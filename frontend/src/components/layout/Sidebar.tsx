"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Building2,
  Users,
  Handshake,
  CreditCard,
  BarChart3,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";

export interface SidebarProps {
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isCollapsed,
  onToggleCollapse,
}) => {
  const pathname = usePathname();
  const { user } = useAuth();

  const navItems = [
    {
      label: "Dashboard",
      href: "/",
      icon: <LayoutDashboard className="w-5 h-5" />,
      allowedRoles: ["admin", "agent", "accountant", "staff"],
    },
    {
      label: "Properties",
      href: "/properties",
      icon: <Building2 className="w-5 h-5" />,
      allowedRoles: ["admin", "agent", "accountant", "staff"],
    },
    {
      label: "Clients",
      href: "/clients",
      icon: <Users className="w-5 h-5" />,
      allowedRoles: ["admin", "agent", "accountant", "staff"],
    },
    {
      label: "Deals",
      href: "/deals",
      icon: <Handshake className="w-5 h-5" />,
      allowedRoles: ["admin", "agent", "accountant", "staff"],
      badge: user?.role === "agent" ? "My Deals" : undefined,
    },
    {
      label: "Payments",
      href: "/payments",
      icon: <CreditCard className="w-5 h-5" />,
      allowedRoles: ["admin", "accountant", "agent", "staff"],
      highlight: user?.role === "accountant",
      badge: user?.role === "accountant" ? "Ledger" : undefined,
    },
    {
      label: "Reports",
      href: "/reports",
      icon: <BarChart3 className="w-5 h-5" />,
      allowedRoles: ["admin", "accountant"],
      badge: "Soon",
    },
  ];

  const userRole = user?.role || "agent";
  const visibleNav = navItems.filter((item) =>
    item.allowedRoles.includes(userRole)
  );

  return (
    <aside
      className={`fixed top-0 left-0 bottom-0 z-40 bg-slate-950/95 border-r border-slate-800/80 backdrop-blur-xl transition-all duration-300 flex flex-col justify-between ${
        isCollapsed ? "w-20" : "w-64"
      }`}
    >
      {/* Top Brand / Logo */}
      <div>
        <div className="h-16 px-4 flex items-center justify-between border-b border-slate-800/80">
          {!isCollapsed ? (
            <Link href="/" className="flex items-center gap-2.5 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-600 to-amber-400 flex items-center justify-center text-slate-950 font-black shadow-lg shadow-amber-950/30 flex-shrink-0">
                MH
              </div>
              <div className="min-w-0">
                <span className="block text-sm font-bold text-white tracking-wider truncate">
                  MY HOUSE
                </span>
                <span className="block text-[10px] uppercase font-semibold text-amber-400 tracking-widest -mt-0.5">
                  Management Portal
                </span>
              </div>
            </Link>
          ) : (
            <div className="w-full flex justify-center">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-600 to-amber-400 flex items-center justify-center text-slate-950 font-black shadow-lg shadow-amber-950/30">
                MH
              </div>
            </div>
          )}
        </div>

        {/* Navigation List */}
        <nav className="p-3 space-y-1.5 mt-2">
          {visibleNav.map((item) => {
            const isActive =
              item.href === "/"
                ? pathname === "/"
                : pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`group flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 relative ${
                  isActive
                    ? "bg-amber-500/15 text-amber-300 border border-amber-500/30 shadow-md shadow-amber-950/20"
                    : "text-slate-400 hover:text-slate-100 hover:bg-slate-900/80 border border-transparent"
                } ${isCollapsed ? "justify-center px-0" : ""}`}
                title={isCollapsed ? item.label : undefined}
              >
                <span
                  className={`flex-shrink-0 transition-colors ${
                    isActive
                      ? "text-amber-400"
                      : "text-slate-400 group-hover:text-slate-200"
                  }`}
                >
                  {item.icon}
                </span>
                {!isCollapsed && (
                  <span className="truncate flex-1">{item.label}</span>
                )}
                {!isCollapsed && item.badge && (
                  <span
                    className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                      item.highlight
                        ? "bg-amber-500 text-slate-950"
                        : "bg-slate-800 text-slate-400"
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Bottom Collapse Toggle & System Info */}
      <div className="p-3 border-t border-slate-800/80">
        {!isCollapsed && (
          <div className="px-3 py-2 rounded-xl bg-slate-900/60 border border-slate-800 mb-2 flex items-center gap-2 text-slate-400 text-xs">
            <ShieldCheck className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <span className="truncate">RBAC Active: <strong className="text-slate-200 uppercase">{userRole}</strong></span>
          </div>
        )}
        <button
          onClick={onToggleCollapse}
          className="w-full flex items-center justify-center p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/60 transition-colors"
          title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
        >
          {isCollapsed ? (
            <ChevronRight className="w-5 h-5" />
          ) : (
            <div className="flex items-center gap-2 text-xs font-semibold">
              <ChevronLeft className="w-4 h-4" />
              <span>Collapse Sidebar</span>
            </div>
          )}
        </button>
      </div>
    </aside>
  );
};
