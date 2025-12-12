/**
 * Auto Clip Generator Component
 * Shows AI-generated clip suggestions and allows bulk scheduling
 */

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Zap, Play, Calendar, CheckCircle2 } from "lucide-react";
import { analysisApi, ClipSuggestion } from "@/services/api";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { SchedulePostDialog } from "./SchedulePostDialog";

interface AutoClipGeneratorProps {
  videoUrl: string;
  duration: number;
  importedStreamId?: string;
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

  const handleScheduleClip = (clip: ClipSuggestion) => {
    setSelectedClip(clip);
    setScheduleDialogOpen(true);
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
            {analysis.clips.map((clip, index) => (
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
                  </div>
                  <p className="text-sm text-muted-foreground">{clip.reason}</p>
                </div>
                <div className="flex items-center gap-2 ml-4">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleScheduleClip(clip)}
                  >
                    <Calendar className="h-4 w-4 mr-2" />
                    Schedule
                  </Button>
                </div>
              </div>
            ))}
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

