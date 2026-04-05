"use client";

import { Backup } from "@/lib/api";
import { CheckCircle2, XCircle, Clock, Cloud, CloudOff } from "lucide-react";

interface RecentBackupsProps {
  backups: Backup[];
  isLoading: boolean;
}

export default function RecentBackups({ backups, isLoading }: RecentBackupsProps) {
  const statusIcons = {
    success: <CheckCircle2 className="w-4 h-4 text-success" />,
    failed: <XCircle className="w-4 h-4 text-danger" />,
    in_progress: <Clock className="w-4 h-4 text-warning animate-spin" />,
  };

  return (
    <div className="card-premium h-full animate-fade-in flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-[10px] font-bold text-muted uppercase tracking-[0.2em]">
          Live Activity Feed
        </h3>
        <a
          href="/backups"
          className="text-[10px] font-extrabold text-accent hover:text-accent-hover tracking-widest uppercase transition-colors"
        >
          View Full History →
        </a>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center gap-4 py-3">
              <div className="w-10 h-10 rounded-xl bg-white/5 animate-pulse" />
              <div className="flex-1 space-y-2">
                <div className="w-1/2 h-3 rounded bg-white/5 animate-pulse" />
                <div className="w-1/3 h-2 rounded bg-white/5 animate-pulse" />
              </div>
              <div className="w-12 h-4 rounded bg-white/5 animate-pulse" />
            </div>
          ))}
        </div>
      ) : backups.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-muted/30">
          <Clock className="w-12 h-12 mb-3" />
          <p className="text-xs font-bold tracking-widest uppercase">Waiting for Data</p>
        </div>
      ) : (
        <div className="space-y-1 flex-1 overflow-y-auto no-scrollbar">
          {backups.slice(0, 7).map((backup, i) => (
            <div
              key={backup.id}
              className="flex items-center gap-4 py-3.5 px-3 rounded-2xl hover:bg-white/5 transition-all duration-300 group animate-fade-in"
              style={{ animationDelay: `${i * 80}ms` }}
            >
              {/* Status circle */}
              <div className="relative shrink-0">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-transform duration-300 group-hover:scale-110 ${
                  backup.status === 'success' ? 'bg-success/10 border border-success/20' : 
                  backup.status === 'failed' ? 'bg-danger/10 border border-danger/20' : 
                  'bg-warning/10 border border-warning/20'
                }`}>
                  {backup.status === 'success' && <CheckCircle2 className="w-5 h-5 text-success" />}
                  {backup.status === 'failed' && <XCircle className="w-5 h-5 text-danger" />}
                  {backup.status === 'in_progress' && <Clock className="w-5 h-5 text-warning animate-spin" />}
                </div>
                {backup.cloudSync && (
                  <div className="absolute -right-1 -top-1 w-4 h-4 rounded-full bg-accent flex items-center justify-center border-2 border-bg-primary shadow-lg">
                    <Cloud className="w-2 h-2 text-white" />
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-white truncate leading-tight">
                  {backup.dbName}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <p className="text-[10px] font-bold text-muted uppercase tracking-wider">
                    {new Date(backup.date).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                  </p>
                  <span className="w-1 h-1 rounded-full bg-white/10" />
                  <p className="text-[10px] font-bold text-muted uppercase tracking-wider">
                    {new Date(backup.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>

              {/* Meta */}
              <div className="text-right">
                <p className="text-sm font-black text-white leading-none">
                  {backup.size}
                </p>
                {backup.duration && (
                  <p className="text-[9px] font-bold text-muted mt-1.5 uppercase tracking-widest">
                    {backup.duration}s
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
