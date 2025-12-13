/**
 * Viral Clip Utilities
 * Functions for generating clickbait titles, engaging captions, and viral-optimized content
 * Based on patterns from successful streamers like Kai Cenat, IShowSpeed, etc.
 */

/**
 * Generate clickbait title based on clip type and content
 */
export function generateClickbaitTitle(
  clipType: "reaction" | "action" | "funny" | "dramatic" | "highlight",
  reason: string,
  score: number
): string {
  const titles: Record<string, string[]> = {
    reaction: [
      "🔥 HE REACTED LIKE THIS?!",
      "💀 HIS REACTION IS INSANE",
      "😱 YOU WON'T BELIEVE HIS REACTION",
      "🔥 THIS REACTION WENT VIRAL",
      "💀 HE LOST IT WHEN THIS HAPPENED",
      "😱 HIS REACTION IS EVERYTHING",
      "🔥 THIS REACTION IS TOO FUNNY",
      "💀 WAIT FOR HIS REACTION",
      "😱 HIS REACTION SAYS IT ALL",
      "🔥 THIS REACTION IS WILD",
    ],
    action: [
      "🔥 HE DID WHAT?!",
      "💀 THIS IS INSANE",
      "😱 YOU HAVE TO SEE THIS",
      "🔥 THIS IS TOO CRAZY",
      "💀 HE WENT OFF",
      "😱 THIS IS WILD",
      "🔥 HE DIDN'T HOLD BACK",
      "💀 THIS IS NEXT LEVEL",
      "😱 YOU WON'T BELIEVE THIS",
      "🔥 THIS IS INSANE",
    ],
    funny: [
      "😂 THIS IS TOO FUNNY",
      "💀 I'M DEAD",
      "😭 THIS MADE ME CRY",
      "😂 YOU'LL LAUGH AT THIS",
      "💀 THIS IS HILARIOUS",
      "😭 I CAN'T STOP LAUGHING",
      "😂 THIS IS GOLD",
      "💀 THIS IS TOO GOOD",
      "😭 MY STOMACH HURTS",
      "😂 THIS IS COMEDY",
    ],
    dramatic: [
      "🔥 THIS IS DRAMA",
      "💀 THIS IS INTENSE",
      "😱 THIS IS CRAZY",
      "🔥 YOU HAVE TO SEE THIS",
      "💀 THIS IS WILD",
      "😱 THIS IS INSANE",
      "🔥 THIS IS TOO MUCH",
      "💀 THIS IS NEXT LEVEL",
      "😱 YOU WON'T BELIEVE THIS",
      "🔥 THIS IS UNREAL",
    ],
    highlight: [
      "🔥 THIS IS THE MOMENT",
      "💀 BEST MOMENT EVER",
      "😱 YOU HAVE TO SEE THIS",
      "🔥 THIS IS INSANE",
      "💀 THIS IS TOO GOOD",
      "😱 THIS IS WILD",
      "🔥 THIS IS THE ONE",
      "💀 THIS IS LEGENDARY",
      "😱 THIS IS UNREAL",
      "🔥 THIS IS FIRE",
    ],
  };

  const pool = titles[clipType] || titles.highlight;
  
  // Add score-based modifiers
  if (score >= 90) {
    return `🔥 ${pool[Math.floor(Math.random() * pool.length)]} 🔥`;
  } else if (score >= 80) {
    return pool[Math.floor(Math.random() * pool.length)];
  } else {
    // For lower scores, use more generic but still engaging titles
    return pool[Math.floor(Math.random() * pool.length)];
  }
}

/**
 * Generate engaging caption for social media
 */
export function generateViralCaption(
  clipType: "reaction" | "action" | "funny" | "dramatic" | "highlight",
  reason: string,
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
  
  // Create engaging caption with emojis and hashtags
  const caption = `${title}\n\n${reason}\n\n${tags.join(" ")}`;
  
  return caption;
}

/**
 * Optimize clip length for maximum engagement
 * TikTok/Shorts perform best at 15-30 seconds
 */
export function optimizeClipLength(startTime: number, endTime: number): { startTime: number; endTime: number } {
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
 * Calculate viral score based on multiple factors
 */
export function calculateViralScore(features: {
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
 * Generate viral-optimized clip metadata
 */
export function generateViralMetadata(clip: {
  startTime: number;
  endTime: number;
  score: number;
  reason: string;
  type: "reaction" | "action" | "funny" | "dramatic" | "highlight";
}): {
  title: string;
  caption: string;
  hashtags: string[];
  optimizedClip: { startTime: number; endTime: number };
} {
  // Optimize clip length
  const optimizedClip = optimizeClipLength(clip.startTime, clip.endTime);
  
  // Generate clickbait title
  const title = generateClickbaitTitle(clip.type, clip.reason, clip.score);
  
  // Generate engaging caption
  const caption = generateViralCaption(clip.type, clip.reason, title);
  
  // Extract hashtags from caption
  const hashtags = caption.match(/#\w+/g) || [];
  
  return {
    title,
    caption,
    hashtags,
    optimizedClip,
  };
}

