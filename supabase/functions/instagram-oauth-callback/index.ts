/**
 * Instagram OAuth Flow - Step 2: Handle Callback and Exchange Code for Token
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

    const appId = Deno.env.get("INSTAGRAM_APP_ID");
    const appSecret = Deno.env.get("INSTAGRAM_APP_SECRET");
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const callbackUrl = `${supabaseUrl}/functions/v1/instagram-oauth-callback`;

    // Exchange authorization code for access token
    const tokenUrl = "https://graph.facebook.com/v18.0/oauth/access_token";
    const tokenParams = new URLSearchParams({
      client_id: appId!,
      client_secret: appSecret!,
      redirect_uri: callbackUrl,
      code,
    });

    const tokenResponse = await fetch(`${tokenUrl}?${tokenParams.toString()}`, {
      method: "GET",
    });

    if (!tokenResponse.ok) {
      const error = await tokenResponse.text();
      throw new Error(`Failed to exchange code for token: ${error}`);
    }

    const tokenData = await tokenResponse.json();
    const { access_token, expires_in } = tokenData;

    // Get user's Instagram Business accounts (pages)
    const pagesResponse = await fetch(
      `https://graph.facebook.com/v18.0/me/accounts?access_token=${access_token}`
    );

    if (!pagesResponse.ok) {
      throw new Error("Failed to fetch Instagram pages");
    }

    const pagesData = await pagesResponse.json();
    const pages = pagesData.data || [];

    if (pages.length === 0) {
      throw new Error("No Instagram Business accounts found. Please connect a Facebook Page with Instagram.");
    }

    // Get Instagram account for the first page
    const page = pages[0];
    const instagramResponse = await fetch(
      `https://graph.facebook.com/v18.0/${page.id}?fields=instagram_business_account&access_token=${access_token}`
    );

    if (!instagramResponse.ok) {
      throw new Error("Failed to fetch Instagram account");
    }

    const instagramData = await instagramResponse.json();
    const instagramAccountId = instagramData.instagram_business_account?.id;

    if (!instagramAccountId) {
      throw new Error("No Instagram Business account linked to this Facebook Page");
    }

    // Get Instagram account info
    const accountInfoResponse = await fetch(
      `https://graph.facebook.com/v18.0/${instagramAccountId}?fields=username,profile_picture_url&access_token=${access_token}`
    );

    if (!accountInfoResponse.ok) {
      throw new Error("Failed to fetch Instagram account info");
    }

    const accountInfo = await accountInfoResponse.json();

    // Save to database
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const supabase = createClient(supabaseUrl!, supabaseServiceKey!);

    const expiresAt = new Date(Date.now() + (expires_in || 5184000) * 1000).toISOString(); // Default 60 days

    const { data: account, error: dbError } = await supabase
      .from("connected_accounts")
      .upsert({
        user_id: userId,
        platform: "instagram",
        platform_user_id: instagramAccountId,
        platform_username: accountInfo.username,
        platform_avatar_url: accountInfo.profile_picture_url,
        access_token: access_token,
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

    console.log("Instagram account connected successfully:", account.id);

    // Redirect to success page
    const frontendUrl = Deno.env.get("FRONTEND_URL") || "http://localhost:5173";
    return Response.redirect(`${frontendUrl}/accounts?connected=instagram`);
  } catch (error) {
    console.error("Error in Instagram OAuth callback:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    const frontendUrl = Deno.env.get("FRONTEND_URL") || "http://localhost:5173";
    return Response.redirect(`${frontendUrl}/accounts?error=${encodeURIComponent(message)}`);
  }
});

