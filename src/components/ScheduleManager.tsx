import { useState } from "react";
import { format } from "date-fns";
import { Calendar, Clock, Plus, Trash2, AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useScheduledPosts, useDeleteScheduledPost, ScheduledPost } from "@/hooks/useScheduledPosts";
import { SchedulePostDialog } from "./SchedulePostDialog";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export function ScheduleManager() {
  const [scheduleDialogOpen, setScheduleDialogOpen] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  
  const { data: posts = [], isLoading } = useScheduledPosts();
  const deletePost = useDeleteScheduledPost();
  const { toast } = useToast();

  const handleDelete = async () => {
    if (!deleteConfirmId) return;

    try {
      await deletePost.mutateAsync(deleteConfirmId);
      toast({
        title: "Post deleted",
        description: "The scheduled post has been removed.",
      });
    } catch {
      toast({
        title: "Error",
        description: "Failed to delete post. Please try again.",
        variant: "destructive",
      });
    } finally {
      setDeleteConfirmId(null);
    }
  };

  const getStatusBadge = (status: ScheduledPost["status"]) => {
    const variants: Record<ScheduledPost["status"], { variant: "default" | "secondary" | "destructive" | "outline"; icon: React.ReactNode; label: string }> = {
      pending: { variant: "secondary", icon: <Clock className="h-3 w-3" />, label: "Pending" },
      processing: { variant: "default", icon: <Loader2 className="h-3 w-3 animate-spin" />, label: "Processing" },
      posted: { variant: "outline", icon: <CheckCircle2 className="h-3 w-3" />, label: "Posted" },
      failed: { variant: "destructive", icon: <AlertCircle className="h-3 w-3" />, label: "Failed" },
    };
    const { variant, icon, label } = variants[status];
    return (
      <Badge variant={variant} className="flex items-center gap-1">
        {icon}
        {label}
      </Badge>
    );
  };

  const getPlatformIcon = (platform: string) => {
    const icons: Record<string, string> = {
      youtube: "🎬",
      tiktok: "🎵",
      instagram: "📸",
    };
    return icons[platform] || "📱";
  };

  const pendingPosts = posts.filter((p) => p.status === "pending");
  const completedPosts = posts.filter((p) => p.status !== "pending");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Scheduled Posts</h2>
          <p className="text-muted-foreground">
            Manage your upcoming and past scheduled posts
          </p>
        </div>
        <Button onClick={() => setScheduleDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Schedule Post
        </Button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : posts.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No scheduled posts</h3>
            <p className="text-muted-foreground text-center mb-4">
              Schedule your first post to automatically share clips to your connected accounts.
            </p>
            <Button onClick={() => setScheduleDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Schedule Your First Post
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {pendingPosts.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Upcoming ({pendingPosts.length})
              </h3>
              <div className="grid gap-4">
                {pendingPosts.map((post) => (
                  <Card key={post.id}>
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">
                            {getPlatformIcon(post.connected_accounts?.platform || "")}
                          </span>
                          <div>
                            <CardTitle className="text-base">
                              {post.connected_accounts?.platform_username}
                            </CardTitle>
                            <CardDescription className="capitalize">
                              {post.connected_accounts?.platform}
                            </CardDescription>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {getStatusBadge(post.status)}
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setDeleteConfirmId(post.id)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Calendar className="h-4 w-4" />
                          {format(new Date(post.scheduled_at), "PPP 'at' p")}
                        </div>
                        <p className="text-muted-foreground truncate">
                          {post.clip_url}
                        </p>
                        {post.caption && (
                          <p className="text-foreground">{post.caption}</p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {completedPosts.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">History ({completedPosts.length})</h3>
              <div className="grid gap-4">
                {completedPosts.map((post) => (
                  <Card key={post.id} className="opacity-75">
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">
                            {getPlatformIcon(post.connected_accounts?.platform || "")}
                          </span>
                          <div>
                            <CardTitle className="text-base">
                              {post.connected_accounts?.platform_username}
                            </CardTitle>
                            <CardDescription className="capitalize">
                              {post.connected_accounts?.platform}
                            </CardDescription>
                          </div>
                        </div>
                        {getStatusBadge(post.status)}
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Calendar className="h-4 w-4" />
                          {format(new Date(post.scheduled_at), "PPP 'at' p")}
                        </div>
                        {post.error_message && (
                          <p className="text-destructive">{post.error_message}</p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <SchedulePostDialog open={scheduleDialogOpen} onOpenChange={setScheduleDialogOpen} />

      <AlertDialog open={!!deleteConfirmId} onOpenChange={() => setDeleteConfirmId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete scheduled post?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove the scheduled post. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
