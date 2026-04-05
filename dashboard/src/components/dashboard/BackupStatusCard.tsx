"use client";

import { CheckCircle2, XCircle, Clock, Calendar } from "lucide-react";
import { Backup } from "@/lib/api";

interface BackupStatusCardProps {
  lastBackup: Backup | null;
  stats: { total: number; successful: number; failed: number } | null;
  isLoading: boolean;
}

export default function BackupStatusCard({ lastBackup, stats, isLoading }: BackupStatusCardProps) {
  if (isLoading) {
    return (
      <div className="card-premium h-full animate-fade-in flex flex-col justify-center">
        <div className="space-y-6">
          <div className="w-40 h-4 rounded bg-white/5 animate-pulse" />
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-white/5 animate-pulse" />
            <div className="space-y-2 flex-1">
              <div className="w-full h-6 rounded bg-white/5 animate-pulse" />
              <div className="w-3/4 h-3 rounded bg-white/5 animate-pulse" />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4 pt-6 border-t border-white/5">
            <div className="h-12 rounded bg-white/5 animate-pulse" />
            <div className="h-12 rounded bg-white/5 animate-pulse" />
            <div className="h-12 rounded bg-white/5 animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  const statusConfig = {
    success: {
      icon: CheckCircle2,
      label: "System Healthy",
      subLabel: "Latest backup successful",
      color: "var(--success)",
      bg: "var(--success-bg)",
    },
    failed: {
      icon: XCircle,
      label: "Action Required",
      subLabel: "Latest backup failed",
      color: "var(--danger)",
      bg: "var(--danger-bg)",
    },
    in_progress: {
      icon: Clock,
      label: "Syncing Data",
      subLabel: "Backup currently running",
      color: "var(--warning)",
      bg: "var(--warning-bg)",
    },
  };

  const status = lastBackup
    ? statusConfig[lastBackup.status as keyof typeof statusConfig] || statusConfig.success
    : { icon: Clock, label: "No Activity", subLabel: "No backups recorded", color: "var(--text-muted)", bg: "rgba(255,255,255,0.05)" };

  const StatusIcon = status.icon;

  return (
    <div className="card-premium h-full animate-fade-in flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-[10px] font-bold text-muted uppercase tracking-[0.2em]">
          Backup Health Log
        </h3>
        {lastBackup && (
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-white/5 border border-white/5">
            <Clock className="w-3 h-3 text-muted" />
            <span className="text-[9px] font-bold text-muted">
              {new Date(lastBackup.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
        )}
      </div>

      <div className="flex-1">
        {lastBackup ? (
          <div className="space-y-6">
            {/* Status section */}
            <div className="flex items-center gap-5">
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center relative shadow-lg group-hover:scale-105 transition-transform duration-300"
                style={{ background: status.bg, border: `1px solid ${status.color}20` }}
              >
                <div 
                  className="absolute inset-0 rounded-2xl opacity-20 blur-md"
                  style={{ background: status.color }}
                />
                <StatusIcon className="w-8 h-8 relative z-10" style={{ color: status.color }} />
              </div>
              <div className="flex flex-col gap-0.5">
                <p className="text-xl font-extrabold text-white tracking-tight">
                  {status.label}
                </p>
                <p className="text-xs text-muted font-medium">
                  {status.subLabel}
                </p>
              </div>
            </div>

            {/* Metrics cards */}
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-white/[0.03] border border-white/5 rounded-2xl p-3 hover:bg-white/[0.05] transition-colors">
                <p className="text-[9px] font-bold text-muted uppercase tracking-wider mb-1">Database</p>
                <p className="text-xs font-bold text-white truncate">{lastBackup.dbName}</p>
              </div>
              <div className="bg-white/[0.03] border border-white/5 rounded-2xl p-3 hover:bg-white/[0.05] transition-colors">
                <p className="text-[9px] font-bold text-muted uppercase tracking-wider mb-1">Size</p>
                <p className="text-xs font-bold text-white">{lastBackup.size}</p>
              </div>
              <div className="bg-white/[0.03] border border-white/5 rounded-2xl p-3 hover:bg-white/[0.05] transition-colors">
                <p className="text-[9px] font-bold text-muted uppercase tracking-wider mb-1">Time</p>
                <p className="text-xs font-bold text-white">{lastBackup.duration ? `${lastBackup.duration}s` : "—"}</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-10 text-muted/30">
            <Clock className="w-12 h-12 mb-3" />
            <p className="text-xs font-bold tracking-widest uppercase">Initializing System</p>
          </div>
        )}
      </div>

      {/* Snapshot footer */}
      {stats && (
        <div className="grid grid-cols-3 bg-white/[0.03] border border-white/5 rounded-2xl p-4 mt-6">
          <div className="text-center border-r border-white/5">
            <p className="text-lg font-black text-white leading-none">{stats.total}</p>
            <p className="text-[9px] font-bold text-muted uppercase tracking-wider mt-1.5">Total</p>
          </div>
          <div className="text-center border-r border-white/5">
            <p className="text-lg font-black text-success leading-none">{stats.successful}</p>
            <p className="text-[9px] font-bold text-muted uppercase tracking-wider mt-1.5">Success</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-black text-danger leading-none">{stats.failed}</p>
            <p className="text-[9px] font-bold text-muted uppercase tracking-wider mt-1.5">Failed</p>
          </div>
        </div>
      )}
    </div>
  );
}
