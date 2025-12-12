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

interface StreamItem {
  id: string;
  title: string;
  thumbnail: string;
  duration: number;
  views: number;
  createdAt: Date;
  platform: string;
  type: "vod" | "clip";
  url: string;
}

// Mock data for demonstration
const generateMockStreams = (platform: string): StreamItem[] => {
  const types: ("vod" | "clip")[] = ["vod", "clip", "vod", "clip", "vod", "clip", "vod", "clip"];
  return Array.from({ length: 8 }, (_, i) => ({
    id: `${platform}-${i}`,
    title: types[i % 8] === "vod" 
      ? `Stream VOD: ${["Epic Gaming Session", "Late Night Chill", "Tournament Practice", "Community Games"][i % 4]}`
      : `Clip: ${["Insane Play!", "Funny Moment", "Close Call", "Victory Royale"][i % 4]}`,
    thumbnail: `https://picsum.photos/seed/${platform}${i}/320/180`,
    duration: types[i % 8] === "vod" ? 3600 + Math.random() * 7200 : 15 + Math.random() * 45,
    views: Math.floor(Math.random() * 10000),
    createdAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000),
    platform,
    type: types[i % 8],
    url: `https://example.com/${platform}/${i}`,
  }));
};

export function StreamImporter() {
  const [url, setUrl] = useState("");
  const [isUrlLoading, setIsUrlLoading] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<"all" | "vod" | "clip">("all");
  const [streams, setStreams] = useState<StreamItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [importedItems, setImportedItems] = useState<Set<string>>(new Set());

  const { data: accounts = [] } = useConnectedAccounts();
  const { toast } = useToast();

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

  const formatViews = (views: number) => {
    if (views >= 1000000) return `${(views / 1000000).toFixed(1)}M`;
    if (views >= 1000) return `${(views / 1000).toFixed(1)}K`;
    return views.toString();
  };

  const handleUrlImport = () => {
    if (!url) return;
    setIsUrlLoading(true);
    setTimeout(() => {
      setIsUrlLoading(false);
      toast({
        title: "Stream imported",
        description: "Your stream is being processed for clip generation",
      });
      setUrl("");
    }, 2000);
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

    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    const account = accounts.find(a => a.id === selectedAccount);
    if (account) {
      setStreams(generateMockStreams(account.platform));
      toast({
        title: "Streams loaded",
        description: `Found 8 items from ${account.platform_username}`,
      });
    }
    
    setIsLoading(false);
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
    if (selectedItems.size === 0) {
      toast({
        title: "No items selected",
        description: "Please select at least one item to import",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const newImported = new Set(importedItems);
    selectedItems.forEach(id => newImported.add(id));
    setImportedItems(newImported);
    setSelectedItems(new Set());
    
    toast({
      title: "Import complete",
      description: `Successfully imported ${selectedItems.size} items`,
    });
    
    setIsLoading(false);
  };

  const filteredStreams = streams.filter(stream => {
    const matchesSearch = stream.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = filterType === "all" || stream.type === filterType;
    return matchesSearch && matchesType;
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
                      Processing
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4 mr-2" />
                      Generate Clips
                    </>
                  )}
                </Button>
              </div>
            </div>

            {platform && (
              <div className="mt-4 flex items-center gap-2 text-sm">
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
                    disabled={!selectedAccount || isLoading}
                  >
                    <RefreshCw className={cn("h-4 w-4 mr-2", isLoading && "animate-spin")} />
                    {isLoading ? "Loading..." : "Fetch Streams"}
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
                    disabled={selectedItems.size === 0 || isLoading}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Import ({selectedItems.size})
                  </Button>
                </div>
              </div>

              {/* Stream Grid */}
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {filteredStreams.map((stream) => {
                  const isSelected = selectedItems.has(stream.id);
                  const isImported = importedItems.has(stream.id);

                  return (
                    <Card 
                      key={stream.id}
                      className={cn(
                        "overflow-hidden cursor-pointer transition-all hover:shadow-lg",
                        isSelected && "ring-2 ring-primary",
                        isImported && "opacity-60"
                      )}
                      onClick={() => !isImported && toggleSelection(stream.id)}
                    >
                      <div className="relative aspect-video bg-muted">
                        <img
                          src={stream.thumbnail}
                          alt={stream.title}
                          className="w-full h-full object-cover"
                        />
                        
                        <Badge 
                          variant="secondary" 
                          className="absolute bottom-2 right-2 bg-black/80 text-white"
                        >
                          {formatDuration(stream.duration)}
                        </Badge>

                        <Badge 
                          variant={stream.type === "clip" ? "default" : "secondary"}
                          className="absolute top-2 left-2"
                        >
                          {stream.type === "clip" ? "Clip" : "VOD"}
                        </Badge>

                        {(isSelected || isImported) && (
                          <div className={cn(
                            "absolute inset-0 flex items-center justify-center",
                            isSelected ? "bg-primary/20" : "bg-background/50"
                          )}>
                            <CheckCircle2 className={cn(
                              "h-12 w-12",
                              isSelected ? "text-primary" : "text-muted-foreground"
                            )} />
                          </div>
                        )}

                        {!isSelected && !isImported && (
                          <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity bg-black/30">
                            <div className="h-12 w-12 rounded-full bg-white/90 flex items-center justify-center">
                              <Play className="h-6 w-6 text-foreground ml-0.5" />
                            </div>
                          </div>
                        )}
                      </div>

                      <CardContent className="p-3">
                        <h3 className="font-medium text-sm line-clamp-2 mb-2">
                          {stream.title}
                        </h3>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Eye className="h-3 w-3" />
                            {formatViews(stream.views)}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {formatDistanceToNow(stream.createdAt, { addSuffix: true })}
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

          {streams.length === 0 && !isLoading && (
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
    </div>
  );
}
