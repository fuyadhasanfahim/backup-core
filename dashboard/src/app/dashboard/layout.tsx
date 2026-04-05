"use client";

import { ReactNode } from "react";
import AuthGuard from "@/components/layout/AuthGuard";
import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <AuthGuard>
      <div className="flex min-h-screen bg-background relative selection:bg-accent/30">
        <div className="aurora-bg opacity-20 fixed top-0 right-0 w-[50%] h-[50%] -z-10" />
        <Sidebar />
        <div className="flex-1 ml-64 flex flex-col transition-all duration-500 delay-100">
          <Header />
          <main className="flex-1 p-8 overflow-y-auto no-scrollbar">{children}</main>
        </div>
      </div>
    </AuthGuard>
  );
}
