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

