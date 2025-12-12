import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Sidebar } from "@/components/Sidebar";
import { Dashboard } from "@/components/Dashboard";
import { AccountsManager } from "@/components/AccountsManager";
import { ScheduleManager } from "@/components/ScheduleManager";
import { ClipEditor } from "@/components/ClipEditor";
import { StreamImporter } from "@/components/StreamImporter";
import { Settings } from "@/components/Settings";
import { Distribute } from "@/components/Distribute";
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

  const handleScheduleFromEditor = (clipData: { url: string; startTime: number; endTime: number }) => {
    setActiveTab("schedule");
  };

  return (
    <div className="min-h-screen bg-background">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      
      <main className="ml-64 min-h-screen p-8">
        <div className="mx-auto max-w-7xl">
          {activeTab === "dashboard" && <Dashboard />}
          {activeTab === "accounts" && <AccountsManager />}
          {activeTab === "schedule" && <ScheduleManager />}
          {activeTab === "clips" && <ClipEditor onSchedule={handleScheduleFromEditor} />}
          {activeTab === "streams" && <StreamImporter />}
          {activeTab === "settings" && <Settings />}
          {activeTab === "distribute" && <Distribute />}
        </div>
      </main>
    </div>
  );
};

export default Index;
