"use client";

import React, { useState, useEffect } from "react";
import { DollarSign, Calendar, CreditCard, FileText, CheckCircle2, Save } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { useToast } from "@/components/ui/Toast";
import { PaymentListItem, PaymentMethod, updatePayment } from "@/lib/payments";

export interface RecordPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  payment: PaymentListItem | null;
  onPaymentUpdated: () => void;
}

export const RecordPaymentModal: React.FC<RecordPaymentModalProps> = ({
  isOpen,
  onClose,
  payment,
  onPaymentUpdated,
}) => {
  const { showToast } = useToast();

  const [amountPaid, setAmountPaid] = useState<string>("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("bank_transfer");
  const [paidDate, setPaidDate] = useState<string>("");
  const [transactionRef, setTransactionRef] = useState<string>("");
  const [notes, setNotes] = useState<string>("");

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    if (payment) {
      setAmountPaid(payment.amount_paid || "0.00");
      setPaymentMethod(payment.payment_method || "bank_transfer");
      setPaidDate(payment.paid_date || new Date().toISOString().split("T")[0]);
      setTransactionRef(payment.transaction_reference || "");
      setError("");
    }
  }, [payment]);

  if (!payment) return null;

  const totalScheduled = Number(payment.amount) || 0;
  const currentPaid = Number(amountPaid) || 0;
  const calculatedRemaining = Math.max(0, totalScheduled - currentPaid);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isNaN(currentPaid) || currentPaid < 0) {
      setError("Amount paid cannot be negative.");
      return;
    }

    if (currentPaid > totalScheduled) {
      setError("Amount paid cannot exceed scheduled installment amount.");
      return;
    }

    setIsSubmitting(true);
    try {
      await updatePayment(payment.id, {
        amount_paid: currentPaid,
        payment_method: paymentMethod,
        paid_date: currentPaid > 0 ? paidDate || new Date().toISOString().split("T")[0] : null,
        transaction_reference: transactionRef,
        notes: notes || undefined,
      });

      showToast({
        type: "success",
        title: "Payment Recorded",
        message: `Successfully recorded collection for Installment #${payment.installment_number || 1}.`,
      });

      onPaymentUpdated();
      onClose();
    } catch (err: any) {
      setError(err?.message || "Failed to record payment.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Record Payment — Installment #${payment.installment_number || 1}`}
      description={`Property: ${payment.property_title} | Client: ${payment.client_name}`}
      footer={
        <>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            form="record-payment-form"
            variant="gold"
            size="sm"
            isLoading={isSubmitting}
            leftIcon={<Save className="w-4 h-4" />}
          >
            Save Collection
          </Button>
        </>
      }
    >
      <form id="record-payment-form" onSubmit={handleSubmit} className="space-y-4">
        {/* Financial Summary */}
        <div className="grid grid-cols-3 gap-3 p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 text-xs">
          <div>
            <span className="text-slate-500 uppercase block font-semibold">Scheduled</span>
            <span className="text-sm font-bold text-white font-mono mt-0.5 block">
              PKR {totalScheduled.toLocaleString()}
            </span>
          </div>
          <div>
            <span className="text-slate-500 uppercase block font-semibold">Collected</span>
            <span className="text-sm font-bold text-emerald-400 font-mono mt-0.5 block">
              PKR {currentPaid.toLocaleString()}
            </span>
          </div>
          <div>
            <span className="text-slate-500 uppercase block font-semibold">Balance</span>
            <span className="text-sm font-bold text-amber-300 font-mono mt-0.5 block">
              PKR {calculatedRemaining.toLocaleString()}
            </span>
          </div>
        </div>

        {error && (
          <div className="p-2.5 rounded-lg bg-rose-950/80 border border-rose-700/60 text-xs text-rose-300">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input
            label="Amount Paid (PKR) *"
            type="number"
            value={amountPaid}
            onChange={(e) => setAmountPaid(e.target.value)}
            placeholder="e.g. 500000"
            required
            leftIcon={<DollarSign className="w-4 h-4 text-emerald-400" />}
          />

          <Select
            label="Payment Method *"
            value={paymentMethod}
            onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
            options={[
              { value: "bank_transfer", label: "Bank Wire / Online Transfer" },
              { value: "cheque", label: "Cheque / Pay Order" },
              { value: "cash", label: "Direct Cash Deposit" },
              { value: "online", label: "Online Card / Gateway" },
              { value: "other", label: "Other Method" },
            ]}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input
            label="Collection / Payment Date"
            type="date"
            value={paidDate}
            onChange={(e) => setPaidDate(e.target.value)}
            leftIcon={<Calendar className="w-4 h-4 text-amber-400" />}
          />

          <Input
            label="Transaction Reference / Cheque #"
            placeholder="e.g. HBL-FT-987654321"
            value={transactionRef}
            onChange={(e) => setTransactionRef(e.target.value)}
            leftIcon={<CreditCard className="w-4 h-4 text-sky-400" />}
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold uppercase tracking-wider text-slate-300">
            Receipt / Ledger Remarks
          </label>
          <textarea
            rows={2}
            placeholder="e.g. Cheque cleared from Meezan Bank, token receipt acknowledged..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full bg-slate-900/80 text-slate-100 text-xs rounded-xl border border-slate-800 p-2.5 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
          />
        </div>
      </form>
    </Modal>
  );
};
