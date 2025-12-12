import { useState } from "react";
import { 
  Send, 
  Link, 
  MessageSquare, 
  CheckCircle2, 
  AlertCircle,
  Loader2,
  Video
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useConnectedAccounts } from "@/hooks/useConnectedAccounts";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface PostResult {
  accountId: string;
  platform: string;
  username: string;
  status: "pending" | "posting" | "success" | "failed";
  error?: string;
}

export function Distribute() {
  const [clipUrl, setClipUrl] = useState("");
  const [caption, setCaption] = useState("");
  const [selectedAccounts, setSelectedAccounts] = useState<Set<string>>(new Set());
  const [isPosting, setIsPosting] = useState(false);
  const [postResults, setPostResults] = useState<PostResult[]>([]);
  const [showResults, setShowResults] = useState(false);

  const { data: accounts = [] } = useConnectedAccounts();
  const { toast } = useToast();

  const getPlatformIcon = (platform: string) => {
    const icons: Record<string, string> = {
      youtube: "🎬",
      tiktok: "🎵",
      instagram: "📸",
      twitter: "🐦",
      twitch: "🎮",
    };
    return icons[platform] || "📱";
  };

  const getPlatformColor = (platform: string) => {
    const colors: Record<string, string> = {
      youtube: "bg-red-500/10 border-red-500/30 text-red-500",
      tiktok: "bg-pink-500/10 border-pink-500/30 text-pink-500",
      instagram: "bg-purple-500/10 border-purple-500/30 text-purple-500",
      twitter: "bg-blue-400/10 border-blue-400/30 text-blue-400",
      twitch: "bg-violet-500/10 border-violet-500/30 text-violet-500",
    };
    return colors[platform] || "bg-muted border-border";
  };

  const toggleAccount = (accountId: string) => {
    const newSelected = new Set(selectedAccounts);
    if (newSelected.has(accountId)) {
      newSelected.delete(accountId);
    } else {
      newSelected.add(accountId);
    }
    setSelectedAccounts(newSelected);
  };

  const selectAll = () => {
    if (selectedAccounts.size === accounts.length) {
      setSelectedAccounts(new Set());
    } else {
      setSelectedAccounts(new Set(accounts.map(a => a.id)));
    }
  };

  const handleDistribute = async () => {
    if (!clipUrl) {
      toast({
        title: "Missing clip URL",
        description: "Please enter a clip URL to distribute",
        variant: "destructive",
      });
      return;
    }

    if (selectedAccounts.size === 0) {
      toast({
        title: "No accounts selected",
        description: "Please select at least one account to post to",
        variant: "destructive",
      });
      return;
    }

    setIsPosting(true);
    setShowResults(true);

    // Initialize results
    const initialResults: PostResult[] = accounts
      .filter(a => selectedAccounts.has(a.id))
      .map(a => ({
        accountId: a.id,
        platform: a.platform,
        username: a.platform_username,
        status: "pending" as const,
      }));
    
    setPostResults(initialResults);

    // Simulate posting to each platform
    for (let i = 0; i < initialResults.length; i++) {
      const result = initialResults[i];
      
      // Update to posting status
      setPostResults(prev => 
        prev.map(r => 
          r.accountId === result.accountId 
            ? { ...r, status: "posting" as const }
            : r
        )
      );

      // Simulate API call with random delay
      await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 1000));

      // Simulate success/failure (90% success rate for demo)
      const success = Math.random() > 0.1;

      setPostResults(prev => 
        prev.map(r => 
          r.accountId === result.accountId 
            ? { 
                ...r, 
                status: success ? "success" as const : "failed" as const,
                error: success ? undefined : "Failed to connect to platform API"
              }
            : r
        )
      );
    }

    setIsPosting(false);

    const successCount = initialResults.length; // In real impl, count actual successes
    toast({
      title: "Distribution complete",
      description: `Posted to ${successCount} platform(s)`,
    });
  };

  const resetForm = () => {
    setClipUrl("");
    setCaption("");
    setSelectedAccounts(new Set());
    setPostResults([]);
    setShowResults(false);
  };

  const successCount = postResults.filter(r => r.status === "success").length;
  const failedCount = postResults.filter(r => r.status === "failed").length;
  const progress = postResults.length > 0 
    ? ((successCount + failedCount) / postResults.length) * 100 
    : 0;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Distribute</h2>
        <p className="text-muted-foreground">
          Post clips to multiple platforms simultaneously
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Left Column - Form */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Video className="h-5 w-5" />
                Clip Details
              </CardTitle>
              <CardDescription>
                Enter the clip URL and caption for your post
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="clip-url" className="flex items-center gap-2">
                  <Link className="h-4 w-4" />
                  Clip URL
                </Label>
                <Input
                  id="clip-url"
                  placeholder="https://example.com/clip.mp4"
                  value={clipUrl}
                  onChange={(e) => setClipUrl(e.target.value)}
                  disabled={isPosting}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="caption" className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4" />
                  Caption
                </Label>
                <Textarea
                  id="caption"
                  placeholder="Write a caption for your post..."
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  rows={4}
                  disabled={isPosting}
                />
                <p className="text-xs text-muted-foreground">
                  {caption.length}/500 characters
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Select Accounts</CardTitle>
                  <CardDescription>
                    Choose which platforms to post to
                  </CardDescription>
                </div>
                {accounts.length > 0 && (
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={selectAll}
                    disabled={isPosting}
                  >
                    {selectedAccounts.size === accounts.length ? "Deselect All" : "Select All"}
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {accounts.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground mb-4">
                    No connected accounts yet.
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Connect accounts in the Accounts section first.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {accounts.map((account) => {
                    const isSelected = selectedAccounts.has(account.id);
                    return (
                      <div
                        key={account.id}
                        onClick={() => !isPosting && toggleAccount(account.id)}
                        className={cn(
                          "flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all",
                          isSelected
                            ? "border-primary bg-primary/5"
                            : "border-border hover:border-primary/50",
                          isPosting && "opacity-50 cursor-not-allowed"
                        )}
                      >
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={() => toggleAccount(account.id)}
                          disabled={isPosting}
                        />
                        <span className="text-2xl">
                          {getPlatformIcon(account.platform)}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">
                            {account.platform_username}
                          </p>
                          <p className="text-sm text-muted-foreground capitalize">
                            {account.platform}
                          </p>
                        </div>
                        <Badge 
                          variant="outline" 
                          className={getPlatformColor(account.platform)}
                        >
                          {account.platform}
                        </Badge>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          <div className="flex gap-3">
            <Button
              size="lg"
              className="flex-1"
              onClick={handleDistribute}
              disabled={isPosting || selectedAccounts.size === 0 || !clipUrl}
            >
              {isPosting ? (
                <>
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                  Posting...
                </>
              ) : (
                <>
                  <Send className="h-5 w-5 mr-2" />
                  Distribute to {selectedAccounts.size} Platform{selectedAccounts.size !== 1 ? "s" : ""}
                </>
              )}
            </Button>
            {showResults && !isPosting && (
              <Button
                size="lg"
                variant="outline"
                onClick={resetForm}
              >
                New Post
              </Button>
            )}
          </div>
        </div>

        {/* Right Column - Results */}
        <div>
          {showResults ? (
            <Card>
              <CardHeader>
                <CardTitle>Distribution Progress</CardTitle>
                <CardDescription>
                  {isPosting 
                    ? "Posting to selected platforms..." 
                    : `Completed: ${successCount} success, ${failedCount} failed`
                  }
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Progress</span>
                    <span>{Math.round(progress)}%</span>
                  </div>
                  <Progress value={progress} className="h-2" />
                </div>

                <div className="space-y-3">
                  {postResults.map((result) => (
                    <div
                      key={result.accountId}
                      className={cn(
                        "flex items-center gap-3 p-3 rounded-lg border",
                        result.status === "success" && "border-green-500/30 bg-green-500/5",
                        result.status === "failed" && "border-destructive/30 bg-destructive/5",
                        result.status === "posting" && "border-primary/30 bg-primary/5",
                        result.status === "pending" && "border-border"
                      )}
                    >
                      <span className="text-xl">
                        {getPlatformIcon(result.platform)}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{result.username}</p>
                        <p className="text-sm text-muted-foreground capitalize">
                          {result.platform}
                        </p>
                        {result.error && (
                          <p className="text-xs text-destructive mt-1">
                            {result.error}
                          </p>
                        )}
                      </div>
                      <div>
                        {result.status === "pending" && (
                          <Badge variant="secondary">Pending</Badge>
                        )}
                        {result.status === "posting" && (
                          <Badge variant="default" className="gap-1">
                            <Loader2 className="h-3 w-3 animate-spin" />
                            Posting
                          </Badge>
                        )}
                        {result.status === "success" && (
                          <Badge variant="outline" className="gap-1 text-green-500 border-green-500/30">
                            <CheckCircle2 className="h-3 w-3" />
                            Success
                          </Badge>
                        )}
                        {result.status === "failed" && (
                          <Badge variant="outline" className="gap-1 text-destructive border-destructive/30">
                            <AlertCircle className="h-3 w-3" />
                            Failed
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {!isPosting && failedCount > 0 && (
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => {
                      toast({
                        title: "Retry not implemented",
                        description: "Real OAuth integration required for retry functionality",
                      });
                    }}
                  >
                    Retry Failed ({failedCount})
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <Card className="h-full flex items-center justify-center min-h-[400px]">
              <CardContent className="text-center py-12">
                <Send className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">Ready to Distribute</h3>
                <p className="text-muted-foreground max-w-sm">
                  Enter a clip URL, select your accounts, and click distribute 
                  to post to multiple platforms at once.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
