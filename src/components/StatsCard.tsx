import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatsCardProps {
  title: string;
  value: string | number;
  change?: string;
  icon: LucideIcon;
  trend?: "up" | "down";
  platform?: "youtube" | "twitch" | "tiktok" | "instagram";
}

export function StatsCard({ title, value, change, icon: Icon, trend, platform }: StatsCardProps) {
  const platformClasses = {
    youtube: "from-youtube/20 to-youtube/5 border-youtube/30",
    twitch: "from-twitch/20 to-twitch/5 border-twitch/30",
    tiktok: "from-tiktok/20 to-tiktok/5 border-tiktok/30",
    instagram: "from-instagram/20 to-instagram/5 border-instagram/30",
  };

  const iconColors = {
    youtube: "text-youtube",
    twitch: "text-twitch",
    tiktok: "text-tiktok",
    instagram: "text-instagram",
  };

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-xl border p-6 transition-all duration-300 hover:scale-[1.02] animate-slide-up",
        platform
          ? `bg-gradient-to-br ${platformClasses[platform]}`
          : "bg-card border-border hover:border-primary/30"
      )}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="mt-2 text-3xl font-bold text-foreground">{value}</p>
          {change && (
            <p
              className={cn(
                "mt-1 text-sm font-medium",
                trend === "up" ? "text-green-400" : "text-red-400"
              )}
            >
              {trend === "up" ? "↑" : "↓"} {change}
            </p>
          )}
        </div>
        <div
          className={cn(
            "flex h-12 w-12 items-center justify-center rounded-xl",
            platform
              ? `bg-${platform}/20 ${iconColors[platform]}`
              : "bg-primary/10 text-primary"
          )}
        >
          <Icon className={cn("h-6 w-6", platform && iconColors[platform])} />
        </div>
      </div>
      
      {/* Decorative gradient */}
      <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-primary/5 blur-2xl" />
    </div>
  );
}
