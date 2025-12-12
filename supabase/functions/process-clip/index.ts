/**
 * Video Processing Service
 * Clips videos using FFmpeg and uploads to R2 storage
 * 
 * Note: FFmpeg processing is CPU-intensive and may not work well in Deno Edge Functions
 * Recommended: Use GitHub Actions or a dedicated server for processing
 * 
 * This function can:
 * 1. Queue processing jobs
 * 2. Call external processing service
 * 3. Or use a lightweight approach if FFmpeg is available
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { uploadToR2, generateStorageKey, deleteFromR2 } from "../_shared/storage.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

/**
 * Process video clip using FFmpeg
 * 
 * Since Deno Edge Functions have limitations, we'll use one of these approaches:
 * 1. Queue job for GitHub Actions processing (recommended)
 * 2. Call external FFmpeg service
 * 3. Use Supabase Edge Function with FFmpeg (if available)
 */
async function processClip(
  sourceUrl: string,
  startTime: number,
  endTime: number,
  userId: string,
  clipId: string
): Promise<{ clipUrl: string; duration: number }> {
  const processingServiceUrl = Deno.env.get("FFMPEG_SERVICE_URL");
  
  if (processingServiceUrl) {
    // Call external FFmpeg processing service
    const response = await fetch(`${processingServiceUrl}/process`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sourceUrl,
        startTime,
        endTime,
        userId,
        clipId,
      }),
    });

    if (!response.ok) {
      throw new Error(`Processing failed: ${response.statusText}`);
    }

    const result = await response.json();
    return {
      clipUrl: result.clipUrl,
      duration: result.duration,
    };
  }

  // Alternative: Queue for GitHub Actions processing
  // Store processing job in database
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  // Create processing job
  const { data: job, error } = await supabase
    .from("processing_jobs")
    .insert({
      source_video_url: sourceUrl,
      clip_start_time: startTime,
      clip_end_time: endTime,
      user_id: userId,
      status: "pending",
      created_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to queue processing job: ${error.message}`);
  }

  // Return job ID - actual processing will be done by GitHub Actions
  return {
    clipUrl: `pending:${job.id}`, // Placeholder until processing completes
    duration: endTime - startTime,
  };
}

/**
 * Lightweight video info extraction (without full processing)
 * Can be used to validate clips before processing
 */
async function getVideoInfo(sourceUrl: string): Promise<{ duration: number; format: string }> {
  // This would typically use ffprobe, but for now we'll return placeholder
  // In production, this should call an FFmpeg service or use platform APIs
  
  return {
    duration: 0, // Will be determined during actual processing
    format: "mp4",
  };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { sourceUrl, startTime, endTime, userId, clipId } = await req.json();

    // Validate inputs
    if (!sourceUrl || startTime === undefined || endTime === undefined || !userId || !clipId) {
      return new Response(
        JSON.stringify({ 
          error: "Missing required fields: sourceUrl, startTime, endTime, userId, clipId" 
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (startTime < 0 || endTime <= startTime) {
      return new Response(
        JSON.stringify({ error: "Invalid time range: startTime must be >= 0 and endTime must be > startTime" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const duration = endTime - startTime;
    if (duration > 600) { // 10 minutes max
      return new Response(
        JSON.stringify({ error: "Clip duration cannot exceed 10 minutes" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Processing clip: ${clipId} from ${sourceUrl} (${startTime}s - ${endTime}s)`);

    // Process the clip
    const result = await processClip(sourceUrl, startTime, endTime, userId, clipId);

    return new Response(
      JSON.stringify({
        success: true,
        clipId,
        clipUrl: result.clipUrl,
        duration: result.duration,
        startTime,
        endTime,
        message: result.clipUrl.startsWith("pending:")
          ? "Clip queued for processing. Check status in processing_jobs table."
          : "Clip processed successfully",
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error processing clip:", error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : "Unknown error",
        details: error instanceof Error ? error.stack : undefined,
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

