/**
 * FFmpeg Analysis Service
 * 
 * HTTP server that provides video analysis using FFmpeg
 * Can be deployed separately and called from Edge Functions
 * 
 * Run: node scripts/ffmpeg-analysis-service.js
 * Or deploy to a server with FFmpeg installed
 */

const express = require('express');
const { analyzeVideo } = require('./analyze-video-ffmpeg');
const { downloadFile, cleanupFile } = require('./download-utils');
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');

const app = express();
app.use(express.json());

// CORS middleware
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

const PORT = process.env.PORT || 3001;

/**
 * Get R2 client if credentials are available
 */
function getR2Client() {
  const accountId = process.env.R2_ACCOUNT_ID;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
  const bucketName = process.env.R2_BUCKET_NAME || 'clip-factory';
  
  if (!accountId || !accessKeyId || !secretAccessKey) {
    return null; // R2 not configured
  }
  
  return {
    client: new S3Client({
      region: 'auto',
      endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    }),
    bucketName,
  };
}

/**
 * Upload file to R2
 */
async function uploadToR2(filePath, key) {
  const r2 = getR2Client();
  if (!r2) {
    return null;
  }
  
  const fileBuffer = fs.readFileSync(filePath);
  const command = new PutObjectCommand({
    Bucket: r2.bucketName,
    Key: key,
    Body: fileBuffer,
    ContentType: 'video/mp4',
  });
  
  await r2.client.send(command);
  
  // Return public URL or presigned URL
  const publicUrl = process.env.R2_PUBLIC_URL || `https://${r2.bucketName}.r2.dev`;
  return `${publicUrl}/${key}`;
}

/**
 * Analyze video endpoint
 * POST /analyze
 * Body: { videoUrl: string, duration?: number }
 */
app.post('/analyze', async (req, res) => {
  try {
    const { videoUrl, duration } = req.body;
    
    if (!videoUrl) {
      return res.status(400).json({ error: 'videoUrl is required' });
    }
    
    console.log(`Analyzing video: ${videoUrl}`);
    
    // Download video temporarily
    const tempPath = await downloadFile(videoUrl);
    
    try {
      // Analyze video
      const result = analyzeVideo(tempPath);
      
      // Return clips in expected format
      res.json({
        success: true,
        clips: result.clips.map(clip => ({
          startTime: clip.startTime,
          endTime: clip.endTime,
          score: clip.score,
          reason: clip.reason,
          type: clip.type,
          confidence: clip.confidence,
          features: clip.features,
        })),
        metadata: result.metadata,
        analysis: result.analysis,
      });
    } finally {
      // Cleanup
      cleanupFile(tempPath);
    }
  } catch (error) {
    console.error('Analysis error:', error);
    res.status(500).json({
      error: error.message,
    });
  }
});

/**
 * Create subtitle file (SRT format) for captions
 */
function createSubtitleFile(text, duration, outputPath) {
  // Simple SRT format: show caption for entire clip duration
  const srtContent = `1
00:00:00,000 --> ${formatSRTTime(duration)},000
${text}
`;
  fs.writeFileSync(outputPath, srtContent, 'utf8');
}

/**
 * Format time for SRT (HH:MM:SS,mmm)
 */
function formatSRTTime(seconds) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 1000);
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')},${ms.toString().padStart(3, '0')}`;
}

/**
 * Process video clip endpoint with editing features
 * POST /process
 * Body: { 
 *   sourceUrl: string, 
 *   startTime: number, 
 *   endTime: number,
 *   options?: {
 *     addCaptions?: boolean,
 *     captionText?: string,
 *     addTransitions?: boolean,
 *     enhanceAudio?: boolean,
 *     videoQuality?: "high" | "medium" | "low"
 *   }
 * }
 * Returns: { clipUrl: string, duration: number }
 */
