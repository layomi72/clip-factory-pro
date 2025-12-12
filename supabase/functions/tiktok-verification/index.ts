/**
 * TikTok URL Verification File
 * Serves the verification file as plain text
 */

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Content-Type": "text/plain",
};

Deno.serve(async (req) => {
  // Return the verification content as plain text
  return new Response(
    "tiktok-developers-site-verification=7jnWfAGd5smRtWZ94dKVYDTMwNmIzEu3",
    {
      headers: corsHeaders,
    }
  );
});

