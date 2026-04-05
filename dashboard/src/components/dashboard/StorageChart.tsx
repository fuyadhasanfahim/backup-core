"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import type { Payload } from "recharts/types/component/DefaultTooltipContent";
import { StorageSnapshot } from "@/lib/api";
import { Database } from "lucide-react";

interface StorageChartProps {
  data: StorageSnapshot[];
  isLoading: boolean;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Payload<number, string>[];
  label?: string;
}

function CustomTooltip({
  active,
  payload,
  label,
}: CustomTooltipProps) {
  if (active && payload && payload.length) {
    return (
      <div className="glass-strong rounded-xl px-4 py-3 shadow-premium border border-white/10 animate-fade-in -translate-y-2.5">
        <p className="text-[10px] font-black text-muted uppercase tracking-widest mb-2 border-b border-white/5 pb-1">
          {String(label)}
        </p>
        <div className="space-y-1.5">
          {payload.map((entry, i) => (
            <div key={i} className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: entry.color }} />
                <span className="text-[11px] font-bold text-secondary">{entry.name}</span>
              </div>
              <span className="text-[11px] font-black text-white">{entry.value} GB</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return null;
}

export default function StorageChart({ data, isLoading }: StorageChartProps) {
  const chartData = data.map((snap) => ({
    date: new Date(snap.date).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
    }),
    used: parseFloat(snap.usedGB.toFixed(2)),
    backup: parseFloat(snap.backupGB.toFixed(2)),
    free: parseFloat(snap.freeGB.toFixed(2)),
  }));

  const COLORS = {
    used: "var(--warning)",
    backup: "var(--accent)",
  };

  return (
    <div className="card-premium h-full animate-fade-in flex flex-col">
      <h3 className="text-[10px] font-bold text-muted uppercase tracking-[0.2em] mb-6">
        Storage Analytics
      </h3>

      {isLoading ? (
        <div className="flex-1 w-full bg-white/5 rounded-2xl animate-pulse" />
      ) : chartData.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-muted/30 py-12">
          <Database className="w-12 h-12 mb-3" />
          <p className="text-xs font-bold tracking-widest uppercase">Waiting for Data Snapshots</p>
        </div>
      ) : (
        <div className="flex-1 w-full mt-auto" style={{ minHeight: 250 }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={chartData}
              margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
            >
              <defs>
                <linearGradient id="usedGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={COLORS.used} stopOpacity={0.2} />
                  <stop offset="95%" stopColor={COLORS.used} stopOpacity={0} />
                </linearGradient>
                <linearGradient id="backupGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={COLORS.backup} stopOpacity={0.2} />
                  <stop offset="95%" stopColor={COLORS.backup} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="8 8"
                stroke="rgba(255,255,255,0.03)"
                vertical={false}
              />
              <XAxis
                dataKey="date"
                tick={{ fill: "var(--text-muted)", fontSize: 10, fontWeight: '700' }}
                stroke="transparent"
                dy={10}
              />
              <YAxis
                tick={{ fill: "var(--text-muted)", fontSize: 10, fontWeight: '700' }}
                stroke="transparent"
                unit="G"
              />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="used"
                name="System Used"
                stroke={COLORS.used}
                fill="url(#usedGrad)"
                strokeWidth={3}
                animationDuration={1500}
              />
              <Area
                type="monotone"
                dataKey="backup"
                name="Backups"
                stroke={COLORS.backup}
                fill="url(#backupGrad)"
                strokeWidth={3}
                animationDuration={2000}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
