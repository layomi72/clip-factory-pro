/**
 * FFmpeg-based Video Analysis Script
 * 
 * This script uses FFmpeg and FFprobe to perform real video/audio analysis
 * Can be run as a service or called from Edge Functions
 * 
 * Requires: FFmpeg and FFprobe installed
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

/**
 * Analyze audio for loud moments and reactions
 */
function analyzeAudio(videoPath) {
  console.log('Analyzing audio...');
  
  try {
    // Use FFprobe to get audio levels
    // This detects RMS (Root Mean Square) levels - loud moments
    const command = `ffprobe -f lavfi -i "amovie=${videoPath},astats=metadata=1:reset=1" -show_entries frame=pkt_pts_time:frame_tags=lavfi.astats.Overall.RMS_level -of csv=p=0 2>/dev/null`;
    
    const output = execSync(command, { encoding: 'utf-8', maxBuffer: 10 * 1024 * 1024 });
    const lines = output.trim().split('\n');
    
    const loudMoments = [];
    const audioEnergy = [];
    
    lines.forEach(line => {
      const [time, level] = line.split(',');
      if (time && level) {
        const timestamp = parseFloat(time);
        const rmsLevel = parseFloat(level);
        
        audioEnergy.push({ time: timestamp, energy: rmsLevel });
        
        // Loud moments (RMS > -20 dB is considered loud)
        if (rmsLevel > -20) {
          loudMoments.push({
            time: timestamp,
            intensity: rmsLevel,
          });
        }
      }
    });
    
    return { loudMoments, audioEnergy };
  } catch (error) {
    console.error('Audio analysis failed:', error.message);
    return { loudMoments: [], audioEnergy: [] };
  }
}

/**
 * Detect scene changes using FFmpeg
 */
function detectSceneChanges(videoPath) {
  console.log('Detecting scene changes...');
  
  try {
    // FFmpeg scene detection (threshold 0.3 = 30% change)
    const command = `ffmpeg -i "${videoPath}" -filter:v "select='gt(scene,0.3)',showinfo" -f null - 2>&1 | grep "scene_score"`;
    
    const output = execSync(command, { encoding: 'utf-8', maxBuffer: 10 * 1024 * 1024 });
    const sceneChanges = [];
    
    // Parse scene change timestamps
    const lines = output.split('\n');
    lines.forEach(line => {
      const match = line.match(/pts_time:([\d.]+)/);
      if (match) {
        sceneChanges.push(parseFloat(match[1]));
      }
    });
    
    return sceneChanges;
  } catch (error) {
    console.error('Scene detection failed:', error.message);
    return [];
  }
}

/**
 * Analyze motion/activity in video
 */
function analyzeMotion(videoPath) {
  console.log('Analyzing motion...');
  
  try {
    // Use frame difference to detect motion
    // Higher difference = more motion = more engaging
    const command = `ffmpeg -i "${videoPath}" -vf "select='gt(scene,0.1)',showinfo" -f null - 2>&1 | grep "pts_time"`;
    
    const output = execSync(command, { encoding: 'utf-8', maxBuffer: 10 * 1024 * 1024 });
    const motionMoments = [];
    
    const lines = output.split('\n');
    let lastTime = 0;
    lines.forEach(line => {
      const match = line.match(/pts_time:([\d.]+)/);
      if (match) {
        const time = parseFloat(match[1]);
        // More frequent scene changes = more motion
        const motionScore = time - lastTime < 2 ? 80 : 40;
        motionMoments.push({ time, motionScore });
        lastTime = time;
      }
    });
    
    return motionMoments;
  } catch (error) {
    console.error('Motion analysis failed:', error.message);
    return [];
  }
}

/**
 * Get video duration and metadata
 */
function getVideoMetadata(videoPath) {
  try {
    const command = `ffprobe -v error -show_entries format=duration,bit_rate -show_entries stream=width,height,r_frame_rate -of json "${videoPath}"`;
    const output = execSync(command, { encoding: 'utf-8' });
    const data = JSON.parse(output);
    
    const format = data.format || {};
    const stream = data.streams?.[0] || {};
    
    const fpsMatch = stream.r_frame_rate?.match(/(\d+)\/(\d+)/);
    const fps = fpsMatch ? parseFloat(fpsMatch[1]) / parseFloat(fpsMatch[2]) : 30;
    
    return {
      duration: parseFloat(format.duration) || 0,
      fps: fps,
      resolution: {
        width: stream.width || 1920,
        height: stream.height || 1080,
      },
      bitrate: parseInt(format.bit_rate) || 5000000,
    };
  } catch (error) {
    console.error('Metadata extraction failed:', error.message);
    return { duration: 0, fps: 30, resolution: { width: 1920, height: 1080 }, bitrate: 5000000 };
  }
}

/**
 * Main analysis function
 */
