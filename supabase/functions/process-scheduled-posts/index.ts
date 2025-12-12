import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// #region agent log
const LOG_ENDPOINT = "http://127.0.0.1:7242/ingest/e2477d0b-20b7-40f2-a8ad-d298bc4c53e5";
const logDebug = async (data: any) => {
  try {
    await fetch(LOG_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...data,
        timestamp: Date.now(),
        sessionId: "debug-session",
        location: "process-scheduled-posts/index.ts",
      }),
    });
  } catch {}
};
// #endregion

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  // #region agent log
  await logDebug({
    message: "Function entry - processing scheduled posts",
    data: { method: req.method },
    hypothesisId: "A",
    runId: "run1",
  });
  // #endregion

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

    // #region agent log
    await logDebug({
      message: "Fetched due posts - before processing loop",
      data: {
        postCount: duePosts?.length || 0,
        postsByPlatform: duePosts?.reduce((acc: any, p: any) => {
          const platform = p.connected_accounts?.platform || "unknown";
          acc[platform] = (acc[platform] || 0) + 1;
          return acc;
        }, {}) || {},
        postsByAccount: duePosts?.reduce((acc: any, p: any) => {
          const accountId = p.connected_account_id;
          acc[accountId] = (acc[accountId] || 0) + 1;
          return acc;
        }, {}) || {},
      },
      hypothesisId: "B",
      runId: "run1",
    });
    // #endregion

    console.log(`Found ${duePosts?.length || 0} posts to process`);

    if (!duePosts || duePosts.length === 0) {
      return new Response(
        JSON.stringify({ message: "No posts to process", processed: 0 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const results: Array<{
      id: string;
      status: string;
      platform?: string;
      result?: any;
      error?: string;
    }> = [];
    const startTime = Date.now();
    let postIndex = 0;

    for (const post of duePosts) {
      const postStartTime = Date.now();
      const timeSinceLastPost = postIndex > 0 ? postStartTime - startTime : 0;

      // #region agent log
      await logDebug({
        message: "Processing post - loop iteration start",
        data: {
          postId: post.id,
          postIndex: postIndex,
          accountId: post.connected_account_id,
          platform: post.connected_accounts?.platform,
          timeSinceLastPostMs: timeSinceLastPost,
          timeSinceFunctionStartMs: postStartTime - startTime,
        },
        hypothesisId: "A",
        runId: "run1",
      });
      // #endregion

      console.log(`Processing post ${post.id} for ${post.connected_accounts?.platform}`);

      // Update status to processing
      await supabase
        .from("scheduled_posts")
        .update({ status: "processing" })
        .eq("id", post.id);

      try {
        const platform = post.connected_accounts?.platform;
        const accessToken = post.connected_accounts?.access_token;

        if (!accessToken) {
          throw new Error(`No access token for ${platform} account`);
        }

        // Call the appropriate posting function based on platform
        const supabaseFunctionsUrl = `${supabaseUrl}/functions/v1`;
        let postResponse: Response;
        const apiCallStartTime = Date.now();

        // #region agent log
        await logDebug({
          message: "Before API call - no delay applied",
          data: {
            postId: post.id,
            platform,
            accountId: post.connected_account_id,
            timeSinceLastPostMs: timeSinceLastPost,
          },
          hypothesisId: "A",
          runId: "run1",
        });
        // #endregion

        if (platform === "youtube") {
          postResponse = await fetch(`${supabaseFunctionsUrl}/post-to-youtube`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${supabaseServiceKey}`,
            },
            body: JSON.stringify({
              clipUrl: post.clip_url,
              title: post.caption || "Clip",
              description: post.caption || "",
              accessToken,
            }),
          });
        } else if (platform === "instagram") {
          // Get Instagram account ID from connected_accounts (stored in platform_user_id)
          const instagramAccountId = post.connected_accounts?.platform_user_id;
          
          if (!instagramAccountId) {
            throw new Error("Instagram account ID not found");
          }

          postResponse = await fetch(`${supabaseFunctionsUrl}/post-to-instagram`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${supabaseServiceKey}`,
            },
            body: JSON.stringify({
              clipUrl: post.clip_url,
              caption: post.caption || "",
              accessToken,
              instagramAccountId,
            }),
          });
        } else if (platform === "tiktok") {
          postResponse = await fetch(`${supabaseFunctionsUrl}/post-to-tiktok`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${supabaseServiceKey}`,
            },
            body: JSON.stringify({
              clipUrl: post.clip_url,
              caption: post.caption || "",
              accessToken,
            }),
          });
        } else {
          throw new Error(`Unsupported platform: ${platform}`);
        }

        const apiCallDuration = Date.now() - apiCallStartTime;
        const responseStatus = postResponse.status;

        // #region agent log
        await logDebug({
          message: "API call completed",
          data: {
            postId: post.id,
            platform,
            accountId: post.connected_account_id,
            responseStatus,
            apiCallDurationMs: apiCallDuration,
            isRateLimit: responseStatus === 429,
            isSuccess: postResponse.ok,
          },
          hypothesisId: "C",
          runId: "run1",
        });
        // #endregion

        if (!postResponse.ok) {
          const errorData = await postResponse.json();
          
          // #region agent log
          await logDebug({
            message: "API call failed",
            data: {
              postId: post.id,
              platform,
              accountId: post.connected_account_id,
              status: responseStatus,
              error: errorData.error || postResponse.statusText,
              isRateLimit: responseStatus === 429,
            },
            hypothesisId: "C",
            runId: "run1",
          });
          // #endregion

          throw new Error(`Failed to post to ${platform}: ${errorData.error || postResponse.statusText}`);
        }

        const postResult = await postResponse.json();
        console.log(`Successfully posted to ${platform}:`, postResult);

        await supabase
          .from("scheduled_posts")
          .update({
            status: "posted",
            posted_at: new Date().toISOString(),
          })
          .eq("id", post.id);

        // #region agent log
        await logDebug({
          message: "Post succeeded",
          data: {
            postId: post.id,
            platform,
            accountId: post.connected_account_id,
            totalTimeMs: Date.now() - postStartTime,
          },
          hypothesisId: "D",
          runId: "run1",
        });
        // #endregion

        results.push({ id: post.id, status: "posted", platform, result: postResult });
      } catch (postError) {
        console.error(`Error posting ${post.id}:`, postError);

        // #region agent log
        await logDebug({
          message: "Post error caught",
          data: {
            postId: post.id,
            platform: post.connected_accounts?.platform,
            accountId: post.connected_account_id,
            error: postError instanceof Error ? postError.message : "Unknown error",
            isRateLimitError: postError instanceof Error && postError.message.includes("429"),
          },
          hypothesisId: "C",
          runId: "run1",
        });
        // #endregion

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

      postIndex++;
    }

    // #region agent log
    await logDebug({
      message: "All posts processed - function exit",
      data: {
        totalPosts: duePosts.length,
        totalTimeMs: Date.now() - startTime,
        successCount: results.filter((r) => r.status === "posted").length,
        failureCount: results.filter((r) => r.status === "failed").length,
        averageTimePerPost: (Date.now() - startTime) / duePosts.length,
      },
      hypothesisId: "A",
      runId: "run1",
    });
    // #endregion

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
