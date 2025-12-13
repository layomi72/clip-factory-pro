import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const clientKey = Deno.env.get('TIKTOK_CLIENT_KEY')?.trim();
    
    if (!clientKey) {
      console.error('TIKTOK_CLIENT_KEY is missing or empty');
      throw new Error('TIKTOK_CLIENT_KEY is not configured');
    }
    
    // Log first few characters for debugging (don't log full key for security)
    console.log('TikTok Client Key configured:', clientKey.substring(0, 4) + '...');

    const { userId, redirectUri } = await req.json();

    if (!userId) {
      throw new Error('User ID is required');
    }

    // TikTok OAuth 2.0 authorization URL
    const baseUrl = 'https://www.tiktok.com/v2/auth/authorize/';
    
    // Scopes needed for content posting
    // Note: video.upload is the correct scope name (not video.publish)
    const scopes = [
      'user.info.basic',
      'video.upload'
    ].join(',');

    // State contains user ID for linking after callback
    const state = btoa(JSON.stringify({ userId, timestamp: Date.now() }));

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const callbackUrl = `${supabaseUrl}/functions/v1/tiktok-oauth-callback`;

    const params = new URLSearchParams({
      client_key: clientKey,
      scope: scopes,
      response_type: 'code',
      redirect_uri: callbackUrl,
      state: state,
    });

    const authUrl = `${baseUrl}?${params.toString()}`;

    console.log('=== TikTok OAuth Debug Info ===');
    console.log('Client Key (first 8 chars):', clientKey.substring(0, 8) + '...');
    console.log('Client Key length:', clientKey.length);
    console.log('Redirect URI:', callbackUrl);
    console.log('Redirect URI length:', callbackUrl.length);
    console.log('Scopes:', scopes);
    console.log('Full OAuth URL:', authUrl);
    console.log('==============================');

    return new Response(
      JSON.stringify({ authUrl }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error generating TikTok OAuth URL:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
