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

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  console.log("Processing scheduled posts...");

  try {
    // Find all pending posts that are due
    const now = new Date().toISOString();
    const { data: duePosts, error: fetchError } = await supabase
      .from("scheduled_posts")
      .select(`
        *,
        connected_accounts (
          platform,
          platform_username,
          access_token
        )
      `)
      .eq("status", "pending")
      .lte("scheduled_at", now);

    if (fetchError) {
      console.error("Error fetching scheduled posts:", fetchError);
      throw fetchError;
    }

    console.log(`Found ${duePosts?.length || 0} posts to process`);

    if (!duePosts || duePosts.length === 0) {
      return new Response(
        JSON.stringify({ message: "No posts to process", processed: 0 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const results = [];

    for (const post of duePosts) {
      console.log(`Processing post ${post.id} for ${post.connected_accounts?.platform}`);

      // Update status to processing
      await supabase
        .from("scheduled_posts")
        .update({ status: "processing" })
        .eq("id", post.id);

      try {
        // Simulate posting to the platform
        // In production, this would call the actual platform APIs
        const platform = post.connected_accounts?.platform;
        const hasToken = !!post.connected_accounts?.access_token;

        if (!hasToken) {
          throw new Error(`No access token for ${platform} account`);
        }

        // Simulate API call delay
        await new Promise((resolve) => setTimeout(resolve, 500));

        // For demo purposes, we'll mark as posted
        // Real implementation would call YouTube/TikTok/Instagram APIs here
        console.log(`Successfully posted to ${platform}: ${post.clip_url}`);

        await supabase
          .from("scheduled_posts")
          .update({
            status: "posted",
            posted_at: new Date().toISOString(),
          })
          .eq("id", post.id);

        results.push({ id: post.id, status: "posted", platform });
      } catch (postError) {
        console.error(`Error posting ${post.id}:`, postError);

        await supabase
          .from("scheduled_posts")
          .update({
            status: "failed",
            error_message: postError instanceof Error ? postError.message : "Unknown error",
          })
          .eq("id", post.id);

        results.push({
          id: post.id,
          status: "failed",
          error: postError instanceof Error ? postError.message : "Unknown error",
        });
      }
    }

    console.log("Processing complete:", results);

    return new Response(
      JSON.stringify({
        message: "Processing complete",
        processed: results.length,
        results,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in process-scheduled-posts:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
