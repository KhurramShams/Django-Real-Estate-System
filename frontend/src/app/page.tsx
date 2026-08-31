"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Building2,
  Users,
  Handshake,
  CreditCard,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ArrowRight,
  ShieldCheck,
  Sparkles,
  BarChart3,
  Layers,
  Percent,
  Calendar,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { CardSkeleton } from "@/components/ui/Skeleton";
import { DashboardSummaryData, fetchDashboardSummary } from "@/lib/dashboard";

export default function DashboardPage() {
  const { user } = useAuth();
  const [summary, setSummary] = useState<DashboardSummaryData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    fetchDashboardSummary()
      .then((data) => setSummary(data))
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, []);

  const formatCurrency = (val: string | number) => {
    const num = Number(val);
    if (isNaN(num) || num === 0) return "PKR 0";
    if (num >= 10000000) {
      return `PKR ${(num / 10000000).toFixed(2)} Cr`;
    }
    if (num >= 100000) {
      return `PKR ${(num / 100000).toFixed(2)} Lac`;
    }
    return `PKR ${num.toLocaleString()}`;
  };

  const isAgent = summary?.scope === "agent" || user?.role === "agent";

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-3xl bg-gradient-to-r from-slate-900 via-slate-900/90 to-amber-950/40 border border-slate-800 shadow-2xl relative overflow-hidden">
        <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="space-y-1 relative z-10">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
              Executive Real Estate CRM
            </span>
            {isAgent ? (
              <Badge variant="agent" size="sm">
                Your Performance Portfolio
              </Badge>
            ) : (
              <Badge variant="admin" size="sm">
                Agency Executive Overview
              </Badge>
            )}
          </div>
          <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight">
            Welcome back, {user?.full_name || "Real Estate Executive"}
          </h1>
          <p className="text-xs md:text-sm text-slate-400 flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-slate-500" />
            Operational dashboard and financial metrics for{" "}
            <strong className="text-slate-200">
              {summary?.month_label || "Current Month"}
            </strong>
          </p>
        </div>

        <div className="flex items-center gap-3 relative z-10">
          <Link href="/deals/new">
            <Button
              variant="gold"
              size="sm"
              leftIcon={<Handshake className="w-4 h-4" />}
            >
              Initiate Deal
            </Button>
          </Link>
          <Link href="/properties/new">
            <Button
              variant="outline"
              size="sm"
              leftIcon={<Building2 className="w-4 h-4 text-amber-400" />}
            >
              Add Listing
            </Button>
          </Link>
        </div>
      </div>

      {/* Main KPI Summary Cards Grid */}
      {isLoading || !summary ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* 1. This Month's Revenue */}
          <Card variant="glass" className="relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-2xl group-hover:bg-emerald-500/10 transition-colors" />
            <CardContent className="p-5 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs uppercase font-bold text-slate-400">
                  This Month's Revenue
                </span>
                <div className="w-8 h-8 rounded-xl bg-emerald-950/60 border border-emerald-700/50 flex items-center justify-center text-emerald-400">
                  <TrendingUp className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-black text-white font-mono tracking-tight">
                {formatCurrency(summary.deals.revenue_this_month)}
              </div>
              <p className="text-[11px] text-slate-400">
                From{" "}
                <strong className="text-emerald-400">
                  {summary.deals.completed_this_month} deals closed
                </strong>{" "}
                in {summary.month_label}
              </p>
            </CardContent>
          </Card>

          {/* 2. This Month's Commission */}
          <Card variant="glass" className="relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-full blur-2xl group-hover:bg-amber-500/10 transition-colors" />
            <CardContent className="p-5 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs uppercase font-bold text-slate-400">
                  Earned Commission
                </span>
                <div className="w-8 h-8 rounded-xl bg-amber-950/60 border border-amber-600/50 flex items-center justify-center text-amber-400">
                  <Percent className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-black text-amber-300 font-mono tracking-tight">
                {formatCurrency(summary.deals.commission_this_month)}
              </div>
              <p className="text-[11px] text-slate-400">
                Agency commission for {summary.month_label}
              </p>
            </CardContent>
          </Card>

          {/* 3. Active Deals Pipeline */}
          <Link href="/deals" className="block group">
            <Card variant="glass" className="h-full group-hover:border-sky-500/50 transition-all">
              <CardContent className="p-5 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs uppercase font-bold text-slate-400">
                    Active Transactions
                  </span>
                  <div className="w-8 h-8 rounded-xl bg-sky-950/60 border border-sky-700/50 flex items-center justify-center text-sky-400">
                    <Handshake className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-2xl font-black text-sky-300 font-mono tracking-tight">
                  {summary.deals.active} Deals
                </div>
                <p className="text-[11px] text-slate-400 flex items-center justify-between">
                  <span>In negotiation & progress</span>
                  <ArrowRight className="w-3.5 h-3.5 text-sky-400 group-hover:translate-x-0.5 transition-transform" />
                </p>
              </CardContent>
            </Card>
          </Link>

          {/* 4. Urgent Overdue Payments */}
          <Link href="/payments" className="block group">
            <Card
              variant="glass"
              className={`h-full transition-all ${
                summary.payments.overdue_count > 0
                  ? "border-rose-700/60 bg-rose-950/20 group-hover:border-rose-500"
                  : "border-slate-800"
              }`}
            >
              <CardContent className="p-5 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs uppercase font-bold text-rose-400 flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5" /> Overdue Collections
                  </span>
                  <div className="w-8 h-8 rounded-xl bg-rose-950/80 border border-rose-600/60 flex items-center justify-center text-rose-300">
                    <Clock className="w-4 h-4 animate-pulse" />
                  </div>
                </div>
                <div className="text-2xl font-black text-rose-300 font-mono tracking-tight">
                  {summary.payments.overdue_count} Overdue
                </div>
                <p className="text-[11px] text-rose-300 font-mono font-semibold flex items-center justify-between">
                  <span>{formatCurrency(summary.payments.overdue_amount)} late</span>
                  <ArrowRight className="w-3.5 h-3.5 text-rose-400 group-hover:translate-x-0.5 transition-transform" />
                </p>
              </CardContent>
            </Card>
          </Link>
        </div>
      )}

      {/* Secondary Row: Inventory Status Breakdown & Financial Ledger Summary */}
      {summary && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Properties Inventory Breakdown */}
          <Card variant="glass" className="lg:col-span-2">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>
                    <Building2 className="w-4 h-4 text-amber-400" />
                    Property Portfolio Breakdown
                  </CardTitle>
                  <CardDescription>
                    Current distribution across {summary.properties.total} total inventory listings.
                  </CardDescription>
                </div>
                <Link href="/properties">
                  <Button variant="ghost" size="sm">
                    View Listings <ArrowRight className="w-3 h-3 ml-1" />
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Proportional Progress Bar */}
              <div className="space-y-2">
                <div className="h-4 w-full bg-slate-900 rounded-full overflow-hidden flex border border-slate-800 p-0.5">
                  {summary.properties.total > 0 ? (
                    <>
                      <div
                        style={{
                          width: `${(summary.properties.available / summary.properties.total) * 100}%`,
                        }}
                        className="bg-emerald-500 h-full rounded-l-full"
                        title={`Available: ${summary.properties.available}`}
                      />
                      <div
                        style={{
                          width: `${(summary.properties.under_negotiation / summary.properties.total) * 100}%`,
                        }}
                        className="bg-amber-500 h-full"
                        title={`Under Negotiation: ${summary.properties.under_negotiation}`}
                      />
                      <div
                        style={{
                          width: `${(summary.properties.sold / summary.properties.total) * 100}%`,
                        }}
                        className="bg-sky-500 h-full"
                        title={`Sold: ${summary.properties.sold}`}
                      />
                      <div
                        style={{
                          width: `${(summary.properties.rented / summary.properties.total) * 100}%`,
                        }}
                        className="bg-purple-500 h-full rounded-r-full"
                        title={`Rented: ${summary.properties.rented}`}
                      />
                    </>
                  ) : (
                    <div className="w-full bg-slate-800 h-full rounded-full" />
                  )}
                </div>
              </div>

              {/* Status Grid Badges */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 text-xs">
                  <span className="text-slate-500 font-semibold uppercase flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400" /> Available
                  </span>
                  <span className="text-xl font-bold text-white font-mono mt-1 block">
                    {summary.properties.available}
                  </span>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 text-xs">
                  <span className="text-slate-500 font-semibold uppercase flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-amber-400" /> Under Offer
                  </span>
                  <span className="text-xl font-bold text-white font-mono mt-1 block">
                    {summary.properties.under_negotiation}
                  </span>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 text-xs">
                  <span className="text-slate-500 font-semibold uppercase flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-sky-400" /> Sold
                  </span>
                  <span className="text-xl font-bold text-white font-mono mt-1 block">
                    {summary.properties.sold}
                  </span>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 text-xs">
                  <span className="text-slate-500 font-semibold uppercase flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-purple-400" /> Rented
                  </span>
                  <span className="text-xl font-bold text-white font-mono mt-1 block">
                    {summary.properties.rented}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Client & Collections Ledger Card */}
          <Card variant="glass">
            <CardHeader>
              <CardTitle>
                <Users className="w-4 h-4 text-emerald-400" />
                Pipeline & Collections
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-xs">
              {/* Clients Metric */}
              <Link href="/clients" className="block group">
                <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 group-hover:border-amber-500/50 transition-colors flex items-center justify-between">
                  <div>
                    <span className="text-slate-400 font-semibold uppercase block">
                      Active Registered Clients
                    </span>
                    <span className="text-lg font-bold text-white font-mono mt-0.5 block">
                      {summary.clients.total_active} Contacts
                    </span>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-amber-400 transition-colors" />
                </div>
              </Link>

              {/* Pending Installments Metric */}
              <Link href="/payments" className="block group">
                <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 group-hover:border-sky-500/50 transition-colors flex items-center justify-between">
                  <div>
                    <span className="text-slate-400 font-semibold uppercase block">
                      Pending Scheduled Installments
                    </span>
                    <span className="text-lg font-bold text-sky-300 font-mono mt-0.5 block">
                      {formatCurrency(summary.payments.pending_amount)}
                    </span>
                    <span className="text-[10px] text-slate-500">
                      {summary.payments.pending_count} installments remaining
                    </span>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-sky-400 transition-colors" />
                </div>
              </Link>

              {/* Collected This Month */}
              <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center justify-between">
                <div>
                  <span className="text-slate-400 font-semibold uppercase block">
                    Cash Collected This Month
                  </span>
                  <span className="text-lg font-bold text-emerald-400 font-mono mt-0.5 block">
                    {formatCurrency(summary.payments.collected_this_month)}
                  </span>
                </div>
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
