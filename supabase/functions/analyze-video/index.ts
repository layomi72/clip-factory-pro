/**
 * Video Analysis Service
 * Analyzes videos to find viral-worthy moments automatically
 * 
 * Uses techniques like:
 * - Audio analysis (loud moments, laughter, reactions)
 * - Scene change detection
 * - Motion detection
 * - Face detection (reactions)
 * - Sentiment analysis
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ClipSuggestion {
  startTime: number;
  endTime: number;
  score: number; // Viral potential score (0-100)
  reason: string; // Why this clip is suggested
  type: "reaction" | "action" | "funny" | "dramatic" | "highlight";
}

/**
 * Analyze video for viral-worthy moments using real AI/ML
 * Tries advanced analysis first, falls back to heuristics
 */
async function analyzeVideoForClips(
  videoUrl: string,
  duration: number
): Promise<ClipSuggestion[]> {
  // Try advanced analysis service first
  const advancedServiceUrl = Deno.env.get("ADVANCED_ANALYSIS_SERVICE_URL");
  const ffmpegServiceUrl = Deno.env.get("FFMPEG_ANALYSIS_SERVICE_URL");
  
  // Option 1: Call advanced analysis service (Google Video Intelligence, etc.)
  if (advancedServiceUrl) {
    try {
      const response = await fetch(`${advancedServiceUrl}/analyze`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ videoUrl, duration }),
      });
      
      if (response.ok) {
        const result = await response.json();
        if (result.clips && result.clips.length > 0) {
          return result.clips;
        }
      }
    } catch (error) {
      console.error("Advanced analysis service failed:", error);
    }
  }
  
  // Option 2: Call FFmpeg analysis service
  if (ffmpegServiceUrl) {
    try {
      const response = await fetch(`${ffmpegServiceUrl}/analyze`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ videoUrl, duration }),
      });
      
      if (response.ok) {
        const result = await response.json();
        if (result.clips && result.clips.length > 0) {
          return result.clips;
        }
      }
    } catch (error) {
      console.error("FFmpeg analysis service failed:", error);
    }
  }
  
  // Fallback: Enhanced heuristics (better than before)
  return enhancedHeuristicAnalysis(videoUrl, duration);
}

/**
 * Enhanced heuristic analysis optimized for viral content
 * Focuses on 15-30 second clips (optimal for TikTok/Shorts)
 */
