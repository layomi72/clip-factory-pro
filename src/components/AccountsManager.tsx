import { useState } from "react";
import { useConnectedAccounts, useRemoveConnectedAccount, Platform } from "@/hooks/useConnectedAccounts";
import { ConnectAccountDialog } from "./ConnectAccountDialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, ExternalLink, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

const platformConfig = {
  youtube: {
    name: "YouTube",
    bg: "bg-youtube/10",
    border: "border-youtube/30",
    icon: "bg-youtube",
    color: "text-youtube",
  },
  tiktok: {
    name: "TikTok",
    bg: "bg-tiktok/10",
    border: "border-tiktok/30",
    icon: "bg-tiktok",
    color: "text-tiktok",
  },
  instagram: {
    name: "Instagram",
    bg: "bg-instagram/10",
    border: "border-instagram/30",
    icon: "bg-gradient-to-br from-purple-500 via-pink-500 to-orange-400",
    color: "text-pink-500",
  },
  twitch: {
    name: "Twitch",
    bg: "bg-twitch/10",
    border: "border-twitch/30",
    icon: "bg-twitch",
    color: "text-twitch",
  },
};

const YouTubeIcon = () => (
  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
  </svg>
);

const TikTokIcon = () => (
  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z" />
  </svg>
);

const InstagramIcon = () => (
  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 0C8.74 0 8.333.015 7.053.072 5.775.132 4.905.333 4.14.63c-.789.306-1.459.717-2.126 1.384S.935 3.35.63 4.14C.333 4.905.131 5.775.072 7.053.012 8.333 0 8.74 0 12s.015 3.667.072 4.947c.06 1.277.261 2.148.558 2.913.306.788.717 1.459 1.384 2.126.667.666 1.336 1.079 2.126 1.384.766.296 1.636.499 2.913.558C8.333 23.988 8.74 24 12 24s3.667-.015 4.947-.072c1.277-.06 2.148-.262 2.913-.558.788-.306 1.459-.718 2.126-1.384.666-.667 1.079-1.335 1.384-2.126.296-.765.499-1.636.558-2.913.06-1.28.072-1.687.072-4.947s-.015-3.667-.072-4.947c-.06-1.277-.262-2.149-.558-2.913-.306-.789-.718-1.459-1.384-2.126C21.319 1.347 20.651.935 19.86.63c-.765-.297-1.636-.499-2.913-.558C15.667.012 15.26 0 12 0zm0 2.16c3.203 0 3.585.016 4.85.071 1.17.055 1.805.249 2.227.415.562.217.96.477 1.382.896.419.42.679.819.896 1.381.164.422.36 1.057.413 2.227.057 1.266.07 1.646.07 4.85s-.015 3.585-.074 4.85c-.061 1.17-.256 1.805-.421 2.227-.224.562-.479.96-.899 1.382-.419.419-.824.679-1.38.896-.42.164-1.065.36-2.235.413-1.274.057-1.649.07-4.859.07-3.211 0-3.586-.015-4.859-.074-1.171-.061-1.816-.256-2.236-.421-.569-.224-.96-.479-1.379-.899-.421-.419-.69-.824-.9-1.38-.165-.42-.359-1.065-.42-2.235-.045-1.26-.061-1.649-.061-4.844 0-3.196.016-3.586.061-4.861.061-1.17.255-1.814.42-2.234.21-.57.479-.96.9-1.381.419-.419.81-.689 1.379-.898.42-.166 1.051-.361 2.221-.421 1.275-.045 1.65-.06 4.859-.06l.045.03zm0 3.678c-3.405 0-6.162 2.76-6.162 6.162 0 3.405 2.76 6.162 6.162 6.162 3.405 0 6.162-2.76 6.162-6.162 0-3.405-2.757-6.162-6.162-6.162zM12 16c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4zm7.846-10.405c0 .795-.646 1.44-1.44 1.44-.795 0-1.44-.646-1.44-1.44 0-.794.646-1.439 1.44-1.439.793-.001 1.44.645 1.44 1.439z" />
  </svg>
);

