"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Handshake,
  Building2,
  Users,
  DollarSign,
  Calendar,
  Percent,
  Layers,
  ArrowLeft,
  Save,
  AlertCircle,
  FileText,
  Clock,
  Sparkles,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/components/ui/Toast";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/Card";
import {
  DealDetail,
  DealFormData,
  DealType,
  DealStatus,
  CommissionStatus,
  InstallmentFrequency,
  createDeal,
  updateDeal,
} from "@/lib/deals";
import { fetchProperties, PropertyListItem } from "@/lib/properties";
import { fetchClients, ClientListItem, AgentUser, fetchAgents } from "@/lib/clients";

export interface DealFormProps {
  initialData?: DealDetail;
  isEditMode?: boolean;
}

export const DealForm: React.FC<DealFormProps> = ({
  initialData,
  isEditMode = false,
}) => {
  const router = useRouter();
  const { user } = useAuth();
  const { showToast } = useToast();

  const isAdmin = user?.role === "admin";

  const [formData, setFormData] = useState<DealFormData>({
    property: initialData?.property || "",
    client: initialData?.client || "",
    agent: initialData?.agent || (isAdmin ? null : user?.id || null),
    deal_type: (initialData?.deal_type as DealType) || "sale",
    deal_status: (initialData?.deal_status as DealStatus) || "negotiation",
    agreed_price: initialData?.agreed_price || "",
    booking_amount: initialData?.booking_amount || "0",
    commission_percentage: initialData?.commission_percentage || "1.00",
    commission_amount: initialData?.commission_amount || "",
    commission_status: (initialData?.commission_status as CommissionStatus) || "pending",
    is_installment: initialData?.is_installment || false,
    number_of_installments: initialData?.number_of_installments || 4,
    installment_frequency: (initialData?.installment_frequency as InstallmentFrequency) || "quarterly",
    payment_terms_notes: initialData?.payment_terms_notes || "",
    deal_date: initialData?.deal_date || new Date().toISOString().split("T")[0],
    expected_completion_date: initialData?.expected_completion_date || "",
    notes: initialData?.notes || "",
  });

  const [properties, setProperties] = useState<PropertyListItem[]>([]);
  const [clients, setClients] = useState<ClientListItem[]>([]);
  const [agents, setAgents] = useState<AgentUser[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  useEffect(() => {
    fetchProperties({ page_size: 100 })
      .then((res) => setProperties(res.results || []))
      .catch(() => {});

    fetchClients({ page_size: 100 })
      .then((res) => setClients(res.results || []))
      .catch(() => {});

    if (isAdmin) {
      fetchAgents()
        .then((res) => setAgents(res))
        .catch(() => {});
    }
  }, [isAdmin]);

  // Live Commission Calculation Preview
  const liveCommissionAmount = useMemo(() => {
    const price = Number(formData.agreed_price);
    const pct = Number(formData.commission_percentage);
    if (!isNaN(price) && price > 0 && !isNaN(pct) && pct >= 0) {
      return ((price * pct) / 100).toFixed(2);
    }
    return "0.00";
  }, [formData.agreed_price, formData.commission_percentage]);

  // When a property is selected, auto-sync deal_type and price if not set
  const handlePropertyChange = (propertyId: string) => {
    const selectedProp = properties.find((p) => p.id === propertyId);
    if (selectedProp) {
      setFormData((prev) => ({
        ...prev,
        property: propertyId,
        deal_type: selectedProp.listing_type as DealType,
        agreed_price: prev.agreed_price ? prev.agreed_price : selectedProp.price,
      }));
    } else {
      setFormData((prev) => ({ ...prev, property: propertyId }));
    }
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.property) {
      newErrors.property = "Property selection is required.";
    }

    if (!formData.client) {
      newErrors.client = "Client selection is required.";
    }

    const price = Number(formData.agreed_price);
    if (!formData.agreed_price || isNaN(price) || price <= 0) {
      newErrors.agreed_price = "Agreed price must be a positive number greater than zero.";
    }

    const booking = Number(formData.booking_amount || 0);
    if (isNaN(booking) || booking < 0) {
      newErrors.booking_amount = "Booking / token amount cannot be negative.";
    } else if (booking > price) {
      newErrors.booking_amount = "Booking amount cannot exceed the total agreed price.";
    }

    const pct = Number(formData.commission_percentage);
    if (formData.commission_percentage && (isNaN(pct) || pct < 0 || pct > 100)) {
      newErrors.commission_percentage = "Commission percentage must be between 0% and 100%.";
    }

    if (formData.is_installment) {
      const installments = Number(formData.number_of_installments);
      if (!installments || installments <= 0) {
        newErrors.number_of_installments = "Please enter a valid number of installments (e.g. 4).";
      }
      if (!formData.installment_frequency) {
        newErrors.installment_frequency = "Installment frequency is required for installment deals.";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) {
      showToast({
        type: "error",
        title: "Validation Error",
        message: "Please correct the highlighted fields before submitting.",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const payload: DealFormData = {
        ...formData,
        agreed_price: Number(formData.agreed_price),
        booking_amount: Number(formData.booking_amount || 0),
        commission_percentage: formData.commission_percentage ? Number(formData.commission_percentage) : null,
        number_of_installments: formData.is_installment ? Number(formData.number_of_installments) : null,
        installment_frequency: formData.is_installment ? formData.installment_frequency : null,
        agent: isAdmin ? formData.agent : undefined,
      };

      if (isEditMode && initialData) {
        await updateDeal(initialData.id, payload);
        showToast({
          type: "success",
          title: "Deal Updated",
          message: "Deal contract terms updated successfully.",
        });
        router.push(`/deals/${initialData.id}`);
      } else {
        const created = await createDeal(payload);
        showToast({
          type: "success",
          title: "Deal Created",
          message: `Deal transaction successfully created in pipeline.`,
        });
        router.push(`/deals/${created.id}`);
      }
    } catch (err: any) {
      let errorMsg = err?.message || "Failed to save deal.";
      if (err?.data?.property) {
        errorMsg = Array.isArray(err.data.property) ? err.data.property.join(" ") : String(err.data.property);
      }
      showToast({
        type: "error",
        title: "Submission Error",
        message: errorMsg,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-4xl mx-auto">
      {/* Top Action Bar */}
      <div className="flex items-center justify-between gap-4">
        <Button
          type="button"
          variant="outline"
          size="sm"
          leftIcon={<ArrowLeft className="w-4 h-4" />}
          onClick={() => router.back()}
        >
          Back
        </Button>
        <h2 className="text-xl md:text-2xl font-bold text-white tracking-tight flex items-center gap-2">
          <Handshake className="w-6 h-6 text-amber-400" />
          {isEditMode ? "Edit Deal Transaction" : "Initiate Deal Transaction"}
        </h2>
        <Button
          type="submit"
          variant="gold"
          size="sm"
          isLoading={isSubmitting}
          leftIcon={<Save className="w-4 h-4" />}
        >
          {isEditMode ? "Save Changes" : "Create Deal"}
        </Button>
      </div>

      {/* 1. Core Transaction Parties & Property */}
      <Card variant="glass">
        <CardHeader>
          <CardTitle>
            <Building2 className="w-4 h-4 text-amber-400" />
            Property & Client Selection
          </CardTitle>
          <CardDescription>
            Select the inventory property and party client entering into this agreement.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Property Selector */}
            <Select
              label="Select Property *"
              value={formData.property}
              onChange={(e) => handlePropertyChange(e.target.value)}
              options={[
                { value: "", label: "-- Choose Property Listing --" },
                ...properties.map((p) => ({
                  value: p.id,
                  label: `${p.title} (${p.city} - PKR ${p.price}) [${p.listing_type.toUpperCase()}]`,
                })),
              ]}
              error={errors.property}
              disabled={isEditMode}
            />

            {/* Client Selector */}
            <Select
              label="Select Client *"
              value={formData.client}
              onChange={(e) =>
                setFormData({ ...formData, client: e.target.value })
              }
              options={[
                { value: "", label: "-- Choose Client --" },
                ...clients.map((c) => ({
                  value: c.id,
                  label: `${c.full_name} (${c.phone_number}) - ${c.client_type_display}`,
                })),
              ]}
              error={errors.client}
              disabled={isEditMode}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Select
              label="Deal Type *"
              value={formData.deal_type}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  deal_type: e.target.value as DealType,
                })
              }
              options={[
                { value: "sale", label: "Sale Transaction" },
                { value: "rent", label: "Rental Lease" },
              ]}
              helperText="Must match property listing type."
            />

            <Select
              label="Pipeline Stage *"
              value={formData.deal_status}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  deal_status: e.target.value as DealStatus,
                })
              }
              options={[
                { value: "negotiation", label: "In Negotiation" },
                { value: "booked", label: "Token / Booked" },
                { value: "in_progress", label: "In Progress" },
                { value: "completed", label: "Closed / Completed" },
                { value: "cancelled", label: "Cancelled" },
              ]}
            />

            {/* Assigned Agent */}
            {isAdmin ? (
              <Select
                label="Handling Agent"
                value={formData.agent || ""}
                onChange={(e) =>
                  setFormData({ ...formData, agent: e.target.value || null })
                }
                options={[
                  { value: "", label: "Default (Assign to Creator)" },
                  ...agents.map((a) => ({
                    value: a.id,
                    label: `${a.full_name || a.email} (${a.role.toUpperCase()})`,
                  })),
                ]}
              />
            ) : (
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                  Handling Agent
                </label>
                <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800 text-xs text-slate-300 flex items-center justify-between">
                  <span className="font-semibold text-amber-300">
                    {initialData?.agent_name || user?.full_name || "Self"}
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono">Agent-Locked</span>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* 2. Financial Terms & Live Commission Engine */}
      <Card variant="glass">
        <CardHeader>
          <CardTitle>
            <DollarSign className="w-4 h-4 text-emerald-400" />
            Financial Terms & Commission Engine
          </CardTitle>
          <CardDescription>
            Agreed transaction price, token deposit, and automated commission derivation.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Agreed Price (PKR) *"
              type="number"
              placeholder="e.g. 95000000"
              value={formData.agreed_price}
              onChange={(e) =>
                setFormData({ ...formData, agreed_price: e.target.value })
              }
              error={errors.agreed_price}
              required
            />

            <Input
              label="Booking / Token Amount (PKR)"
              type="number"
              placeholder="e.g. 10000000"
              value={formData.booking_amount}
              onChange={(e) =>
                setFormData({ ...formData, booking_amount: e.target.value })
              }
              error={errors.booking_amount}
              helperText="Initial down payment / token advance."
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-xl bg-slate-950/60 border border-slate-800">
            <Input
              label="Agency Commission Rate (%)"
              type="number"
              step="0.01"
              placeholder="e.g. 1.00"
              value={formData.commission_percentage || ""}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  commission_percentage: e.target.value,
                })
              }
              error={errors.commission_percentage}
              leftIcon={<Percent className="w-4 h-4 text-amber-400" />}
              helperText="Authoritative rate driving calculated commission."
            />

            <div className="flex flex-col gap-1.5 justify-center">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Calculated Commission Preview
              </span>
              <div className="text-xl font-bold text-emerald-400 font-mono">
                PKR {Number(liveCommissionAmount).toLocaleString()}
              </div>
              <p className="text-[11px] text-slate-500">
                Auto-computed from {formData.commission_percentage || "0"}% of PKR {Number(formData.agreed_price || 0).toLocaleString()}.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 3. Installment Plan Structure */}
      <Card variant="glass">
        <CardHeader>
          <CardTitle>
            <Layers className="w-4 h-4 text-sky-400" />
            Installment Plan Structure
          </CardTitle>
          <CardDescription>
            Configure installment frequency and scheduled milestone terms.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <label className="flex items-center gap-3 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={formData.is_installment}
              onChange={(e) =>
                setFormData({ ...formData, is_installment: e.target.checked })
              }
              className="w-4 h-4 rounded text-amber-500 focus:ring-amber-400 bg-slate-900 border-slate-700"
            />
            <span className="text-sm font-semibold text-white">
              Structure this transaction on an Installment Schedule
            </span>
          </label>

          {formData.is_installment && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-xl bg-slate-950/60 border border-slate-800 animate-in fade-in duration-200">
              <Input
                label="Number of Installments *"
                type="number"
                placeholder="e.g. 4"
                value={formData.number_of_installments || ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    number_of_installments: e.target.value,
                  })
                }
                error={errors.number_of_installments}
              />

              <Select
                label="Installment Frequency *"
                value={formData.installment_frequency || ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    installment_frequency: e.target.value as InstallmentFrequency,
                  })
                }
                options={[
                  { value: "monthly", label: "Monthly (Every 1 Month)" },
                  { value: "quarterly", label: "Quarterly (Every 3 Months)" },
                  { value: "bi_annually", label: "Bi-Annually (Every 6 Months)" },
                  { value: "annually", label: "Annually (Every 12 Months)" },
                ]}
                error={errors.installment_frequency}
              />
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-300">
              Payment Terms & Milestones
            </label>
            <textarea
              rows={2}
              placeholder="e.g. 20% on booking, 4 equal quarterly installments, balance on possession..."
              value={formData.payment_terms_notes || ""}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  payment_terms_notes: e.target.value,
                })
              }
              className="w-full bg-slate-900/80 text-slate-100 text-sm rounded-xl border border-slate-800 p-3 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
            />
          </div>
        </CardContent>
      </Card>

      {/* 4. Dates & Negotiation Remarks */}
      <Card variant="glass">
        <CardHeader>
          <CardTitle>
            <Calendar className="w-4 h-4 text-purple-400" />
            Key Dates & Negotiation Notes
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Deal Date *"
              type="date"
              value={formData.deal_date}
              onChange={(e) =>
                setFormData({ ...formData, deal_date: e.target.value })
              }
              required
            />

            <Input
              label="Expected Completion Date"
              type="date"
              value={formData.expected_completion_date || ""}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  expected_completion_date: e.target.value,
                })
              }
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-300">
              General Remarks & Negotiation History
            </label>
            <textarea
              rows={3}
              placeholder="Record legal verification status, token cheque details, lawyer contacts..."
              value={formData.notes || ""}
              onChange={(e) =>
                setFormData({ ...formData, notes: e.target.value })
              }
              className="w-full bg-slate-900/80 text-slate-100 text-sm rounded-xl border border-slate-800 p-3 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
            />
          </div>
        </CardContent>
        <CardFooter>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => router.back()}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="gold"
            size="md"
            isLoading={isSubmitting}
            leftIcon={<Save className="w-4 h-4" />}
          >
            {isEditMode ? "Save Changes" : "Initiate Deal"}
          </Button>
        </CardFooter>
      </Card>
    </form>
  );
};