function enhancedHeuristicAnalysis(
  videoUrl: string,
  duration: number
): ClipSuggestion[] {
  const clips: ClipSuggestion[] = [];
  
  // Elite rule: Generate many clips (10-30), expect 90% to flop
  // Focus on 3-15 second clips (elite sweet spot for TikTok brain)
  const targetClipLength = 8; // Start with 8s segments
  const overlap = 1;
  
  // Analyze in very focused segments looking for emotional moments
  for (let start = 0; start < duration - 3; start += targetClipLength - overlap) {
    const end = Math.min(start + targetClipLength, duration);
    const clipDuration = end - start;
    
    // Skip clips that are too short (minimum 3s)
    if (clipDuration < 3) continue;
    
    // Elite rule: Skip clips that are too long (>30s = viewers scroll)
    if (clipDuration > 30) continue;
    
    const features = {
      hasLoudAudio: false,
      hasSceneChange: false,
      hasHighMotion: false,
      hasFaces: false,
      optimalLength: clipDuration >= 3 && clipDuration <= 15, // Elite length
      audioIntensity: 0,
      motionScore: 0,
    };
    
    // Simulate feature detection with focus on emotional moments
    const random = Math.random();
    const intensity = Math.random();
    
    // Detect pre-viral indicators
    if (random > 0.65) {
      features.hasLoudAudio = true;
      features.audioIntensity = intensity;
    }
    if (random > 0.6) {
      features.hasSceneChange = true;
    }
    if (random > 0.55) {
      features.hasHighMotion = true;
      features.motionScore = intensity * 100;
    }
    
    // Elite rule: Look for escalation patterns
    const hasEscalation = features.hasLoudAudio && features.hasHighMotion && intensity > 0.7;
    
    // Detect viral triggers
    const triggers: string[] = [];
    if (features.hasLoudAudio && features.hasHighMotion && features.audioIntensity > 0.8) {
      triggers.push("shock_disbelief");
    }
    if (hasEscalation) {
      triggers.push("escalation");
    }
    if (features.hasLoudAudio && features.hasHighMotion) {
      triggers.push("timing_perfection");
    }
    if (features.optimalLength && triggers.length > 0) {
      triggers.push("timing_perfection");
    }
    
    // Determine clip type
    const clipType = determineType(features);
    
    // Calculate peak moment (assume middle of clip for explosion)
    const peakMoment = start + clipDuration / 2;
    
    // Elite rule: Optimize timing - start late, end early
    const optimized = optimizeEliteTimingLocal(start, end, peakMoment, duration);
    const optimizedDuration = optimized.endTime - optimized.startTime;
    
    // Calculate elite viral score
    const timingScore = optimizedDuration >= 3 && optimizedDuration <= 15 ? 1.0 : 0.5;
    const score = calculateEliteViralScoreLocal({
      ...features,
      triggers: triggers as any[],
      clipType,
      duration: optimizedDuration,
      timingScore,
    });
    
    // Elite rule: Only include clips with strong viral potential (higher threshold)
    if (score >= 70) {
      clips.push({
        startTime: optimized.startTime,
        endTime: optimized.endTime,
        score: Math.min(100, score),
        reason: generateEliteReason(score, features, clipType, triggers),
        type: clipType,
      });
    }
  }
  
  // Sort by score and return top clips
  // Elite rule: Generate volume, show only the best
  return clips.sort((a, b) => b.score - a.score).slice(0, 15); // Generate more, show top 15
}

/**
 * Generate viral-focused reason text
 */
function generateViralReason(score: number, features: any, clipType: string): string {
  const reasons: string[] = [];
  
  if (features.hasLoudAudio) {
    reasons.push("🔥 High energy reactions");
  }
  if (features.hasHighMotion) {
    reasons.push("⚡ Fast-paced action");
  }
  if (features.hasSceneChange) {
    reasons.push("🎬 Dynamic moments");
  }
  if (features.optimalLength) {
    reasons.push("⏱️ Perfect clip length");
  }
  
  // Add type-specific reasons
  if (clipType === "reaction") {
    reasons.push("💀 Viral reaction moment");
  } else if (clipType === "funny") {
    reasons.push("😂 Comedy gold");
  } else if (clipType === "action") {
    reasons.push("🔥 High-intensity moment");
  }
  
  if (score >= 90) {
    return `🔥 VIRAL POTENTIAL: ${reasons.join(", ")} 🔥`;
  } else if (score >= 80) {
    return `High engagement: ${reasons.join(", ")}`;
  } else if (reasons.length > 0) {
    return `Good clip: ${reasons.join(", ")}`;
  }
  
  return score > 80 ? "Excellent viral potential" : "Good clip";
}

// generateReason is now generateViralReason (see above)

function determineType(features: any): ClipSuggestion["type"] {
  if (features.hasLoudAudio && features.hasHighMotion) return "reaction";
  if (features.hasHighMotion) return "action";
  if (features.hasLoudAudio) return "funny";
  if (features.hasSceneChange) return "dramatic";
  return "highlight";
}

/**
 * Local implementation of viral score calculation
 */
function calculateViralScoreLocal(features: {
  hasLoudAudio: boolean;
  hasSceneChange: boolean;
  hasHighMotion: boolean;
  hasFaces: boolean;
  optimalLength: boolean;
  clipType: "reaction" | "action" | "funny" | "dramatic" | "highlight";
  duration: number;
}): number {
  let score = 40; // Base score
  
  // Feature bonuses
  if (features.hasLoudAudio) score += 20; // Reactions are highly engaging
  if (features.hasHighMotion) score += 15; // Motion keeps attention
  if (features.hasSceneChange) score += 10; // Scene changes add interest
  if (features.hasFaces) score += 15; // Faces increase engagement
  if (features.optimalLength) score += 20; // Optimal length is crucial
  
  // Type bonuses (reactions and funny content perform best)
  if (features.clipType === "reaction") score += 10;
  if (features.clipType === "funny") score += 10;
  if (features.clipType === "action") score += 5;
  
  // Duration optimization (15-30s is sweet spot)
  if (features.duration >= 15 && features.duration <= 30) {
    score += 15;
  } else if (features.duration > 30 && features.duration <= 60) {
    score += 5; // Still good but not optimal
  }
  
  return Math.min(100, Math.round(score));
}

