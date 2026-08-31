"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import {
  CreditCard,
  Search,
  SlidersHorizontal,
  RotateCcw,
  Building2,
  Users,
  DollarSign,
  Calendar,
  AlertTriangle,
  Receipt,
  Plus,
  CheckCircle2,
  Clock,
  ChevronLeft,
  ChevronRight,
  ArrowRight,
  TrendingDown,
  Percent,
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
  PaymentListItem,
  PaginatedPaymentsResponse,
  fetchPayments,
  PaymentMethod,
  PaymentEffectiveStatus,
} from "@/lib/payments";
import { RecordPaymentModal } from "@/components/payments/RecordPaymentModal";
import { PaymentReceiptModal } from "@/components/payments/PaymentReceiptModal";

type QuickTab = "all" | "overdue" | "pending" | "partial" | "paid";

export default function PaymentsListPage() {
  const { user } = useAuth();
  const { showToast } = useToast();

  const isAgent = user?.role === "agent";
  const canRecordPayment = user?.role === "admin" || user?.role === "accountant";

  // Quick Tab state
  const [activeTab, setActiveTab] = useState<QuickTab>("all");

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [methodFilter, setMethodFilter] = useState<string>("");
  const [dueDateAfter, setDueDateAfter] = useState<string>("");
  const [dueDateBefore, setDueDateBefore] = useState<string>("");
  const [currentPage, setCurrentPage] = useState<number>(1);

  const [showFilters, setShowFilters] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [data, setData] = useState<PaginatedPaymentsResponse | null>(null);

  // Modals state
  const [selectedPaymentForRecord, setSelectedPaymentForRecord] = useState<PaymentListItem | null>(null);
  const [selectedPaymentForReceipt, setSelectedPaymentForReceipt] = useState<string | null>(null);

  const loadPayments = useCallback(async () => {
    setIsLoading(true);
    try {
      const params: Record<string, string | number | boolean | undefined> = {
        search: searchQuery || undefined,
        payment_method: methodFilter || undefined,
        due_date_after: dueDateAfter || undefined,
        due_date_before: dueDateBefore || undefined,
        page: currentPage,
      };

      // Quick Tab handling
      if (activeTab === "overdue") {
        params.overdue = true;
      } else if (activeTab === "pending") {
        params.effective_status = "pending";
      } else if (activeTab === "partial") {
        params.effective_status = "partial";
      } else if (activeTab === "paid") {
        params.effective_status = "paid";
      } else if (statusFilter) {
        params.effective_status = statusFilter;
      }

      const response = await fetchPayments(params);
      setData(response);
    } catch (err: any) {
      showToast({
        type: "error",
        title: "Load Error",
        message: err?.message || "Failed to load payments ledger.",
      });
    } finally {
      setIsLoading(false);
    }
  }, [
    searchQuery,
    activeTab,
    statusFilter,
    methodFilter,
    dueDateAfter,
    dueDateBefore,
    currentPage,
    showToast,
  ]);

  useEffect(() => {
    loadPayments();
  }, [loadPayments]);

  const handleClearFilters = () => {
    setSearchQuery("");
    setActiveTab("all");
    setStatusFilter("");
    setMethodFilter("");
    setDueDateAfter("");
    setDueDateBefore("");
    setCurrentPage(1);
  };

  const hasActiveFilters =
    Boolean(searchQuery) ||
    activeTab !== "all" ||
    Boolean(statusFilter) ||
    Boolean(methodFilter) ||
    Boolean(dueDateAfter) ||
    Boolean(dueDateBefore);

  const formatPrice = (val: string | number) => {
    const num = Number(val);
    return isNaN(num) ? `PKR ${val}` : `PKR ${num.toLocaleString()}`;
  };

  return (
    <div className="space-y-6">
      {/* Top Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h2 className="text-xl md:text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
              <CreditCard className="w-6 h-6 text-amber-400" />
              Payments & Installment Ledger
            </h2>
            {isAgent && (
              <Badge variant="agent" size="sm">
                Scoped to Your Deals
              </Badge>
            )}
          </div>
          <p className="text-xs text-slate-400">
            {data
              ? isAgent
                ? `${data.count} installment records linked to your deal portfolio`
                : `${data.count} payment records across agency transactions`
              : "Loading financial ledger..."}
          </p>
        </div>
      </div>

      {/* Quick Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 border-b border-slate-800">
        <button
          onClick={() => {
            setActiveTab("all");
            setCurrentPage(1);
          }}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-2 ${
            activeTab === "all"
              ? "bg-amber-500 text-slate-950 shadow-md"
              : "bg-slate-900/80 text-slate-400 hover:text-white border border-slate-800"
          }`}
        >
          All Installments
        </button>

        <button
          onClick={() => {
            setActiveTab("overdue");
            setCurrentPage(1);
          }}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-2 ${
            activeTab === "overdue"
              ? "bg-rose-600 text-white shadow-lg shadow-rose-950/50"
              : "bg-slate-900/80 text-rose-400 hover:bg-rose-950/40 border border-rose-800/40"
          }`}
        >
          <AlertTriangle className="w-3.5 h-3.5" />
          Overdue / Late Collections
        </button>

        <button
          onClick={() => {
            setActiveTab("pending");
            setCurrentPage(1);
          }}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-2 ${
            activeTab === "pending"
              ? "bg-amber-500 text-slate-950 shadow-md"
              : "bg-slate-900/80 text-slate-400 hover:text-white border border-slate-800"
          }`}
        >
          <Clock className="w-3.5 h-3.5" />
          Upcoming Scheduled
        </button>

        <button
          onClick={() => {
            setActiveTab("partial");
            setCurrentPage(1);
          }}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-2 ${
            activeTab === "partial"
              ? "bg-amber-500 text-slate-950 shadow-md"
              : "bg-slate-900/80 text-sky-400 hover:text-white border border-slate-800"
          }`}
        >
          Partially Paid
        </button>

        <button
          onClick={() => {
            setActiveTab("paid");
            setCurrentPage(1);
          }}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-2 ${
            activeTab === "paid"
              ? "bg-amber-500 text-slate-950 shadow-md"
              : "bg-slate-900/80 text-emerald-400 hover:text-white border border-slate-800"
          }`}
        >
          <CheckCircle2 className="w-3.5 h-3.5" />
          Fully Settled
        </button>
      </div>

      {/* Search & Filter Controls */}
      <Card variant="glass">
        <CardContent className="p-4 md:p-5 space-y-4">
          <div className="flex flex-col md:flex-row items-center gap-3">
            <div className="flex-1 w-full">
              <Input
                placeholder="Search payments by property title, client name, or transaction reference..."
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
                label="Effective Status"
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setCurrentPage(1);
                }}
                options={[
                  { value: "", label: "All Effective Statuses" },
                  { value: "paid", label: "Paid (Fully Settled)" },
                  { value: "partial", label: "Partial (On Track)" },
                  { value: "partial_overdue", label: "Partial Overdue" },
                  { value: "overdue", label: "Overdue (Untouched & Late)" },
                  { value: "pending", label: "Pending (Scheduled)" },
                ]}
              />

              <Select
                label="Payment Method"
                value={methodFilter}
                onChange={(e) => {
                  setMethodFilter(e.target.value);
                  setCurrentPage(1);
                }}
                options={[
                  { value: "", label: "All Payment Methods" },
                  { value: "bank_transfer", label: "Bank Transfer / Wire" },
                  { value: "cheque", label: "Cheque / Pay Order" },
                  { value: "cash", label: "Cash" },
                  { value: "online", label: "Online Gateway" },
                  { value: "other", label: "Other" },
                ]}
              />

              <Input
                label="Due Date After"
                type="date"
                value={dueDateAfter}
                onChange={(e) => {
                  setDueDateAfter(e.target.value);
                  setCurrentPage(1);
                }}
              />

              <Input
                label="Due Date Before"
                type="date"
                value={dueDateBefore}
                onChange={(e) => {
                  setDueDateBefore(e.target.value);
                  setCurrentPage(1);
                }}
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Payments Table */}
      {isLoading ? (
        <TableSkeleton rows={8} cols={7} />
      ) : !data || data.results.length === 0 ? (
        <EmptyState
          icon={<CreditCard className="w-8 h-8" />}
          title={
            hasActiveFilters
              ? "No Matching Payment Records"
              : "No Payment Records Found"
          }
          description={
            hasActiveFilters
              ? "No payment records match your active search or filters. Try clearing filter settings."
              : "No payments recorded in the system yet. Installments can be generated directly from Deal detail pages."
          }
          actionLabel={hasActiveFilters ? "Clear Filters" : undefined}
          onAction={hasActiveFilters ? handleClearFilters : undefined}
        />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Deal & Asset</TableHead>
              <TableHead>Client</TableHead>
              <TableHead>Installment</TableHead>
              <TableHead>Due Date</TableHead>
              <TableHead>Scheduled</TableHead>
              <TableHead>Amount Paid</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.results.map((p: PaymentListItem) => (
              <TableRow key={p.id}>
                <TableCell>
                  <div>
                    <Link
                      href={`/deals/${p.deal}`}
                      className="font-bold text-white hover:text-amber-300 transition-colors block text-sm max-w-xs truncate"
                    >
                      {p.property_title}
                    </Link>
                    <span className="text-xs text-slate-500 flex items-center gap-1">
                      Agent: {p.agent_name}
                    </span>
                  </div>
                </TableCell>

                <TableCell>
                  <span className="text-xs font-semibold text-slate-200 block">
                    {p.client_name}
                  </span>
                </TableCell>

                <TableCell>
                  <span className="font-mono text-xs text-slate-300">
                    #{p.installment_number || 1}
                    {p.total_installments ? ` of ${p.total_installments}` : ""}
                  </span>
                </TableCell>

                <TableCell>
                  <span className="font-mono text-xs text-slate-300 flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-slate-500" />
                    {p.due_date}
                  </span>
                </TableCell>

                <TableCell>
                  <span className="font-mono text-xs text-slate-300 font-semibold">
                    {formatPrice(p.amount)}
                  </span>
                </TableCell>

                <TableCell>
                  <div>
                    <span className="font-mono text-xs font-bold text-emerald-400 block">
                      {formatPrice(p.amount_paid)}
                    </span>
                    {Number(p.remaining_balance) > 0 && (
                      <span className="font-mono text-[10px] text-amber-400 block">
                        Bal: {formatPrice(p.remaining_balance)}
                      </span>
                    )}
                  </div>
                </TableCell>

                <TableCell>
                  <Badge variant={p.effective_status as any} size="sm">
                    {p.effective_status.replace("_", " ").toUpperCase()}
                  </Badge>
                </TableCell>

                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1.5">
                    {canRecordPayment && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedPaymentForRecord(p)}
                      >
                        Record
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      leftIcon={<Receipt className="w-3.5 h-3.5 text-amber-400" />}
                      onClick={() => setSelectedPaymentForReceipt(p.id)}
                    >
                      Receipt
                    </Button>
                  </div>
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
            <strong className="text-white">{data.total_pages}</strong> ({data.count} Total Records)
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

      {/* Record Payment Modal */}
      <RecordPaymentModal
        isOpen={Boolean(selectedPaymentForRecord)}
        onClose={() => setSelectedPaymentForRecord(null)}
        payment={selectedPaymentForRecord}
        onPaymentUpdated={loadPayments}
      />

      {/* Printable Receipt Modal */}
      <PaymentReceiptModal
        isOpen={Boolean(selectedPaymentForReceipt)}
        onClose={() => setSelectedPaymentForReceipt(null)}
        paymentId={selectedPaymentForReceipt}
      />
    </div>
  );
}
