/**
 * API Service Layer
 * Centralized service for calling Supabase Edge Functions
 * Includes error handling, retry logic, and type safety
 */

import { supabase } from "@/integrations/supabase/client";

// Types
export interface DownloadVideoResponse {
  success: boolean;
  platform: string;
  sourceUrl: string;
  videoUrl: string;
  metadata: any;
  message?: string;
}

export interface ProcessClipResponse {
  success: boolean;
  clipId: string;
  clipUrl: string;
  duration: number;
  startTime: number;
  endTime: number;
  message?: string;
}

export interface OAuthResponse {
  authUrl: string;
}

export interface PostResponse {
  success: boolean;
  videoId?: string;
  mediaId?: string;
  videoUrl?: string;
  permalink?: string;
  platform: string;
}

/**
 * Retry configuration
 */
const RETRY_CONFIG = {
  maxRetries: 3,
  retryDelay: 1000, // 1 second
};

/**
 * Retry helper function
 */
async function retry<T>(
  fn: () => Promise<T>,
  maxRetries: number = RETRY_CONFIG.maxRetries,
  delay: number = RETRY_CONFIG.retryDelay
): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    if (maxRetries > 0) {
      await new Promise((resolve) => setTimeout(resolve, delay));
      return retry(fn, maxRetries - 1, delay * 2); // Exponential backoff
    }
    throw error;
  }
}

/**
 * Generic function invoker with error handling
 */
async function invokeFunction<T>(
  functionName: string,
  body: any,
  options?: { retry?: boolean }
): Promise<T> {
  const invoke = async () => {
    const { data, error } = await supabase.functions.invoke(functionName, {
      body,
    });

    if (error) {
      throw new Error(error.message || `Failed to call ${functionName}`);
    }

    if (data?.error) {
      throw new Error(data.error);
    }

    return data as T;
  };

  if (options?.retry !== false) {
    return retry(invoke);
  }

  return invoke();
}

/**
 * Video Download API
 */
export const videoApi = {
  /**
   * Download video from URL
   */
  async downloadVideo(url: string, userId: string): Promise<DownloadVideoResponse> {
    return invokeFunction<DownloadVideoResponse>("download-video", {
      url,
      userId,
    });
  },
};

/**
 * Video Analysis API
 */
export interface ClipSuggestion {
  startTime: number;
  endTime: number;
  duration: number;
  score: number;
  reason: string;
  type: "reaction" | "action" | "funny" | "dramatic" | "highlight";
}

export interface AnalyzeVideoResponse {
  success: boolean;
  clipsFound: number;
  clips: ClipSuggestion[];
  jobsCreated: number;
  message: string;
}

export const analysisApi = {
  /**
   * Analyze video for viral-worthy clips
   * Uses real AI/ML analysis when available
   */
  async analyzeVideo(
    videoUrl: string,
    duration: number,
    userId: string,
    importedStreamId?: string
  ): Promise<AnalyzeVideoResponse> {
    // Use basic analyze-video function directly (more reliable)
    console.log("Calling analyze-video function:", { videoUrl, duration, userId, importedStreamId });
    
    try {
      // Add timeout to prevent hanging (30 seconds max)
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error("Analysis timeout - took longer than 30 seconds")), 30000);
      });
      
      const analysisPromise = invokeFunction<AnalyzeVideoResponse>("analyze-video", {
        videoUrl,
        duration,
        userId,
        importedStreamId,
      });
      
      const result = await Promise.race([analysisPromise, timeoutPromise]);
      console.log("Analysis succeeded:", result);
      return result;
    } catch (error) {
      console.error("Analysis failed:", error);
      throw error;
    }
  },
};

/**
 * Video Processing API
 */
export const processingApi = {
  /**
   * Process a video clip
   */
  async processClip(
    sourceUrl: string,
    startTime: number,
    endTime: number,
    userId: string,
    clipId: string
  ): Promise<ProcessClipResponse> {
    return invokeFunction<ProcessClipResponse>("process-clip", {
      sourceUrl,
      startTime,
      endTime,
      userId,
      clipId,
    });
  },
};

/**
 * OAuth API
 */
export const oauthApi = {
  /**
   * Get YouTube OAuth URL
   */
  async getYouTubeAuthUrl(userId: string, redirectUri?: string): Promise<string> {
    const response = await invokeFunction<OAuthResponse>("youtube-oauth", {
      userId,
      redirectUri,
    });
    return response.authUrl;
  },

  /**
   * Get Instagram OAuth URL
   */
  async getInstagramAuthUrl(userId: string, redirectUri?: string): Promise<string> {
    const response = await invokeFunction<OAuthResponse>("instagram-oauth", {
      userId,
      redirectUri,
    });
    return response.authUrl;
  },

  /**
   * Get TikTok OAuth URL
   */
  async getTikTokAuthUrl(userId: string, redirectUri?: string): Promise<string> {
    const response = await invokeFunction<OAuthResponse>("tiktok-oauth", {
      userId,
      redirectUri,
    });
    return response.authUrl;
  },
};

/**
 * Posting API (for testing/manual posting)
 */
export const postingApi = {
  /**
   * Post video to YouTube
   */
  async postToYouTube(
    clipUrl: string,
    title: string,
    description: string,
    accessToken: string,
    tags?: string[]
  ): Promise<PostResponse> {
    return invokeFunction<PostResponse>("post-to-youtube", {
      clipUrl,
      title,
      description,
      accessToken,
      tags,
    });
  },

  /**
   * Post video to Instagram
   */
  async postToInstagram(
    clipUrl: string,
    caption: string,
    accessToken: string,
    instagramAccountId: string
  ): Promise<PostResponse> {
    return invokeFunction<PostResponse>("post-to-instagram", {
      clipUrl,
      caption,
      accessToken,
      instagramAccountId,
    });
  },

  /**
   * Post video to TikTok
   */
  async postToTikTok(
    clipUrl: string,
    caption: string,
    accessToken: string
  ): Promise<PostResponse> {
    return invokeFunction<PostResponse>("post-to-tiktok", {
      clipUrl,
      caption,
      accessToken,
    });
  },
};

/**
 * Token Refresh API (for handling expired tokens)
 */
export const tokenApi = {
  /**
   * Refresh YouTube token
   */
  async refreshYouTubeToken(refreshToken: string): Promise<{
    access_token: string;
    refresh_token?: string;
    expires_in: number;
  }> {
    // This would typically call a refresh function
    // For now, we'll use Google's token endpoint directly
    const response = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        client_id: import.meta.env.VITE_YOUTUBE_CLIENT_ID || "",
        client_secret: import.meta.env.VITE_YOUTUBE_CLIENT_SECRET || "",
        refresh_token: refreshToken,
        grant_type: "refresh_token",
      }),
    });

    if (!response.ok) {
      throw new Error("Failed to refresh YouTube token");
    }

    return response.json();
  },

  /**
   * Refresh Instagram token
   */
  async refreshInstagramToken(accessToken: string): Promise<{
    access_token: string;
    expires_in: number;
  }> {
    // Instagram tokens are long-lived (60 days)
    // This would call Meta's token endpoint
    const response = await fetch(
      `https://graph.facebook.com/v18.0/oauth/access_token?grant_type=fb_exchange_token&client_id=${import.meta.env.VITE_INSTAGRAM_APP_ID}&client_secret=${import.meta.env.VITE_INSTAGRAM_APP_SECRET}&fb_exchange_token=${accessToken}`,
      {
        method: "GET",
      }
    );

    if (!response.ok) {
      throw new Error("Failed to refresh Instagram token");
    }

    return response.json();
  },
};