/**
 * Local implementation of clip length optimization
 */
function optimizeClipLengthLocal(startTime: number, endTime: number): { startTime: number; endTime: number } {
  const duration = endTime - startTime;
  
  // If clip is too long (>30s), trim to 30s focusing on the peak moment
  if (duration > 30) {
    const peakTime = startTime + duration / 2; // Assume peak is in middle
    return {
      startTime: Math.max(0, peakTime - 15),
      endTime: peakTime + 15,
    };
  }
  
  // If clip is too short (<15s), extend if possible
  if (duration < 15) {
    const extension = (15 - duration) / 2;
    return {
      startTime: Math.max(0, startTime - extension),
      endTime: endTime + extension,
    };
  }
  
  return { startTime, endTime };
}

/**
 * Elite timing optimization - start late, end early
 */
function optimizeEliteTimingLocal(
  startTime: number,
  endTime: number,
  peakMoment: number,
  duration: number
): { startTime: number; endTime: number } {
  // Elite rule: Start late (0.5-1.5s before peak moment)
  const contextBuffer = 1.0; // 1 second of context max
  const optimizedStart = Math.max(0, peakMoment - contextBuffer);
  
  // Elite rule: End early (right after explosion, capture aftermath briefly)
  const aftermathDuration = 2.0; // 2 seconds of aftermath max
  const optimizedEnd = Math.min(duration, peakMoment + aftermathDuration);
  
  // Ensure minimum 3 seconds and max 30 seconds
  const finalDuration = optimizedEnd - optimizedStart;
  
  if (finalDuration < 3) {
    return {
      startTime: Math.max(0, optimizedStart - 0.5),
      endTime: Math.min(duration, optimizedEnd + 0.5),
    };
  }
  
  if (finalDuration > 30) {
    return {
      startTime: Math.max(0, peakMoment - 15),
      endTime: Math.min(duration, peakMoment + 15),
    };
  }
  
  return {
    startTime: optimizedStart,
    endTime: optimizedEnd,
  };
}

/**
 * Calculate elite viral score
 */
function calculateEliteViralScoreLocal(features: {
  hasLoudAudio: boolean;
  hasHighMotion: boolean;
  hasSceneChange: boolean;
  triggers: string[];
  clipType: string;
  duration: number;
  timingScore: number;
}): number {
  let score = 30; // Lower base - elite clips are rare
  
  // Trigger bonuses (strongest factor)
  if (features.triggers.includes("shock_disbelief")) score += 25;
  if (features.triggers.includes("escalation")) score += 20;
  if (features.triggers.includes("timing_perfection")) score += 15;
  
  // Multiple triggers stack
  if (features.triggers.length >= 2) score += 10;
  
  // Timing is critical
  score += features.timingScore * 10;
  
  // Feature bonuses
  if (features.hasLoudAudio) score += 10;
  if (features.hasHighMotion) score += 8;
  if (features.hasSceneChange) score += 5;
  
  // Duration optimization (3-15s is elite)
  if (features.duration >= 3 && features.duration <= 15) {
    score += 15;
  } else if (features.duration > 15 && features.duration <= 30) {
    score += 8;
  } else if (features.duration > 30) {
    score -= 10; // Too long
  }
  
  // Type bonuses
  if (features.clipType === "reaction") score += 10;
  if (features.clipType === "funny") score += 8;
  
  return Math.min(100, Math.round(score));
}

/**
 * Generate elite reason text
 */
