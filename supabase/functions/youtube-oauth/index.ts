/**
 * YouTube OAuth Flow - Step 1: Generate Authorization URL
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const clientId = Deno.env.get("YOUTUBE_CLIENT_ID");
    const clientSecret = Deno.env.get("YOUTUBE_CLIENT_SECRET");

    if (!clientId || !clientSecret) {
      throw new Error("YOUTUBE_CLIENT_ID and YOUTUBE_CLIENT_SECRET must be configured");
    }

    const { userId, redirectUri } = await req.json();

    if (!userId) {
      throw new Error("User ID is required");
    }

    // YouTube OAuth 2.0 authorization URL
    const baseUrl = "https://accounts.google.com/o/oauth2/v2/auth";

    // Scopes needed for YouTube upload
    const scopes = [
      "https://www.googleapis.com/auth/youtube.upload",
      "https://www.googleapis.com/auth/youtube.readonly",
      "https://www.googleapis.com/auth/userinfo.profile",
    ].join(" ");

    // State contains user ID for linking after callback
    const state = btoa(JSON.stringify({ userId, timestamp: Date.now() }));

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const callbackUrl = redirectUri || `${supabaseUrl}/functions/v1/youtube-oauth-callback`;

    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: callbackUrl,
      response_type: "code",
      scope: scopes,
      state: state,
      access_type: "offline", // Required for refresh token
      prompt: "consent", // Force consent to get refresh token
    });

    const authUrl = `${baseUrl}?${params.toString()}`;

    console.log("Generated YouTube OAuth URL for user:", userId);

    return new Response(
      JSON.stringify({ authUrl }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error generating YouTube OAuth URL:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

