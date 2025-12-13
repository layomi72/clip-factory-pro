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
  status: "pending" | "processing" | "completed" | "failed" | "awaiting_service";
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
            Found {analysis.clipsFound} potential viral clips. 
            {analysis.clipsProcessed !== undefined && analysis.clipsProcessed > 0 
              ? ` ${analysis.clipsProcessed} clips processed and ready to download.`
              : ` Top ${analysis.jobsCreated} queued for processing.`}
          </p>
          {!analysis.processingAvailable && (
            <div className="mt-2 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
              <p className="text-sm text-amber-600 dark:text-amber-400">
                <strong>⚠️ FFmpeg Service Not Configured:</strong> Clips are identified but cannot be processed into edited videos. 
                Deploy the FFmpeg service to Railway/Render to enable full clip generation with captions, zoom effects, and audio enhancement.
              </p>
            </div>
          )}
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {analysis.clips.map((clip, index) => {
              const timeKey = `${clip.startTime}-${clip.endTime}`;
              const processedClip = jobsByTimeRange.get(timeKey);
              
              // Check clip status from either the response or the jobs query
              const clipStatus = clip.processingStatus || processedClip?.status;
              const clipUrl = clip.clipUrl || processedClip?.clipUrl;
              
              const isProcessing = clipStatus === "processing" || clipStatus === "pending";
              const isAwaitingService = clipStatus === "awaiting_service";
              const isCompleted = clipStatus === "completed" && clipUrl;
              const isFailed = clipStatus === "failed";
              
              // Generate preview URL for source video
              const getPreviewUrl = () => {
                if (videoUrl.includes("youtube.com") || videoUrl.includes("youtu.be")) {
                  const videoId = videoUrl.match(/(?:v=|youtu\.be\/)([^&?]+)/)?.[1];
                  return videoId ? `https://www.youtube.com/watch?v=${videoId}&t=${Math.floor(clip.startTime)}` : videoUrl;
                }
                if (videoUrl.includes("twitch.tv")) {
                  return `${videoUrl}?t=${Math.floor(clip.startTime / 3600)}h${Math.floor((clip.startTime % 3600) / 60)}m${Math.floor(clip.startTime % 60)}s`;
                }
                return videoUrl;
              };
              
              return (
                <div
                  key={index}
                  className="flex items-start justify-between p-4 rounded-lg border bg-secondary/30 hover:bg-secondary/50 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2 flex-wrap">
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
                      {isAwaitingService && (
                        <Badge variant="outline" className="bg-amber-500/10 text-amber-600 dark:text-amber-400">
                          Awaiting Service
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
                      <p className="text-base font-bold text-foreground mb-1">{clip.title}</p>
                    )}
                    <p className="text-sm text-muted-foreground mb-2">{clip.reason}</p>
                    {clip.hashtags && clip.hashtags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-2">
                        {clip.hashtags.slice(0, 5).map((tag, i) => (
                          <span key={i} className="text-xs text-primary bg-primary/10 px-2 py-0.5 rounded">
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                    {clip.triggers && clip.triggers.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {clip.triggers.map((trigger, i) => (
                          <span key={i} className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded">
                            {trigger.replace(/_/g, " ")}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2 ml-4 flex-shrink-0">
                    {/* Preview button - always available */}
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => window.open(getPreviewUrl(), "_blank")}
                      title="Preview in source"
                    >
                      <Play className="h-4 w-4" />
                    </Button>
                    
                    {isCompleted && clipUrl ? (
                      <>
                        <Button
                          size="sm"
                          variant="default"
                          onClick={() => handleDownloadClip(clipUrl!, clip)}
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
                    ) : analysis.processingAvailable ? (
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
                          Process
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
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleScheduleClip(clip)}
                      >
                        <Calendar className="h-4 w-4 mr-2" />
                        Schedule
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {analysis.clipsProcessed !== undefined && analysis.clipsProcessed > 0 && (
            <div className="mt-4 p-3 rounded-lg bg-green-500/10 border border-green-500/20">
              <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
                <CheckCircle2 className="h-4 w-4" />
                <span>
                  {analysis.clipsProcessed} clips processed and ready to download! 
                  Click the Download button to save them.
                </span>
              </div>
            </div>
          )}
          
          {analysis.jobsCreated > 0 && analysis.processingAvailable && (!analysis.clipsProcessed || analysis.clipsProcessed === 0) && (
            <div className="mt-4 p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
              <div className="flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>
                  Processing clips... Refresh the page to check status.
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

