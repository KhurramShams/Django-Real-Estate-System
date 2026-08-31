"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Users,
  Plus,
  Search,
  SlidersHorizontal,
  RotateCcw,
  Phone,
  Mail,
  MapPin,
  ChevronLeft,
  ChevronRight,
  UserCheck,
  Building,
  DollarSign,
  ArrowRight,
  Shield,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/components/ui/Toast";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Badge, BadgeVariant } from "@/components/ui/Badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/Table";
import { TableSkeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import {
  ClientListItem,
  PaginatedClientsResponse,
  fetchClients,
  ClientType,
  ClientSource,
  AgentUser,
  fetchAgents,
} from "@/lib/clients";

export default function ClientsListPage() {
  const { user } = useAuth();
  const { showToast } = useToast();

  const isEditor = user?.role === "admin" || user?.role === "agent";
  const isAdmin = user?.role === "admin";
  const isAgent = user?.role === "agent";

  // Filter & Search state
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("");
  const [sourceFilter, setSourceFilter] = useState<string>("");
  const [agentFilter, setAgentFilter] = useState<string>("");
  const [cityFilter, setCityFilter] = useState<string>("");
  const [minBudget, setMinBudget] = useState<string>("");
  const [maxBudget, setMaxBudget] = useState<string>("");
  const [currentPage, setCurrentPage] = useState<number>(1);

  const [showFilters, setShowFilters] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [data, setData] = useState<PaginatedClientsResponse | null>(null);
  const [agents, setAgents] = useState<AgentUser[]>([]);

  useEffect(() => {
    if (isAdmin) {
      fetchAgents()
        .then((agentList) => setAgents(agentList))
        .catch(() => {});
    }
  }, [isAdmin]);

  const loadClients = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetchClients({
        search: searchQuery || undefined,
        client_type: typeFilter || undefined,
        source: sourceFilter || undefined,
        assigned_agent: agentFilter || undefined,
        preferred_city: cityFilter || undefined,
        min_budget: minBudget || undefined,
        max_budget: maxBudget || undefined,
        page: currentPage,
      });
      setData(response);
    } catch (err: any) {
      showToast({
        type: "error",
        title: "Load Error",
        message: err?.message || "Failed to load clients directory.",
      });
    } finally {
      setIsLoading(false);
    }
  }, [
    searchQuery,
    typeFilter,
    sourceFilter,
    agentFilter,
    cityFilter,
    minBudget,
    maxBudget,
    currentPage,
    showToast,
  ]);

  useEffect(() => {
    loadClients();
  }, [loadClients]);

  const handleClearFilters = () => {
    setSearchQuery("");
    setTypeFilter("");
    setSourceFilter("");
    setAgentFilter("");
    setCityFilter("");
    setMinBudget("");
    setMaxBudget("");
    setCurrentPage(1);
  };

  const hasActiveFilters =
    Boolean(searchQuery) ||
    Boolean(typeFilter) ||
    Boolean(sourceFilter) ||
    Boolean(agentFilter) ||
    Boolean(cityFilter) ||
    Boolean(minBudget) ||
    Boolean(maxBudget);

  const formatBudget = (min?: string | null, max?: string | null) => {
    if (!min && !max) return "Budget Unspecified";
    const formatNumber = (val: string) => {
      const n = Number(val);
      if (isNaN(n)) return val;
      if (n >= 10000000) return `${(n / 10000000).toFixed(1)} Cr`;
      if (n >= 100000) return `${(n / 100000).toFixed(1)} Lac`;
      return n.toLocaleString();
    };

    if (min && max) return `PKR ${formatNumber(min)} - ${formatNumber(max)}`;
    if (min) return `Min: PKR ${formatNumber(min)}`;
    if (max) return `Max: PKR ${formatNumber(max)}`;
    return "N/A";
  };

  const getClientTypeBadgeVariant = (type: ClientType): BadgeVariant => {
    switch (type) {
      case "buyer":
        return "sold"; // Emerald
      case "seller":
        return "gold"; // Amber gold
      case "tenant":
        return "rented"; // Blue
      case "landlord":
        return "admin"; // Purple
      default:
        return "neutral";
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h2 className="text-xl md:text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
              <Users className="w-6 h-6 text-amber-400" />
              Clients & Leads Directory
            </h2>
            {isAgent && (
              <Badge variant="agent" size="sm">
                Assigned to You
              </Badge>
            )}
          </div>
          <p className="text-xs text-slate-400">
            {data
              ? isAgent
                ? `${data.count} client profiles assigned directly to your portfolio`
                : `${data.count} client profiles active agency-wide`
              : "Loading clients directory..."}
          </p>
        </div>

        {isEditor && (
          <Link href="/clients/new">
            <Button
              variant="gold"
              size="sm"
              leftIcon={<Plus className="w-4 h-4" />}
            >
              Add Client
            </Button>
          </Link>
        )}
      </div>

      {/* Search & Filter Controls */}
      <Card variant="glass">
        <CardContent className="p-4 md:p-5 space-y-4">
          <div className="flex flex-col md:flex-row items-center gap-3">
            <div className="flex-1 w-full">
              <Input
                placeholder="Search clients by full name, phone number, email, or CNIC..."
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
                label="Client Type"
                value={typeFilter}
                onChange={(e) => {
                  setTypeFilter(e.target.value);
                  setCurrentPage(1);
                }}
                options={[
                  { value: "", label: "All Client Types" },
                  { value: "buyer", label: "Buyer" },
                  { value: "seller", label: "Seller" },
                  { value: "tenant", label: "Tenant" },
                  { value: "landlord", label: "Landlord" },
                ]}
              />

              <Select
                label="Lead Source"
                value={sourceFilter}
                onChange={(e) => {
                  setSourceFilter(e.target.value);
                  setCurrentPage(1);
                }}
                options={[
                  { value: "", label: "All Sources" },
                  { value: "walk_in", label: "Walk-in" },
                  { value: "referral", label: "Referral" },
                  { value: "website", label: "Website" },
                  { value: "social_media", label: "Social Media" },
                  { value: "portal_zameen", label: "Zameen.com" },
                  { value: "portal_olx", label: "OLX" },
                  { value: "direct_call", label: "Direct Call" },
                  { value: "other", label: "Other" },
                ]}
              />

              {isAdmin && (
                <Select
                  label="Assigned Agent"
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

              <Input
                label="Preferred City"
                placeholder="e.g. Islamabad"
                value={cityFilter}
                onChange={(e) => {
                  setCityFilter(e.target.value);
                  setCurrentPage(1);
                }}
              />

              <Input
                label="Min Budget (PKR)"
                type="number"
                placeholder="Min Budget"
                value={minBudget}
                onChange={(e) => {
                  setMinBudget(e.target.value);
                  setCurrentPage(1);
                }}
              />

              <Input
                label="Max Budget (PKR)"
                type="number"
                placeholder="Max Budget"
                value={maxBudget}
                onChange={(e) => {
                  setMaxBudget(e.target.value);
                  setCurrentPage(1);
                }}
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Main Table Content */}
      {isLoading ? (
        <TableSkeleton rows={8} cols={6} />
      ) : !data || data.results.length === 0 ? (
        <EmptyState
          icon={<Users className="w-8 h-8" />}
          title={
            hasActiveFilters
              ? "No Matching Clients Found"
              : isAgent
              ? "No Clients Assigned to You Yet"
              : "No Clients Registered"
          }
          description={
            hasActiveFilters
              ? "No client records match your search or filter parameters. Try clearing filters."
              : isAgent
              ? "Your client portfolio is currently empty. Register your first buyer, seller, or tenant lead."
              : "No clients registered in the system yet. Click 'Add Client' to register an entry."
          }
          actionLabel={hasActiveFilters ? "Clear Filters" : isEditor ? "Add Client" : undefined}
          onAction={hasActiveFilters ? handleClearFilters : isEditor ? () => (window.location.href = "/clients/new") : undefined}
        />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Client Name</TableHead>
              <TableHead>Phone / Contact</TableHead>
              <TableHead>Client Type</TableHead>
              <TableHead>Lead Source</TableHead>
              <TableHead>Target Location</TableHead>
              <TableHead>Budget Range</TableHead>
              <TableHead>Assigned Agent</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.results.map((client) => (
              <TableRow key={client.id}>
                <TableCell>
                  <div>
                    <Link
                      href={`/clients/${client.id}`}
                      className="font-bold text-white hover:text-amber-300 transition-colors block text-sm"
                    >
                      {client.full_name}
                    </Link>
                    {client.email && (
                      <span className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                        <Mail className="w-3 h-3 text-slate-600" />
                        {client.email}
                      </span>
                    )}
                  </div>
                </TableCell>

                <TableCell>
                  <span className="text-xs text-slate-300 font-mono flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-slate-500" />
                    {client.phone_number}
                  </span>
                </TableCell>

                <TableCell>
                  <Badge variant={getClientTypeBadgeVariant(client.client_type)} size="sm">
                    {client.client_type_display}
                  </Badge>
                </TableCell>

                <TableCell>
                  <span className="text-xs text-slate-400 font-medium">
                    {client.source_display}
                  </span>
                </TableCell>

                <TableCell>
                  <span className="text-xs text-slate-300 flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-slate-500" />
                    {client.preferred_city || "Any City"}
                  </span>
                </TableCell>

                <TableCell>
                  <span className="text-xs font-semibold text-emerald-400 font-mono">
                    {formatBudget(client.budget_min, client.budget_max)}
                  </span>
                </TableCell>

                <TableCell>
                  <span className="text-xs text-slate-300 flex items-center gap-1.5">
                    <UserCheck className="w-3.5 h-3.5 text-amber-400" />
                    {client.assigned_agent_name || "Unassigned"}
                  </span>
                </TableCell>

                <TableCell className="text-right">
                  <Link href={`/clients/${client.id}`}>
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

      {/* Pagination Controls */}
      {data && data.total_pages > 1 && (
        <div className="flex items-center justify-between pt-4 border-t border-slate-800">
          <p className="text-xs text-slate-400">
            Showing Page <strong className="text-white">{data.current_page}</strong> of{" "}
            <strong className="text-white">{data.total_pages}</strong> ({data.count} Total Clients)
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