function analyzeVideo(videoPath) {
  console.log(`\n=== Analyzing Video: ${videoPath} ===\n`);
  
  if (!fs.existsSync(videoPath)) {
    throw new Error(`Video file not found: ${videoPath}`);
  }
  
  // Get metadata
  const metadata = getVideoMetadata(videoPath);
  console.log(`Duration: ${metadata.duration}s, Resolution: ${metadata.resolution.width}x${metadata.resolution.height}`);
  
  // Analyze audio
  const audioAnalysis = analyzeAudio(videoPath);
  console.log(`Found ${audioAnalysis.loudMoments.length} loud moments`);
  
  // Detect scene changes
  const sceneChanges = detectSceneChanges(videoPath);
  console.log(`Found ${sceneChanges.length} scene changes`);
  
  // Analyze motion
  const motionAnalysis = analyzeMotion(videoPath);
  console.log(`Found ${motionAnalysis.length} high-motion moments`);
  
  // Generate clip suggestions based on analysis
  const clips = generateClipSuggestions({
    duration: metadata.duration,
    loudMoments: audioAnalysis.loudMoments,
    sceneChanges,
    motionMoments: motionAnalysis,
  });
  
  console.log(`\n=== Generated ${clips.length} Clip Suggestions ===\n`);
  
  return {
    metadata,
    analysis: {
      audio: audioAnalysis,
      sceneChanges,
      motion: motionAnalysis,
    },
    clips,
  };
}

/**
 * Generate clip suggestions based on analysis
 */
function generateClipSuggestions(analysis) {
  const { duration, loudMoments, sceneChanges, motionMoments } = analysis;
  const clips = [];
  const clipLength = 30; // 30 second clips
  
  // Strategy: Find moments with multiple positive signals
  const significantMoments = new Map();
  
  // Score moments based on features
  loudMoments.forEach(moment => {
    const time = Math.floor(moment.time);
    const score = significantMoments.get(time) || 0;
    significantMoments.set(time, score + 30); // Loud audio = +30 points
  });
  
  sceneChanges.forEach(time => {
    const t = Math.floor(time);
    const score = significantMoments.get(t) || 0;
    significantMoments.set(t, score + 20); // Scene change = +20 points
  });
  
  motionMoments.forEach(moment => {
    const time = Math.floor(moment.time);
    const score = significantMoments.get(time) || 0;
    significantMoments.set(time, score + moment.motionScore / 10); // Motion = variable points
  });
  
  // Create clips around significant moments
  for (const [momentTime, baseScore] of significantMoments.entries()) {
    const startTime = Math.max(0, momentTime - 10); // Start 10s before moment
    const endTime = Math.min(duration, momentTime + clipLength - 10); // 30s clip
    
    if (endTime - startTime < 15) continue; // Skip clips shorter than 15s
    
    let score = baseScore;
    const features = {
      hasLoudAudio: loudMoments.some(m => m.time >= startTime && m.time <= endTime),
      hasSceneChange: sceneChanges.some(t => t >= startTime && t <= endTime),
      hasHighMotion: motionMoments.some(m => m.time >= startTime && m.time <= endTime && m.motionScore > 60),
      hasFaces: false, // Would need face detection
      optimalLength: (endTime - startTime) >= 15 && (endTime - startTime) <= 60,
    };
    
    // Bonus for optimal length
    if (features.optimalLength) score += 25;
    
    // Bonus for multiple features
    const featureCount = Object.values(features).filter(Boolean).length;
    score += featureCount * 5;
    
    if (score > 60) {
      clips.push({
        startTime,
        endTime,
        score: Math.min(100, Math.round(score)),
        reason: generateReason(score, features),
        type: determineType(features),
        confidence: score / 100,
        features,
      });
    }
  }
  
  // Sort by score and return top clips
  return clips.sort((a, b) => b.score - a.score).slice(0, 10);
}

function generateReason(score, features) {
  const reasons = [];
  if (features.hasLoudAudio) reasons.push("loud audio/reactions");
  if (features.hasSceneChange) reasons.push("scene change");
  if (features.hasHighMotion) reasons.push("high motion");
  if (features.optimalLength) reasons.push("optimal length");
  
  if (reasons.length > 0) {
    return `High potential: ${reasons.join(", ")}`;
  }
  return score > 80 ? "Excellent viral potential" : "Good clip";
}

function determineType(features) {
  if (features.hasLoudAudio && features.hasHighMotion) return "reaction";
  if (features.hasHighMotion) return "action";
  if (features.hasLoudAudio) return "funny";
  if (features.hasSceneChange) return "dramatic";
  return "highlight";
}

// Export for use as module
module.exports = { analyzeVideo, analyzeAudio, detectSceneChanges, analyzeMotion };

// Run if called directly
if (require.main === module) {
  const videoPath = process.argv[2];
  if (!videoPath) {
    console.error('Usage: node analyze-video-ffmpeg.js <video-path>');
    process.exit(1);
  }
  
  try {
    const result = analyzeVideo(videoPath);
    console.log(JSON.stringify(result, null, 2));
  } catch (error) {
    console.error('Analysis failed:', error);
    process.exit(1);
  }
}

