import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface ScheduledPost {
  id: string;
  user_id: string;
  connected_account_id: string;
  clip_url: string;
  caption: string | null;
  scheduled_at: string;
  status: "pending" | "processing" | "posted" | "failed";
  error_message: string | null;
  posted_at: string | null;
  created_at: string;
  updated_at: string;
  connected_accounts?: {
    platform: string;
    platform_username: string;
    platform_avatar_url: string | null;
  };
}

export function useScheduledPosts() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["scheduled-posts", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("scheduled_posts")
        .select(`
          *,
          connected_accounts (
            platform,
            platform_username,
            platform_avatar_url
          )
        `)
        .order("scheduled_at", { ascending: true });

      if (error) throw error;
      return data as ScheduledPost[];
    },
    enabled: !!user,
  });
}

export function useAddScheduledPost() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (post: {
      connected_account_id: string;
      clip_url: string;
      caption?: string;
      scheduled_at: string;
    }) => {
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("scheduled_posts")
        .insert({
          user_id: user.id,
          connected_account_id: post.connected_account_id,
          clip_url: post.clip_url,
          caption: post.caption || null,
          scheduled_at: post.scheduled_at,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["scheduled-posts"] });
    },
  });
}

export function useUpdateScheduledPost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      ...updates
    }: {
      id: string;
      clip_url?: string;
      caption?: string;
      scheduled_at?: string;
      status?: "pending" | "processing" | "posted" | "failed";
    }) => {
      const { data, error } = await supabase
        .from("scheduled_posts")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["scheduled-posts"] });
    },
  });
}

export function useDeleteScheduledPost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("scheduled_posts")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["scheduled-posts"] });
    },
  });
}