app.post('/process', async (req, res) => {
  try {
    const { sourceUrl, startTime, endTime, options = {} } = req.body;
    
    if (!sourceUrl || startTime === undefined || endTime === undefined) {
      return res.status(400).json({ error: 'sourceUrl, startTime, and endTime are required' });
    }
    
    const duration = endTime - startTime;
    if (duration <= 0) {
      return res.status(400).json({ error: 'Invalid time range' });
    }
    
    console.log(`Processing clip: ${sourceUrl} (${startTime}s - ${endTime}s)`);
    console.log(`Options:`, options);
    
    const tempDir = path.join(__dirname, '../temp');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
    
    const jobId = `clip-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const inputPath = path.join(tempDir, `input-${jobId}.mp4`);
    const clippedPath = path.join(tempDir, `clipped-${jobId}.mp4`);
    const outputPath = path.join(tempDir, `output-${jobId}.mp4`);
    const subtitlePath = path.join(tempDir, `subtitle-${jobId}.srt`);
    
    try {
      // Step 1: Download video (if it's a URL, not already a file)
      if (sourceUrl.startsWith('http')) {
        console.log('Downloading video...');
        await downloadFile(sourceUrl).then(filepath => {
          if (fs.existsSync(filepath)) {
            fs.renameSync(filepath, inputPath);
          } else {
            throw new Error('Download failed');
          }
        });
      } else {
        if (fs.existsSync(sourceUrl)) {
          fs.copyFileSync(sourceUrl, inputPath);
        } else {
          throw new Error('Source file not found');
        }
      }
      
      // Step 2: Clip video using FFmpeg (fast copy first)
      console.log(`Clipping video: ${startTime}s - ${endTime}s`);
      const clipCommand = `ffmpeg -i "${inputPath}" -ss ${startTime} -t ${duration} -c copy -avoid_negative_ts make_zero "${clippedPath}" -y`;
      execSync(clipCommand, { 
        stdio: 'inherit',
        maxBuffer: 50 * 1024 * 1024
      });
      
      // Step 3: Apply viral editing features (captions, zoom, audio enhancement, etc.)
      let videoFilters = [];
      let audioFilters = [];
      
      // Build FFmpeg command with filters
      let command = `ffmpeg -i "${clippedPath}"`;
      
      // Add zoom effect (common in viral clips - subtle zoom in for engagement)
      // Zoom from 1.0 to 1.1 over the duration for dynamic feel
      if (options.addTransitions !== false) { // Default to true for viral clips
        console.log('Adding zoom effect...');
        // Create a subtle zoom-in effect (1.0x to 1.05x) for engagement
        const zoomFilter = `zoompan=z='min(zoom+0.0015,1.05)':d=${Math.floor(duration * 30)}:x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)'`;
        videoFilters.push(zoomFilter);
      }
      
      // Add captions if requested
      if (options.addCaptions && options.captionText) {
        console.log('Adding captions:', options.captionText);
        createSubtitleFile(options.captionText, duration, subtitlePath);
        // Elite rule: Captions add drama, not explanation
        // Use subtitles filter to burn captions into video with viral styling
        // Larger font, bold, with outline for visibility
        // Elite styling: Big, bold, high contrast for maximum impact
        const subtitleFilter = `subtitles='${subtitlePath.replace(/'/g, "\\'")}':force_style='FontSize=32,PrimaryColour=&Hffffff,OutlineColour=&H000000,Outline=4,Alignment=2,MarginV=50,Bold=1,Shadow=2'`;
        videoFilters.push(subtitleFilter);
      }
      
      // Elite rule: Add on-screen text with proper timing
      // First text at 0.2-0.4s, new text at escalations
      if (options.addCaptions && options.captionText) {
        // Extract first dramatic phrase for on-screen text
        const firstPhrase = options.captionText.split('\n')[0] || options.captionText.split('.')[0] || options.captionText;
        // Elite rule: First text appears at 0.3s (0.2-0.4s range)
        // Use drawtext filter for on-screen text
        const onScreenText = `drawtext=text='${firstPhrase.replace(/'/g, "\\'")}':fontsize=36:fontcolor=white:borderw=3:bordercolor=black:x=(w-text_w)/2:y=h-th-60:enable='between(t,0.3,${Math.min(3.0, duration)})':fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf`;
        // Note: Font path may vary by system, this is a common location
        // For production, you'd want to bundle a font or use system default
        try {
          videoFilters.push(onScreenText);
        } catch (e) {
          console.log('On-screen text filter skipped (font not available)');
        }
      }
      
      // Add color grading for more vibrant, engaging look (viral clips are often more saturated)
      if (options.addTransitions !== false) {
        // Slight saturation boost and contrast for more engaging visuals
        videoFilters.push('eq=saturation=1.1:contrast=1.05');
      }
      
      // Audio enhancement
      if (options.enhanceAudio !== false) { // Default to true for viral clips
        console.log('Enhancing audio...');
        // Normalize audio and add compression for consistent, punchy sound
        audioFilters.push('loudnorm=I=-16:TP=-1.5:LRA=11');
        // Add slight high-frequency boost for clarity
        audioFilters.push('highpass=f=80');
        audioFilters.push('lowpass=f=15000');
      }
      
      // Video quality settings (optimized for social media)
      let videoCodec = 'libx264';
      let videoQuality = '23'; // Default CRF (lower = higher quality)
      if (options.videoQuality === 'high') {
        videoQuality = '18'; // Higher quality for viral clips
      } else if (options.videoQuality === 'medium') {
        videoQuality = '23';
      } else if (options.videoQuality === 'low') {
        videoQuality = '28';
      }
      
      // Build final command with all filters
      if (videoFilters.length > 0) {
        command += ` -vf "${videoFilters.join(',')}"`;
      }
      
      if (audioFilters.length > 0) {
        command += ` -af "${audioFilters.join(',')}"`;
      }
      
      // Optimize for social media: H.264, AAC, optimized for mobile viewing
      command += ` -c:v ${videoCodec} -crf ${videoQuality} -preset medium -profile:v high -level 4.0 -c:a aac -b:a 128k -movflags +faststart "${outputPath}" -y`;
      
      console.log('Running enhanced FFmpeg command...');
      execSync(command, { 
        stdio: 'inherit',
        maxBuffer: 50 * 1024 * 1024
      });
      
      // Step 4: Upload to R2 or return base64
      if (!fs.existsSync(outputPath)) {
        throw new Error('Clip processing failed - output file not created');
      }
      
      const clipBuffer = fs.readFileSync(outputPath);
      const clipSize = clipBuffer.length;
      
      // Try to upload to R2 first (if configured)
      const storageKey = `clips/${req.body.userId || 'default'}/${jobId}.mp4`;
      const r2Url = await uploadToR2(outputPath, storageKey);
      
      if (r2Url) {
        console.log(`Uploaded clip to R2: ${r2Url}`);
        res.json({
          success: true,
          clipUrl: r2Url,
          duration: duration,
          size: clipSize,
          storage: 'r2',
        });
      } else {
        // R2 not configured, return base64 (for small clips only)
        if (clipSize > 50 * 1024 * 1024) {
          throw new Error('Clip too large for base64. Please configure R2 storage.');
        }
        
        const clipBase64 = clipBuffer.toString('base64');
        const clipDataUrl = `data:video/mp4;base64,${clipBase64}`;
        
        console.log(`Returning clip as base64 (${(clipSize / 1024 / 1024).toFixed(2)}MB)`);
        res.json({
          success: true,
          clipUrl: clipDataUrl,
          duration: duration,
          size: clipSize,
          storage: 'base64',
          warning: 'R2 storage not configured. Large clips may fail.',
        });
      }
      
    } finally {
      // Cleanup temp files
      cleanupFile(inputPath);
      cleanupFile(clippedPath);
      cleanupFile(outputPath);
      cleanupFile(subtitlePath);
    }
  } catch (error) {
    console.error('Processing error:', error);
    res.status(500).json({
      error: error.message,
    });
  }
});

/**
 * Health check
 */
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'ffmpeg-analysis' });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`FFmpeg Analysis Service running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
  console.log(`Ready to analyze videos!`);
});