const TwitchIcon = () => (
  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
    <path d="M11.571 4.714h1.715v5.143H11.57zm4.715 0H18v5.143h-1.714zM6 0L1.714 4.286v15.428h5.143V24l4.286-4.286h3.428L22.286 12V0zm14.571 11.143l-3.428 3.428h-3.429l-3 3v-3H6.857V1.714h13.714Z" />
  </svg>
);

const getPlatformIcon = (platform: Platform) => {
  switch (platform) {
    case "youtube": return <YouTubeIcon />;
    case "tiktok": return <TikTokIcon />;
    case "instagram": return <InstagramIcon />;
    case "twitch": return <TwitchIcon />;
  }
};

export function AccountsManager() {
  const [connectDialogOpen, setConnectDialogOpen] = useState(false);
  const [selectedPlatform, setSelectedPlatform] = useState<Platform | null>(null);
  const { data: accounts, isLoading } = useConnectedAccounts();
  const removeAccount = useRemoveConnectedAccount();

  const platforms: Platform[] = ["youtube", "tiktok", "instagram", "twitch"];

  const getAccountsByPlatform = (platform: Platform) => 
    accounts?.filter(a => a.platform === platform) || [];

  const handleConnectClick = (platform: Platform) => {
    setSelectedPlatform(platform);
    setConnectDialogOpen(true);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Connected Accounts</h1>
        <p className="mt-1 text-muted-foreground">
          Manage your social media accounts across all platforms
        </p>
      </div>

      {/* Platform Sections */}
      {platforms.map((platform) => {
        const config = platformConfig[platform];
        const platformAccounts = getAccountsByPlatform(platform);

        return (
          <div key={platform} className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={cn("flex h-10 w-10 items-center justify-center rounded-lg text-white", config.icon)}>
                  {getPlatformIcon(platform)}
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-foreground">{config.name}</h2>
                  <p className="text-sm text-muted-foreground">
                    {platformAccounts.length} account{platformAccounts.length !== 1 ? "s" : ""} connected
                  </p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleConnectClick(platform)}
                className="gap-2"
              >
                <Plus className="h-4 w-4" />
                Connect Account
              </Button>
            </div>

            {platformAccounts.length > 0 ? (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {platformAccounts.map((account) => (
                  <div
                    key={account.id}
                    className={cn(
                      "group relative rounded-xl border p-4 transition-all hover:scale-[1.02]",
                      config.bg,
                      config.border
                    )}
                  >
                    <div className="flex items-center gap-3">
                      {account.platform_avatar_url ? (
                        <img
                          src={account.platform_avatar_url}
                          alt={account.platform_username}
                          className="h-12 w-12 rounded-full object-cover"
                        />
                      ) : (
                        <div className={cn("flex h-12 w-12 items-center justify-center rounded-full text-white", config.icon)}>
                          {getPlatformIcon(platform)}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-foreground truncate">
                          {account.platform_username}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          ID: {account.platform_user_id}
                        </p>
                      </div>
                    </div>
                    <div className="mt-3 flex items-center justify-between">
                      <Badge variant="secondary" className="text-xs">
                        Connected
                      </Badge>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => removeAccount.mutate(account.id)}
                          disabled={removeAccount.isPending}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className={cn("rounded-xl border border-dashed p-8 text-center", config.border)}>
                <div className={cn("mx-auto flex h-12 w-12 items-center justify-center rounded-full text-white mb-3", config.icon)}>
                  {getPlatformIcon(platform)}
                </div>
                <p className="text-muted-foreground">No {config.name} accounts connected yet</p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleConnectClick(platform)}
                  className="mt-3 gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Connect your first account
                </Button>
              </div>
            )}
          </div>
        );
      })}

      <ConnectAccountDialog
        open={connectDialogOpen}
        onOpenChange={setConnectDialogOpen}
        platform={selectedPlatform}
      />
    </div>
  );
}
