/**
 * Cloudflare R2 Storage Utilities
 * 
 * R2 is S3-compatible, so we use AWS SDK
 * Free tier: 10GB storage, unlimited egress
 */

import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand, HeadObjectCommand } from "https://esm.sh/@aws-sdk/client-s3@3.490.0";

// Initialize S3 client for Cloudflare R2
// R2 is S3-compatible, so we can use AWS SDK
const getR2Client = () => {
  const accountId = Deno.env.get("R2_ACCOUNT_ID");
  const accessKeyId = Deno.env.get("R2_ACCESS_KEY_ID");
  const secretAccessKey = Deno.env.get("R2_SECRET_ACCESS_KEY");
  const bucketName = Deno.env.get("R2_BUCKET_NAME") || "clip-factory";
  const endpoint = `https://${accountId}.r2.cloudflarestorage.com`;

  if (!accountId || !accessKeyId || !secretAccessKey) {
    throw new Error("R2 credentials not configured. Please set R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, and R2_SECRET_ACCESS_KEY environment variables.");
  }

  return {
    client: new S3Client({
      region: "auto",
      endpoint,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    }),
    bucketName,
  };
};

/**
 * Upload a file to R2 storage
 * @param key - Object key (path) in R2
 * @param body - File content (Buffer, Blob, or ReadableStream)
 * @param contentType - MIME type (e.g., 'video/mp4')
 * @returns URL to access the file
 */
export async function uploadToR2(
  key: string,
  body: Blob | ArrayBuffer | Uint8Array | ReadableStream,
  contentType: string
): Promise<string> {
  const { client, bucketName } = getR2Client();

  // Convert body to Uint8Array if needed
  let bodyData: Uint8Array | ReadableStream;
  if (body instanceof Blob) {
    bodyData = new Uint8Array(await body.arrayBuffer());
  } else if (body instanceof ArrayBuffer) {
    bodyData = new Uint8Array(body);
  } else {
    bodyData = body;
  }

  const command = new PutObjectCommand({
    Bucket: bucketName,
    Key: key,
    Body: bodyData,
    ContentType: contentType,
  });

  await client.send(command);

  // Return public URL (if bucket is public) or presigned URL
  // For now, return the key - you'll need to configure R2 public access or use presigned URLs
  const publicUrl = Deno.env.get("R2_PUBLIC_URL") || `https://${bucketName}.r2.dev`;
  return `${publicUrl}/${key}`;
}

/**
 * Download a file from R2 storage
 * @param key - Object key (path) in R2
 * @returns File content as ArrayBuffer
 */
export async function downloadFromR2(key: string): Promise<ArrayBuffer> {
  const { client, bucketName } = getR2Client();

  const command = new GetObjectCommand({
    Bucket: bucketName,
    Key: key,
  });

  const response = await client.send(command);
  
  if (!response.Body) {
    throw new Error(`File not found: ${key}`);
  }

  // Convert stream to ArrayBuffer
  const chunks: Uint8Array[] = [];
  const reader = response.Body.transformToWebStream().getReader();
  
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
  }

  // Combine chunks
  const totalLength = chunks.reduce((acc, chunk) => acc + chunk.length, 0);
  const result = new Uint8Array(totalLength);
  let offset = 0;
  for (const chunk of chunks) {
    result.set(chunk, offset);
    offset += chunk.length;
  }

  return result.buffer;
}

/**
 * Check if a file exists in R2
 * @param key - Object key (path) in R2
 * @returns true if file exists, false otherwise
 */
export async function fileExistsInR2(key: string): Promise<boolean> {
  const { client, bucketName } = getR2Client();

  try {
    const command = new HeadObjectCommand({
      Bucket: bucketName,
      Key: key,
    });
    await client.send(command);
    return true;
  } catch (error) {
    // File doesn't exist or other error
    return false;
  }
}

/**
 * Delete a file from R2 storage
 * @param key - Object key (path) in R2
 */
export async function deleteFromR2(key: string): Promise<void> {
  const { client, bucketName } = getR2Client();

  const command = new DeleteObjectCommand({
    Bucket: bucketName,
    Key: key,
  });

  await client.send(command);
}

/**
 * Generate a unique key for storing videos
 * @param userId - User ID
 * @param videoId - Video/clip ID
 * @param extension - File extension (e.g., 'mp4')
 * @returns Storage key
 */
export function generateStorageKey(userId: string, videoId: string, extension: string): string {
  const timestamp = Date.now();
  return `videos/${userId}/${videoId}-${timestamp}.${extension}`;
}

/**
 * Generate a key for temporary processing files
 * @param jobId - Processing job ID
 * @param extension - File extension
 * @returns Storage key
 */
export function generateTempKey(jobId: string, extension: string): string {
  return `temp/${jobId}.${extension}`;
}

