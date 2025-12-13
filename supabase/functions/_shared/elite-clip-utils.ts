/**
 * Elite Clip Utilities
 * Based on viral clip analysis from top streamers (Speed, Kai Cenat, Rakai)
 * 
 * Core principles:
 * - Viral clips are emotional punches, not highlights
 * - Start late, end early
 * - Focus on escalation and timing
 * - Captions add drama, not explanation
 */

/**
 * Viral trigger types
 */
export type ViralTrigger = 
  | "shock_disbelief" 
  | "escalation" 
  | "relatability" 
  | "status_flex" 
  | "absurdity" 
  | "timing_perfection";

/**
 * Elite clip structure (4-part formula)
 */
export interface EliteClipStructure {
  contextStart: number;      // 0-1.5s - just enough context
  tensionStart: number;        // Tension builds
  explosionStart: number;      // The moment (yell, fail, rage, shock)
  aftermathStart: number;      // Reaction, laugh, stare, silence
  aftermathEnd: number;        // End early, don't let it die
}

/**
 * Detect viral triggers in a clip segment
 */
export function detectViralTriggers(features: {
  hasLoudAudio: boolean;
  hasHighMotion: boolean;
  hasSceneChange: boolean;
  audioIntensity?: number;
  motionScore?: number;
  clipType: string;
}): ViralTrigger[] {
  const triggers: ViralTrigger[] = [];
  
  // Shock/Disbelief: Sudden loud audio + high motion
  if (features.hasLoudAudio && features.hasHighMotion && (features.audioIntensity || 0) > 0.8) {
    triggers.push("shock_disbelief");
  }
  
  // Escalation: Multiple scene changes or increasing intensity
  if (features.hasSceneChange && features.hasHighMotion) {
    triggers.push("escalation");
  }
  
  // Timing Perfection: Optimal length with high engagement
  if (features.hasLoudAudio && features.hasHighMotion) {
    triggers.push("timing_perfection");
  }
  
  // Absurdity: Unexpected combinations
  if (features.clipType === "funny" && features.hasLoudAudio) {
    triggers.push("absurdity");
  }
  
  return triggers;
}

/**
 * Optimize clip timing using elite formula
 * Start late (right before moment), end early (don't let joke die)
 */
