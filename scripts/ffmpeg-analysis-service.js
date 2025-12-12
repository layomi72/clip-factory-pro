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
 * Process video clip endpoint
 * POST /process
 * Body: { sourceUrl: string, startTime: number, endTime: number }
 * Returns: { clipUrl: string (base64 data URL), duration: number }
 */
app.post('/process', async (req, res) => {
  try {
    const { sourceUrl, startTime, endTime } = req.body;
    
    if (!sourceUrl || startTime === undefined || endTime === undefined) {
      return res.status(400).json({ error: 'sourceUrl, startTime, and endTime are required' });
    }
    
    const duration = endTime - startTime;
    if (duration <= 0) {
      return res.status(400).json({ error: 'Invalid time range' });
    }
    
    console.log(`Processing clip: ${sourceUrl} (${startTime}s - ${endTime}s)`);
    
    const tempDir = path.join(__dirname, '../temp');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
    
    const jobId = `clip-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const inputPath = path.join(tempDir, `input-${jobId}.mp4`);
    const outputPath = path.join(tempDir, `output-${jobId}.mp4`);
    
    try {
      // Step 1: Download video (if it's a URL, not already a file)
      if (sourceUrl.startsWith('http')) {
        console.log('Downloading video...');
        await downloadFile(sourceUrl).then(filepath => {
          // Move to our input path
          if (fs.existsSync(filepath)) {
            fs.renameSync(filepath, inputPath);
          } else {
            throw new Error('Download failed');
          }
        });
      } else {
        // Assume it's a file path (for local testing)
        if (fs.existsSync(sourceUrl)) {
          fs.copyFileSync(sourceUrl, inputPath);
        } else {
          throw new Error('Source file not found');
        }
      }
      
      // Step 2: Clip video using FFmpeg
      console.log(`Clipping video: ${startTime}s - ${endTime}s`);
      const ffmpegCommand = `ffmpeg -i "${inputPath}" -ss ${startTime} -t ${duration} -c copy -avoid_negative_ts make_zero "${outputPath}" -y`;
      
      execSync(ffmpegCommand, { 
        stdio: 'inherit',
        maxBuffer: 50 * 1024 * 1024 // 50MB buffer for large videos
      });
      
      // Step 3: Read processed clip and return as base64
      if (!fs.existsSync(outputPath)) {
        throw new Error('Clip processing failed - output file not created');
      }
      
      const clipBuffer = fs.readFileSync(outputPath);
      const clipBase64 = clipBuffer.toString('base64');
      const clipDataUrl = `data:video/mp4;base64,${clipBase64}`;
      
      // Return clip data
      res.json({
        success: true,
        clipUrl: clipDataUrl,
        duration: duration,
        size: clipBuffer.length,
      });
      
    } finally {
      // Cleanup temp files
      cleanupFile(inputPath);
      cleanupFile(outputPath);
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

