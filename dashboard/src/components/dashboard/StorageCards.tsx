"use client";

import { HardDrive, Database, ArrowUpCircle } from "lucide-react";
import { StorageInfo } from "@/lib/api";

interface StorageCardsProps {
  storage: StorageInfo | null;
  isLoading: boolean;
}

export default function StorageCards({ storage, isLoading }: StorageCardsProps) {
  const cards = [
    {
      label: "Total Storage",
      value: storage?.total || "—",
      icon: HardDrive,
      color: "var(--accent)",
      bg: "rgba(99, 102, 241, 0.1)",
      borderColor: "rgba(99, 102, 241, 0.2)",
    },
    {
      label: "Used Storage",
      value: storage?.used || "—",
      icon: Database,
      color: "var(--warning)",
      bg: "rgba(245, 158, 11, 0.1)",
      borderColor: "rgba(245, 158, 11, 0.2)",
      extra: storage ? `${storage.usePercent}%` : null,
    },
    {
      label: "Free Space",
      value: storage?.free || "—",
      icon: ArrowUpCircle,
      color: "var(--success)",
      bg: "rgba(34, 197, 94, 0.1)",
      borderColor: "rgba(34, 197, 94, 0.2)",
    },
    {
      label: "Backup Size",
      value: storage?.backupSize || "—",
      icon: Database,
      color: "var(--info)",
      bg: "rgba(59, 130, 246, 0.1)",
      borderColor: "rgba(59, 130, 246, 0.2)",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
      {cards.map((card, i) => {
        const Icon = card.icon;
        return (
          <div
            key={card.label}
            className="card-premium relative overflow-hidden group animate-fade-in"
            style={{ animationDelay: `${i * 100}ms` }}
          >
            {/* Hover aurora glow */}
            <div 
              className="absolute -right-10 -top-10 w-32 h-32 opacity-0 group-hover:opacity-20 transition-opacity duration-500 blur-3xl" 
              style={{ background: card.color }}
            />
            
            {isLoading ? (
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-xl bg-white/5 animate-pulse" />
                <div className="w-24 h-3 rounded bg-white/5 animate-pulse" />
                <div className="w-20 h-8 rounded bg-white/5 animate-pulse" />
              </div>
            ) : (
              <div className="relative z-10">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center mb-4 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3 shadow-lg"
                  style={{ background: `${card.color}15`, border: `1px solid ${card.color}30` }}
                >
                  <Icon className="w-6 h-6" style={{ color: card.color }} />
                </div>
                
                <div className="flex flex-col gap-1">
                  <p className="text-[10px] font-bold text-muted uppercase tracking-[0.2em]">
                    {card.label}
                  </p>
                  
                  <div className="flex items-baseline gap-3 mt-1">
                    <p className="text-3xl font-extrabold text-white tracking-tight leading-tight">
                      {card.value}
                    </p>
                    {card.extra && (
                      <span
                        className="text-[10px] font-bold px-2 py-0.5 rounded-full border"
                        style={{ 
                          background: `${card.color}10`, 
                          color: card.color, 
                          borderColor: `${card.color}30` 
                        }}
                      >
                        {card.extra}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
