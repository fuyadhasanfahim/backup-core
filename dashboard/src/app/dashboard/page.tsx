"use client";

import { useEffect, useState } from "react";
import { api, StorageInfo, StorageSnapshot, Backup } from "@/lib/api";
import StorageCards from "@/components/dashboard/StorageCards";
import BackupStatusCard from "@/components/dashboard/BackupStatusCard";
import RecentBackups from "@/components/dashboard/RecentBackups";
import StorageChart from "@/components/dashboard/StorageChart";
import { RefreshCw } from "lucide-react";

export default function DashboardPage() {
  const [storage, setStorage] = useState<StorageInfo | null>(null);
  const [storageHistory, setStorageHistory] = useState<StorageSnapshot[]>([]);
  const [stats, setStats] = useState<{
    total: number;
    successful: number;
    failed: number;
    lastBackup: Backup | null;
  } | null>(null);
  const [recentBackups, setRecentBackups] = useState<Backup[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchData = async (showRefresh = false) => {
    if (showRefresh) setIsRefreshing(true);
    try {
      const [storageRes, historyRes, statsRes, backupsRes] =
        await Promise.allSettled([
          api.getStorage(),
          api.getStorageHistory(30),
          api.getBackupStats(),
          api.getBackups(1, 5),
        ]);

      if (storageRes.status === "fulfilled") setStorage(storageRes.value);
      if (historyRes.status === "fulfilled")
        setStorageHistory(historyRes.value);
      if (statsRes.status === "fulfilled") setStats(statsRes.value);
      if (backupsRes.status === "fulfilled")
        setRecentBackups(backupsRes.value.backups);
    } catch (err) {
      console.error("Dashboard fetch error:", err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <div className="space-y-8 max-w-7xl mx-auto animate-fade-in">
      <div className="aurora-bg opacity-5 -top-40 -left-40 scale-150" />

      {/* Premium Page Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-white/5 pb-8">
        <div className="space-y-1">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-2 h-2 rounded-full bg-accent shadow-accent-glow" />
            <span className="text-[10px] font-black text-accent uppercase tracking-widest">
              System Live
            </span>
          </div>
          <h1 className="text-4xl font-black text-white tracking-tight leading-none">
            Dashboard
          </h1>
          <p className="text-sm text-muted font-medium">
            Global insight into your MongoDB backup architecture
          </p>
        </div>

        <button
          onClick={() => fetchData(true)}
          disabled={isRefreshing}
          className="flex items-center gap-2.5 px-6 py-3 rounded-2xl bg-white/5 border border-white/10 text-xs font-bold text-white hover:bg-white/10 hover:border-accent/40 transition-all duration-300 disabled:opacity-50 group shadow-lg"
        >
          <RefreshCw
            className={`w-4 h-4 transition-transform duration-500 ${isRefreshing ? "animate-spin" : "group-hover:rotate-180"}`}
          />
          <span className="tracking-widest uppercase">Refresh Monitor</span>
        </button>
      </div>

      {/* Main Grid System */}
      <div className="space-y-8">
        {/* Top Tier: Storage Snapshots */}
        <div className="animate-fade-in" style={{ animationDelay: "100ms" }}>
          <StorageCards storage={storage} isLoading={isLoading} />
        </div>

        {/* Middle Tier: Analytics & Health */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div
            className="lg:col-span-2 animate-fade-in"
            style={{ animationDelay: "200ms" }}
          >
            <StorageChart data={storageHistory} isLoading={isLoading} />
          </div>
          <div className="animate-fade-in" style={{ animationDelay: "300ms" }}>
            <BackupStatusCard
              lastBackup={stats?.lastBackup || null}
              stats={
                stats
                  ? {
                      total: stats.total,
                      successful: stats.successful,
                      failed: stats.failed,
                    }
                  : null
              }
              isLoading={isLoading}
            />
          </div>
        </div>

        {/* Bottom Tier: Activity Feed */}
        <div className="animate-fade-in" style={{ animationDelay: "400ms" }}>
          <RecentBackups backups={recentBackups} isLoading={isLoading} />
        </div>
      </div>
    </div>
  );
}
