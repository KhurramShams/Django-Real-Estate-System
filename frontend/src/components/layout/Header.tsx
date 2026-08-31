"use client";

import React, { useState } from "react";
import { usePathname } from "next/navigation";
import {
  Menu,
  Bell,
  LogOut,
  User,
  Search,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";

export interface HeaderProps {
  onOpenMobileNav?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenMobileNav }) => {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);

  const getPageTitle = (path: string) => {
    if (path === "/") return "Executive Overview";
    if (path.startsWith("/properties")) return "Property Listings";
    if (path.startsWith("/clients")) return "Clients & Leads";
    if (path.startsWith("/deals")) return "Deals & Transactions";
    if (path.startsWith("/payments")) return "Payment Ledger & Receipts";
    if (path.startsWith("/reports")) return "Analytics & Reports";
    return "Management Portal";
  };

  const roleVariant = user?.role || "staff";

  return (
    <header className="h-16 bg-slate-950/80 border-b border-slate-800/80 backdrop-blur-md sticky top-0 z-30 px-4 md:px-8 flex items-center justify-between gap-4">
      {/* Left: Mobile Toggle & Page Title */}
      <div className="flex items-center gap-3 md:gap-4">
        {onOpenMobileNav && (
          <button
            onClick={onOpenMobileNav}
            className="md:hidden p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}
        <div>
          <h1 className="text-base md:text-lg font-bold text-white tracking-tight">
            {getPageTitle(pathname)}
          </h1>
        </div>
      </div>

      {/* Right: Quick Search, Notifications, Profile & Logout */}
      <div className="flex items-center gap-3">
        {/* Search shortcut */}
        <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900/60 border border-slate-800 text-xs text-slate-400 w-56">
          <Search className="w-3.5 h-3.5" />
          <span className="truncate">Search properties, clients...</span>
          <kbd className="ml-auto text-[10px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded border border-slate-700 font-mono">
            ⌘K
          </kbd>
        </div>

        {/* Notifications */}
        <button
          className="relative p-2 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-900 border border-slate-800/80 transition-colors"
          title="Notifications"
        >
          <Bell className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-amber-500 ring-2 ring-slate-950" />
        </button>

        {/* User Profile dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-2.5 p-1.5 pr-3 rounded-xl bg-slate-900/80 hover:bg-slate-800/90 border border-slate-800 transition-all text-left"
          >
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-slate-800 to-slate-700 border border-slate-700 flex items-center justify-center text-amber-400 font-semibold text-xs shadow-inner">
              {user?.full_name?.charAt(0).toUpperCase() || <User className="w-4 h-4" />}
            </div>
            <div className="hidden sm:block text-left">
              <span className="block text-xs font-semibold text-slate-200 max-w-[120px] truncate leading-tight">
                {user?.full_name || "Agent User"}
              </span>
              <div className="mt-0.5">
                <Badge variant={roleVariant} size="sm">
                  {user?.role ? user.role.toUpperCase() : "STAFF"}
                </Badge>
              </div>
            </div>
          </button>

          {/* Profile Menu Popover */}
          {showUserMenu && (
            <div
              className="absolute right-0 mt-2 w-56 rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95 duration-150"
              onMouseLeave={() => setShowUserMenu(false)}
            >
              <div className="px-3 py-2 border-b border-slate-800/80 mb-1">
                <p className="text-xs font-bold text-white truncate">{user?.full_name}</p>
                <p className="text-[11px] text-slate-400 truncate">{user?.email}</p>
              </div>

              <div className="space-y-0.5">
                <button
                  onClick={() => {
                    setShowUserMenu(false);
                    logout();
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-rose-400 hover:bg-rose-950/40 hover:text-rose-300 transition-colors text-left"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Log Out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
