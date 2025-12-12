/**
 * Token Refresh Hook
 * Handles automatic token refresh for connected accounts
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { tokenApi } from "@/services/api";
import { useAuth } from "@/contexts/AuthContext";

/**
 * Check if token is expired or expiring soon (within 5 minutes)
 */
function isTokenExpiringSoon(expiresAt: string | null): boolean {
  if (!expiresAt) return true;
  
  const expires = new Date(expiresAt);
  const now = new Date();
  const fiveMinutes = 5 * 60 * 1000; // 5 minutes in milliseconds
  
  return expires.getTime() - now.getTime() < fiveMinutes;
}

/**
 * Hook to refresh tokens for all connected accounts
 */
export function useTokenRefresh() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (accountId: string) => {
      if (!user) throw new Error("Not authenticated");

      // Get account with token info
      const { data: account, error: fetchError } = await supabase
        .from("connected_accounts")
        .select("*")
        .eq("id", accountId)
        .eq("user_id", user.id)
        .single();

      if (fetchError || !account) {
        throw new Error("Account not found");
      }

      // Check if token needs refresh
      if (!isTokenExpiringSoon(account.token_expires_at)) {
        return { refreshed: false, account };
      }

      let newAccessToken: string;
      let newRefreshToken: string | undefined;
      let newExpiresAt: string;

      // Refresh based on platform
      if (account.platform === "youtube" && account.refresh_token) {
        const result = await tokenApi.refreshYouTubeToken(account.refresh_token);
        newAccessToken = result.access_token;
        newRefreshToken = result.refresh_token || account.refresh_token;
        newExpiresAt = new Date(Date.now() + result.expires_in * 1000).toISOString();
      } else if (account.platform === "instagram" && account.access_token) {
        const result = await tokenApi.refreshInstagramToken(account.access_token);
        newAccessToken = result.access_token;
        newRefreshToken = account.refresh_token;
        newExpiresAt = new Date(Date.now() + result.expires_in * 1000).toISOString();
      } else {
        throw new Error(`Token refresh not supported for ${account.platform} or missing refresh token`);
      }

      // Update account with new token
      const { error: updateError } = await supabase
        .from("connected_accounts")
        .update({
          access_token: newAccessToken,
          refresh_token: newRefreshToken,
          token_expires_at: newExpiresAt,
          updated_at: new Date().toISOString(),
        })
        .eq("id", accountId);

      if (updateError) {
        throw new Error(`Failed to update token: ${updateError.message}`);
      }

      return {
        refreshed: true,
        account: {
          ...account,
          access_token: newAccessToken,
          refresh_token: newRefreshToken,
          token_expires_at: newExpiresAt,
        },
      };
    },
    onSuccess: () => {
      // Invalidate accounts query to refresh UI
      queryClient.invalidateQueries({ queryKey: ["connected-accounts"] });
    },
  });
}

/**
 * Hook to check and refresh all expiring tokens
 */
export function useAutoTokenRefresh() {
  const { user } = useAuth();
  const refreshMutation = useTokenRefresh();

  useQuery({
    queryKey: ["check-token-expiry", user?.id],
    queryFn: async () => {
      if (!user) return [];

      // Get all accounts with expiring tokens
      const { data: accounts, error } = await supabase
        .from("connected_accounts")
        .select("id, platform, token_expires_at")
        .eq("user_id", user.id);

      if (error) throw error;

      // Filter accounts with expiring tokens
      const expiringAccounts = accounts?.filter((account) =>
        isTokenExpiringSoon(account.token_expires_at)
      ) || [];

      // Refresh each expiring token
      for (const account of expiringAccounts) {
        try {
          await refreshMutation.mutateAsync(account.id);
        } catch (error) {
          console.error(`Failed to refresh token for account ${account.id}:`, error);
        }
      }

      return expiringAccounts;
    },
    enabled: !!user,
    refetchInterval: 5 * 60 * 1000, // Check every 5 minutes
  });
}


