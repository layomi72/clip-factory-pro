import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Sidebar } from "@/components/Sidebar";
import { Dashboard } from "@/components/Dashboard";
import { AccountsManager } from "@/components/AccountsManager";
import { ScheduleManager } from "@/components/ScheduleManager";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2 } from "lucide-react";

const Index = () => {
  const [activeTab, setActiveTab] = useState("dashboard");
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      
      <main className="ml-64 min-h-screen p-8">
        <div className="mx-auto max-w-7xl">
          {activeTab === "dashboard" && <Dashboard />}
          {activeTab === "accounts" && <AccountsManager />}
          {activeTab === "schedule" && <ScheduleManager />}
          {!["dashboard", "accounts", "schedule"].includes(activeTab) && (
            <div className="flex h-[60vh] items-center justify-center">
              <div className="text-center">
                <div className="mb-4 text-6xl">🚀</div>
                <h2 className="text-2xl font-bold text-foreground mb-2">
                  {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}
                </h2>
                <p className="text-muted-foreground">
                  This section is coming soon
                </p>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Index;