export function optimizeEliteTiming(
  startTime: number,
  endTime: number,
  peakMoment: number,
  duration: number
): { startTime: number; endTime: number } {
  const clipDuration = endTime - startTime;
  
  // Elite rule: Start late (0.5-1.5s before peak moment)
  // Don't start too early - viewers will scroll
  const contextBuffer = 1.0; // 1 second of context max
  const optimizedStart = Math.max(0, peakMoment - contextBuffer);
  
  // Elite rule: End early (right after explosion, capture aftermath briefly)
  // Aftermath should be 1-3 seconds max
  const aftermathDuration = 2.0; // 2 seconds of aftermath
  const optimizedEnd = Math.min(duration, peakMoment + aftermathDuration);
  
  // Ensure minimum 3 seconds (too short = bad) and max 30 seconds (too long = scroll)
  const finalDuration = optimizedEnd - optimizedStart;
  
  if (finalDuration < 3) {
    // Extend slightly if too short
    return {
      startTime: Math.max(0, optimizedStart - 0.5),
      endTime: Math.min(duration, optimizedEnd + 0.5),
    };
  }
  
  if (finalDuration > 30) {
    // Trim to 30s, focusing on peak
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
 * Generate drama-adding captions (not explanatory)
 * Based on elite caption formulas
 */
export function generateDramaCaption(
  clipType: "reaction" | "action" | "funny" | "dramatic" | "highlight",
  triggers: ViralTrigger[],
  score: number
): string {
  // Elite rule: Captions ADD drama, not explain it
  
  const dramaCaptions: Record<string, string[]> = {
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
      "It's getting worse",
      "This is too much",
      "It keeps escalating",
    ],
    timing_perfection: [
      "The timing is PERFECT",
      "This is too good",
      "The reaction is everything",
      "This is gold",
      "Perfect moment",
    ],
    absurdity: [
      "This makes no sense",
      "What is happening",
      "This is too wild",
      "I can't process this",
      "This is chaos",
    ],
    status_flex: [
      "He got HUMBLED",
      "The ego check",
      "He thought he was safe",
      "Confidence destroyed",
      "The fall from grace",
    ],
    relatability: [
      "We've all been there",
      "This is too real",
      "I felt that",
      "This hits different",
      "Too relatable",
    ],
  };
  
  // Use the strongest trigger for caption
  const primaryTrigger = triggers[0] || "timing_perfection";
  const pool = dramaCaptions[primaryTrigger] || dramaCaptions.timing_perfection;
  
  return pool[Math.floor(Math.random() * pool.length)];
}

/**
 * Generate on-screen text with elite timing
 * First text at 0.2-0.4s, new text at escalations
 */
export function generateOnScreenText(
  clipDuration: number,
  triggers: ViralTrigger[],
  peakMoment: number
): Array<{ time: number; text: string; duration: number }> {
  const texts: Array<{ time: number; text: string; duration: number }> = [];
  
  // Elite rule: First text appears at 0.2-0.4s
  const firstTextTime = 0.3;
  const firstText = generateDramaCaption("reaction", triggers, 0);
  texts.push({
    time: firstTextTime,
    text: firstText,
    duration: Math.min(2.0, clipDuration - firstTextTime),
  });
  
  // If there's an escalation, add text at that moment
  if (triggers.includes("escalation") && peakMoment > 1.5) {
    const escalationText = generateDramaCaption("dramatic", ["escalation"], 0);
    texts.push({
      time: peakMoment - 0.5, // Slightly before peak
      text: escalationText,
      duration: 2.0,
    });
  }
  
  return texts;
}

/**
 * Calculate elite viral score
 * Based on emotional impact, not just features
 */
export function calculateEliteViralScore(features: {
  hasLoudAudio: boolean;
  hasHighMotion: boolean;
  hasSceneChange: boolean;
  triggers: ViralTrigger[];
  clipType: string;
  duration: number;
  timingScore: number; // How well it follows elite structure
}): number {
  let score = 30; // Lower base - elite clips are rare
  
  // Trigger bonuses (strongest factor)
  if (features.triggers.includes("shock_disbelief")) score += 25;
  if (features.triggers.includes("escalation")) score += 20;
  if (features.triggers.includes("timing_perfection")) score += 15;
  if (features.triggers.includes("absurdity")) score += 15;
  if (features.triggers.includes("status_flex")) score += 15;
  if (features.triggers.includes("relatability")) score += 10;
  
  // Multiple triggers stack (elite clips often have 2)
  if (features.triggers.length >= 2) score += 10;
  
  // Timing is critical
  score += features.timingScore * 10;
  
  // Feature bonuses
  if (features.hasLoudAudio) score += 10; // Reactions are key
  if (features.hasHighMotion) score += 8; // Physical reactions
  if (features.hasSceneChange) score += 5;
  
  // Duration optimization (3-15s is elite, 15-30s is good)
  if (features.duration >= 3 && features.duration <= 15) {
    score += 15; // Perfect for TikTok brain
  } else if (features.duration > 15 && features.duration <= 30) {
    score += 8; // Still good
  } else if (features.duration > 30) {
    score -= 10; // Too long, viewers scroll
  }
  
  // Type bonuses
  if (features.clipType === "reaction") score += 10;
  if (features.clipType === "funny") score += 8;
  
  return Math.min(100, Math.round(score));
}

/**
 * Detect pre-viral indicators
 * Signs that a moment is about to explode
 */
export function detectPreViralIndicators(segment: {
  audioIntensity: number;
  motionScore: number;
  hasSceneChange: boolean;
  time: number;
}): {
  hasPostureChange: boolean;
  hasToneSwitch: boolean;
  hasRepeatedWords: boolean;
  chatExploding: boolean;
  hasNahOrBro: boolean;
} {
  // Simulate detection (in real implementation, would analyze audio/chat)
  const hasToneSwitch = segment.audioIntensity > 0.7;
  const hasPostureChange = segment.motionScore > 60;
  const chatExploding = segment.hasSceneChange && segment.audioIntensity > 0.6;
  
  return {
    hasPostureChange,
    hasToneSwitch,
    hasRepeatedWords: segment.audioIntensity > 0.8, // High intensity = repeated words
    chatExploding,
    hasNahOrBro: segment.audioIntensity > 0.65, // Common phrases before explosions
  };
}

/**
 * Generate elite clip structure
 * 4-part formula: Context → Tension → Explosion → Aftermath
 */
export function generateEliteStructure(
  startTime: number,
  endTime: number,
  peakMoment: number
): EliteClipStructure {
  const duration = endTime - startTime;
  
  // Context: 0-1.5s (just enough to understand)
  const contextStart = startTime;
  const contextEnd = Math.min(startTime + 1.5, peakMoment - 0.5);
  
  // Tension: Builds before explosion
  const tensionStart = contextEnd;
  const tensionEnd = peakMoment - 0.2;
  
  // Explosion: The moment (peak)
  const explosionStart = peakMoment - 0.2;
  const explosionEnd = peakMoment + 1.0;
  
  // Aftermath: Reaction, laugh, stare (1-3s max)
  const aftermathStart = explosionEnd;
  const aftermathEnd = Math.min(endTime, aftermathStart + 2.5);
  
  return {
    contextStart,
    tensionStart,
    explosionStart,
    aftermathStart,
    aftermathEnd,
  };
}

