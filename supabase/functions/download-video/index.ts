/**
 * Video Download Service
 * Downloads videos from YouTube, Twitch, and TikTok using yt-dlp
 * 
 * Note: yt-dlp is a Python tool, so we'll need to use a Deno subprocess
 * or use a Node.js-based alternative like @distube/ytdl-core
 * 
 * For Deno Edge Functions, we'll use a workaround with yt-dlp via HTTP API
 * or use a service that wraps yt-dlp
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { uploadToR2, generateStorageKey } from "../_shared/storage.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

/**
 * Detect platform from URL
 */
function detectPlatform(url: string): "youtube" | "twitch" | "tiktok" | null {
  if (url.includes("youtube.com") || url.includes("youtu.be")) return "youtube";
  if (url.includes("twitch.tv")) return "twitch";
  if (url.includes("tiktok.com")) return "tiktok";
  return null;
}

/**
 * Download video using yt-dlp via external service
 * 
 * Since Deno Edge Functions can't easily run Python/yt-dlp directly,
 * we'll use one of these approaches:
 * 1. Use a yt-dlp HTTP API service (like yt-dlp-server)
 * 2. Use GitHub Actions for processing (recommended for free tier)
 * 3. Use a Node.js alternative library
 * 
 * For now, we'll structure it to work with an external yt-dlp service
 */
async function downloadVideo(url: string, platform: string): Promise<{ videoUrl: string; metadata: any }> {
  // Option 1: Use external yt-dlp API service
  // You can deploy yt-dlp-server or use a service like this
  const ytdlpServiceUrl = Deno.env.get("YTDLP_SERVICE_URL");
  
  if (ytdlpServiceUrl) {
    // Call external yt-dlp service
    const response = await fetch(`${ytdlpServiceUrl}/download`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url }),
    });

    if (!response.ok) {
      throw new Error(`Failed to download video: ${response.statusText}`);
    }

    const result = await response.json();
    return {
      videoUrl: result.videoUrl,
      metadata: result.metadata,
    };
  }

  // Option 2: Use YouTube/Twitch/TikTok APIs directly where possible
  // This is more reliable but platform-specific
  
  if (platform === "youtube") {
    // Extract video ID from URL
    const videoId = extractYouTubeId(url);
    if (!videoId) {
      throw new Error("Invalid YouTube URL");
    }

    // Use YouTube Data API to get video info
    // Then download using yt-dlp or direct stream
    // For now, return the video ID - actual download will be handled by processing service
    return {
      videoUrl: url,
      metadata: {
        platform: "youtube",
        videoId,
        url,
      },
    };
  }

  if (platform === "twitch") {
    // Twitch VODs can be accessed via API
    return {
      videoUrl: url,
      metadata: {
        platform: "twitch",
        url,
      },
    };
  }

  if (platform === "tiktok") {
    return {
      videoUrl: url,
      metadata: {
        platform: "tiktok",
        url,
      },
    };
  }

  throw new Error(`Unsupported platform: ${platform}`);
}

/**
 * Extract YouTube video ID from URL
 */
function extractYouTubeId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/,
    /youtube\.com\/embed\/([^&\n?#]+)/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }

  return null;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { url, userId } = await req.json();

    if (!url || !userId) {
      return new Response(
        JSON.stringify({ error: "URL and userId are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const platform = detectPlatform(url);
    if (!platform) {
      return new Response(
        JSON.stringify({ error: "Unsupported platform. Please provide a YouTube, Twitch, or TikTok URL." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Downloading video from ${platform}: ${url}`);

    // Download video
    const { videoUrl, metadata } = await downloadVideo(url, platform);

    // If we got a direct video URL, download and store in R2
    let storedUrl = videoUrl;
    
    // For now, we'll store the source URL
    // Actual video file download will be handled by the processing service
    // which can run on GitHub Actions or a server with yt-dlp installed
    
    const result = {
      success: true,
      platform,
      sourceUrl: url,
      videoUrl: storedUrl,
      metadata,
      message: "Video queued for download. Processing will download the actual file.",
    };

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error downloading video:", error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : "Unknown error",
        details: error instanceof Error ? error.stack : undefined,
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

