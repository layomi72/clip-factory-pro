# Auto Viral Clip Generation

## How It Works

The system now automatically finds viral-worthy moments in your streams!

### Current Implementation (Heuristic-Based)

**What it does:**
- Analyzes video in 30-second segments
- Scores each segment based on:
  - Optimal clip length (15-60 seconds = higher score)
  - Timing (beginning/middle often have good moments)
  - Simulated engagement factors

**Limitations:**
- Currently uses heuristics (rules-based), not real AI
- Doesn't actually analyze audio/video content yet
- Scores are simulated for demonstration

### How to Use

1. **Import Stream with Auto-Generate Enabled:**
   - Go to Import Streams
   - Paste video URL
   - Check "Auto-generate viral clips" checkbox
   - Click "Auto-Generate Clips"

2. **System Automatically:**
   - Imports the stream
   - Analyzes for viral moments
   - Creates top 5 clips automatically
   - Queues them for processing

3. **Review & Schedule:**
   - See all suggested clips with scores
   - Top clips are already queued for processing
   - Schedule individual clips to specific accounts
   - Or let the system post the top ones automatically

### Future Enhancements (For Real AI)

To make this truly intelligent, you'd integrate:

1. **Audio Analysis:**
   - Detect loud moments (reactions, excitement)
   - Detect laughter
   - Detect music/sound effects

2. **Video Analysis:**
   - Scene change detection
   - Motion detection (high motion = engaging)
   - Face detection (reactions, expressions)
   - Object detection (interesting items)

3. **ML Services:**
   - Google Cloud Video Intelligence API
   - AWS Rekognition
   - Custom ML models
   - OpenAI Vision API

4. **Engagement Prediction:**
   - Train model on viral clips
   - Predict which moments will perform well
   - Score based on historical data

### Current Workflow

```
Import Stream
    ↓
Auto-Analyze (finds 10 potential clips)
    ↓
Top 5 automatically queued for processing
    ↓
GitHub Actions processes them
    ↓
Clips ready to post
    ↓
Schedule to accounts
    ↓
Auto-post at scheduled times
```

### Configuration

To use real ML analysis, set environment variable:
```
ML_ANALYSIS_SERVICE_URL=https://your-ml-service.com
```

The system will call this service for advanced analysis, falling back to heuristics if unavailable.

---

**Note:** The current implementation is a foundation. For production viral clip detection, you'll want to integrate real ML/AI services or build custom models.

