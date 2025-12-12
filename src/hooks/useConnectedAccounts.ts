import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";

export type Platform = "youtube" | "tiktok" | "instagram" | "twitch";

export interface ConnectedAccount {
  id: string;
  user_id: string;
  platform: Platform;
  platform_user_id: string;
  platform_username: string;
  platform_avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export function useConnectedAccounts() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["connected-accounts", user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from("connected_accounts")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as ConnectedAccount[];
    },
    enabled: !!user,
  });
}

export function useConnectedAccountsByPlatform(platform: Platform) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["connected-accounts", user?.id, platform],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from("connected_accounts")
        .select("*")
        .eq("platform", platform)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as ConnectedAccount[];
    },
    enabled: !!user,
  });
}

export function useAddConnectedAccount() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (account: Omit<ConnectedAccount, "id" | "user_id" | "created_at" | "updated_at">) => {
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("connected_accounts")
        .insert({
          ...account,
          user_id: user.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["connected-accounts"] });
      toast({
        title: "Account Connected",
        description: "Your account has been successfully connected.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Connection Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

export function useRemoveConnectedAccount() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (accountId: string) => {
      const { error } = await supabase
        .from("connected_accounts")
        .delete()
        .eq("id", accountId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["connected-accounts"] });
      toast({
        title: "Account Disconnected",
        description: "The account has been removed.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}
