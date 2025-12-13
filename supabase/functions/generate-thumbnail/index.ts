/**
 * Generate Thumbnail using AI
 * Uses Lovable AI image generation to create clickbait thumbnails for clips
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ThumbnailRequest {
  clipId: string;
  type: "reaction" | "action" | "funny" | "dramatic" | "highlight";
  title: string;
  thumbnailPrompt?: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { clipId, type, title, thumbnailPrompt } = await req.json() as ThumbnailRequest;

    if (!clipId || !type) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: clipId, type" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "AI not configured",
          thumbnailUrl: null 
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Generate a viral thumbnail prompt based on clip type
    const basePrompts: Record<string, string> = {
      reaction: "Shocked face with mouth wide open, dramatic lighting, bright red and yellow background, viral youtube thumbnail style, bold text overlay space",
      action: "Dynamic action scene, motion blur, explosive energy, dramatic contrast, intense colors, viral gaming thumbnail style",
      funny: "Exaggerated laughing face, cartoon-like expressions, bright colorful background, comedy thumbnail style",
      dramatic: "Intense stare, dramatic shadows, high contrast, cinematic look, suspenseful mood",
      highlight: "Epic moment, golden lighting, triumphant pose, winner energy, peak performance",
    };

    const prompt = thumbnailPrompt || basePrompts[type] || basePrompts.highlight;
    const finalPrompt = `${prompt}, 16:9 aspect ratio, youtube thumbnail style, high quality, attention grabbing, bold and vibrant. Ultra high resolution.`;

    console.log(`Generating thumbnail for clip ${clipId}: ${finalPrompt}`);

    // Use Gemini Flash Image for thumbnail generation
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-image-preview",
        messages: [
          { role: "user", content: finalPrompt },
        ],
        modalities: ["image", "text"],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Thumbnail generation failed:", response.status, errorText);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: `Generation failed: ${response.status}`,
          thumbnailUrl: null 
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    const imageUrl = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;

    if (!imageUrl) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "No image generated",
          thumbnailUrl: null 
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        clipId,
        thumbnailUrl: imageUrl,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error generating thumbnail:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Unknown error",
        thumbnailUrl: null,
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
