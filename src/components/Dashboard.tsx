import { useState } from "react";
import { format } from "date-fns";
import { Video, Scissors, Users, TrendingUp, Eye, UserPlus, Calendar, Clock, Plus } from "lucide-react";
import { StatsCard } from "./StatsCard";
import { PlatformCard } from "./PlatformCard";
import { StreamImporter } from "./StreamImporter";
import { ClipQueue } from "./ClipQueue";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useConnectedAccounts } from "@/hooks/useConnectedAccounts";
import { useScheduledPosts } from "@/hooks/useScheduledPosts";
import { SchedulePostDialog } from "./SchedulePostDialog";

// Platform icons as simple components
const YouTubeIcon = () => (
  <svg className="h-7 w-7" viewBox="0 0 24 24" fill="currentColor">
    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
  </svg>
);

const TwitchIcon = () => (
  <svg className="h-7 w-7" viewBox="0 0 24 24" fill="currentColor">
    <path d="M11.571 4.714h1.715v5.143H11.57zm4.715 0H18v5.143h-1.714zM6 0L1.714 4.286v15.428h5.143V24l4.286-4.286h3.428L22.286 12V0zm14.571 11.143l-3.428 3.428h-3.429l-3 3v-3H6.857V1.714h13.714Z" />
  </svg>
);

const TikTokIcon = () => (
  <svg className="h-7 w-7" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z" />
  </svg>
);

const InstagramIcon = () => (
  <svg className="h-7 w-7" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 0C8.74 0 8.333.015 7.053.072 5.775.132 4.905.333 4.14.63c-.789.306-1.459.717-2.126 1.384S.935 3.35.63 4.14C.333 4.905.131 5.775.072 7.053.012 8.333 0 8.74 0 12s.015 3.667.072 4.947c.06 1.277.261 2.148.558 2.913.306.788.717 1.459 1.384 2.126.667.666 1.336 1.079 2.126 1.384.766.296 1.636.499 2.913.558C8.333 23.988 8.74 24 12 24s3.667-.015 4.947-.072c1.277-.06 2.148-.262 2.913-.558.788-.306 1.459-.718 2.126-1.384.666-.667 1.079-1.335 1.384-2.126.296-.765.499-1.636.558-2.913.06-1.28.072-1.687.072-4.947s-.015-3.667-.072-4.947c-.06-1.277-.262-2.149-.558-2.913-.306-.789-.718-1.459-1.384-2.126C21.319 1.347 20.651.935 19.86.63c-.765-.297-1.636-.499-2.913-.558C15.667.012 15.26 0 12 0zm0 2.16c3.203 0 3.585.016 4.85.071 1.17.055 1.805.249 2.227.415.562.217.96.477 1.382.896.419.42.679.819.896 1.381.164.422.36 1.057.413 2.227.057 1.266.07 1.646.07 4.85s-.015 3.585-.074 4.85c-.061 1.17-.256 1.805-.421 2.227-.224.562-.479.96-.899 1.382-.419.419-.824.679-1.38.896-.42.164-1.065.36-2.235.413-1.274.057-1.649.07-4.859.07-3.211 0-3.586-.015-4.859-.074-1.171-.061-1.816-.256-2.236-.421-.569-.224-.96-.479-1.379-.899-.421-.419-.69-.824-.9-1.38-.165-.42-.359-1.065-.42-2.235-.045-1.26-.061-1.649-.061-4.844 0-3.196.016-3.586.061-4.861.061-1.17.255-1.814.42-2.234.21-.57.479-.96.9-1.381.419-.419.81-.689 1.379-.898.42-.166 1.051-.361 2.221-.421 1.275-.045 1.65-.06 4.859-.06l.045.03zm0 3.678c-3.405 0-6.162 2.76-6.162 6.162 0 3.405 2.76 6.162 6.162 6.162 3.405 0 6.162-2.76 6.162-6.162 0-3.405-2.757-6.162-6.162-6.162zM12 16c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4zm7.846-10.405c0 .795-.646 1.44-1.44 1.44-.795 0-1.44-.646-1.44-1.44 0-.794.646-1.439 1.44-1.439.793-.001 1.44.645 1.44 1.439z" />
  </svg>
);

