/**
 * Auto Clip Generator Component
 * Shows AI-generated clip suggestions and allows bulk scheduling
 * Now includes "Process Now" functionality to generate actual video clips with editing
 */

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Zap, Play, Calendar, CheckCircle2, Download, Video, Sparkles } from "lucide-react";
import { analysisApi, ClipSuggestion, processingApi } from "@/services/api";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { SchedulePostDialog } from "./SchedulePostDialog";
import { supabase } from "@/integrations/supabase/client";

interface AutoClipGeneratorProps {
  videoUrl: string;
  duration: number;
  importedStreamId?: string;
}

interface ProcessedClip {
  jobId: string;
  clipUrl: string | null;
  status: "pending" | "processing" | "completed" | "failed";
  startTime: number;
  endTime: number;
}

export function AutoClipGenerator({ videoUrl, duration, importedStreamId }: AutoClipGeneratorProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [scheduleDialogOpen, setScheduleDialogOpen] = useState(false);
  const [selectedClip, setSelectedClip] = useState<ClipSuggestion | null>(null);

  // Analyze video for clips
  const { data: analysis, isLoading, error } = useQuery({
    queryKey: ["video-analysis", videoUrl, duration],
    queryFn: () => analysisApi.analyzeVideo(videoUrl, duration, user!.id, importedStreamId),
    enabled: !!user && !!videoUrl && duration > 0,
  });

  // Fetch processing jobs for this video
  const { data: processingJobs = [] } = useQuery({
    queryKey: ["processing-jobs", videoUrl, user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from("processing_jobs")
        .select("*")
        .eq("user_id", user.id)
        .eq("source_video_url", videoUrl)
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!user && !!videoUrl,
    refetchInterval: 5000, // Poll every 5 seconds for status updates
  });

  // Create a map of processing jobs by time range for quick lookup
  const jobsByTimeRange = new Map<string, ProcessedClip>();
  processingJobs.forEach((job: any) => {
    const key = `${job.clip_start_time}-${job.clip_end_time}`;
    jobsByTimeRange.set(key, {
      jobId: job.id,
      clipUrl: job.output_url,
      status: job.status,
      startTime: job.clip_start_time,
      endTime: job.clip_end_time,
    });
  });

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const getScoreColor = (score: number) => {
    if (score >= 85) return "bg-green-500/20 text-green-600 dark:text-green-400";
    if (score >= 70) return "bg-blue-500/20 text-blue-600 dark:text-blue-400";
    return "bg-yellow-500/20 text-yellow-600 dark:text-yellow-400";
  };

  // Process clip mutation
  const processClipMutation = useMutation({
    mutationFn: async ({ clip, addCaptions }: { clip: ClipSuggestion; addCaptions: boolean }) => {
      if (!user) throw new Error("Not authenticated");
      
      const clipId = `clip-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      // Use viral-optimized caption if available, otherwise use reason
      const captionText = addCaptions 
        ? (clip.caption || clip.title || clip.reason) 
        : undefined;
      
      const result = await processingApi.processClip(
        videoUrl,
        clip.startTime,
        clip.endTime,
        user.id,
        clipId,
        {
          addCaptions: addCaptions,
          captionText: captionText,
          addTransitions: true, // Always add zoom effects for viral clips
          enhanceAudio: true, // Always enhance audio for viral clips
          videoQuality: "high", // High quality for viral content
        }
      );
      
      return { ...result, clip };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["processing-jobs"] });
      toast({
        title: "Clip processing started",
        description: "Your clip is being processed with captions and editing. This may take a few minutes.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Processing failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleProcessClip = async (clip: ClipSuggestion, addCaptions: boolean = true) => {
    await processClipMutation.mutateAsync({ clip, addCaptions });
  };

  const handleScheduleClip = (clip: ClipSuggestion) => {
    setSelectedClip(clip);
    setScheduleDialogOpen(true);
  };

  const handleDownloadClip = (clipUrl: string, clip: ClipSuggestion) => {
    // Create a temporary link to download the clip
    const link = document.createElement("a");
    link.href = clipUrl;
    link.download = `clip-${clip.startTime}-${clip.endTime}.mp4`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast({
      title: "Download started",
      description: "Your clip is downloading",
    });
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
          <p className="text-muted-foreground">Analyzing video for viral clips...</p>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="py-6">
          <p className="text-destructive">Failed to analyze video: {error instanceof Error ? error.message : "Unknown error"}</p>
        </CardContent>
      </Card>
    );
  }

  if (!analysis || analysis.clipsFound === 0) {
    return (
      <Card>
        <CardContent className="py-6">
          <p className="text-muted-foreground text-center">No viral-worthy clips found. Try manual editing.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-primary" />
            AI-Generated Viral Clips
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Found {analysis.clipsFound} potential viral clips. Top {analysis.jobsCreated} queued for processing.
          </p>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {analysis.clips.map((clip, index) => {
              const timeKey = `${clip.startTime}-${clip.endTime}`;
              const processedClip = jobsByTimeRange.get(timeKey);
              const isProcessing = processedClip?.status === "processing" || processedClip?.status === "pending";
              const isCompleted = processedClip?.status === "completed" && processedClip.clipUrl;
              const isFailed = processedClip?.status === "failed";
              
              return (
                <div
                  key={index}
                  className="flex items-center justify-between p-4 rounded-lg border bg-secondary/30 hover:bg-secondary/50 transition-colors"
                >
                  <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <Badge className={cn("font-semibold", getScoreColor(clip.score))}>
                      {clip.score}% Viral Score
                    </Badge>
                    <Badge variant="outline" className="capitalize">
                      {clip.type}
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      {formatTime(clip.startTime)} - {formatTime(clip.endTime)} ({formatTime(clip.duration)})
                    </span>
                    {isProcessing && (
                      <Badge variant="outline" className="bg-blue-500/10 text-blue-600 dark:text-blue-400">
                        <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                        Processing...
                      </Badge>
                    )}
                    {isCompleted && (
                      <Badge variant="outline" className="bg-green-500/10 text-green-600 dark:text-green-400">
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        Ready
                      </Badge>
                    )}
                    {isFailed && (
                      <Badge variant="outline" className="bg-red-500/10 text-red-600 dark:text-red-400">
                        Failed
                      </Badge>
                    )}
                  </div>
                  {clip.title && (
                    <p className="text-sm font-semibold text-foreground mb-1">{clip.title}</p>
                  )}
                  <p className="text-sm text-muted-foreground">{clip.reason}</p>
                  {clip.hashtags && clip.hashtags.length > 0 && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {clip.hashtags.slice(0, 3).join(" ")}
                    </p>
                  )}
                </div>
                  <div className="flex items-center gap-2 ml-4">
                    {isCompleted && processedClip.clipUrl ? (
                      <>
                        <Button
                          size="sm"
                          variant="default"
                          onClick={() => handleDownloadClip(processedClip.clipUrl!, clip)}
                        >
                          <Download className="h-4 w-4 mr-2" />
                          Download
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleScheduleClip(clip)}
                        >
                          <Calendar className="h-4 w-4 mr-2" />
                          Schedule
                        </Button>
                      </>
                    ) : isProcessing ? (
                      <Button
                        size="sm"
                        variant="outline"
                        disabled
                      >
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Processing...
                      </Button>
                    ) : (
                      <>
                        <Button
                          size="sm"
                          variant="default"
                          onClick={() => handleProcessClip(clip, true)}
                          disabled={processClipMutation.isPending}
                        >
                          {processClipMutation.isPending ? (
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          ) : (
                            <Sparkles className="h-4 w-4 mr-2" />
                          )}
                          Process Now
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleScheduleClip(clip)}
                        >
                          <Calendar className="h-4 w-4 mr-2" />
                          Schedule
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {analysis.jobsCreated > 0 && (
            <div className="mt-4 p-3 rounded-lg bg-green-500/10 border border-green-500/20">
              <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
                <CheckCircle2 className="h-4 w-4" />
                <span>
                  {analysis.jobsCreated} top clips automatically queued for processing. 
                  They'll be ready to post once processing completes.
                </span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {selectedClip && (
        <SchedulePostDialog
          open={scheduleDialogOpen}
          onOpenChange={setScheduleDialogOpen}
          defaultClipUrl={`pending:${selectedClip.startTime}-${selectedClip.endTime}`}
          defaultStartTime={selectedClip.startTime}
          defaultEndTime={selectedClip.endTime}
        />
      )}
    </>
  );
}