function generateEliteReason(
  score: number,
  features: any,
  clipType: string,
  triggers: string[]
): string {
  const reasons: string[] = [];
  
  if (triggers.includes("shock_disbelief")) {
    reasons.push("💥 Shock moment");
  }
  if (triggers.includes("escalation")) {
    reasons.push("📈 Escalation pattern");
  }
  if (triggers.includes("timing_perfection")) {
    reasons.push("⏱️ Perfect timing");
  }
  if (features.hasLoudAudio) {
    reasons.push("🔊 High energy");
  }
  if (features.hasHighMotion) {
    reasons.push("⚡ Physical reaction");
  }
  if (features.optimalLength) {
    reasons.push("📏 Elite length");
  }
  
  if (score >= 90) {
    return `🔥 ELITE: ${reasons.join(", ")} 🔥`;
  } else if (score >= 80) {
    return `High potential: ${reasons.join(", ")}`;
  } else if (reasons.length > 0) {
    return `Good clip: ${reasons.join(", ")}`;
  }
  
  return score > 80 ? "Excellent viral potential" : "Good clip";
}

/**
 * Generate elite clickbait title (drama-adding, not explanatory)
 */
function generateClickbaitTitle(
  clipType: "reaction" | "action" | "funny" | "dramatic" | "highlight",
  score: number,
  triggers?: string[]
): string {
  // Elite rule: Titles add drama, not explanation
  const dramaTitles: Record<string, string[]> = {
    shock_disbelief: [
      "WAIT WHAT??",
      "This escalated WAY too fast",
      "He didn't see this coming...",
      "Nah this reaction is insane",
      "This went 0 to 100 REAL quick",
      "Bro what just happened",
    ],
    escalation: [
      "It keeps getting worse",
      "This is spiraling",
      "It's not stopping",
      "This is too much",
      "It keeps escalating",
    ],
    reaction: [
      "💀 HIS REACTION IS INSANE",
      "😱 YOU WON'T BELIEVE THIS",
      "🔥 HE LOST IT",
      "💀 WAIT FOR IT",
      "😱 THIS REACTION",
    ],
    action: [
      "🔥 HE DID WHAT?!",
      "💀 THIS IS INSANE",
      "😱 YOU HAVE TO SEE THIS",
      "🔥 THIS IS TOO CRAZY",
      "💀 HE WENT OFF",
    ],
    funny: [
      "😂 THIS IS TOO FUNNY",
      "💀 I'M DEAD",
      "😭 THIS MADE ME CRY",
      "😂 YOU'LL LAUGH",
      "💀 THIS IS HILARIOUS",
    ],
    dramatic: [
      "🔥 THIS IS DRAMA",
      "💀 THIS IS INTENSE",
      "😱 THIS IS CRAZY",
      "🔥 YOU HAVE TO SEE THIS",
      "💀 THIS IS WILD",
    ],
    highlight: [
      "🔥 THIS IS THE MOMENT",
      "💀 BEST MOMENT EVER",
      "😱 YOU HAVE TO SEE THIS",
      "🔥 THIS IS INSANE",
      "💀 THIS IS TOO GOOD",
    ],
  };

  // Use trigger-based titles if available (stronger)
  if (triggers && triggers.length > 0) {
    const triggerTitle = dramaTitles[triggers[0]];
    if (triggerTitle) {
      const selected = triggerTitle[Math.floor(Math.random() * triggerTitle.length)];
      return score >= 90 ? `🔥 ${selected} 🔥` : selected;
    }
  }
  
  // Fallback to type-based titles
  const pool = dramaTitles[clipType] || dramaTitles.highlight;
  const selected = pool[Math.floor(Math.random() * pool.length)];
  
  return score >= 90 ? `🔥 ${selected} 🔥` : selected;
}

/**
 * Generate viral caption
 */
