"use client";

import React, { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { useAuth } from "@/context/AuthContext";
import { Loader2, X } from "lucide-react";

export interface AppShellProps {
  children: React.ReactNode;
}

export const AppShell: React.FC<AppShellProps> = ({ children }) => {
  const pathname = usePathname();
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();

  const [isCollapsed, setIsCollapsed] = useState<boolean>(false);
  const [isMobileOpen, setIsMobileOpen] = useState<boolean>(false);

  // If on login page, render plain without shell
  const isLoginPage = pathname.startsWith("/login");

  useEffect(() => {
    if (!isLoading && !isAuthenticated && !isLoginPage) {
      router.push("/login");
    }
  }, [isLoading, isAuthenticated, isLoginPage, router]);

  // Close mobile drawer on route change
  useEffect(() => {
    setIsMobileOpen(false);
  }, [pathname]);

  if (isLoginPage) {
    return <main className="min-h-screen bg-slate-950">{children}</main>;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-600 to-amber-400 flex items-center justify-center text-slate-950 font-black shadow-xl shadow-amber-950/40 animate-pulse">
            LR
          </div>
          <p className="text-xs font-semibold text-slate-400">Loading Portal...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#070D1E] text-slate-100 flex flex-col">
      {/* Desktop Persistent Sidebar */}
      <div className="hidden md:block">
        <Sidebar
          isCollapsed={isCollapsed}
          onToggleCollapse={() => setIsCollapsed(!isCollapsed)}
        />
      </div>

      {/* Mobile / Tablet Drawer */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div
            className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm"
            onClick={() => setIsMobileOpen(false)}
          />
          <div className="relative w-72 max-w-[85vw] h-full z-10 bg-slate-950 border-r border-slate-800 shadow-2xl flex flex-col">
            <div className="absolute top-4 right-4 z-20">
              <button
                onClick={() => setIsMobileOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white bg-slate-900 border border-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <Sidebar isCollapsed={false} onToggleCollapse={() => setIsMobileOpen(false)} />
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div
        className={`flex-1 flex flex-col transition-all duration-300 ${
          isCollapsed ? "md:pl-20" : "md:pl-64"
        }`}
      >
        <Header onOpenMobileNav={() => setIsMobileOpen(true)} />
        <main className="flex-1 p-4 md:p-8 max-w-7xl w-full mx-auto animate-in fade-in duration-300">
          {children}
        </main>
      </div>
    </div>
  );
};
