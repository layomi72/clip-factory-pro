import { useState } from "react";
import { 
  Video, 
  Search, 
  Filter, 
  Download, 
  Play,
  Clock,
  Eye,
  RefreshCw,
  CheckCircle2,
  Link2,
  Sparkles,
  Loader2
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useConnectedAccounts } from "@/hooks/useConnectedAccounts";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { videoApi, analysisApi } from "@/services/api";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Sparkles, Zap } from "lucide-react";
import { AutoClipGenerator } from "./AutoClipGenerator";

interface StreamItem {
  id: string;
  title: string | null;
  thumbnail: string | null;
  duration: number | null;
  platform: string;
  source_url: string;
  status: string;
  created_at: string;
  video_id?: string | null;
}

export function StreamImporter() {
  const [url, setUrl] = useState("");
  const [isUrlLoading, setIsUrlLoading] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<"all" | "vod" | "clip">("all");
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [recentlyImported, setRecentlyImported] = useState<{ id: string; url: string; duration: number } | null>(null);

  const { data: accounts = [] } = useConnectedAccounts();
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch imported streams from database
  const { data: streams = [], isLoading: isLoadingStreams } = useQuery({
    queryKey: ["imported-streams", user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from("imported_streams")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as StreamItem[];
    },
    enabled: !!user,
  });

  const [autoGenerateClips, setAutoGenerateClips] = useState(true);

  // Import video mutation
  const importVideoMutation = useMutation({
    mutationFn: async (videoUrl: string) => {
      if (!user) throw new Error("Not authenticated");
      
      // Call download-video API
      const result = await videoApi.downloadVideo(videoUrl, user.id);
      
      // Save to database
      const { data, error } = await supabase
        .from("imported_streams")
        .insert({
          user_id: user.id,
          source_url: videoUrl,
          platform: result.platform,
          video_id: result.metadata?.videoId || null,
          title: result.metadata?.title || null,
          thumbnail_url: result.metadata?.thumbnail || null,
          duration_seconds: result.metadata?.duration || null,
          metadata: result.metadata,
          status: "imported",
        })
        .select()
        .single();

      if (error) throw error;

      // Auto-generate viral clips if enabled
      if (autoGenerateClips && result.metadata?.duration) {
        try {
          const analysisResult = await analysisApi.analyzeVideo(
            videoUrl,
            result.metadata.duration,
            user.id,
            data.id
          );
          
          return { ...data, clipsGenerated: analysisResult.clipsFound, jobsCreated: analysisResult.jobsCreated };
        } catch (analysisError) {
          console.error("Auto-clip generation failed:", analysisError);
          // Continue even if analysis fails
        }
      }

      return data;
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["imported-streams"] });
      queryClient.invalidateQueries({ queryKey: ["processing-jobs"] });
      
      if (data?.clipsGenerated) {
        toast({
          title: "Stream imported & clips generated!",
          description: `Found ${data.clipsGenerated} viral-worthy clips. ${data.jobsCreated} queued for processing.`,
        });
        // Show auto-clip generator if clips were generated
        if (data.metadata?.duration) {
          setRecentlyImported({
            id: data.id,
            url: data.source_url,
            duration: data.metadata.duration,
          });
        }
      } else {
        toast({
          title: "Stream imported",
          description: "Your stream has been imported and is ready for clip generation",
        });
      }
      setUrl("");
    },
    onError: (error: Error) => {
      toast({
        title: "Import failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const detectPlatform = (url: string) => {
    if (url.includes("youtube.com") || url.includes("youtu.be")) return "youtube";
    if (url.includes("twitch.tv")) return "twitch";
    if (url.includes("tiktok.com")) return "tiktok";
    return null;
  };

  const platform = detectPlatform(url);

  const formatDuration = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    if (hrs > 0) {
      return `${hrs}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    }
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };


  const handleUrlImport = async () => {
    if (!url || !user) return;
    
    setIsUrlLoading(true);
    try {
      await importVideoMutation.mutateAsync(url);
    } catch (error) {
      // Error handled by mutation
    } finally {
      setIsUrlLoading(false);
    }
  };

  const handleFetchStreams = async () => {
    if (!selectedAccount) {
      toast({
        title: "No account selected",
        description: "Please select a connected account first",
        variant: "destructive",
      });
      return;
    }

    const account = accounts.find(a => a.id === selectedAccount);
    if (!account) return;

    // TODO: Implement platform-specific stream fetching
    // For now, show message that this feature is coming
    toast({
      title: "Feature coming soon",
      description: `Stream fetching from ${account.platform} accounts will be available soon. Use URL import for now.`,
    });
  };

  const toggleSelection = (id: string) => {
    const newSelected = new Set(selectedItems);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedItems(newSelected);
  };

  const handleImportSelected = async () => {
    if (selectedItems.size === 0 || !user) {
      toast({
        title: "No items selected",
        description: "Please select at least one item to import",
        variant: "destructive",
      });
      return;
    }

    // Items are already imported (from database)
    // This function can be used for batch operations in the future
    toast({
      title: "Items already imported",
      description: "These streams are already in your library. You can now create clips from them.",
    });
    
    setSelectedItems(new Set());
  };

  const filteredStreams = streams.filter(stream => {
    const matchesSearch = !searchQuery || (stream.title || "").toLowerCase().includes(searchQuery.toLowerCase());
    // Note: We don't have type field yet, so filterType is ignored for now
    return matchesSearch;
  });

  const getPlatformIcon = (platform: string) => {
    const icons: Record<string, string> = {
      youtube: "🎬",
      tiktok: "🎵",
      instagram: "📸",
      twitch: "🎮",
    };
    return icons[platform] || "📱";
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Import Streams</h2>
        <p className="text-muted-foreground">
          Import VODs and clips from URLs or connected accounts
        </p>
      </div>

      <Tabs defaultValue="url" className="space-y-6">
        <TabsList>
          <TabsTrigger value="url">Import by URL</TabsTrigger>
          <TabsTrigger value="browse">Browse Accounts</TabsTrigger>
        </TabsList>

        {/* URL Import Tab */}
        <TabsContent value="url" className="space-y-4">
          <Card className="p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <Sparkles className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">Import from URL</h3>
                <p className="text-sm text-muted-foreground">Paste a YouTube, Twitch, or TikTok stream URL</p>
              </div>
            </div>

            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2">
                <Link2 className="h-5 w-5 text-muted-foreground" />
              </div>
              <input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://www.youtube.com/watch?v=..."
                className={cn(
                  "w-full rounded-xl border bg-secondary/50 py-4 pl-12 pr-36 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all",
                  platform === "youtube" && "border-primary/50 ring-primary/30",
                  platform === "twitch" && "border-purple-500/50 ring-purple-500/30",
                  platform === "tiktok" && "border-pink-500/50 ring-pink-500/30",
                  !platform && "border-border"
                )}
              />
              <div className="absolute right-2 top-1/2 -translate-y-1/2">
                <Button
                  onClick={handleUrlImport}
                  disabled={!url || isUrlLoading}
                  className="h-10"
                >
                  {isUrlLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      {autoGenerateClips ? "Analyzing & Importing..." : "Importing..."}
                    </>
                  ) : (
                    <>
                      {autoGenerateClips ? (
                        <Zap className="h-4 w-4 mr-2" />
                      ) : (
                        <Sparkles className="h-4 w-4 mr-2" />
                      )}
                      {autoGenerateClips ? "Auto-Generate Clips" : "Import Stream"}
                    </>
                  )}
                </Button>
              </div>
            </div>

            {platform && (
              <div className="mt-4 space-y-3">
                <div className="flex items-center gap-2 text-sm">
                  <div
                    className={cn(
                      "h-2 w-2 rounded-full",
                      platform === "youtube" && "bg-red-500",
                      platform === "twitch" && "bg-purple-500",
                      platform === "tiktok" && "bg-pink-500"
                    )}
                  />
                  <span className="text-muted-foreground">
                    Detected: <span className="capitalize text-foreground font-medium">{platform}</span>
                  </span>
                </div>
                
                {/* Auto-generate clips option */}
                <div className="flex items-center gap-2 p-3 rounded-lg bg-primary/5 border border-primary/20">
                  <Zap className="h-4 w-4 text-primary" />
                  <div className="flex-1">
                    <label className="text-sm font-medium cursor-pointer flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={autoGenerateClips}
                        onChange={(e) => setAutoGenerateClips(e.target.checked)}
                        className="rounded"
                      />
                      <span>Auto-generate viral clips</span>
                    </label>
                    <p className="text-xs text-muted-foreground mt-1">
                      AI will automatically find the best moments and create clips for you
                    </p>
                  </div>
                </div>
              </div>
            )}
          </Card>
        </TabsContent>

        {/* Browse Accounts Tab */}
        <TabsContent value="browse" className="space-y-6">
          {/* Account Selection */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <label className="text-sm font-medium mb-2 block">Select Account</label>
                  <Select value={selectedAccount} onValueChange={setSelectedAccount}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a connected account" />
                    </SelectTrigger>
                    <SelectContent>
                      {accounts.map((account) => (
                        <SelectItem key={account.id} value={account.id}>
                          <span className="flex items-center gap-2">
                            {getPlatformIcon(account.platform)}
                            {account.platform_username} ({account.platform})
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {accounts.length === 0 && (
                    <p className="text-sm text-muted-foreground mt-2">
                      No connected accounts. Connect an account in the Accounts section first.
                    </p>
                  )}
                </div>
                <div className="flex items-end">
                  <Button 
                    onClick={handleFetchStreams} 
                    disabled={!selectedAccount || isLoadingStreams}
                  >
                    <RefreshCw className={cn("h-4 w-4 mr-2", isLoadingStreams && "animate-spin")} />
                    {isLoadingStreams ? "Loading..." : "Fetch Streams"}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {streams.length > 0 && (
            <>
              {/* Filters and Search */}
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search streams..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <div className="flex gap-2">
                  <Select value={filterType} onValueChange={(v: "all" | "vod" | "clip") => setFilterType(v)}>
                    <SelectTrigger className="w-[140px]">
                      <Filter className="h-4 w-4 mr-2" />
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="vod">VODs Only</SelectItem>
                      <SelectItem value="clip">Clips Only</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button 
                    onClick={handleImportSelected}
                    disabled={selectedItems.size === 0 || importVideoMutation.isPending}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Selected ({selectedItems.size})
                  </Button>
                </div>
              </div>

              {/* Stream Grid */}
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {filteredStreams.map((stream) => {
                  const isSelected = selectedItems.has(stream.id);

                  return (
                    <Card 
                      key={stream.id}
                      className={cn(
                        "overflow-hidden cursor-pointer transition-all hover:shadow-lg",
                        isSelected && "ring-2 ring-primary"
                      )}
                      onClick={() => toggleSelection(stream.id)}
                    >
                      <div className="relative aspect-video bg-muted">
                        {stream.thumbnail_url ? (
                          <img
                            src={stream.thumbnail_url}
                            alt={stream.title || "Stream"}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Video className="h-12 w-12 text-muted-foreground" />
                          </div>
                        )}
                        
                        {stream.duration_seconds && (
                          <Badge 
                            variant="secondary" 
                            className="absolute bottom-2 right-2 bg-black/80 text-white"
                          >
                            {formatDuration(stream.duration_seconds)}
                          </Badge>
                        )}

                        <Badge 
                          variant="secondary"
                          className="absolute top-2 left-2"
                        >
                          {stream.platform}
                        </Badge>

                        {isSelected && (
                          <div className="absolute inset-0 flex items-center justify-center bg-primary/20">
                            <CheckCircle2 className="h-12 w-12 text-primary" />
                          </div>
                        )}

                        {!isSelected && (
                          <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity bg-black/30">
                            <div className="h-12 w-12 rounded-full bg-white/90 flex items-center justify-center">
                              <Play className="h-6 w-6 text-foreground ml-0.5" />
                            </div>
                          </div>
                        )}
                      </div>

                      <CardContent className="p-3">
                        <h3 className="font-medium text-sm line-clamp-2 mb-2">
                          {stream.title || "Untitled Stream"}
                        </h3>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          <Badge variant="outline" className="text-xs">
                            {stream.status}
                          </Badge>
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {formatDistanceToNow(new Date(stream.created_at), { addSuffix: true })}
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>

              {filteredStreams.length === 0 && (
                <div className="text-center py-12">
                  <Video className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">No streams found</h3>
                  <p className="text-muted-foreground">
                    Try adjusting your search or filter settings
                  </p>
                </div>
              )}
            </>
          )}

          {streams.length === 0 && !isLoadingStreams && (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Video className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No streams loaded</h3>
                <p className="text-muted-foreground text-center">
                  Select a connected account and click "Fetch Streams" to browse your VODs and clips.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Auto Clip Generator - Show after import if auto-generate was enabled */}
      {recentlyImported && autoGenerateClips && (
        <div className="mt-6">
          <AutoClipGenerator
            videoUrl={recentlyImported.url}
            duration={recentlyImported.duration}
            importedStreamId={recentlyImported.id}
          />
        </div>
      )}
    </div>
  );
}
