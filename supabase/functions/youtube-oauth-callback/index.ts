/**
 * YouTube OAuth Flow - Step 2: Handle Callback and Exchange Code for Token
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const code = url.searchParams.get("code");
    const state = url.searchParams.get("state");
    const error = url.searchParams.get("error");

    if (error) {
      throw new Error(`OAuth error: ${error}`);
    }

    if (!code || !state) {
      throw new Error("Missing code or state parameter");
    }

    // Decode state to get user ID
    const stateData = JSON.parse(atob(state));
    const userId = stateData.userId;

    if (!userId) {
      throw new Error("Invalid state: user ID not found");
    }

    const clientId = Deno.env.get("YOUTUBE_CLIENT_ID");
    const clientSecret = Deno.env.get("YOUTUBE_CLIENT_SECRET");
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const callbackUrl = `${supabaseUrl}/functions/v1/youtube-oauth-callback`;

    // Exchange authorization code for access token
    const tokenUrl = "https://oauth2.googleapis.com/token";
    const tokenResponse = await fetch(tokenUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        code,
        client_id: clientId!,
        client_secret: clientSecret!,
        redirect_uri: callbackUrl,
        grant_type: "authorization_code",
      }),
    });

    if (!tokenResponse.ok) {
      const error = await tokenResponse.text();
      throw new Error(`Failed to exchange code for token: ${error}`);
    }

    const tokenData = await tokenResponse.json();
    const { access_token, refresh_token, expires_in } = tokenData;

    // Get user info from Google
    const userInfoResponse = await fetch(
      "https://www.googleapis.com/oauth2/v2/userinfo",
      {
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      }
    );

    if (!userInfoResponse.ok) {
      throw new Error("Failed to fetch user info");
    }

    const userInfo = await userInfoResponse.json();

    // Get YouTube channel info
    const channelResponse = await fetch(
      `https://www.googleapis.com/youtube/v3/channels?part=snippet&mine=true`,
      {
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      }
    );

    if (!channelResponse.ok) {
      throw new Error("Failed to fetch YouTube channel info");
    }

    const channelData = await channelResponse.json();
    const channel = channelData.items?.[0];

    if (!channel) {
      throw new Error("No YouTube channel found");
    }

    // Save to database
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const supabase = createClient(supabaseUrl!, supabaseServiceKey!);

    const expiresAt = new Date(Date.now() + expires_in * 1000).toISOString();

    const { data: account, error: dbError } = await supabase
      .from("connected_accounts")
      .upsert({
        user_id: userId,
        platform: "youtube",
        platform_user_id: channel.id,
        platform_username: channel.snippet.title,
        platform_avatar_url: channel.snippet.thumbnails?.default?.url,
        access_token: access_token,
        refresh_token: refresh_token,
        token_expires_at: expiresAt,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: "user_id,platform,platform_user_id",
      })
      .select()
      .single();

    if (dbError) {
      throw new Error(`Failed to save account: ${dbError.message}`);
    }

    console.log("YouTube account connected successfully:", account.id);

    // Redirect to success page
    const frontendUrl = Deno.env.get("FRONTEND_URL") || "http://localhost:5173";
    return Response.redirect(`${frontendUrl}/accounts?connected=youtube`);
  } catch (error) {
    console.error("Error in YouTube OAuth callback:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    const frontendUrl = Deno.env.get("FRONTEND_URL") || "http://localhost:5173";
    return Response.redirect(`${frontendUrl}/accounts?error=${encodeURIComponent(message)}`);
  }
});

