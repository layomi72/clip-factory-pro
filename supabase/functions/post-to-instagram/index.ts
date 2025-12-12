/**
 * Post video to Instagram using Instagram Graph API
 * 
 * Note: Instagram requires:
 * - Meta Business Account
 * - App Review approval
 * - Instagram Business or Creator account
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { downloadFromR2 } from "../_shared/storage.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

/**
 * Upload video to Instagram (Reels)
 * Instagram uses a 3-step process:
 * 1. Create media container
 * 2. Upload video
 * 3. Publish container
 */
async function uploadToInstagram(
  videoFile: Blob | ArrayBuffer,
  caption: string,
  accessToken: string,
  instagramAccountId: string
): Promise<{ mediaId: string; permalink: string }> {
  // Step 1: Create media container
  const videoData = videoFile instanceof Blob ? await videoFile.arrayBuffer() : videoFile;
  const videoSize = videoData.byteLength;

  // For Reels, we use the REELS endpoint
  const createContainerUrl = `https://graph.facebook.com/v18.0/${instagramAccountId}/media`;
  
  const containerParams = new URLSearchParams({
    media_type: "REELS",
    caption: caption.substring(0, 2200), // Instagram caption limit
    access_token: accessToken,
  });

  const containerResponse = await fetch(`${createContainerUrl}?${containerParams.toString()}`, {
    method: "POST",
  });

  if (!containerResponse.ok) {
    const error = await containerResponse.text();
    throw new Error(`Failed to create Instagram container: ${error}`);
  }

  const container = await containerResponse.json();
  const containerId = container.id;

  if (!containerId) {
    throw new Error("No container ID returned from Instagram");
  }

  // Step 2: Upload video file (chunked upload for large files)
  const uploadUrl = container.upload_url || `https://graph.facebook.com/v18.0/${containerId}`;
  
  // Instagram requires chunked upload for files > 4MB
  const chunkSize = 4 * 1024 * 1024; // 4MB chunks
  const totalChunks = Math.ceil(videoSize / chunkSize);

  if (totalChunks > 1) {
    // Chunked upload
    for (let chunkIndex = 0; chunkIndex < totalChunks; chunkIndex++) {
      const start = chunkIndex * chunkSize;
      const end = Math.min(start + chunkSize, videoSize);
      const chunk = videoData.slice(start, end);

      const uploadResponse = await fetch(uploadUrl, {
        method: "POST",
        headers: {
          "Authorization": `OAuth ${accessToken}`,
          "file_offset": start.toString(),
        },
        body: chunk,
      });

      if (!uploadResponse.ok) {
        const error = await uploadResponse.text();
        throw new Error(`Failed to upload chunk ${chunkIndex + 1}: ${error}`);
      }
    }
  } else {
    // Single upload
    const uploadResponse = await fetch(uploadUrl, {
      method: "POST",
      headers: {
        "Authorization": `OAuth ${accessToken}`,
      },
      body: videoData,
    });

    if (!uploadResponse.ok) {
      const error = await uploadResponse.text();
      throw new Error(`Failed to upload video: ${error}`);
    }
  }

  // Step 3: Publish the container
  const publishUrl = `https://graph.facebook.com/v18.0/${instagramAccountId}/media_publish`;
  const publishParams = new URLSearchParams({
    creation_id: containerId,
    access_token: accessToken,
  });

  const publishResponse = await fetch(`${publishUrl}?${publishParams.toString()}`, {
    method: "POST",
  });

  if (!publishResponse.ok) {
    const error = await publishResponse.text();
    throw new Error(`Failed to publish Instagram post: ${error}`);
  }

  const publishResult = await publishResponse.json();
  const mediaId = publishResult.id;

  // Get permalink
  const permalinkResponse = await fetch(
    `https://graph.facebook.com/v18.0/${mediaId}?fields=permalink&access_token=${accessToken}`
  );
  const permalinkData = await permalinkResponse.json();

  return {
    mediaId,
    permalink: permalinkData.permalink || `https://www.instagram.com/reel/${mediaId}/`,
  };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { clipUrl, caption, accessToken, instagramAccountId } = await req.json();

    if (!clipUrl || !accessToken || !instagramAccountId) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: clipUrl, accessToken, instagramAccountId" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Uploading video to Instagram: ${instagramAccountId}`);

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

    // Upload to Instagram
    const result = await uploadToInstagram(
      videoFile,
      caption || "",
      accessToken,
      instagramAccountId
    );

    return new Response(
      JSON.stringify({
        success: true,
        mediaId: result.mediaId,
        permalink: result.permalink,
        platform: "instagram",
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error posting to Instagram:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Unknown error",
        details: error instanceof Error ? error.stack : undefined,
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

