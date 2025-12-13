/**
 * Generate Viral Content using AI
 * Uses Lovable AI to generate clickbait titles, captions, and hashtags
 * for video clips based on the elite clipper formula
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ClipData {
  startTime: number;
  endTime: number;
  duration: number;
  score: number;
  type: "reaction" | "action" | "funny" | "dramatic" | "highlight";
  triggers: string[];
  features: {
    hasLoudAudio: boolean;
    hasHighMotion: boolean;
    hasSceneChange: boolean;
  };
}

interface ViralContent {
  title: string;
  caption: string;
  hashtags: string[];
  onScreenText: string[];
  thumbnailPrompt: string;
}

async function generateViralContent(clip: ClipData): Promise<ViralContent> {
  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
  
  if (!LOVABLE_API_KEY) {
    // Fallback to deterministic generation if AI not available
    return generateFallbackContent(clip);
  }

  const systemPrompt = `You are an elite viral clip maker who understands the Speed/Kai Cenat/Rakai formula for viral content.

Your job is to generate attention-grabbing content that makes viewers STOP SCROLLING.

Key principles:
1. Titles ADD DRAMA, they don't explain. Not "Speed gets mad" but "This escalated WAY too fast"
2. Use emotional triggers: shock, disbelief, escalation, relatability
3. Captions should tease, not spoil
4. Hashtags should maximize discoverability
5. On-screen text appears at 0.3s and at each escalation point

You MUST respond with ONLY valid JSON in this exact format:
{
  "title": "string (dramatic, under 50 chars, can use emojis)",
  "caption": "string (teasing description, 2-3 sentences)",
  "hashtags": ["array", "of", "hashtags", "without #"],
  "onScreenText": ["First text at 0.3s", "Second at escalation"],
  "thumbnailPrompt": "Prompt to generate a clickbait thumbnail"
}`;

  const userPrompt = `Generate viral content for this clip:
- Type: ${clip.type}
- Duration: ${clip.duration}s
- Viral Score: ${clip.score}%
- Triggers: ${clip.triggers.join(", ") || "none detected"}
- Features: ${clip.features.hasLoudAudio ? "loud audio, " : ""}${clip.features.hasHighMotion ? "high motion, " : ""}${clip.features.hasSceneChange ? "scene change" : ""}

Make it ATTENTION-GRABBING. Think: would someone stop scrolling for this?`;

  try {
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.8,
      }),
    });

    if (!response.ok) {
      console.error("AI request failed:", response.status);
      return generateFallbackContent(clip);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    
    if (!content) {
      return generateFallbackContent(clip);
    }

    // Parse JSON response
    try {
      const parsed = JSON.parse(content);
      return {
        title: parsed.title || generateFallbackTitle(clip),
        caption: parsed.caption || "",
        hashtags: Array.isArray(parsed.hashtags) ? parsed.hashtags.map((h: string) => `#${h.replace(/^#/, "")}`) : [],
        onScreenText: Array.isArray(parsed.onScreenText) ? parsed.onScreenText : [],
        thumbnailPrompt: parsed.thumbnailPrompt || "",
      };
    } catch {
      // Try to extract JSON from markdown code blocks
      const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[1]);
        return {
          title: parsed.title || generateFallbackTitle(clip),
          caption: parsed.caption || "",
          hashtags: Array.isArray(parsed.hashtags) ? parsed.hashtags.map((h: string) => `#${h.replace(/^#/, "")}`) : [],
          onScreenText: Array.isArray(parsed.onScreenText) ? parsed.onScreenText : [],
          thumbnailPrompt: parsed.thumbnailPrompt || "",
        };
      }
      return generateFallbackContent(clip);
    }
  } catch (error) {
    console.error("AI generation error:", error);
    return generateFallbackContent(clip);
  }
}

function generateFallbackTitle(clip: ClipData): string {
  const titles: Record<string, string[]> = {
    reaction: [
      "💀 HIS REACTION IS INSANE",
      "😱 WAIT FOR IT...",
      "🔥 He didn't see this coming",
      "💀 This reaction says it all",
    ],
    action: [
      "🔥 HE DID WHAT?!",
      "💀 This is too crazy",
      "😱 You have to see this",
      "🔥 This went 0 to 100",
    ],
    funny: [
      "😂 I'm crying",
      "💀 This is too funny",
      "😭 I can't stop laughing",
      "😂 Comedy gold",
    ],
    dramatic: [
      "🔥 The tension is REAL",
      "💀 This escalated fast",
      "😱 It keeps getting worse",
      "🔥 Things got intense",
    ],
    highlight: [
      "🔥 THIS IS THE MOMENT",
      "💀 Best moment ever",
      "😱 Legendary clip",
      "🔥 Peak content",
    ],
  };

  const pool = titles[clip.type] || titles.highlight;
  return pool[Math.floor(Math.random() * pool.length)];
}

function generateFallbackContent(clip: ClipData): ViralContent {
  const title = generateFallbackTitle(clip);
  
  const hashtags = [
    "#viral",
    "#fyp",
    "#foryou",
    clip.type === "funny" ? "#funny" : "#reaction",
    "#trending",
    "#clip",
  ];

  const captions: Record<string, string[]> = {
    reaction: [
      "Wait for the reaction... 💀",
      "His face says it all",
      "Nah this is too much 😭",
    ],
    action: [
      "It keeps getting crazier",
      "Nobody expected this",
      "This is wild fr",
    ],
    funny: [
      "I can't with this 😂",
      "Peak comedy right here",
      "Send this to someone who needs to laugh",
    ],
    dramatic: [
      "The tension is unreal",
      "It just keeps escalating...",
      "Bro what is happening 💀",
    ],
    highlight: [
      "This is the one",
      "Legendary moment",
      "Peak content right here 🔥",
    ],
  };

  const captionPool = captions[clip.type] || captions.highlight;
  const caption = `${captionPool[Math.floor(Math.random() * captionPool.length)]}\n\n${hashtags.join(" ")}`;

  return {
    title,
    caption,
    hashtags,
    onScreenText: [title],
    thumbnailPrompt: `Dramatic reaction face, ${clip.type} moment, viral thumbnail style, high contrast, bold colors`,
  };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { clips } = await req.json();

    if (!clips || !Array.isArray(clips)) {
      return new Response(
        JSON.stringify({ error: "Missing required field: clips (array)" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Generating viral content for ${clips.length} clips`);

    // Process clips in parallel (max 5 at a time to avoid rate limits)
    const results = [];
    const batchSize = 5;

    for (let i = 0; i < clips.length; i += batchSize) {
      const batch = clips.slice(i, i + batchSize);
      const batchResults = await Promise.all(
        batch.map(async (clip: ClipData) => {
          const content = await generateViralContent(clip);
          return {
            ...clip,
            ...content,
          };
        })
      );
      results.push(...batchResults);
    }

    return new Response(
      JSON.stringify({
        success: true,
        clips: results,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error generating viral content:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
