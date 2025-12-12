import { 
  LayoutDashboard, 
  Video, 
  Users, 
  Scissors, 
  Send, 
  Settings,
  Zap
} from "lucide-react";
import { cn } from "@/lib/utils";

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const navItems = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "streams", label: "Import Streams", icon: Video },
  { id: "clips", label: "Clips", icon: Scissors },
  { id: "accounts", label: "Accounts", icon: Users },
  { id: "distribute", label: "Distribute", icon: Send },
  { id: "settings", label: "Settings", icon: Settings },
];

export function Sidebar({ activeTab, setActiveTab }: SidebarProps) {
  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-64 bg-sidebar border-r border-border">
      <div className="flex h-full flex-col">
        {/* Logo */}
        <div className="flex items-center gap-3 px-6 py-6 border-b border-border">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-blue-500">
            <Zap className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="text-xl font-bold gradient-text">ClipFlow</span>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 px-3 py-4">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={cn(
                  "flex w-full items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-all duration-200",
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                )}
              >
                <Icon className="h-5 w-5" />
                {item.label}
                {isActive && (
                  <div className="ml-auto h-2 w-2 rounded-full bg-primary animate-pulse-glow" />
                )}
              </button>
            );
          })}
        </nav>

        {/* Pro Badge */}
        <div className="p-4">
          <div className="rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 p-4 border border-primary/20">
            <p className="text-sm font-semibold text-foreground mb-1">Upgrade to Pro</p>
            <p className="text-xs text-muted-foreground mb-3">Unlock unlimited clips & accounts</p>
            <button className="w-full rounded-lg bg-gradient-to-r from-primary to-blue-500 px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 transition-opacity">
              Upgrade Now
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
}
