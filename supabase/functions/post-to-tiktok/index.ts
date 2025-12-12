/**
 * Post video to TikTok using TikTok Creative Center API
 * 
 * Note: TikTok has limited API access. This uses the Creative Center API
 * which requires business verification and approval.
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { downloadFromR2 } from "../_shared/storage.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

/**
 * Upload video to TikTok using Creative Center API
 * 
 * TikTok upload process:
 * 1. Initialize upload (get upload URL)
 * 2. Upload video file
 * 3. Publish video
 */
async function uploadToTikTok(
  videoFile: Blob | ArrayBuffer,
  caption: string,
  accessToken: string
): Promise<{ videoId: string; videoUrl: string }> {
  const clientKey = Deno.env.get("TIKTOK_CLIENT_KEY");
  if (!clientKey) {
    throw new Error("TIKTOK_CLIENT_KEY not configured");
  }

  // Step 1: Initialize upload
  const initUrl = "https://open.tiktokapis.com/v2/post/publish/init/";
  
  const videoData = videoFile instanceof Blob ? await videoFile.arrayBuffer() : videoFile;
  const videoSize = videoData.byteLength;

  const initResponse = await fetch(initUrl, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      post_info: {
        title: caption.substring(0, 150), // TikTok title limit
        privacy_level: "PUBLIC_TO_EVERYONE", // or "MUTUAL_FOLLOW_FRIENDS", "SELF_ONLY"
        disable_duet: false,
        disable_comment: false,
        disable_stitch: false,
        video_cover_timestamp_ms: 1000, // Thumbnail at 1 second
      },
      source_info: {
        source: "FILE_UPLOAD",
        video_size: videoSize,
        chunk_size: 10000000, // 10MB chunks
        total_chunk_count: Math.ceil(videoSize / 10000000),
      },
    }),
  });

  if (!initResponse.ok) {
    const error = await initResponse.text();
    throw new Error(`Failed to initialize TikTok upload: ${error}`);
  }

  const initResult = await initResponse.json();
  const uploadUrl = initResult.data.upload_url;
  const publishId = initResult.data.publish_id;

  if (!uploadUrl || !publishId) {
    throw new Error("No upload URL or publish ID returned from TikTok");
  }

  // Step 2: Upload video file (chunked)
  const chunkSize = 10000000; // 10MB
  const totalChunks = Math.ceil(videoSize / chunkSize);

  for (let chunkIndex = 0; chunkIndex < totalChunks; chunkIndex++) {
    const start = chunkIndex * chunkSize;
    const end = Math.min(start + chunkSize, videoSize);
    const chunk = videoData.slice(start, end);

    const uploadResponse = await fetch(uploadUrl, {
      method: "PUT",
      headers: {
        "Content-Type": "video/mp4",
        "Content-Range": `bytes ${start}-${end - 1}/${videoSize}`,
      },
      body: chunk,
    });

    if (!uploadResponse.ok) {
      const error = await uploadResponse.text();
      throw new Error(`Failed to upload chunk ${chunkIndex + 1}: ${error}`);
    }
  }

  // Step 3: Publish video
  const publishUrl = "https://open.tiktokapis.com/v2/post/publish/status/fetch/";
  
  const publishResponse = await fetch(publishUrl, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      publish_id: publishId,
    }),
  });

  if (!publishResponse.ok) {
    const error = await publishResponse.text();
    throw new Error(`Failed to publish TikTok video: ${error}`);
  }

  const publishResult = await publishResponse.json();
  const videoId = publishResult.data.share_id;

  return {
    videoId,
    videoUrl: `https://www.tiktok.com/@username/video/${videoId}`, // TikTok doesn't return full URL
  };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { clipUrl, caption, accessToken } = await req.json();

    if (!clipUrl || !accessToken) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: clipUrl, accessToken" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Uploading video to TikTok`);

    // Download video from R2 or get from URL
    let videoFile: Blob | ArrayBuffer;
    
    if (clipUrl.startsWith("https://") || clipUrl.startsWith("http://")) {
      const response = await fetch(clipUrl);
      if (!response.ok) {
        throw new Error(`Failed to download video: ${response.statusText}`);
      }
      videoFile = await response.arrayBuffer();
    } else {
      const videoData = await downloadFromR2(clipUrl);
      videoFile = videoData;
    }

    // Upload to TikTok
    const result = await uploadToTikTok(
      videoFile,
      caption || "",
      accessToken
    );

    return new Response(
      JSON.stringify({
        success: true,
        videoId: result.videoId,
        videoUrl: result.videoUrl,
        platform: "tiktok",
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error posting to TikTok:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Unknown error",
        details: error instanceof Error ? error.stack : undefined,
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

