import { useState } from "react";
import { Sidebar } from "@/components/Sidebar";
import { Dashboard } from "@/components/Dashboard";

const Index = () => {
  const [activeTab, setActiveTab] = useState("dashboard");

  return (
    <div className="min-h-screen bg-background">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      
      <main className="ml-64 min-h-screen p-8">
        <div className="mx-auto max-w-7xl">
          {activeTab === "dashboard" && <Dashboard />}
          {activeTab !== "dashboard" && (
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