// Time period labels
const periodLabels: Record<string, { label: string; changeLabel: string }> = {
  today: { label: "Today", changeLabel: "vs yesterday" },
  week: { label: "This Week", changeLabel: "vs last week" },
  month: { label: "This Month", changeLabel: "vs last month" },
  year: { label: "This Year", changeLabel: "vs last year" },
  allTime: { label: "All Time", changeLabel: "total" },
};

const formatNumber = (num: number) => {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return num.toString();
};

export function Dashboard() {
  const [timePeriod, setTimePeriod] = useState<string>("month");
  const [scheduleDialogOpen, setScheduleDialogOpen] = useState(false);
  const { data: accounts = [] } = useConnectedAccounts();
  const { data: scheduledPosts = [] } = useScheduledPosts();

  // Calculate accounts by platform
  const accountsByPlatform = accounts.reduce((acc, account) => {
    acc[account.platform] = (acc[account.platform] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const period = periodLabels[timePeriod];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
        <p className="mt-1 text-muted-foreground">
          Manage your streams and distribute clips across {accounts.length} accounts
        </p>
      </div>

      {/* Combined Stats Overview */}
      <Card className="bg-gradient-to-br from-primary/10 via-background to-accent/10 border-primary/20">
        <CardHeader className="pb-2">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <CardTitle className="text-lg">Combined Account Stats</CardTitle>
            <Tabs value={timePeriod} onValueChange={setTimePeriod}>
              <TabsList className="h-9">
                <TabsTrigger value="today" className="text-xs px-3">Today</TabsTrigger>
                <TabsTrigger value="week" className="text-xs px-3">Week</TabsTrigger>
                <TabsTrigger value="month" className="text-xs px-3">Month</TabsTrigger>
                <TabsTrigger value="year" className="text-xs px-3">Year</TabsTrigger>
                <TabsTrigger value="allTime" className="text-xs px-3">All Time</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
          <p className="text-sm text-muted-foreground">{period.label} statistics</p>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                <Eye className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">—</p>
                <p className="text-sm text-muted-foreground">Total Views</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-500/10">
                <UserPlus className="h-6 w-6 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">—</p>
                <p className="text-sm text-muted-foreground">
                  {timePeriod === "allTime" ? "Total Followers" : "New Followers"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500/10">
                <Users className="h-6 w-6 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{accounts.length}</p>
                <p className="text-sm text-muted-foreground">Connected Accounts</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-500/10">
                <TrendingUp className="h-6 w-6 text-purple-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">—</p>
                <p className="text-sm text-muted-foreground">Avg Views/Account</p>
              </div>
            </div>
          </div>

          {/* Period comparison note */}
          {timePeriod !== "allTime" && (
            <p className="text-xs text-muted-foreground mt-4 text-center">
              Stats will update once platform APIs are connected
            </p>
          )}

          {/* Platform breakdown */}
          {accounts.length > 0 && (
            <div className="mt-6 pt-6 border-t border-border">
              <p className="text-sm font-medium mb-3">Breakdown by Platform</p>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {Object.entries(accountsByPlatform).map(([platform, count]) => (
                  <div 
                    key={platform}
                    className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50"
                  >
                    <span className="text-xl">
                      {platform === "youtube" && "🎬"}
                      {platform === "tiktok" && "🎵"}
                      {platform === "instagram" && "📸"}
                      {platform === "twitch" && "🎮"}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium capitalize text-sm">{platform}</p>
                      <p className="text-xs text-muted-foreground">
                        {count} account{count !== 1 ? "s" : ""}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Total Streams"
          value="0"
          change="—"
          trend="up"
          icon={Video}
        />
        <StatsCard
          title="Clips Generated"
          value="0"
          change="—"
          trend="up"
          icon={Scissors}
        />
        <StatsCard
          title="Connected Accounts"
          value={accounts.length.toString()}
          change={accounts.length > 0 ? `${accounts.length} connected` : "None yet"}
          trend="up"
          icon={Users}
        />
        <StatsCard
          title="Scheduled Posts"
          value={scheduledPosts.filter(p => p.status === "pending").length.toString()}
          change={`${scheduledPosts.filter(p => p.status === "posted").length} posted`}
          trend="up"
          icon={TrendingUp}
        />
      </div>

      {/* Stream Importer */}
      <StreamImporter />

      {/* Platforms Grid */}
      <div>
        <h2 className="mb-4 text-xl font-semibold text-foreground">Connected Platforms</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <PlatformCard
            name="YouTube"
            icon={<YouTubeIcon />}
            accounts={accountsByPlatform.youtube || 0}
            clips={0}
            platform="youtube"
          />
          <PlatformCard
            name="TikTok"
            icon={<TikTokIcon />}
            accounts={accountsByPlatform.tiktok || 0}
            clips={0}
            platform="tiktok"
          />
          <PlatformCard
            name="Instagram"
            icon={<InstagramIcon />}
            accounts={accountsByPlatform.instagram || 0}
            clips={0}
            platform="instagram"
          />
          <PlatformCard
            name="Twitch"
            icon={<TwitchIcon />}
            accounts={accountsByPlatform.twitch || 0}
            clips={0}
            platform="twitch"
          />
        </div>
      </div>

      {/* Per-Account Scheduling Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl">Account Scheduling</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                View and schedule uploads for each account individually
              </p>
            </div>
            <Button onClick={() => setScheduleDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Schedule New
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {accounts.length === 0 ? (
            <div className="text-center py-8">
              <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No connected accounts yet</p>
              <p className="text-sm text-muted-foreground mt-1">
                Connect your social media accounts to start scheduling posts
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {accounts.map((account) => {
                const accountPosts = scheduledPosts.filter(
                  (p) => p.connected_account_id === account.id
                );
                const pendingPosts = accountPosts.filter((p) => p.status === "pending");
                const postedPosts = accountPosts.filter((p) => p.status === "posted");

                return (
                  <div
                    key={account.id}
                    className="border border-border rounded-lg p-4 bg-secondary/20"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">
                          {account.platform === "youtube" && "🎬"}
                          {account.platform === "tiktok" && "🎵"}
                          {account.platform === "instagram" && "📸"}
                          {account.platform === "twitch" && "🎮"}
                        </span>
                        <div>
                          <p className="font-semibold">{account.platform_username}</p>
                          <p className="text-sm text-muted-foreground capitalize">{account.platform}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 text-sm">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setScheduleDialogOpen(true)}
                        >
                          <Calendar className="h-3 w-3 mr-1" />
                          Schedule
                        </Button>
                      </div>
                    </div>

                    {accountPosts.length > 0 ? (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                          <Badge variant="secondary" className="text-xs">
                            {pendingPosts.length} pending
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {postedPosts.length} posted
                          </Badge>
                        </div>
                        <div className="grid gap-2">
                          {pendingPosts.slice(0, 3).map((post) => (
                            <div
                              key={post.id}
                              className="flex items-center justify-between p-2 rounded bg-background/50 text-sm"
                            >
                              <div className="flex items-center gap-2 min-w-0 flex-1">
                                <Clock className="h-3 w-3 text-muted-foreground shrink-0" />
                                <span className="truncate">{post.caption || "No caption"}</span>
                              </div>
                              <span className="text-xs text-muted-foreground shrink-0 ml-2">
                                {format(new Date(post.scheduled_at), "MMM d, h:mm a")}
                              </span>
                            </div>
                          ))}
                          {pendingPosts.length > 3 && (
                            <p className="text-xs text-muted-foreground text-center">
                              +{pendingPosts.length - 3} more scheduled
                            </p>
                          )}
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground text-center py-2">
                        No scheduled posts for this account
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Clip Queue */}
      <ClipQueue />

      <SchedulePostDialog 
        open={scheduleDialogOpen} 
        onOpenChange={setScheduleDialogOpen}
      />
    </div>
  );
}
