import { useState } from "react";
import { Link2, Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function StreamImporter() {
  const [url, setUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const detectPlatform = (url: string) => {
    if (url.includes("youtube.com") || url.includes("youtu.be")) return "youtube";
    if (url.includes("twitch.tv")) return "twitch";
    if (url.includes("tiktok.com")) return "tiktok";
    return null;
  };

  const platform = detectPlatform(url);

  const handleImport = () => {
    if (!url) return;
    setIsLoading(true);
    // Simulate import
    setTimeout(() => {
      setIsLoading(false);
      setUrl("");
    }, 2000);
  };

  return (
    <div className="rounded-xl bg-card border border-border p-6 animate-slide-up">
      <div className="flex items-center gap-3 mb-6">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
          <Sparkles className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-foreground">Import Stream</h2>
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
            platform === "youtube" && "border-youtube/50 ring-youtube/30",
            platform === "twitch" && "border-twitch/50 ring-twitch/30",
            platform === "tiktok" && "border-tiktok/50 ring-tiktok/30",
            !platform && "border-border"
          )}
        />
        <div className="absolute right-2 top-1/2 -translate-y-1/2">
          <Button
            onClick={handleImport}
            disabled={!url || isLoading}
            variant="gradient"
            className="h-10"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Processing
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
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
              platform === "youtube" && "bg-youtube",
              platform === "twitch" && "bg-twitch",
              platform === "tiktok" && "bg-tiktok"
            )}
          />
          <span className="text-muted-foreground">
            Detected: <span className="capitalize text-foreground font-medium">{platform}</span>
          </span>
        </div>
      )}
    </div>
  );
}
