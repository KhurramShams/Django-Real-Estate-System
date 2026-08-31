"use client";

import React, { useState, useEffect } from "react";
import { Printer, Download, CheckCircle2, Building, User, Calendar, CreditCard, ShieldCheck } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { Badge } from "@/components/ui/Badge";
import { PaymentReceiptData, fetchPaymentReceipt } from "@/lib/payments";

export interface PaymentReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  paymentId: string | null;
}

export const PaymentReceiptModal: React.FC<PaymentReceiptModalProps> = ({
  isOpen,
  onClose,
  paymentId,
}) => {
  const [receipt, setReceipt] = useState<PaymentReceiptData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    if (isOpen && paymentId) {
      setIsLoading(true);
      fetchPaymentReceipt(paymentId)
        .then((data) => setReceipt(data))
        .catch(() => {})
        .finally(() => setIsLoading(false));
    } else {
      setReceipt(null);
    }
  }, [isOpen, paymentId]);

  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  const formatPrice = (val: string | number) => {
    const num = Number(val);
    return isNaN(num) ? `PKR ${val}` : `PKR ${num.toLocaleString()}`;
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Official Payment Receipt & Invoicing Record"
      description="Agency certified financial transaction receipt."
      size="lg"
      footer={
        <>
          <Button variant="outline" size="sm" onClick={onClose}>
            Close
          </Button>
          <Button
            variant="gold"
            size="sm"
            leftIcon={<Printer className="w-4 h-4" />}
            onClick={handlePrint}
          >
            Print Receipt
          </Button>
        </>
      }
    >
      {isLoading || !receipt ? (
        <div className="space-y-4 p-4 animate-pulse">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-32 w-full rounded-xl" />
          <Skeleton className="h-24 w-full rounded-xl" />
        </div>
      ) : (
        <div className="p-4 sm:p-6 bg-slate-950 text-slate-100 rounded-xl border border-slate-800 space-y-6 print:border-none print:p-0">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-base font-black tracking-tight text-white uppercase">
                  My House Management
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40">
                  OFFICIAL RECEIPT
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Executive Agency Deal Financial Ledger & Acknowledgment
              </p>
            </div>

            <div className="sm:text-right">
              <span className="text-xs font-mono font-bold text-amber-300 block">
                {receipt.receipt_number}
              </span>
              <span className="text-[11px] text-slate-400 block font-mono">
                Issued: {new Date(receipt.issued_at).toLocaleDateString()}
              </span>
            </div>
          </div>

          {/* Parties Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="p-3 rounded-lg bg-slate-900/90 border border-slate-800 space-y-1">
              <span className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1">
                <User className="w-3 h-3 text-amber-400" /> Client (Payer)
              </span>
              <div className="font-bold text-white text-sm">{receipt.client.full_name}</div>
              <div className="text-slate-400 font-mono">{receipt.client.phone_number}</div>
              {receipt.client.cnic && (
                <div className="text-slate-500 font-mono text-[11px]">CNIC: {receipt.client.cnic}</div>
              )}
            </div>

            <div className="p-3 rounded-lg bg-slate-900/90 border border-slate-800 space-y-1">
              <span className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1">
                <Building className="w-3 h-3 text-sky-400" /> Property Asset
              </span>
              <div className="font-bold text-white text-sm truncate">{receipt.property.title}</div>
              <div className="text-slate-400">{receipt.property.address}, {receipt.property.city}</div>
              <div className="text-slate-500 text-[11px]">Type: {receipt.property.property_type.toUpperCase()}</div>
            </div>
          </div>

          {/* Payment Breakdown Table */}
          <div className="rounded-xl border border-slate-800 overflow-hidden">
            <table className="w-full text-xs">
              <thead className="bg-slate-900 text-slate-400">
                <tr>
                  <th className="p-3 text-left">Description / Milestone</th>
                  <th className="p-3 text-center">Due Date</th>
                  <th className="p-3 text-right">Scheduled</th>
                  <th className="p-3 text-right">Amount Paid</th>
                  <th className="p-3 text-right">Balance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80 bg-slate-950/60">
                <tr>
                  <td className="p-3 font-semibold text-white">
                    Installment #{receipt.installment_number || 1}
                    {receipt.total_installments ? ` of ${receipt.total_installments}` : ""}
                  </td>
                  <td className="p-3 text-center font-mono text-slate-300">
                    {receipt.due_date}
                  </td>
                  <td className="p-3 text-right font-mono text-slate-300">
                    {formatPrice(receipt.amount)}
                  </td>
                  <td className="p-3 text-right font-mono font-bold text-emerald-400">
                    {formatPrice(receipt.amount_paid)}
                  </td>
                  <td className="p-3 text-right font-mono text-amber-300">
                    {formatPrice(receipt.remaining_balance)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Payment Method & Reference */}
          <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <span className="text-slate-500 block uppercase font-semibold text-[10px]">Payment Method</span>
              <span className="text-white font-medium capitalize">{receipt.payment_method_display}</span>
              {receipt.transaction_reference && (
                <span className="block text-slate-400 font-mono text-[11px]">
                  Ref: {receipt.transaction_reference}
                </span>
              )}
            </div>

            <div className="sm:text-right">
              <span className="text-slate-500 block uppercase font-semibold text-[10px]">Effective Status</span>
              <Badge variant={receipt.effective_status as any} size="sm">
                {receipt.effective_status.toUpperCase()}
              </Badge>
            </div>
          </div>

          {/* Footer & Verification Signature */}
          <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500">
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              Verified by Agent: <strong className="text-slate-300">{receipt.agent.full_name}</strong>
            </span>
            <span>Computer Generated Document</span>
          </div>
        </div>
      )}
    </Modal>
  );
};
