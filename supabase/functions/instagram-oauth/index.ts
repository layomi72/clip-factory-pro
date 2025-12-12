/**
 * Instagram OAuth Flow - Step 1: Generate Authorization URL
 * 
 * Note: Instagram requires Meta Business Account and App Review
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
    const appId = Deno.env.get("INSTAGRAM_APP_ID");
    const appSecret = Deno.env.get("INSTAGRAM_APP_SECRET");

    if (!appId || !appSecret) {
      throw new Error("INSTAGRAM_APP_ID and INSTAGRAM_APP_SECRET must be configured");
    }

    const { userId, redirectUri } = await req.json();

    if (!userId) {
      throw new Error("User ID is required");
    }

    // Instagram uses Facebook OAuth (Meta)
    const baseUrl = "https://www.facebook.com/v18.0/dialog/oauth";

    // Scopes needed for Instagram posting
    const scopes = [
      "instagram_basic",
      "instagram_content_publish",
      "pages_read_engagement",
      "pages_show_list",
    ].join(",");

    // State contains user ID for linking after callback
    const state = btoa(JSON.stringify({ userId, timestamp: Date.now() }));

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const callbackUrl = redirectUri || `${supabaseUrl}/functions/v1/instagram-oauth-callback`;

    const params = new URLSearchParams({
      client_id: appId,
      redirect_uri: callbackUrl,
      scope: scopes,
      response_type: "code",
      state: state,
    });

    const authUrl = `${baseUrl}?${params.toString()}`;

    console.log("Generated Instagram OAuth URL for user:", userId);

    return new Response(
      JSON.stringify({ authUrl }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error generating Instagram OAuth URL:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

