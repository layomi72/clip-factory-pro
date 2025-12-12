import { cn } from "@/lib/utils";

interface PlatformCardProps {
  name: string;
  icon: React.ReactNode;
  accounts: number;
  clips: number;
  platform: "youtube" | "twitch" | "tiktok" | "instagram";
}

const platformStyles = {
  youtube: {
    bg: "bg-youtube/10",
    border: "border-youtube/30 hover:border-youtube/50",
    icon: "bg-youtube",
    glow: "shadow-youtube/20",
  },
  twitch: {
    bg: "bg-twitch/10",
    border: "border-twitch/30 hover:border-twitch/50",
    icon: "bg-twitch",
    glow: "shadow-twitch/20",
  },
  tiktok: {
    bg: "bg-tiktok/10",
    border: "border-tiktok/30 hover:border-tiktok/50",
    icon: "bg-tiktok",
    glow: "shadow-tiktok/20",
  },
  instagram: {
    bg: "bg-instagram/10",
    border: "border-instagram/30 hover:border-instagram/50",
    icon: "bg-gradient-to-br from-purple-500 via-pink-500 to-orange-400",
    glow: "shadow-instagram/20",
  },
};

export function PlatformCard({ name, icon, accounts, clips, platform }: PlatformCardProps) {
  const styles = platformStyles[platform];

  return (
    <div
      className={cn(
        "group relative overflow-hidden rounded-xl border p-6 transition-all duration-300 hover:scale-[1.02] cursor-pointer",
        styles.bg,
        styles.border
      )}
    >
      <div className="flex items-center gap-4">
        <div
          className={cn(
            "flex h-14 w-14 items-center justify-center rounded-xl text-white transition-transform group-hover:scale-110",
            styles.icon
          )}
        >
          {icon}
        </div>
        <div>
          <h3 className="text-lg font-semibold text-foreground">{name}</h3>
          <p className="text-sm text-muted-foreground">{accounts} accounts connected</p>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between">
        <div className="flex gap-6">
          <div>
            <p className="text-2xl font-bold text-foreground">{clips}</p>
            <p className="text-xs text-muted-foreground">Clips posted</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-foreground">{accounts}</p>
            <p className="text-xs text-muted-foreground">Active pages</p>
          </div>
        </div>
        <button
          className={cn(
            "rounded-lg px-4 py-2 text-sm font-medium text-white transition-all hover:opacity-90",
            styles.icon
          )}
        >
          Manage
        </button>
      </div>

      {/* Decorative element */}
      <div className={cn("absolute -right-6 -top-6 h-20 w-20 rounded-full blur-3xl opacity-30", styles.icon)} />
    </div>
  );
}
