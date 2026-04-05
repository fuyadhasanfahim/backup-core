"use client";

import { useAuth } from "@/lib/auth";
import { useRouter } from "next/navigation";
import { LogOut, Bell, User } from "lucide-react";
import { useState } from "react";

export default function Header() {
  const { username, logout } = useAuth();
  const router = useRouter();
  const [showMenu, setShowMenu] = useState(false);

  const handleLogout = async () => {
    await logout();
    router.push("/login");
  };

  return (
    <header className="sticky top-0 z-30 h-20 flex items-center justify-between px-8 glass-strong border-b border-white/5">
      <div className="relative">
        <div className="aurora-bg opacity-10 -left-10" />
        <h2 className="text-xl font-extrabold tracking-tight text-white leading-tight">
          Backup Control Panel
        </h2>
        <div className="flex items-center gap-2 mt-0.5">
          <div className="w-1.5 h-1.5 rounded-full bg-success shadow-[0_0_10px_var(--success)]" />
          <p className="text-[10px] font-bold tracking-[0.1em] text-muted uppercase">
            {new Date().toLocaleDateString("en-US", {
              weekday: "long",
              month: "long",
              day: "numeric",
            })}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-5">
        {/* Notifications */}
        <button className="relative p-2.5 rounded-xl text-muted hover:text-white hover:bg-white/5 transition-all duration-300 group">
          <Bell className="w-5 h-5 group-hover:scale-110 transition-transform" />
          <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-accent shadow-accent-glow" />
        </button>

        {/* User profile */}
        <div className="relative">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="flex items-center gap-3 pl-1 pr-3 py-1 rounded-2xl bg-white/5 border border-white/10 hover:border-accent/40 transition-all duration-300 group"
          >
            <div className="w-8 h-8 rounded-xl bg-linear-to-br from-accent to-blue-500 flex items-center justify-center p-0.5 shadow-lg group-hover:rotate-3 transition-transform">
              <div className="w-full h-full rounded-[10px] bg-bg-primary flex items-center justify-center">
                <User className="w-4 h-4 text-accent" />
              </div>
            </div>
            <div className="flex flex-col items-start pr-2">
              <span className="text-xs font-bold text-white leading-none">
                {username || "Admin"}
              </span>
              <span className="text-[9px] text-muted font-bold tracking-wider uppercase mt-1">
                System Admin
              </span>
            </div>
          </button>

          {showMenu && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowMenu(false)} />
              <div className="absolute right-0 top-full mt-3 w-56 rounded-2xl glass-strong border border-white/10 shadow-premium z-50 py-2.5 animate-fade-in translate-y-0">
                <div className="px-4 py-2 border-b border-white/5 mb-2">
                  <p className="text-[10px] font-bold text-muted uppercase tracking-widest">Account Settings</p>
                </div>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-3 w-[calc(100%-16px)] mx-2 px-3 py-2.5 rounded-xl text-sm font-semibold text-danger hover:bg-danger/10 transition-all duration-200 group"
                >
                  <LogOut className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
                  <span>Sign Out</span>
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
