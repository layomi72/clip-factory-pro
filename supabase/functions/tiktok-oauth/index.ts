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
    const clientKey = Deno.env.get('TIKTOK_CLIENT_KEY');
    
    if (!clientKey) {
      throw new Error('TIKTOK_CLIENT_KEY is not configured');
    }

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

    console.log('Generated TikTok OAuth URL for user:', userId);

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
