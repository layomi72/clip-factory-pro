import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAddConnectedAccount, Platform } from "@/hooks/useConnectedAccounts";
import { Loader2, ExternalLink, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

const platformConfig = {
  youtube: {
    name: "YouTube",
    icon: "bg-youtube",
    hasOAuth: false,
    instructions: "Enter your YouTube channel username and ID to connect your account.",
  },
  tiktok: {
    name: "TikTok",
    icon: "bg-tiktok",
    hasOAuth: true,
    instructions: "Connect your TikTok account using OAuth for automatic posting.",
  },
  instagram: {
    name: "Instagram",
    icon: "bg-gradient-to-br from-purple-500 via-pink-500 to-orange-400",
    hasOAuth: false,
    instructions: "Enter your Instagram username and account ID to connect your account.",
  },
  twitch: {
    name: "Twitch",
    icon: "bg-twitch",
    hasOAuth: false,
    instructions: "Enter your Twitch username and user ID to connect your account.",
  },
};

interface ConnectAccountDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  platform: Platform | null;
}

export function ConnectAccountDialog({ open, onOpenChange, platform }: ConnectAccountDialogProps) {
  const [username, setUsername] = useState("");
  const [userId, setUserId] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [isConnecting, setIsConnecting] = useState(false);
  const addAccount = useAddConnectedAccount();
  const { user } = useAuth();

  if (!platform) return null;

  const config = platformConfig[platform];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    await addAccount.mutateAsync({
      platform,
      platform_user_id: userId,
      platform_username: username,
      platform_avatar_url: avatarUrl || null,
    });

    // Reset form and close dialog
    setUsername("");
    setUserId("");
    setAvatarUrl("");
    onOpenChange(false);
  };

  const handleOAuthConnect = async () => {
    if (!user) {
      toast.error("Please log in to connect your account");
      return;
    }

    if (platform === "tiktok") {
      setIsConnecting(true);
      try {
        const { data, error } = await supabase.functions.invoke("tiktok-oauth", {
          body: { userId: user.id },
        });

        if (error) {
          console.error("OAuth error:", error);
          toast.error("Failed to start OAuth flow");
          return;
        }

        if (data?.authUrl) {
          // Redirect to TikTok authorization
          window.location.href = data.authUrl;
        }
      } catch (err) {
        console.error("OAuth error:", err);
        toast.error("Failed to connect to TikTok");
      } finally {
        setIsConnecting(false);
      }
    } else {
      // For platforms without OAuth, show a message
      toast.info(`OAuth for ${config.name} coming soon! Use manual entry for now.`);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <div className={cn("flex h-8 w-8 items-center justify-center rounded-lg text-white", config.icon)}>
              {platform === "youtube" && (
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                </svg>
              )}
              {platform === "tiktok" && (
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z" />
                </svg>
              )}
              {platform === "instagram" && (
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 0C8.74 0 8.333.015 7.053.072 5.775.132 4.905.333 4.14.63c-.789.306-1.459.717-2.126 1.384S.935 3.35.63 4.14C.333 4.905.131 5.775.072 7.053.012 8.333 0 8.74 0 12s.015 3.667.072 4.947c.06 1.277.261 2.148.558 2.913.306.788.717 1.459 1.384 2.126.667.666 1.336 1.079 2.126 1.384.766.296 1.636.499 2.913.558C8.333 23.988 8.74 24 12 24s3.667-.015 4.947-.072c1.277-.06 2.148-.262 2.913-.558.788-.306 1.459-.718 2.126-1.384.666-.667 1.079-1.335 1.384-2.126.296-.765.499-1.636.558-2.913.06-1.28.072-1.687.072-4.947s-.015-3.667-.072-4.947c-.06-1.277-.262-2.149-.558-2.913-.306-.789-.718-1.459-1.384-2.126C21.319 1.347 20.651.935 19.86.63c-.765-.297-1.636-.499-2.913-.558C15.667.012 15.26 0 12 0zm0 2.16c3.203 0 3.585.016 4.85.071 1.17.055 1.805.249 2.227.415.562.217.96.477 1.382.896.419.42.679.819.896 1.381.164.422.36 1.057.413 2.227.057 1.266.07 1.646.07 4.85s-.015 3.585-.074 4.85c-.061 1.17-.256 1.805-.421 2.227-.224.562-.479.96-.899 1.382-.419.419-.824.679-1.38.896-.42.164-1.065.36-2.235.413-1.274.057-1.649.07-4.859.07-3.211 0-3.586-.015-4.859-.074-1.171-.061-1.816-.256-2.236-.421-.569-.224-.96-.479-1.379-.899-.421-.419-.69-.824-.9-1.38-.165-.42-.359-1.065-.42-2.235-.045-1.26-.061-1.649-.061-4.844 0-3.196.016-3.586.061-4.861.061-1.17.255-1.814.42-2.234.21-.57.479-.96.9-1.381.419-.419.81-.689 1.379-.898.42-.166 1.051-.361 2.221-.421 1.275-.045 1.65-.06 4.859-.06l.045.03zm0 3.678c-3.405 0-6.162 2.76-6.162 6.162 0 3.405 2.76 6.162 6.162 6.162 3.405 0 6.162-2.76 6.162-6.162 0-3.405-2.757-6.162-6.162-6.162zM12 16c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4zm7.846-10.405c0 .795-.646 1.44-1.44 1.44-.795 0-1.44-.646-1.44-1.44 0-.794.646-1.439 1.44-1.439.793-.001 1.44.645 1.44 1.439z" />
                </svg>
              )}
              {platform === "twitch" && (
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M11.571 4.714h1.715v5.143H11.57zm4.715 0H18v5.143h-1.714zM6 0L1.714 4.286v15.428h5.143V24l4.286-4.286h3.428L22.286 12V0zm14.571 11.143l-3.428 3.428h-3.429l-3 3v-3H6.857V1.714h13.714Z" />
                </svg>
              )}
            </div>
            Connect {config.name}
          </DialogTitle>
          <DialogDescription>
            {config.instructions}
          </DialogDescription>
        </DialogHeader>

        {config.hasOAuth ? (
          <Alert className="bg-primary/10 border-primary/20">
            <AlertCircle className="h-4 w-4 text-primary" />
            <AlertDescription className="text-sm">
              Click "Connect with OAuth" to securely authorize your {config.name} account.
            </AlertDescription>
          </Alert>
        ) : (
          <Alert className="bg-muted/50">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-sm">
              OAuth for {config.name} coming soon. For now, manually add your account details below.
            </AlertDescription>
          </Alert>
        )}

        {config.hasOAuth ? (
          <div className="pt-4">
            <Button
              type="button"
              variant="gradient"
              className="w-full gap-2"
              onClick={handleOAuthConnect}
              disabled={isConnecting}
            >
              {isConnecting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <ExternalLink className="h-4 w-4" />
              )}
              Connect with OAuth
            </Button>
            <p className="text-xs text-muted-foreground text-center mt-3">
              Or add manually below
            </p>
          </div>
        ) : null}

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="username">Username / Channel Name</Label>
            <Input
              id="username"
              placeholder={`Your ${config.name} username`}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="userId">Account / Channel ID</Label>
            <Input
              id="userId"
              placeholder={`Your ${config.name} ID`}
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="avatarUrl">Profile Picture URL (optional)</Label>
            <Input
              id="avatarUrl"
              placeholder="https://..."
              value={avatarUrl}
              onChange={(e) => setAvatarUrl(e.target.value)}
            />
          </div>

          <div className="pt-4">
            <Button
              type="submit"
              variant={config.hasOAuth ? "outline" : "gradient"}
              className="w-full"
              disabled={addAccount.isPending}
            >
              {addAccount.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Add Manually
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
