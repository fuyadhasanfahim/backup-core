"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Database,
  Settings,
  Shield,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useState } from "react";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/backups", label: "Backups", icon: Database },
  { href: "/settings", label: "Settings", icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={`fixed left-0 top-0 h-full z-40 flex flex-col transition-all duration-500 cubic-bezier(0.4, 0, 0.2, 1) glass-strong border-r border-white/5 ${
        collapsed ? "w-20" : "w-64"
      }`}
    >
      {/* Logo Section */}
      <div className="flex items-center gap-3 px-6 h-20 relative">
        <div className="aurora-bg opacity-30" />
        <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-linear-to-br from-accent to-blue-500 shadow-accent-glow animate-float shrink-0">
          <Shield className="w-6 h-6 text-white" />
        </div>
        {!collapsed && (
          <div className="flex flex-col animate-fade-in">
            <h1 className="text-base font-extrabold tracking-tight gradient-text leading-none uppercase">
              BackendSafe
            </h1>
            <p className="text-[10px] text-muted font-bold tracking-[0.2em] mt-1 uppercase">
              Backup Manager
            </p>
          </div>
        )}
      </div>

      {/* Navigation Section */}
      <nav className="flex-1 py-6 px-4 space-y-2 overflow-y-auto no-scrollbar">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3.5 rounded-2xl text-sm font-semibold transition-all duration-300 group relative ${
                isActive
                  ? "text-white bg-white/10 shadow-lg border border-white/10"
                  : "text-secondary hover:text-white hover:bg-white/5"
              }`}
            >
              {isActive && (
                <div className="absolute left-0 top-1/4 bottom-1/4 w-1 bg-accent rounded-r-full shadow-accent-glow" />
              )}
              <Icon
                className={`w-5 h-5 shrink-0 transition-all duration-300 ${
                  isActive ? "text-accent scale-110" : "text-muted group-hover:text-secondary group-hover:scale-105"
                }`}
              />
              {!collapsed && (
                <span className="animate-fade-in">{item.label}</span>
              )}
              {isActive && !collapsed && (
                <div className="ml-auto w-1.5 h-1.5 rounded-full bg-accent shadow-accent-glow" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer Toggle */}
      <div className="p-4 border-t border-white/5">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="flex items-center justify-center w-full py-3 rounded-xl text-muted hover:text-white hover:bg-white/5 transition-all duration-300 group"
        >
          {collapsed ? (
            <ChevronRight className="w-5 h-5 group-hover:translate-x-0.5 transition-transform" />
          ) : (
            <div className="flex items-center gap-3">
              <ChevronLeft className="w-5 h-5 group-hover:-translate-x-0.5 transition-transform" />
              <span className="text-xs font-bold tracking-widest uppercase">Collapse</span>
            </div>
          )}
        </button>
      </div>
    </aside>
  );
}
