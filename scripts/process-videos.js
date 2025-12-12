/**
 * Video Processing Script for GitHub Actions
 * 
 * This script:
 * 1. Fetches pending processing jobs from Supabase
 * 2. Downloads videos using yt-dlp
 * 3. Processes clips using FFmpeg
 * 4. Uploads processed clips to R2
 * 5. Updates job status in database
 */

const { createClient } = require('@supabase/supabase-js');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Configuration from environment variables
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID;
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID;
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY;
const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME || 'clip-factory';

// Initialize clients
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const r2Client = new S3Client({
  region: 'auto',
  endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: R2_ACCESS_KEY_ID,
    secretAccessKey: R2_SECRET_ACCESS_KEY,
  },
});

// Create temp directory for processing
const TEMP_DIR = path.join(__dirname, '../temp');
if (!fs.existsSync(TEMP_DIR)) {
  fs.mkdirSync(TEMP_DIR, { recursive: true });
}

/**
 * Download video using yt-dlp
 */
async function downloadVideo(url, outputPath) {
  console.log(`Downloading video from: ${url}`);
  
  try {
    // Use yt-dlp to download video
    // Format: best video+audio, max 1080p for faster processing
    const command = `yt-dlp -f "bestvideo[height<=1080]+bestaudio/best[height<=1080]" -o "${outputPath}" "${url}"`;
    
    execSync(command, { stdio: 'inherit' });
    
    if (!fs.existsSync(outputPath)) {
      throw new Error('Downloaded file not found');
    }
    
    console.log(`Video downloaded successfully: ${outputPath}`);
    return outputPath;
  } catch (error) {
    console.error('Download failed:', error.message);
    throw error;
  }
}

/**
 * Process clip using FFmpeg
 */
async function processClip(inputPath, outputPath, startTime, endTime) {
  console.log(`Processing clip: ${startTime}s - ${endTime}s`);
  
  try {
    // FFmpeg command to extract clip
    // -ss: start time, -t: duration, -c copy: copy codec (faster, no re-encoding)
    const duration = endTime - startTime;
    const command = `ffmpeg -i "${inputPath}" -ss ${startTime} -t ${duration} -c copy -avoid_negative_ts make_zero "${outputPath}"`;
    
    execSync(command, { stdio: 'inherit' });
    
    if (!fs.existsSync(outputPath)) {
      throw new Error('Processed clip not found');
    }
    
    console.log(`Clip processed successfully: ${outputPath}`);
    return outputPath;
  } catch (error) {
    console.error('Processing failed:', error.message);
    throw error;
  }
}

/**
 * Upload to R2 storage
 */
async function uploadToR2(filePath, key) {
  console.log(`Uploading to R2: ${key}`);
  
  try {
    const fileContent = fs.readFileSync(filePath);
    
    const command = new PutObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: key,
      Body: fileContent,
      ContentType: 'video/mp4',
    });
    
    await r2Client.send(command);
    
    // Generate public URL (adjust based on your R2 setup)
    const publicUrl = `https://${R2_BUCKET_NAME}.r2.dev/${key}`;
    console.log(`Uploaded successfully: ${publicUrl}`);
    
    return publicUrl;
  } catch (error) {
    console.error('Upload failed:', error.message);
    throw error;
  }
}

/**
 * Process a single job
 */
async function processJob(job) {
  console.log(`\n=== Processing Job ${job.id} ===`);
  console.log(`Source: ${job.source_video_url}`);
  console.log(`Time: ${job.clip_start_time}s - ${job.clip_end_time}s`);
  
  const jobId = job.id;
  const tempInput = path.join(TEMP_DIR, `input-${jobId}.mp4`);
  const tempOutput = path.join(TEMP_DIR, `output-${jobId}.mp4`);
  const storageKey = `clips/${job.user_id}/${jobId}.mp4`;
  
  try {
    // Update status to processing
    await supabase
      .from('processing_jobs')
      .update({ status: 'processing' })
      .eq('id', jobId);
    
    // Step 1: Download video
    await downloadVideo(job.source_video_url, tempInput);
    
    // Step 2: Process clip
    await processClip(tempInput, tempOutput, job.clip_start_time, job.clip_end_time);
    
    // Step 3: Upload to R2
    const outputUrl = await uploadToR2(tempOutput, storageKey);
    
    // Step 4: Update job status
    await supabase
      .from('processing_jobs')
      .update({
        status: 'completed',
        output_url: outputUrl,
        completed_at: new Date().toISOString(),
      })
      .eq('id', jobId);
    
    console.log(`✓ Job ${jobId} completed successfully`);
    
    // Cleanup temp files
    try {
      if (fs.existsSync(tempInput)) fs.unlinkSync(tempInput);
      if (fs.existsSync(tempOutput)) fs.unlinkSync(tempOutput);
    } catch (cleanupError) {
      console.warn('Cleanup warning:', cleanupError.message);
    }
    
    return { success: true, outputUrl };
  } catch (error) {
    console.error(`✗ Job ${jobId} failed:`, error.message);
    
    // Update job status to failed
    await supabase
      .from('processing_jobs')
      .update({
        status: 'failed',
        error_message: error.message,
      })
      .eq('id', jobId);
    
    // Cleanup temp files
    try {
      if (fs.existsSync(tempInput)) fs.unlinkSync(tempInput);
      if (fs.existsSync(tempOutput)) fs.unlinkSync(tempOutput);
    } catch (cleanupError) {
      console.warn('Cleanup warning:', cleanupError.message);
    }
    
    return { success: false, error: error.message };
  }
}

/**
 * Main processing function
 */
async function main() {
  console.log('=== Video Processing Script ===\n');
  
  try {
    // Fetch pending jobs
    console.log('Fetching pending jobs...');
    const { data: jobs, error } = await supabase
      .from('processing_jobs')
      .select('*')
      .eq('status', 'pending')
      .order('created_at', { ascending: true })
      .limit(10); // Process max 10 jobs per run
    
    if (error) {
      throw new Error(`Failed to fetch jobs: ${error.message}`);
    }
    
    if (!jobs || jobs.length === 0) {
      console.log('No pending jobs found.');
      return;
    }
    
    console.log(`Found ${jobs.length} pending job(s)\n`);
    
    // Process each job
    const results = [];
    for (const job of jobs) {
      const result = await processJob(job);
      results.push({ jobId: job.id, ...result });
      
      // Small delay between jobs to avoid overwhelming the system
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    // Summary
    console.log('\n=== Processing Summary ===');
    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;
    console.log(`Successful: ${successful}`);
    console.log(`Failed: ${failed}`);
    
    if (failed > 0) {
      process.exit(1); // Exit with error if any jobs failed
    }
  } catch (error) {
    console.error('Fatal error:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { processJob, main };


