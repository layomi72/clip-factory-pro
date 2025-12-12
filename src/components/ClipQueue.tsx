import { Clock, CheckCircle2, Loader2, Play } from "lucide-react";
import { cn } from "@/lib/utils";

interface Clip {
  id: string;
  title: string;
  duration: string;
  thumbnail: string;
  status: "processing" | "ready" | "distributed";
  platforms: number;
}

const clips: Clip[] = [
  {
    id: "1",
    title: "Epic Gaming Moment #47",
    duration: "0:58",
    thumbnail: "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=200&h=120&fit=crop",
    status: "distributed",
    platforms: 120,
  },
  {
    id: "2",
    title: "Funny Reaction Compilation",
    duration: "1:24",
    thumbnail: "https://images.unsplash.com/photo-1493711662062-fa541f7f3d24?w=200&h=120&fit=crop",
    status: "ready",
    platforms: 0,
  },
  {
    id: "3",
    title: "Tutorial Highlight - Part 3",
    duration: "2:15",
    thumbnail: "https://images.unsplash.com/photo-1560419015-7c427e8ae5ba?w=200&h=120&fit=crop",
    status: "processing",
    platforms: 0,
  },
  {
    id: "4",
    title: "Best Plays This Week",
    duration: "1:45",
    thumbnail: "https://images.unsplash.com/photo-1511512578047-dfb367046420?w=200&h=120&fit=crop",
    status: "ready",
    platforms: 0,
  },
];

const statusConfig = {
  processing: {
    icon: Loader2,
    label: "Processing",
    color: "text-yellow-400",
    bg: "bg-yellow-400/10",
    animate: "animate-spin",
  },
  ready: {
    icon: Play,
    label: "Ready",
    color: "text-primary",
    bg: "bg-primary/10",
    animate: "",
  },
  distributed: {
    icon: CheckCircle2,
    label: "Distributed",
    color: "text-green-400",
    bg: "bg-green-400/10",
    animate: "",
  },
};

export function ClipQueue() {
  return (
    <div className="rounded-xl bg-card border border-border p-6 animate-slide-up">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10">
            <Clock className="h-5 w-5 text-accent" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-foreground">Clip Queue</h2>
            <p className="text-sm text-muted-foreground">{clips.length} clips in queue</p>
          </div>
        </div>
        <button className="text-sm font-medium text-primary hover:underline">View All</button>
      </div>

      <div className="space-y-3">
        {clips.map((clip) => {
          const status = statusConfig[clip.status];
          const StatusIcon = status.icon;

          return (
            <div
              key={clip.id}
              className="group flex items-center gap-4 rounded-lg bg-secondary/30 p-3 transition-all hover:bg-secondary/50 cursor-pointer"
            >
              <div className="relative h-16 w-28 flex-shrink-0 overflow-hidden rounded-lg">
                <img
                  src={clip.thumbnail}
                  alt={clip.title}
                  className="h-full w-full object-cover transition-transform group-hover:scale-105"
                />
                <div className="absolute bottom-1 right-1 rounded bg-black/70 px-1.5 py-0.5 text-xs font-medium text-white">
                  {clip.duration}
                </div>
              </div>

              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-foreground truncate">{clip.title}</h3>
                <div className="mt-1 flex items-center gap-2">
                  <span
                    className={cn(
                      "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium",
                      status.bg,
                      status.color
                    )}
                  >
                    <StatusIcon className={cn("h-3 w-3", status.animate)} />
                    {status.label}
                  </span>
                  {clip.platforms > 0 && (
                    <span className="text-xs text-muted-foreground">
                      Posted to {clip.platforms} pages
                    </span>
                  )}
                </div>
              </div>

              {clip.status === "ready" && (
                <button className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground opacity-0 transition-opacity group-hover:opacity-100">
                  Distribute
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
