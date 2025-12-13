import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async (req) => {
  try {
    const url = new URL(req.url);
    const code = url.searchParams.get('code');
    const state = url.searchParams.get('state');
    const error = url.searchParams.get('error');
    const errorDescription = url.searchParams.get('error_description');

    // Get the frontend URL for redirects
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    // Extract project ref from supabase URL to build frontend URL
    const projectRef = supabaseUrl.match(/https:\/\/([^.]+)/)?.[1] || '';
    const frontendUrl = `https://${projectRef}.lovableproject.com`;

    if (error) {
      console.error('TikTok OAuth error:', error, errorDescription);
      return Response.redirect(`${frontendUrl}/?error=${encodeURIComponent(errorDescription || error)}`);
    }

    if (!code || !state) {
      console.error('Missing code or state in callback');
      return Response.redirect(`${frontendUrl}/?error=missing_parameters`);
    }

    // Decode state to get user ID
    let userId: string;
    try {
      const stateData = JSON.parse(atob(state));
      userId = stateData.userId;
    } catch (e) {
      console.error('Invalid state parameter:', e);
      return Response.redirect(`${frontendUrl}/?error=invalid_state`);
    }

    const clientKey = Deno.env.get('TIKTOK_CLIENT_KEY')?.trim();
    const clientSecret = Deno.env.get('TIKTOK_CLIENT_SECRET')?.trim();

    if (!clientKey || !clientSecret) {
      console.error('Missing TikTok credentials');
      return Response.redirect(`${frontendUrl}/?error=server_configuration_error`);
    }
    
    // Log for debugging (first few chars only for security)
    console.log('=== TikTok OAuth Callback Debug ===');
    console.log('Client Key (first 8 chars):', clientKey.substring(0, 8) + '...');
    console.log('Client Secret (first 8 chars):', clientSecret.substring(0, 8) + '...');
    console.log('Client Key length:', clientKey.length);
    console.log('Client Secret length:', clientSecret.length);

    const callbackUrl = `${supabaseUrl}/functions/v1/tiktok-oauth-callback`;

    // Exchange code for access token
    console.log('Exchanging code for access token...');
    console.log('Callback URL:', callbackUrl);
    console.log('Code received:', code ? code.substring(0, 10) + '...' : 'MISSING');
    
    const tokenResponse = await fetch('https://open.tiktokapis.com/v2/oauth/token/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_key: clientKey,
        client_secret: clientSecret,
        code: code,
        grant_type: 'authorization_code',
        redirect_uri: callbackUrl,
      }),
    });

    const tokenData = await tokenResponse.json();
    console.log('Token response status:', tokenResponse.status);
    console.log('Token response data:', JSON.stringify(tokenData));

    if (tokenData.error || !tokenData.access_token) {
      console.error('Token exchange failed:', tokenData);
      return Response.redirect(`${frontendUrl}/?error=${encodeURIComponent(tokenData.error_description || 'token_exchange_failed')}`);
    }

    const { access_token, refresh_token, expires_in, open_id } = tokenData;

    // Fetch user info from TikTok
    console.log('Fetching TikTok user info...');
    const userInfoResponse = await fetch('https://open.tiktokapis.com/v2/user/info/?fields=open_id,union_id,avatar_url,display_name', {
      headers: {
        'Authorization': `Bearer ${access_token}`,
      },
    });

    const userInfoData = await userInfoResponse.json();
    console.log('User info response:', userInfoData);

    const tiktokUser = userInfoData.data?.user || {};
    const username = tiktokUser.display_name || `TikTok User ${open_id.slice(0, 8)}`;
    const avatarUrl = tiktokUser.avatar_url || null;

    // Calculate token expiry
    const tokenExpiresAt = new Date(Date.now() + (expires_in * 1000)).toISOString();

    // Store in Supabase using service role
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Check if account already exists
    const { data: existingAccount } = await supabase
      .from('connected_accounts')
      .select('id')
      .eq('user_id', userId)
      .eq('platform', 'tiktok')
      .eq('platform_user_id', open_id)
      .single();

    if (existingAccount) {
      // Update existing account
      const { error: updateError } = await supabase
        .from('connected_accounts')
        .update({
          access_token: access_token,
          refresh_token: refresh_token,
          token_expires_at: tokenExpiresAt,
          platform_username: username,
          platform_avatar_url: avatarUrl,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingAccount.id);

      if (updateError) {
        console.error('Error updating account:', updateError);
        return Response.redirect(`${frontendUrl}/?error=database_error`);
      }

      console.log('Updated existing TikTok account for user:', userId);
    } else {
      // Insert new account
      const { error: insertError } = await supabase
        .from('connected_accounts')
        .insert({
          user_id: userId,
          platform: 'tiktok',
          platform_user_id: open_id,
          platform_username: username,
          platform_avatar_url: avatarUrl,
          access_token: access_token,
          refresh_token: refresh_token,
          token_expires_at: tokenExpiresAt,
        });

      if (insertError) {
        console.error('Error inserting account:', insertError);
        return Response.redirect(`${frontendUrl}/?error=database_error`);
      }

      console.log('Created new TikTok account for user:', userId);
    }

    // Redirect back to frontend with success
    return Response.redirect(`${frontendUrl}/?tiktok_connected=true`);

  } catch (error) {
    console.error('TikTok OAuth callback error:', error);
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const projectRef = supabaseUrl.match(/https:\/\/([^.]+)/)?.[1] || '';
    const frontendUrl = `https://${projectRef}.lovableproject.com`;
    return Response.redirect(`${frontendUrl}/?error=server_error`);
  }
});
