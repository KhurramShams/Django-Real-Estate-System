"use client";

import React, { useState, useEffect, useCallback, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Handshake,
  Building2,
  Users,
  DollarSign,
  Calendar,
  Layers,
  Percent,
  CheckCircle2,
  Edit,
  Trash2,
  ArrowLeft,
  ArrowRight,
  ShieldAlert,
  Clock,
  UserCheck,
  AlertTriangle,
  FileText,
  CreditCard,
  Sparkles,
  Receipt,
  RotateCcw,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/components/ui/Toast";
import { Button } from "@/components/ui/Button";
import { Badge, BadgeVariant } from "@/components/ui/Badge";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/Card";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/Table";
import { Modal } from "@/components/ui/Modal";
import { Skeleton } from "@/components/ui/Skeleton";
import {
  DealDetail,
  DealStatus,
  CommissionStatus,
  fetchDeal,
  updateDeal,
  updateDealCommissionStatus,
  deleteDeal,
  generateInstallmentPlan,
} from "@/lib/deals";
import {
  PaymentListItem,
  fetchPayments,
} from "@/lib/payments";
import { RecordPaymentModal } from "@/components/payments/RecordPaymentModal";
import { PaymentReceiptModal } from "@/components/payments/PaymentReceiptModal";

export default function DealDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const dealId = resolvedParams.id;

  const router = useRouter();
  const { user } = useAuth();
  const { showToast } = useToast();

  const isEditor = user?.role === "admin" || user?.role === "agent";
  const isAdmin = user?.role === "admin";
  const isAccountant = user?.role === "accountant";
  const canRecordPayment = user?.role === "admin" || user?.role === "accountant";

  const [deal, setDeal] = useState<DealDetail | null>(null);
  const [payments, setPayments] = useState<PaymentListItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isUnauthorized, setIsUnauthorized] = useState<boolean>(false);

  // Status Change Confirmation Modal
  const [pendingStatusChange, setPendingStatusChange] = useState<DealStatus | null>(null);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState<boolean>(false);

  // Delete Modal
  const [showDeleteModal, setShowDeleteModal] = useState<boolean>(false);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  // Installment Generation
  const [isGeneratingPlan, setIsGeneratingPlan] = useState<boolean>(false);
  const [showRegenerateModal, setShowRegenerateModal] = useState<boolean>(false);

  // Payment Modals
  const [selectedPaymentForRecord, setSelectedPaymentForRecord] = useState<PaymentListItem | null>(null);
  const [selectedPaymentForReceipt, setSelectedPaymentForReceipt] = useState<string | null>(null);

  const loadDealAndPayments = useCallback(async () => {
    setIsLoading(true);
    setIsUnauthorized(false);
    try {
      const [dealData, paymentsData] = await Promise.all([
        fetchDeal(dealId),
        fetchPayments({ deal: dealId, page_size: 100 }),
      ]);
      setDeal(dealData);
      setPayments(paymentsData.results || []);
    } catch (err: any) {
      if (err?.status === 404 || err?.status === 403) {
        setIsUnauthorized(true);
      } else {
        showToast({
          type: "error",
          title: "Load Error",
          message: err?.message || "Failed to load deal details.",
        });
      }
    } finally {
      setIsLoading(false);
    }
  }, [dealId, showToast]);

  useEffect(() => {
    loadDealAndPayments();
  }, [loadDealAndPayments]);

  const handleStatusChangeRequest = (newStatus: DealStatus) => {
    if (newStatus === "completed" || newStatus === "cancelled") {
      setPendingStatusChange(newStatus);
    } else {
      executeStatusChange(newStatus);
    }
  };

  const executeStatusChange = async (targetStatus: DealStatus) => {
    setIsUpdatingStatus(true);
    try {
      await updateDeal(dealId, { deal_status: targetStatus });
      showToast({
        type: "success",
        title: "Deal Stage Updated",
        message: `Transaction stage transitioned to "${targetStatus}".`,
      });
      setPendingStatusChange(null);
      await loadDealAndPayments();
    } catch (err: any) {
      showToast({
        type: "error",
        title: "Status Update Failed",
        message: err?.message || "Failed to change deal stage.",
      });
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleCommissionStatusChange = async (newStatus: CommissionStatus) => {
    try {
      await updateDealCommissionStatus(dealId, newStatus);
      showToast({
        type: "success",
        title: "Commission Settlement Updated",
        message: `Commission marked as ${newStatus.toUpperCase()}.`,
      });
      await loadDealAndPayments();
    } catch (err: any) {
      showToast({
        type: "error",
        title: "Update Failed",
        message: err?.message || "Failed to update commission status.",
      });
    }
  };

  const handleGeneratePlan = async (force: boolean = false) => {
    setIsGeneratingPlan(true);
    try {
      const res = await generateInstallmentPlan(dealId, force);
      showToast({
        type: "success",
        title: force ? "Installment Plan Regenerated" : "Installment Plan Generated",
        message: res.message || "Installments created successfully.",
      });
      setShowRegenerateModal(false);
      await loadDealAndPayments();
    } catch (err: any) {
      showToast({
        type: "error",
        title: "Generation Failed",
        message: err?.message || "Failed to generate installment plan.",
      });
    } finally {
      setIsGeneratingPlan(false);
    }
  };

  const handleDeleteDeal = async () => {
    setIsDeleting(true);
    try {
      await deleteDeal(dealId);
      showToast({
        type: "success",
        title: "Deal Removed",
        message: "The deal transaction has been deleted.",
      });
      router.push("/deals");
    } catch (err: any) {
      showToast({
        type: "error",
        title: "Delete Failed",
        message: err?.message || "Failed to delete deal.",
      });
      setIsDeleting(false);
      setShowDeleteModal(false);
    }
  };

  const formatPrice = (priceStr: string | number) => {
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

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-5xl mx-auto animate-pulse">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-36 w-full rounded-2xl" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Skeleton className="h-64 md:col-span-2 rounded-2xl" />
          <Skeleton className="h-64 rounded-2xl" />
        </div>
      </div>
    );
  }

  if (isUnauthorized || !deal) {
    return (
      <div className="glass-panel max-w-lg mx-auto my-12 p-8 rounded-2xl text-center space-y-4 border border-rose-800/40">
        <div className="w-14 h-14 mx-auto rounded-2xl bg-rose-950/60 border border-rose-700/50 flex items-center justify-center text-rose-400 shadow-xl shadow-rose-950/30">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h3 className="text-lg font-bold text-white tracking-tight">
          Deal Transaction Not Accessible
        </h3>
        <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed">
          This deal record either does not exist or is managed by another agency agent. Agent access is strictly restricted to assigned deals.
        </p>
        <Link href="/deals" className="inline-block mt-2">
          <Button variant="gold" size="sm" leftIcon={<ArrowLeft className="w-4 h-4" />}>
            Return to Your Deals
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Top Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <Link href="/deals">
          <Button
            variant="outline"
            size="sm"
            leftIcon={<ArrowLeft className="w-4 h-4" />}
          >
            All Deals
          </Button>
        </Link>

        <div className="flex items-center gap-2.5">
          {/* Stage Switcher Dropdown (ADMIN/AGENT) */}
          {isEditor && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400 font-semibold uppercase hidden sm:inline">
                Update Stage:
              </span>
              <select
                value={deal.deal_status}
                onChange={(e) => handleStatusChangeRequest(e.target.value as DealStatus)}
                className="bg-slate-900 text-xs font-semibold text-amber-300 border border-amber-500/40 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-500/50 cursor-pointer"
              >
                <option value="negotiation">In Negotiation</option>
                <option value="booked">Token / Booked</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Closed / Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          )}

          {/* Edit / Delete actions */}
          {isEditor && (
            <>
              <Link href={`/deals/${deal.id}/edit`}>
                <Button
                  variant="outline"
                  size="sm"
                  leftIcon={<Edit className="w-4 h-4 text-amber-400" />}
                >
                  Edit Terms
                </Button>
              </Link>
              <Button
                variant="danger"
                size="sm"
                leftIcon={<Trash2 className="w-4 h-4" />}
                onClick={() => setShowDeleteModal(true)}
              >
                Delete
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Transaction Overview Card */}
      <Card variant="glass">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Badge variant={deal.deal_status} />
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-slate-900 text-amber-300 border border-amber-500/30 uppercase tracking-wider">
                  {deal.deal_type_display}
                </span>
                {deal.is_installment && (
                  <span className="text-xs text-sky-300 bg-sky-950/80 border border-sky-700/50 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                    <Layers className="w-3 h-3" /> Installment Schedule
                  </span>
                )}
              </div>
              <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">
                {deal.property_title}
              </h1>
              <p className="text-xs md:text-sm text-slate-400 mt-1 flex items-center gap-1.5">
                <span>Party: <strong className="text-slate-200">{deal.client_name}</strong></span>
                <span>•</span>
                <span>Agent: <strong className="text-amber-300">{deal.agent_name}</strong></span>
              </p>
            </div>

            <div className="md:text-right">
              <span className="text-xs uppercase font-semibold text-slate-400 block">Agreed Transaction Amount</span>
              <span className="text-2xl md:text-3xl font-black text-emerald-400 tracking-tight font-mono">
                {formatPrice(deal.agreed_price)}
              </span>
              <span className="block text-xs text-slate-400 mt-0.5">
                Token / Booking: <strong className="text-slate-200">{formatPrice(deal.booking_amount)}</strong>
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Linked Entities Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Linked Property Card */}
        <Card variant="glass">
          <CardHeader>
            <CardTitle>
              <Building2 className="w-4 h-4 text-amber-400" />
              Contract Property Listing
            </CardTitle>
            <Link
              href={`/properties/${deal.property}`}
              className="text-xs font-semibold text-amber-400 hover:text-amber-300 flex items-center gap-1"
            >
              Open Listing <ArrowRight className="w-3 h-3" />
            </Link>
          </CardHeader>
          <CardContent className="space-y-2.5 text-xs">
            <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800">
              <h4 className="text-sm font-bold text-white">{deal.property_details?.title || deal.property_title}</h4>
              <p className="text-slate-400 mt-0.5">
                {deal.property_details?.address}, {deal.property_details?.city}
              </p>
              <div className="flex items-center gap-2 mt-2 pt-2 border-t border-slate-800">
                <span className="text-emerald-400 font-bold font-mono">
                  {deal.property_details?.price ? formatPrice(deal.property_details.price) : "Asking Price"}
                </span>
                <span>•</span>
                <span className="text-slate-300">
                  {deal.property_details?.size} {deal.property_details?.size_unit}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Linked Client Card */}
        <Card variant="glass">
          <CardHeader>
            <CardTitle>
              <Users className="w-4 h-4 text-sky-400" />
              Contract Client / Counterparty
            </CardTitle>
            <Link
              href={`/clients/${deal.client}`}
              className="text-xs font-semibold text-amber-400 hover:text-amber-300 flex items-center gap-1"
            >
              Open Client <ArrowRight className="w-3 h-3" />
            </Link>
          </CardHeader>
          <CardContent className="space-y-2.5 text-xs">
            <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800">
              <h4 className="text-sm font-bold text-white">{deal.client_details?.full_name || deal.client_name}</h4>
              <p className="text-slate-400 font-mono mt-0.5">
                {deal.client_details?.phone_number || deal.client_phone}
              </p>
              <div className="flex items-center gap-2 mt-2 pt-2 border-t border-slate-800">
                <span className="text-slate-300">{deal.client_details?.email || "No email"}</span>
                {deal.client_details?.cnic && (
                  <>
                    <span>•</span>
                    <span className="text-slate-400 font-mono">CNIC: {deal.client_details.cnic}</span>
                  </>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Financial & Commission Terms */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Financial & Commission Details */}
        <div className="md:col-span-2 space-y-6">
          <Card variant="glass">
            <CardHeader>
              <CardTitle>
                <DollarSign className="w-4 h-4 text-emerald-400" />
                Financial Breakdown & Commission Engine
              </CardTitle>
              <CardDescription>
                Calculated according to the system commission precedence rules.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800">
                  <span className="text-slate-500 font-semibold block uppercase">Agreed Total</span>
                  <span className="text-sm font-bold text-white font-mono mt-0.5 block">
                    {formatPrice(deal.agreed_price)}
                  </span>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800">
                  <span className="text-slate-500 font-semibold block uppercase">Token / Booking</span>
                  <span className="text-sm font-bold text-amber-300 font-mono mt-0.5 block">
                    {formatPrice(deal.booking_amount)}
                  </span>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800">
                  <span className="text-slate-500 font-semibold block uppercase">Remaining Net</span>
                  <span className="text-sm font-bold text-emerald-400 font-mono mt-0.5 block">
                    {formatPrice(String(Number(deal.agreed_price) - Number(deal.booking_amount || 0)))}
                  </span>
                </div>
              </div>

              {/* Commission Details Card */}
              <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs uppercase font-bold text-amber-400 flex items-center gap-1">
                      <Percent className="w-3.5 h-3.5" /> Agency Commission
                    </span>
                    <Badge
                      variant={deal.commission_status === "paid" ? "paid" : "pending"}
                      size="sm"
                    >
                      {deal.commission_status_display}
                    </Badge>
                  </div>
                  <div className="text-xl font-bold text-emerald-400 font-mono mt-1">
                    {deal.commission_amount ? formatPrice(deal.commission_amount) : "N/A"}
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Driven authoritatively by <strong className="text-amber-300">{deal.commission_percentage || "1.00"}%</strong> commission rate.
                  </p>
                </div>

                {/* Accountant Inline Commission Control */}
                {isAccountant && (
                  <div className="p-3 rounded-xl bg-slate-900 border border-teal-700/50 flex flex-col gap-1.5">
                    <span className="text-[11px] font-bold text-teal-300 uppercase">
                      Accountant Settlement Control
                    </span>
                    <select
                      value={deal.commission_status}
                      onChange={(e) => handleCommissionStatusChange(e.target.value as CommissionStatus)}
                      className="bg-slate-950 text-xs font-semibold text-white border border-slate-700 rounded-lg p-1.5 cursor-pointer focus:ring-2 focus:ring-teal-500"
                    >
                      <option value="pending">Pending Settlement</option>
                      <option value="paid">Settled / Paid</option>
                    </select>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Real Installments & Payments Ledger Table */}
          <Card variant="glass">
            <CardHeader>
              <div className="flex items-center justify-between w-full">
                <div>
                  <CardTitle>
                    <CreditCard className="w-4 h-4 text-teal-400" />
                    Installments & Payment Ledger
                  </CardTitle>
                  <CardDescription>
                    Scheduled installments and collected payment receipts.
                  </CardDescription>
                </div>

                {/* Generation & Regeneration controls */}
                {deal.is_installment && (
                  <div className="flex items-center gap-2">
                    {payments.length === 0 ? (
                      <Button
                        variant="gold"
                        size="sm"
                        isLoading={isGeneratingPlan}
                        leftIcon={<Sparkles className="w-4 h-4" />}
                        onClick={() => handleGeneratePlan(false)}
                      >
                        Generate Plan
                      </Button>
                    ) : isAdmin ? (
                      <Button
                        variant="outline"
                        size="sm"
                        leftIcon={<RotateCcw className="w-4 h-4 text-amber-400" />}
                        onClick={() => setShowRegenerateModal(true)}
                      >
                        Regenerate Plan
                      </Button>
                    ) : null}
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {payments.length === 0 ? (
                <div className="p-6 rounded-xl bg-slate-950/40 border border-slate-800/80 text-center space-y-2">
                  <CreditCard className="w-8 h-8 mx-auto text-slate-600" />
                  <p className="text-xs font-semibold text-slate-400">
                    No Payment Ledger Records Found
                  </p>
                  <p className="text-[11px] text-slate-500 max-w-sm mx-auto">
                    {deal.is_installment
                      ? "Click 'Generate Plan' above to schedule installments for this deal."
                      : "Single lump-sum payments can be tracked in the Payments Ledger."}
                  </p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>#</TableHead>
                      <TableHead>Due Date</TableHead>
                      <TableHead>Scheduled</TableHead>
                      <TableHead>Paid</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Method</TableHead>
                      <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {payments.map((p) => (
                      <TableRow key={p.id}>
                        <TableCell>
                          <span className="font-bold text-white font-mono text-xs">
                            #{p.installment_number || 1}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className="font-mono text-xs text-slate-300">
                            {p.due_date}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className="font-mono text-xs text-slate-300 font-semibold">
                            PKR {Number(p.amount).toLocaleString()}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className="font-mono text-xs text-emerald-400 font-bold">
                            PKR {Number(p.amount_paid).toLocaleString()}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Badge variant={p.effective_status as any} size="sm">
                            {p.effective_status.replace("_", " ").toUpperCase()}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <span className="text-[11px] text-slate-400 capitalize">
                            {p.payment_method_display}
                          </span>
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
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Dates & Notes */}
        <div className="space-y-6">
          <Card variant="glass">
            <CardHeader>
              <CardTitle>
                <Calendar className="w-4 h-4 text-purple-400" />
                Key Milestones & Dates
              </CardTitle>
            </CardHeader>
            <CardContent className="text-xs space-y-3">
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-950/60 border border-slate-800">
                <span className="text-slate-500">Agreement Date:</span>
                <span className="text-slate-200 font-mono font-bold">{deal.deal_date}</span>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-950/60 border border-slate-800">
                <span className="text-slate-500">Target Completion:</span>
                <span className="text-slate-200 font-mono font-bold">
                  {deal.expected_completion_date || "Open Timeline"}
                </span>
              </div>

              <div className="pt-2 border-t border-slate-800/80 space-y-1.5">
                <span className="text-slate-500 block">Record Created:</span>
                <span className="text-slate-400 font-mono block">{new Date(deal.created_at).toLocaleString()}</span>
              </div>
            </CardContent>
          </Card>

          {deal.notes && (
            <Card variant="glass">
              <CardHeader>
                <CardTitle>
                  <FileText className="w-4 h-4 text-amber-400" />
                  Deal Remarks
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-slate-300 whitespace-pre-line leading-relaxed">
                  {deal.notes}
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Confirmation Modal for Completed / Cancelled Status Changes */}
      <Modal
        isOpen={Boolean(pendingStatusChange)}
        onClose={() => setPendingStatusChange(null)}
        title={
          pendingStatusChange === "completed"
            ? "Confirm Deal Completion & Property Status Sync"
            : "Confirm Deal Cancellation"
        }
        description="Changing deal status will synchronize property inventory status."
        footer={
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPendingStatusChange(null)}
              disabled={isUpdatingStatus}
            >
              Cancel
            </Button>
            <Button
              variant={pendingStatusChange === "completed" ? "gold" : "danger"}
              size="sm"
              isLoading={isUpdatingStatus}
              onClick={() => pendingStatusChange && executeStatusChange(pendingStatusChange)}
            >
              Confirm Status Change
            </Button>
          </>
        }
      >
        <div className="space-y-3 text-sm text-slate-300">
          {pendingStatusChange === "completed" ? (
            <div className="p-3 rounded-xl bg-emerald-950/60 border border-emerald-700/50 space-y-1 text-xs text-emerald-200">
              <p className="font-bold flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                Automatic Property Inventory Synchronization:
              </p>
              <p>
                Marking this deal as <strong>Completed</strong> will automatically mark the linked property (<strong className="text-white">{deal.property_title}</strong>) as <strong>{deal.deal_type === "sale" ? "SOLD" : "RENTED"}</strong>.
              </p>
            </div>
          ) : (
            <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-700/50 space-y-1 text-xs text-rose-200">
              <p className="font-bold flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-rose-400" />
                Automatic Property Inventory Synchronization:
              </p>
              <p>
                Marking this deal as <strong>Cancelled</strong> will revert the property status back to <strong>AVAILABLE</strong> (provided no other active negotiations exist).
              </p>
            </div>
          )}
          <p className="text-xs text-slate-400">
            Do you wish to proceed with this transition?
          </p>
        </div>
      </Modal>

      {/* Admin Regenerate Installment Plan Modal */}
      <Modal
        isOpen={showRegenerateModal}
        onClose={() => setShowRegenerateModal(false)}
        title="Regenerate Installment Schedule?"
        description="Destructive action: Existing installments and payment tracking will be replaced."
        footer={
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowRegenerateModal(false)}
              disabled={isGeneratingPlan}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              size="sm"
              isLoading={isGeneratingPlan}
              onClick={() => handleGeneratePlan(true)}
            >
              Force Regenerate Plan
            </Button>
          </>
        }
      >
        <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-700/50 text-xs text-rose-200 space-y-2">
          <p className="font-bold flex items-center gap-1.5">
            <AlertTriangle className="w-4 h-4 text-rose-400" />
            Warning: Overwriting Existing Payment Schedule
          </p>
          <p>
            Regenerating the installment plan will delete all current payment records for this deal and recreate a fresh schedule based on current agreed price and terms.
          </p>
        </div>
      </Modal>

      {/* Delete Deal Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Delete Deal Record?"
        description="This action cannot be undone. All linked installment plan schedules and deal records will be permanently removed."
        footer={
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowDeleteModal(false)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              size="sm"
              isLoading={isDeleting}
              onClick={handleDeleteDeal}
            >
              Confirm Delete
            </Button>
          </>
        }
      >
        <p className="text-sm text-slate-300">
          Are you sure you want to delete this deal for <strong className="text-white">"{deal.property_title}"</strong>?
        </p>
      </Modal>

      {/* Record Payment Modal */}
      <RecordPaymentModal
        isOpen={Boolean(selectedPaymentForRecord)}
        onClose={() => setSelectedPaymentForRecord(null)}
        payment={selectedPaymentForRecord}
        onPaymentUpdated={loadDealAndPayments}
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
