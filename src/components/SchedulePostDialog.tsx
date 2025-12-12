import { useState, useEffect } from "react";
import { format } from "date-fns";
import { Calendar as CalendarIcon, Clock, Link, MessageSquare } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useConnectedAccounts } from "@/hooks/useConnectedAccounts";
import { useAddScheduledPost } from "@/hooks/useScheduledPosts";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface SchedulePostDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultClipUrl?: string;
  defaultStartTime?: number;
  defaultEndTime?: number;
}

export function SchedulePostDialog({ 
  open, 
  onOpenChange, 
  defaultClipUrl,
  defaultStartTime,
  defaultEndTime 
}: SchedulePostDialogProps) {
  const [clipUrl, setClipUrl] = useState(defaultClipUrl || "");
  const [caption, setCaption] = useState("");
  const [selectedAccountId, setSelectedAccountId] = useState("");
  const [date, setDate] = useState<Date>();
  const [time, setTime] = useState("12:00");

  // Update clipUrl when defaultClipUrl changes
  useEffect(() => {
    if (defaultClipUrl) {
      setClipUrl(defaultClipUrl);
    }
  }, [defaultClipUrl]);

  const { data: accounts = [] } = useConnectedAccounts();
  const addScheduledPost = useAddScheduledPost();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!clipUrl || !selectedAccountId || !date) {
      toast({
        title: "Missing fields",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    const [hours, minutes] = time.split(":").map(Number);
    const scheduledAt = new Date(date);
    scheduledAt.setHours(hours, minutes, 0, 0);

    if (scheduledAt <= new Date()) {
      toast({
        title: "Invalid time",
        description: "Scheduled time must be in the future",
        variant: "destructive",
      });
      return;
    }

    try {
      await addScheduledPost.mutateAsync({
        connected_account_id: selectedAccountId,
        clip_url: clipUrl,
        caption: caption || undefined,
        scheduled_at: scheduledAt.toISOString(),
      });

      toast({
        title: "Post scheduled",
        description: `Your clip will be posted on ${format(scheduledAt, "PPP 'at' p")}`,
      });

      setClipUrl("");
      setCaption("");
      setSelectedAccountId("");
      setDate(undefined);
      setTime("12:00");
      onOpenChange(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to schedule post. Please try again.",
        variant: "destructive",
      });
    }
  };

  const getPlatformIcon = (platform: string) => {
    const icons: Record<string, string> = {
      youtube: "🎬",
      tiktok: "🎵",
      instagram: "📸",
    };
    return icons[platform] || "📱";
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Schedule a Post</DialogTitle>
          <DialogDescription>
            Choose when to automatically post your clip to a connected account.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <label className="text-sm font-medium flex items-center gap-2">
              <Link className="h-4 w-4" />
              Clip URL
            </label>
            <Input
              placeholder="https://example.com/clip.mp4"
              value={clipUrl}
              onChange={(e) => setClipUrl(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Account</label>
            <Select value={selectedAccountId} onValueChange={setSelectedAccountId}>
              <SelectTrigger>
                <SelectValue placeholder="Select an account" />
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
              <p className="text-sm text-muted-foreground">
                No connected accounts. Connect an account first.
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2">
                <CalendarIcon className="h-4 w-4" />
                Date
              </label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !date && "text-muted-foreground"
                    )}
                  >
                    {date ? format(date, "PPP") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={setDate}
                    disabled={(date) => date < new Date()}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Time
              </label>
              <Input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              Caption (optional)
            </label>
            <Textarea
              placeholder="Write a caption for your post..."
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={addScheduledPost.isPending}>
              {addScheduledPost.isPending ? "Scheduling..." : "Schedule Post"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
