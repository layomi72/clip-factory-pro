/**
 * Post video to YouTube using YouTube Data API v3
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { downloadFromR2 } from "../_shared/storage.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

/**
 * Upload video to YouTube
 */
async function uploadToYouTube(
  videoFile: Blob | ArrayBuffer,
  title: string,
  description: string,
  accessToken: string,
  tags?: string[]
): Promise<{ videoId: string; videoUrl: string }> {
  // YouTube Data API v3 upload endpoint
  const uploadUrl = "https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable&part=snippet,status";

  // Step 1: Initialize upload (get resumable session URI)
  const initResponse = await fetch(uploadUrl, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      "X-Upload-Content-Type": "video/*",
      "X-Upload-Content-Length": videoFile instanceof Blob ? videoFile.size.toString() : videoFile.byteLength.toString(),
    },
    body: JSON.stringify({
      snippet: {
        title: title.substring(0, 100), // YouTube title limit
        description: description.substring(0, 5000), // YouTube description limit
        tags: tags || [],
        categoryId: "22", // People & Blogs category
        defaultLanguage: "en",
        defaultAudioLanguage: "en",
      },
      status: {
        privacyStatus: "public", // or "unlisted", "private"
        selfDeclaredMadeForKids: false,
      },
    }),
  });

  if (!initResponse.ok) {
    const error = await initResponse.text();
    throw new Error(`Failed to initialize YouTube upload: ${error}`);
  }

  const location = initResponse.headers.get("Location");
  if (!location) {
    throw new Error("No resumable session URI returned from YouTube");
  }

  // Step 2: Upload video file
  const videoData = videoFile instanceof Blob ? await videoFile.arrayBuffer() : videoFile;
  const uploadResponse = await fetch(location, {
    method: "PUT",
    headers: {
      "Content-Type": "video/*",
      "Content-Length": videoData.byteLength.toString(),
    },
    body: videoData,
  });

  if (!uploadResponse.ok) {
    const error = await uploadResponse.text();
    throw new Error(`Failed to upload video to YouTube: ${error}`);
  }

  const result = await uploadResponse.json();
  const videoId = result.id;

  return {
    videoId,
    videoUrl: `https://www.youtube.com/watch?v=${videoId}`,
  };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { clipUrl, title, description, accessToken, tags, privacyStatus } = await req.json();

    if (!clipUrl || !title || !accessToken) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: clipUrl, title, accessToken" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Uploading video to YouTube: ${title}`);

    // Download video from R2 or get from URL
    let videoFile: Blob | ArrayBuffer;
    
    if (clipUrl.startsWith("https://") || clipUrl.startsWith("http://")) {
      // Download from URL
      const response = await fetch(clipUrl);
      if (!response.ok) {
        throw new Error(`Failed to download video: ${response.statusText}`);
      }
      videoFile = await response.arrayBuffer();
    } else {
      // Assume it's an R2 key
      const videoData = await downloadFromR2(clipUrl);
      videoFile = videoData;
    }

    // Upload to YouTube
    const result = await uploadToYouTube(
      videoFile,
      title,
      description || "",
      accessToken,
      tags,
    );

    return new Response(
      JSON.stringify({
        success: true,
        videoId: result.videoId,
        videoUrl: result.videoUrl,
        platform: "youtube",
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error posting to YouTube:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Unknown error",
        details: error instanceof Error ? error.stack : undefined,
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

