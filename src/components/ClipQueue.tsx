import { Clock, CheckCircle2, Loader2, Play, AlertCircle, ExternalLink, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { formatDistanceToNow } from "date-fns";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { SchedulePostDialog } from "./SchedulePostDialog";

interface ProcessingJob {
  id: string;
  source_video_url: string;
  clip_start_time: number;
  clip_end_time: number;
  status: "pending" | "processing" | "completed" | "failed";
  output_url: string | null;
  error_message: string | null;
  created_at: string;
  completed_at: string | null;
}

const statusConfig = {
  pending: {
    icon: Clock,
    label: "Pending",
    color: "text-blue-400",
    bg: "bg-blue-400/10",
    animate: "",
  },
  processing: {
    icon: Loader2,
    label: "Processing",
    color: "text-yellow-400",
    bg: "bg-yellow-400/10",
    animate: "animate-spin",
  },
  completed: {
    icon: CheckCircle2,
    label: "Completed",
    color: "text-green-400",
    bg: "bg-green-400/10",
    animate: "",
  },
  failed: {
    icon: AlertCircle,
    label: "Failed",
    color: "text-red-400",
    bg: "bg-red-400/10",
    animate: "",
  },
};

const formatDuration = (seconds: number) => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
};

const getPreviewUrl = (sourceUrl: string, startTime: number): string | null => {
  try {
    const url = new URL(sourceUrl);
    
    // YouTube
    if (url.hostname.includes("youtube.com") || url.hostname.includes("youtu.be")) {
      const videoId = url.searchParams.get("v") || url.pathname.split("/").pop();
      return `https://www.youtube.com/watch?v=${videoId}&t=${Math.floor(startTime)}s`;
    }
    
    // Twitch
    if (url.hostname.includes("twitch.tv")) {
      return `${sourceUrl}?t=${Math.floor(startTime)}s`;
    }
    
    // TikTok - no timestamp support
    if (url.hostname.includes("tiktok.com")) {
      return sourceUrl;
    }
    
    return sourceUrl;
  } catch {
    return null;
  }
};

export function ClipQueue() {
  const { user } = useAuth();
  const [scheduleDialogOpen, setScheduleDialogOpen] = useState(false);
  const [selectedJob, setSelectedJob] = useState<ProcessingJob | null>(null);

  const { data: jobs = [], isLoading } = useQuery({
    queryKey: ["processing-jobs", user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await (supabase
        .from("processing_jobs")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(10) as any);

      if (error) throw error;
      return (data || []) as ProcessingJob[];
    },
    enabled: !!user,
    refetchInterval: 5000,
  });

  const formatClipDuration = (job: ProcessingJob) => {
    const duration = job.clip_end_time - job.clip_start_time;
    return formatDuration(duration);
  };

  const handlePreview = (job: ProcessingJob) => {
    const previewUrl = getPreviewUrl(job.source_video_url, job.clip_start_time);
    if (previewUrl) {
      window.open(previewUrl, "_blank");
    }
  };

  const handleSchedule = (job: ProcessingJob) => {
    setSelectedJob(job);
    setScheduleDialogOpen(true);
  };

  return (
    <>
      <div className="rounded-xl bg-card border border-border p-6 animate-slide-up">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10">
              <Clock className="h-5 w-5 text-accent" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-foreground">Clip Queue</h2>
              <p className="text-sm text-muted-foreground">
                {isLoading ? "Loading..." : `${jobs.length} clips in queue`}
              </p>
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : jobs.length === 0 ? (
          <div className="text-center py-8">
            <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No clips in queue</h3>
            <p className="text-muted-foreground text-sm">
              Process clips from imported streams to see them here
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {jobs.map((job) => {
              const status = statusConfig[job.status];
              const StatusIcon = status.icon;

              return (
                <div
                  key={job.id}
                  className="group flex items-center gap-4 rounded-lg bg-secondary/30 p-3 transition-all hover:bg-secondary/50"
                >
                  <button
                    onClick={() => handlePreview(job)}
                    className="relative h-16 w-28 flex-shrink-0 overflow-hidden rounded-lg bg-muted flex items-center justify-center cursor-pointer hover:bg-muted/80 transition-colors"
                    title="Preview clip in new tab"
                  >
                    <Play className="h-6 w-6 text-muted-foreground group-hover:text-primary transition-colors" />
                    <div className="absolute bottom-1 right-1 rounded bg-black/70 px-1.5 py-0.5 text-xs font-medium text-white">
                      {formatClipDuration(job)}
                    </div>
                  </button>

                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-foreground truncate text-sm">
                      Clip from {new URL(job.source_video_url).hostname}
                    </h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {formatDuration(job.clip_start_time)} - {formatDuration(job.clip_end_time)}
                    </p>
                    <div className="mt-1 flex items-center gap-2 flex-wrap">
                      <span
                        className={cn(
                          "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium",
                          status.bg,
                          status.color
                        )}
                      >
                        <StatusIcon className={cn("h-3 w-3", status.animate)} />
                        {status.label}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(job.created_at), { addSuffix: true })}
                      </span>
                      {job.error_message && (
                        <span className="text-xs text-red-400 truncate max-w-[200px]">
                          {job.error_message}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handlePreview(job)}
                      title="Preview on source platform"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleSchedule(job)}
                    >
                      <Calendar className="h-4 w-4 mr-1" />
                      Schedule
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {selectedJob && (
        <SchedulePostDialog
          open={scheduleDialogOpen}
          onOpenChange={setScheduleDialogOpen}
          defaultClipUrl={selectedJob.output_url || selectedJob.source_video_url}
          defaultStartTime={selectedJob.clip_start_time}
          defaultEndTime={selectedJob.clip_end_time}
        />
      )}
    </>
  );
}