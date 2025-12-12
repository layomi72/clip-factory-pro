import { useState, useRef, useEffect, useCallback } from "react";
import { 
  Play, 
  Pause, 
  SkipBack, 
  SkipForward, 
  Scissors, 
  Volume2, 
  VolumeX,
  RotateCcw,
  Calendar,
  Loader2
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { processingApi } from "@/services/api";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";

interface ClipEditorProps {
  onSchedule?: (clipData: { url: string; startTime: number; endTime: number; clipId?: string }) => void;
  sourceStreamId?: string; // Optional: ID of imported stream
}

export function ClipEditor({ onSchedule, sourceStreamId }: ClipEditorProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoUrl, setVideoUrl] = useState("");
  const [isLoaded, setIsLoaded] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [trimStart, setTrimStart] = useState(0);
  const [trimEnd, setTrimEnd] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processedClipUrl, setProcessedClipUrl] = useState<string | null>(null);

  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const handleLoadVideo = () => {
    if (videoUrl && videoRef.current) {
      videoRef.current.src = videoUrl;
      videoRef.current.load();
    }
  };

  const handleVideoLoaded = () => {
    if (videoRef.current) {
      const dur = videoRef.current.duration;
      setDuration(dur);
      setTrimEnd(dur);
      setIsLoaded(true);
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      const time = videoRef.current.currentTime;
      setCurrentTime(time);
      
      // Loop within trim bounds
      if (time >= trimEnd) {
        videoRef.current.currentTime = trimStart;
        if (!isPlaying) {
          videoRef.current.pause();
        }
      }
    }
  };

  const togglePlay = useCallback(() => {
    if (!videoRef.current || !isLoaded) return;
    
    if (isPlaying) {
      videoRef.current.pause();
    } else {
      if (videoRef.current.currentTime < trimStart || videoRef.current.currentTime >= trimEnd) {
        videoRef.current.currentTime = trimStart;
      }
      videoRef.current.play();
    }
    setIsPlaying(!isPlaying);
  }, [isPlaying, isLoaded, trimStart, trimEnd]);

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const handleVolumeChange = (value: number[]) => {
    if (videoRef.current) {
      const vol = value[0];
      videoRef.current.volume = vol;
      setVolume(vol);
      setIsMuted(vol === 0);
    }
  };

  const seekTo = (time: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const percent = (e.clientX - rect.left) / rect.width;
    const newTime = percent * duration;
    seekTo(Math.max(trimStart, Math.min(trimEnd, newTime)));
  };

  const handleTrimStartChange = (value: number[]) => {
    const newStart = value[0];
    if (newStart < trimEnd - 1) {
      setTrimStart(newStart);
      if (currentTime < newStart) {
        seekTo(newStart);
      }
    }
  };

  const handleTrimEndChange = (value: number[]) => {
    const newEnd = value[0];
    if (newEnd > trimStart + 1) {
      setTrimEnd(newEnd);
      if (currentTime > newEnd) {
        seekTo(newEnd);
      }
    }
  };

  const resetTrim = () => {
    setTrimStart(0);
    setTrimEnd(duration);
    seekTo(0);
  };

  const skipBack = () => {
    seekTo(Math.max(trimStart, currentTime - 5));
  };

  const skipForward = () => {
    seekTo(Math.min(trimEnd, currentTime + 5));
  };

  const handleScheduleClick = async () => {
    if (!videoUrl || !user) {
      toast({
        title: "Error",
        description: "Please load a video first",
        variant: "destructive",
      });
      return;
    }

    if (trimEnd <= trimStart) {
      toast({
        title: "Invalid clip",
        description: "End time must be greater than start time",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);
    try {
      // Generate clip ID
      const clipId = `clip-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      // Call process-clip API
      const result = await processingApi.processClip(
        videoUrl,
        trimStart,
        trimEnd,
        user.id,
        clipId
      );

      setProcessedClipUrl(result.clipUrl);
      
      // Invalidate processing jobs query to refresh status
      queryClient.invalidateQueries({ queryKey: ["processing-jobs"] });

      toast({
        title: "Clip processed",
        description: result.message || "Your clip is being processed",
      });

      // Call onSchedule callback with processed clip URL
      if (onSchedule) {
        onSchedule({
          url: result.clipUrl,
          startTime: trimStart,
          endTime: trimEnd,
          clipId: result.clipId,
        });
      }
    } catch (error) {
      toast({
        title: "Processing failed",
        description: error instanceof Error ? error.message : "Failed to process clip",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement) return;
      
      if (e.code === "Space") {
        e.preventDefault();
        togglePlay();
      } else if (e.code === "ArrowLeft") {
        skipBack();
      } else if (e.code === "ArrowRight") {
        skipForward();
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [togglePlay]);

  const trimmedDuration = trimEnd - trimStart;
  const progressPercent = duration ? ((currentTime - trimStart) / trimmedDuration) * 100 : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Clip Editor</h2>
          <p className="text-muted-foreground">
            Trim and preview clips before scheduling
          </p>
        </div>
      </div>

      {/* URL Input */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <div className="flex-1">
              <Label htmlFor="video-url">Video URL</Label>
              <Input
                id="video-url"
                placeholder="https://example.com/video.mp4"
                value={videoUrl}
                onChange={(e) => setVideoUrl(e.target.value)}
                className="mt-1"
              />
            </div>
            <div className="flex items-end">
              <Button onClick={handleLoadVideo} disabled={!videoUrl}>
                Load Video
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Video Player */}
      <Card className="overflow-hidden">
        <div className="relative bg-black aspect-video">
          <video
            ref={videoRef}
            className="w-full h-full"
            onLoadedMetadata={handleVideoLoaded}
            onTimeUpdate={handleTimeUpdate}
            onEnded={() => setIsPlaying(false)}
            playsInline
          />
          
          {!isLoaded && (
            <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
              <p>Enter a video URL and click Load Video to begin</p>
            </div>
          )}
        </div>

        {isLoaded && (
          <CardContent className="space-y-4 pt-4">
            {/* Progress Bar */}
            <div 
              className="relative h-2 bg-secondary rounded-full cursor-pointer group"
              onClick={handleProgressClick}
            >
              {/* Trim region overlay */}
              <div 
                className="absolute h-full bg-primary/20 rounded-full"
                style={{ 
                  left: `${(trimStart / duration) * 100}%`,
                  width: `${((trimEnd - trimStart) / duration) * 100}%`
                }}
              />
              
              {/* Progress */}
              <div 
                className="absolute h-full bg-primary rounded-full transition-all"
                style={{ 
                  left: `${(trimStart / duration) * 100}%`,
                  width: `${Math.min(progressPercent, 100) * (trimmedDuration / duration)}%`
                }}
              />
              
              {/* Current position indicator */}
              <div 
                className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-primary rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                style={{ left: `calc(${(currentTime / duration) * 100}% - 6px)` }}
              />
            </div>

            {/* Time Display */}
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">{formatTime(currentTime)}</span>
              <Badge variant="secondary">
                Clip: {formatTime(trimmedDuration)}
              </Badge>
              <span className="text-muted-foreground">{formatTime(duration)}</span>
            </div>

            {/* Playback Controls */}
            <div className="flex items-center justify-center gap-2">
              <Button variant="ghost" size="icon" onClick={skipBack}>
                <SkipBack className="h-5 w-5" />
              </Button>
              
              <Button 
                variant="default" 
                size="icon" 
                className="h-12 w-12 rounded-full"
                onClick={togglePlay}
              >
                {isPlaying ? (
                  <Pause className="h-6 w-6" />
                ) : (
                  <Play className="h-6 w-6 ml-0.5" />
                )}
              </Button>
              
              <Button variant="ghost" size="icon" onClick={skipForward}>
                <SkipForward className="h-5 w-5" />
              </Button>

              <div className="ml-4 flex items-center gap-2">
                <Button variant="ghost" size="icon" onClick={toggleMute}>
                  {isMuted ? (
                    <VolumeX className="h-5 w-5" />
                  ) : (
                    <Volume2 className="h-5 w-5" />
                  )}
                </Button>
                <Slider
                  value={[isMuted ? 0 : volume]}
                  max={1}
                  step={0.1}
                  onValueChange={handleVolumeChange}
                  className="w-24"
                />
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Trim Controls */}
      {isLoaded && (
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <Scissors className="h-5 w-5" />
                Trim Controls
              </CardTitle>
              <Button variant="ghost" size="sm" onClick={resetTrim}>
                <RotateCcw className="h-4 w-4 mr-2" />
                Reset
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Start Point</Label>
                  <span className="text-sm font-mono text-muted-foreground">
                    {formatTime(trimStart)}
                  </span>
                </div>
                <Slider
                  value={[trimStart]}
                  max={duration}
                  step={0.1}
                  onValueChange={handleTrimStartChange}
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>End Point</Label>
                  <span className="text-sm font-mono text-muted-foreground">
                    {formatTime(trimEnd)}
                  </span>
                </div>
                <Slider
                  value={[trimEnd]}
                  max={duration}
                  step={0.1}
                  onValueChange={handleTrimEndChange}
                />
              </div>
            </div>

            {/* Timeline Visualization */}
            <div className="space-y-2">
              <Label>Trimmed Region</Label>
              <div className="relative h-8 bg-secondary rounded-lg overflow-hidden">
                <div 
                  className={cn(
                    "absolute h-full bg-gradient-to-r from-primary/40 to-primary/60",
                    "border-x-2 border-primary"
                  )}
                  style={{ 
                    left: `${(trimStart / duration) * 100}%`,
                    width: `${((trimEnd - trimStart) / duration) * 100}%`
                  }}
                >
                  <div className="h-full flex items-center justify-center text-xs font-medium text-primary-foreground">
                    {formatTime(trimmedDuration)}
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                className="flex-1"
                onClick={() => seekTo(trimStart)}
              >
                Go to Start
              </Button>
              <Button 
                variant="outline" 
                className="flex-1"
                onClick={() => seekTo(trimEnd - 0.1)}
              >
                Go to End
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Process & Schedule Button */}
      {isLoaded && onSchedule && (
        <Button 
          size="lg" 
          className="w-full"
          onClick={handleScheduleClick}
          disabled={isProcessing || trimEnd <= trimStart}
        >
          {isProcessing ? (
            <>
              <Loader2 className="h-5 w-5 mr-2 animate-spin" />
              Processing Clip...
            </>
          ) : (
            <>
              <Calendar className="h-5 w-5 mr-2" />
              Process & Schedule Clip
            </>
          )}
        </Button>
      )}

      {processedClipUrl && (
        <Card className="bg-green-500/10 border-green-500/20">
          <CardContent className="pt-4">
            <p className="text-sm text-green-600 dark:text-green-400">
              ✓ Clip processed successfully! You can now schedule it for posting.
            </p>
            {processedClipUrl.startsWith("pending:") && (
              <p className="text-xs text-muted-foreground mt-2">
                Processing in queue. Check status in Clip Queue.
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Keyboard Shortcuts */}
      {isLoaded && (
        <Card>
          <CardContent className="pt-4">
            <p className="text-sm text-muted-foreground text-center">
              <span className="font-medium">Keyboard shortcuts:</span>{" "}
              <kbd className="px-1.5 py-0.5 bg-secondary rounded text-xs">Space</kbd> Play/Pause{" "}
              <kbd className="px-1.5 py-0.5 bg-secondary rounded text-xs">←</kbd> -5s{" "}
              <kbd className="px-1.5 py-0.5 bg-secondary rounded text-xs">→</kbd> +5s
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
