"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import {
  Handshake,
  Plus,
  Search,
  SlidersHorizontal,
  RotateCcw,
  Building2,
  Users,
  DollarSign,
  Calendar,
  Layers,
  LayoutGrid,
  List,
  ArrowRight,
  TrendingUp,
  UserCheck,
  CheckCircle2,
  Clock,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/components/ui/Toast";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Badge, BadgeVariant } from "@/components/ui/Badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/Table";
import { TableSkeleton, CardSkeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import {
  DealListItem,
  PaginatedDealsResponse,
  fetchDeals,
  DealStatus,
  DealType,
  CommissionStatus,
} from "@/lib/deals";
import { AgentUser, fetchAgents } from "@/lib/clients";

const PIPELINE_STAGES: { status: DealStatus; label: string; badge: BadgeVariant; countBg: string }[] = [
  { status: "negotiation", label: "In Negotiation", badge: "negotiation", countBg: "bg-sky-950 text-sky-300 border-sky-800" },
  { status: "booked", label: "Token / Booked", badge: "booked", countBg: "bg-amber-950 text-amber-300 border-amber-800" },
  { status: "in_progress", label: "In Progress", badge: "in_progress", countBg: "bg-indigo-950 text-indigo-300 border-indigo-800" },
  { status: "completed", label: "Closed / Completed", badge: "completed", countBg: "bg-emerald-950 text-emerald-300 border-emerald-800" },
  { status: "cancelled", label: "Cancelled", badge: "cancelled", countBg: "bg-rose-950 text-rose-300 border-rose-800" },
];

export default function DealsListPage() {
  const { user } = useAuth();
  const { showToast } = useToast();

  const isEditor = user?.role === "admin" || user?.role === "agent";
  const isAdmin = user?.role === "admin";
  const isAgent = user?.role === "agent";

  // View state: 'kanban' | 'table'
  const [viewMode, setViewMode] = useState<"kanban" | "table">("kanban");

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [typeFilter, setTypeFilter] = useState<string>("");
  const [commissionStatusFilter, setCommissionStatusFilter] = useState<string>("");
  const [agentFilter, setAgentFilter] = useState<string>("");
  const [isInstallmentFilter, setIsInstallmentFilter] = useState<string>("");
  const [currentPage, setCurrentPage] = useState<number>(1);

  const [showFilters, setShowFilters] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [data, setData] = useState<PaginatedDealsResponse | null>(null);
  const [agents, setAgents] = useState<AgentUser[]>([]);

  useEffect(() => {
    if (isAdmin) {
      fetchAgents()
        .then((res) => setAgents(res))
        .catch(() => {});
    }
  }, [isAdmin]);

  const loadDeals = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetchDeals({
        search: searchQuery || undefined,
        deal_status: statusFilter || undefined,
        deal_type: typeFilter || undefined,
        commission_status: commissionStatusFilter || undefined,
        agent: agentFilter || undefined,
        is_installment: isInstallmentFilter !== "" ? isInstallmentFilter === "true" : undefined,
        page: currentPage,
        page_size: viewMode === "kanban" ? 100 : 20,
      });
      setData(response);
    } catch (err: any) {
      showToast({
        type: "error",
        title: "Load Error",
        message: err?.message || "Failed to load deals pipeline.",
      });
    } finally {
      setIsLoading(false);
    }
  }, [
    searchQuery,
    statusFilter,
    typeFilter,
    commissionStatusFilter,
    agentFilter,
    isInstallmentFilter,
    currentPage,
    viewMode,
    showToast,
  ]);

  useEffect(() => {
    loadDeals();
  }, [loadDeals]);

  const handleClearFilters = () => {
    setSearchQuery("");
    setStatusFilter("");
    setTypeFilter("");
    setCommissionStatusFilter("");
    setAgentFilter("");
    setIsInstallmentFilter("");
    setCurrentPage(1);
  };

  const hasActiveFilters =
    Boolean(searchQuery) ||
    Boolean(statusFilter) ||
    Boolean(typeFilter) ||
    Boolean(commissionStatusFilter) ||
    Boolean(agentFilter) ||
    Boolean(isInstallmentFilter);

  const formatPrice = (priceStr: string) => {
    const num = Number(priceStr);
    if (isNaN(num)) return `PKR ${priceStr}`;
    if (num >= 10000000) {
      return `PKR ${(num / 10000000).toFixed(2)} Crore`;
    }
    if (num >= 100000) {
      return `PKR ${(num / 100000).toFixed(2)} Lakh`;
    }
    return `PKR ${num.toLocaleString()}`;
  };

  // Group deals by stage for Kanban
  const dealsByStage = useMemo(() => {
    const map: Record<DealStatus, DealListItem[]> = {
      negotiation: [],
      booked: [],
      in_progress: [],
      completed: [],
      cancelled: [],
    };
    if (data && data.results) {
      data.results.forEach((deal) => {
        if (map[deal.deal_status]) {
          map[deal.deal_status].push(deal);
        }
      });
    }
    return map;
  }, [data]);

  return (
    <div className="space-y-6">
      {/* Top Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h2 className="text-xl md:text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
              <Handshake className="w-6 h-6 text-amber-400" />
              Transactions Pipeline
            </h2>
            {isAgent && (
              <Badge variant="agent" size="sm">
                My Deals Portfolio
              </Badge>
            )}
          </div>
          <p className="text-xs text-slate-400">
            {data
              ? isAgent
                ? `${data.count} active deal contracts managed by you`
                : `${data.count} deals across all agency sales and leases`
              : "Loading deal pipeline..."}
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* View Toggle */}
          <div className="flex items-center bg-slate-900 border border-slate-800 rounded-xl p-1">
            <button
              onClick={() => setViewMode("kanban")}
              className={`p-1.5 rounded-lg transition-colors ${
                viewMode === "kanban"
                  ? "bg-amber-500 text-slate-950 shadow-md"
                  : "text-slate-400 hover:text-white"
              }`}
              title="Kanban Pipeline Board"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode("table")}
              className={`p-1.5 rounded-lg transition-colors ${
                viewMode === "table"
                  ? "bg-amber-500 text-slate-950 shadow-md"
                  : "text-slate-400 hover:text-white"
              }`}
              title="Table View"
            >
              <List className="w-4 h-4" />
            </button>
          </div>

          {isEditor && (
            <Link href="/deals/new">
              <Button
                variant="gold"
                size="sm"
                leftIcon={<Plus className="w-4 h-4" />}
              >
                New Deal
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* Search & Filter Controls */}
      <Card variant="glass">
        <CardContent className="p-4 md:p-5 space-y-4">
          <div className="flex flex-col md:flex-row items-center gap-3">
            <div className="flex-1 w-full">
              <Input
                placeholder="Search deals by property title, sector, client name, or agent..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                leftIcon={<Search className="w-4 h-4" />}
              />
            </div>

            <Button
              variant={showFilters || hasActiveFilters ? "gold" : "secondary"}
              size="md"
              leftIcon={<SlidersHorizontal className="w-4 h-4" />}
              onClick={() => setShowFilters(!showFilters)}
            >
              Filters {hasActiveFilters && "(Active)"}
            </Button>

            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="md"
                leftIcon={<RotateCcw className="w-4 h-4" />}
                onClick={handleClearFilters}
              >
                Reset
              </Button>
            )}
          </div>

          {/* Expanded Filter Panel */}
          {showFilters && (
            <div className="pt-4 border-t border-slate-800/80 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 animate-in fade-in duration-200">
              <Select
                label="Pipeline Stage"
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setCurrentPage(1);
                }}
                options={[
                  { value: "", label: "All Stages" },
                  { value: "negotiation", label: "In Negotiation" },
                  { value: "booked", label: "Token / Booked" },
                  { value: "in_progress", label: "In Progress" },
                  { value: "completed", label: "Closed / Completed" },
                  { value: "cancelled", label: "Cancelled" },
                ]}
              />

              <Select
                label="Transaction Type"
                value={typeFilter}
                onChange={(e) => {
                  setTypeFilter(e.target.value);
                  setCurrentPage(1);
                }}
                options={[
                  { value: "", label: "All Types" },
                  { value: "sale", label: "Sale Transaction" },
                  { value: "rent", label: "Rental Lease" },
                ]}
              />

              <Select
                label="Commission Status"
                value={commissionStatusFilter}
                onChange={(e) => {
                  setCommissionStatusFilter(e.target.value);
                  setCurrentPage(1);
                }}
                options={[
                  { value: "", label: "All Commission Statuses" },
                  { value: "pending", label: "Pending Settlement" },
                  { value: "paid", label: "Settled / Paid" },
                ]}
              />

              {isAdmin && (
                <Select
                  label="Handling Agent"
                  value={agentFilter}
                  onChange={(e) => {
                    setAgentFilter(e.target.value);
                    setCurrentPage(1);
                  }}
                  options={[
                    { value: "", label: "All Agents" },
                    ...agents.map((a) => ({
                      value: a.id,
                      label: a.full_name || a.email,
                    })),
                  ]}
                />
              )}

              <Select
                label="Payment Structure"
                value={isInstallmentFilter}
                onChange={(e) => {
                  setIsInstallmentFilter(e.target.value);
                  setCurrentPage(1);
                }}
                options={[
                  { value: "", label: "All Payment Structures" },
                  { value: "true", label: "Installment Plans Only" },
                  { value: "false", label: "Lump Sum / One-Time" },
                ]}
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Main Content Area: Kanban vs Table */}
      {isLoading ? (
        viewMode === "kanban" ? (
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <CardSkeleton key={i} />
            ))}
          </div>
        ) : (
          <TableSkeleton rows={8} cols={6} />
        )
      ) : !data || data.results.length === 0 ? (
        <EmptyState
          icon={<Handshake className="w-8 h-8" />}
          title={
            hasActiveFilters
              ? "No Matching Deals Found"
              : isAgent
              ? "No Deals in Your Portfolio Yet"
              : "No Deals Recorded"
          }
          description={
            hasActiveFilters
              ? "No deal transactions match your filter criteria. Try resetting filters."
              : isAgent
              ? "You haven't initiated any deals yet. Click 'New Deal' to register an active negotiation."
              : "No deals recorded agency-wide yet. Click 'New Deal' to start tracking transactions."
          }
          actionLabel={hasActiveFilters ? "Clear All Filters" : isEditor ? "New Deal" : undefined}
          onAction={hasActiveFilters ? handleClearFilters : isEditor ? () => (window.location.href = "/deals/new") : undefined}
        />
      ) : viewMode === "kanban" ? (
        /* Kanban Pipeline Board */
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 items-start overflow-x-auto pb-4">
          {PIPELINE_STAGES.map((col) => {
            const columnDeals = dealsByStage[col.status] || [];
            return (
              <div
                key={col.status}
                className="rounded-2xl bg-slate-950/60 border border-slate-800/80 p-3.5 flex flex-col gap-3 min-w-[240px]"
              >
                {/* Column Header */}
                <div className="flex items-center justify-between pb-2 border-b border-slate-800/60">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-200 tracking-tight">
                      {col.label}
                    </span>
                    <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${col.countBg}`}>
                      {columnDeals.length}
                    </span>
                  </div>
                </div>

                {/* Deal Cards */}
                <div className="space-y-3 min-h-[140px]">
                  {columnDeals.length === 0 ? (
                    <div className="py-8 text-center border-2 border-dashed border-slate-800/60 rounded-xl text-slate-600 text-xs">
                      No deals in this stage
                    </div>
                  ) : (
                    columnDeals.map((deal: DealListItem) => (
                      <Link key={deal.id} href={`/deals/${deal.id}`} className="block group">
                        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 group-hover:border-amber-500/50 transition-all duration-200 shadow-md space-y-2.5">
                          {/* Top Badges */}
                          <div className="flex items-center justify-between gap-1.5">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-300 bg-amber-950/60 border border-amber-600/40 px-2 py-0.5 rounded-full">
                              {deal.deal_type_display}
                            </span>
                            {deal.is_installment && (
                              <span className="text-[10px] text-sky-300 bg-sky-950/60 border border-sky-700/40 px-1.5 py-0.5 rounded-full flex items-center gap-1">
                                <Layers className="w-2.5 h-2.5" /> Plan
                              </span>
                            )}
                          </div>

                          {/* Property Title */}
                          <div>
                            <h4 className="text-sm font-bold text-white group-hover:text-amber-300 transition-colors line-clamp-1">
                              {deal.property_title}
                            </h4>
                            <p className="text-[11px] text-slate-400 truncate mt-0.5">
                              {deal.property_city}
                            </p>
                          </div>

                          {/* Client & Price */}
                          <div className="pt-2 border-t border-slate-800/80 flex flex-col gap-1">
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-slate-400 truncate flex items-center gap-1">
                                <Users className="w-3 h-3 text-slate-500" /> {deal.client_name}
                              </span>
                            </div>
                            <div className="flex items-center justify-between mt-1">
                              <span className="text-sm font-bold text-emerald-400 font-mono">
                                {formatPrice(deal.agreed_price)}
                              </span>
                              <span className="text-[10px] text-slate-500 flex items-center gap-1">
                                <UserCheck className="w-3 h-3 text-amber-400" /> {deal.agent_name?.split(" ")[0] || "Agent"}
                              </span>
                            </div>
                          </div>
                        </div>
                      </Link>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Table View */
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Property Listing</TableHead>
              <TableHead>Client</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Stage</TableHead>
              <TableHead>Agreed Price</TableHead>
              <TableHead>Commission</TableHead>
              <TableHead>Agent</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.results.map((deal) => (
              <TableRow key={deal.id}>
                <TableCell>
                  <div>
                    <Link
                      href={`/deals/${deal.id}`}
                      className="font-bold text-white hover:text-amber-300 transition-colors block text-sm max-w-xs truncate"
                    >
                      {deal.property_title}
                    </Link>
                    <span className="text-xs text-slate-500">{deal.property_city}</span>
                  </div>
                </TableCell>

                <TableCell>
                  <div>
                    <span className="text-xs font-semibold text-slate-200 block">{deal.client_name}</span>
                    <span className="text-[11px] text-slate-500 font-mono">{deal.client_phone}</span>
                  </div>
                </TableCell>

                <TableCell>
                  <span className="text-xs text-slate-300 font-medium capitalize">
                    {deal.deal_type_display}
                  </span>
                </TableCell>

                <TableCell>
                  <Badge variant={deal.deal_status} size="sm" />
                </TableCell>

                <TableCell>
                  <span className="text-xs font-bold text-emerald-400 font-mono">
                    {formatPrice(deal.agreed_price)}
                  </span>
                </TableCell>

                <TableCell>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-mono text-slate-300">
                      {deal.commission_amount ? formatPrice(deal.commission_amount) : "N/A"}
                    </span>
                    <Badge variant={deal.commission_status === "paid" ? "paid" : "pending"} size="sm" dot={false}>
                      {deal.commission_status_display}
                    </Badge>
                  </div>
                </TableCell>

                <TableCell>
                  <span className="text-xs text-slate-300 flex items-center gap-1">
                    <UserCheck className="w-3 h-3 text-amber-400" />
                    {deal.agent_name}
                  </span>
                </TableCell>

                <TableCell className="text-right">
                  <Link href={`/deals/${deal.id}`}>
                    <Button variant="ghost" size="sm">
                      Details
                    </Button>
                  </Link>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      {/* Pagination Controls (for Table view) */}
      {viewMode === "table" && data && data.total_pages > 1 && (
        <div className="flex items-center justify-between pt-4 border-t border-slate-800">
          <p className="text-xs text-slate-400">
            Showing Page <strong className="text-white">{data.current_page}</strong> of{" "}
            <strong className="text-white">{data.total_pages}</strong> ({data.count} Total Deals)
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              leftIcon={<ChevronLeft className="w-4 h-4" />}
              disabled={data.current_page <= 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              rightIcon={<ChevronRight className="w-4 h-4" />}
              disabled={data.current_page >= data.total_pages}
              onClick={() => setCurrentPage((p) => p + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