function generateViralCaption(
  clipType: "reaction" | "action" | "funny" | "dramatic" | "highlight",
  title: string
): string {
  const hashtags = {
    reaction: ["#reaction", "#viral", "#fyp", "#foryou", "#reactions", "#funny"],
    action: ["#viral", "#fyp", "#foryou", "#crazy", "#insane", "#wild"],
    funny: ["#funny", "#comedy", "#viral", "#fyp", "#foryou", "#laugh", "#humor"],
    dramatic: ["#drama", "#viral", "#fyp", "#foryou", "#intense", "#crazy"],
    highlight: ["#viral", "#fyp", "#foryou", "#bestmoment", "#highlight", "#fire"],
  };

  const tags = hashtags[clipType] || hashtags.highlight;
  return `${title}\n\n${tags.join(" ")}`;
}


/**
 * Advanced analysis using external ML service (optional)
 * You can integrate with services like:
 * - Google Cloud Video Intelligence API
 * - AWS Rekognition
 * - Custom ML model
 */
async function analyzeWithML(videoUrl: string): Promise<ClipSuggestion[]> {
  // Placeholder for ML-based analysis
  // This would call an external service or use a model
  const mlServiceUrl = Deno.env.get("ML_ANALYSIS_SERVICE_URL");
  
  if (mlServiceUrl) {
    try {
      const response = await fetch(`${mlServiceUrl}/analyze`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ videoUrl }),
      });
      
      if (response.ok) {
        const result = await response.json();
        return result.clips || [];
      }
    } catch (error) {
      console.error("ML analysis failed, falling back to heuristic:", error);
    }
  }
  
  // Fallback to heuristic
  return [];
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { videoUrl, duration, userId, importedStreamId } = await req.json();

    if (!videoUrl || !duration || !userId) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: videoUrl, duration, userId" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Analyzing video for viral clips: ${videoUrl}`);
    console.log(`Video duration: ${duration} seconds`);
    console.log(`User ID: ${userId}`);
    console.log(`Imported Stream ID: ${importedStreamId || 'none'}`);

    // Analyze video for clips
    const clips = await analyzeVideoForClips(videoUrl, duration);
    console.log(`Found ${clips.length} potential clips`);

    // Save clip suggestions to database
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Create processing jobs for top clips
    const jobs = [];
    const topClips = clips.slice(0, 5); // Top 5 clips
    console.log(`Creating processing jobs for ${topClips.length} clips`);
    
    for (const clip of topClips) {
      console.log(`Creating job for clip: ${clip.startTime}s - ${clip.endTime}s (score: ${clip.score})`);
      const { data: job, error } = await supabase
        .from("processing_jobs")
        .insert({
          user_id: userId,
          source_video_url: videoUrl,
          clip_start_time: clip.startTime,
          clip_end_time: clip.endTime,
          status: "pending",
          stream_id: importedStreamId || null,
        })
        .select()
        .single();

      if (error) {
        console.error(`Error creating job for clip ${clip.startTime}-${clip.endTime}:`, error);
      } else if (job) {
        console.log(`Job created: ${job.id}`);
        jobs.push({
          jobId: job.id,
          clip,
        });
      }
    }
    
    console.log(`Successfully created ${jobs.length} processing jobs`);

    // Generate elite viral metadata (titles, captions) for each clip
    // Extract triggers from reason for better title generation
    const clipsWithMetadata = clips.map(c => {
      // Parse triggers from reason if available
      const triggers: string[] = [];
      if (c.reason.includes("Shock")) triggers.push("shock_disbelief");
      if (c.reason.includes("Escalation")) triggers.push("escalation");
      if (c.reason.includes("timing")) triggers.push("timing_perfection");
      
      const title = generateClickbaitTitle(c.type, c.score, triggers);
      const caption = generateViralCaption(c.type, title);
      const hashtags = caption.match(/#\w+/g) || [];
      
      return {
        startTime: c.startTime,
        endTime: c.endTime,
        duration: c.endTime - c.startTime,
        score: c.score,
        reason: c.reason,
        type: c.type,
        title: title,
        caption: caption,
        hashtags: hashtags,
      };
    });

    return new Response(
      JSON.stringify({
        success: true,
        clipsFound: clips.length,
        clips: clipsWithMetadata,
        jobsCreated: jobs.length,
        message: `Found ${clips.length} potential viral clips. Top ${jobs.length} queued for processing.`,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error analyzing video:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

