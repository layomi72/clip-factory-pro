# AI/ML Analysis Setup Guide

## Overview

The system now supports **real AI/ML analysis** for finding viral clips! You can use:

1. **FFmpeg-based analysis** (free, runs on your server)
2. **Google Cloud Video Intelligence API** (paid, very accurate)
3. **Custom ML service** (your own models)
4. **Enhanced heuristics** (fallback, always works)

---

## Option 1: FFmpeg Analysis Service (Recommended for Free Tier)

### Setup:

1. **Deploy FFmpeg Analysis Service:**
   ```bash
   # On a server with FFmpeg installed
   cd clip-factory-pro
   npm install express
   node scripts/ffmpeg-analysis-service.js
   ```

2. **Set Environment Variable in Supabase:**
   ```
   FFMPEG_ANALYSIS_SERVICE_URL=https://your-server.com:3001
   ```

### What it analyzes:
- ✅ **Audio levels** - Detects loud moments, reactions
- ✅ **Scene changes** - Finds interesting transitions
- ✅ **Motion detection** - Identifies high-activity moments
- ✅ **Optimal clip length** - Ensures 15-60 second clips

### Cost: FREE (runs on your server)

---

## Option 2: Google Cloud Video Intelligence API

### Setup:

1. **Enable API:**
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Enable "Video Intelligence API"
   - Create API key

2. **Set Environment Variable:**
   ```
   GOOGLE_VIDEO_INTELLIGENCE_API_KEY=your-api-key
   ```

### What it analyzes:
- ✅ **Shot detection** - Scene changes
- ✅ **Object tracking** - Interesting objects
- ✅ **Speech transcription** - Can find key moments
- ✅ **Label detection** - Understands content

### Cost: ~$0.10-0.50 per video (pay per use)

---

## Option 3: Custom ML Service

### Setup:

1. **Deploy your ML service** (e.g., using your trained models)

2. **Set Environment Variable:**
   ```
   ML_ANALYSIS_SERVICE_URL=https://your-ml-service.com
   ```

3. **API Contract:**
   Your service should accept:
   ```json
   POST /analyze
   {
     "videoUrl": "https://...",
     "duration": 3600
   }
   ```
   
   And return:
   ```json
   {
     "clips": [
       {
         "startTime": 120,
         "endTime": 150,
         "score": 85,
         "reason": "High engagement moment",
         "type": "reaction",
         "confidence": 0.9,
         "features": {
           "hasLoudAudio": true,
           "hasSceneChange": false,
           "hasHighMotion": true,
           "hasFaces": true,
           "optimalLength": true
         }
       }
     ]
   }
   ```

---

## Option 4: Enhanced Heuristics (Default)

If no ML services are configured, the system uses **enhanced heuristics**:
- Analyzes timing (beginning/middle/end)
- Checks optimal clip length
- Simulates feature detection
- Always works, no setup needed

**Accuracy:** Medium (better than basic heuristics, not as good as real AI)

---

## Recommended Setup for Free Tier

1. **Deploy FFmpeg service** on a free server (Railway, Render, etc.)
2. **Set `FFMPEG_ANALYSIS_SERVICE_URL`** in Supabase
3. **That's it!** You get real audio/video analysis for free

---

## Recommended Setup for Production

1. **Use Google Video Intelligence API** for best accuracy
2. **Or deploy custom ML models** trained on viral clips
3. **Fallback to FFmpeg** if API fails
4. **Final fallback** to heuristics

---

## Testing

After setup, test with:
```bash
# Test FFmpeg service locally
node scripts/analyze-video-ffmpeg.js path/to/video.mp4

# Or test via API
curl -X POST http://localhost:3001/analyze \
  -H "Content-Type: application/json" \
  -d '{"videoUrl": "https://youtube.com/watch?v=..."}'
```

---

## Performance

- **FFmpeg analysis:** ~1-2 minutes per hour of video
- **Google API:** ~30 seconds per video
- **Heuristics:** Instant (but less accurate)

---

## Next Steps

1. Choose your analysis method
2. Set up the service/API
3. Configure environment variables
4. Test with a sample video
5. Enjoy automatic viral clip detection! 🚀

