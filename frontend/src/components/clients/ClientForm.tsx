"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Users,
  Phone,
  Mail,
  MapPin,
  DollarSign,
  Building,
  UserCheck,
  ArrowLeft,
  Save,
  FileText,
  ShieldCheck,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/components/ui/Toast";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/Card";
import {
  ClientDetail,
  ClientFormData,
  ClientType,
  ClientSource,
  AgentUser,
  createClient,
  updateClient,
  fetchAgents,
} from "@/lib/clients";
import { PropertyType, ListingType } from "@/lib/properties";

export interface ClientFormProps {
  initialData?: ClientDetail;
  isEditMode?: boolean;
}

export const ClientForm: React.FC<ClientFormProps> = ({
  initialData,
  isEditMode = false,
}) => {
  const router = useRouter();
  const { user } = useAuth();
  const { showToast } = useToast();

  const isAdmin = user?.role === "admin";

  const [formData, setFormData] = useState<ClientFormData>({
    full_name: initialData?.full_name || "",
    phone_number: initialData?.phone_number || "",
    email: initialData?.email || "",
    cnic: initialData?.cnic || "",
    address: initialData?.address || "",
    client_type: (initialData?.client_type as ClientType) || "buyer",
    source: (initialData?.source as ClientSource) || "walk_in",
    preferred_property_type: initialData?.preferred_property_type || "",
    preferred_listing_type: initialData?.preferred_listing_type || "",
    budget_min: initialData?.budget_min || "",
    budget_max: initialData?.budget_max || "",
    preferred_city: initialData?.preferred_city || "Islamabad",
    preferred_locality: initialData?.preferred_locality || "",
    assigned_agent: initialData?.assigned_agent || (isAdmin ? null : user?.id || null),
    notes: initialData?.notes || "",
  });

  const [agents, setAgents] = useState<AgentUser[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  useEffect(() => {
    if (isAdmin) {
      fetchAgents()
        .then((data) => setAgents(data))
        .catch(() => {});
    }
  }, [isAdmin]);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.full_name.trim()) {
      newErrors.full_name = "Full name is required.";
    }

    if (!formData.phone_number.trim()) {
      newErrors.phone_number = "Phone number is required.";
    }

    if (
      formData.email &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)
    ) {
      newErrors.email = "Please enter a valid email address.";
    }

    const minB = formData.budget_min ? Number(formData.budget_min) : null;
    const maxB = formData.budget_max ? Number(formData.budget_max) : null;

    if (minB !== null && minB < 0) {
      newErrors.budget_min = "Minimum budget cannot be negative.";
    }

    if (maxB !== null && maxB < 0) {
      newErrors.budget_max = "Maximum budget cannot be negative.";
    }

    if (minB !== null && maxB !== null && maxB < minB) {
      newErrors.budget_max = "Maximum budget must be greater than or equal to minimum budget.";
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
      // Clean empty strings for optional decimals
      const payload: ClientFormData = {
        ...formData,
        budget_min: formData.budget_min ? Number(formData.budget_min) : undefined,
        budget_max: formData.budget_max ? Number(formData.budget_max) : undefined,
        assigned_agent: isAdmin ? formData.assigned_agent : undefined, // If agent, let backend auto-assign or preserve
      };

      if (isEditMode && initialData) {
        await updateClient(initialData.id, payload);
        showToast({
          type: "success",
          title: "Client Updated",
          message: `Record for "${formData.full_name}" updated successfully.`,
        });
        router.push(`/clients/${initialData.id}`);
      } else {
        const created = await createClient(payload);
        showToast({
          type: "success",
          title: "Client Registered",
          message: `Client "${created.full_name}" successfully added to pipeline.`,
        });
        router.push(`/clients/${created.id}`);
      }
    } catch (err: any) {
      const errorMsg =
        err?.message || "Failed to save client. Please check inputs.";
      showToast({
        type: "error",
        title: "Submission Error",
        message: errorMsg,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const agentOptions = [
    { value: "", label: "Unassigned / Auto-assign" },
    ...agents.map((a) => ({
      value: a.id,
      label: `${a.full_name || a.email} (${a.role.toUpperCase()})`,
    })),
  ];

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
        <h2 className="text-xl md:text-2xl font-bold text-white tracking-tight">
          {isEditMode ? "Edit Client Profile" : "Register New Client"}
        </h2>
        <Button
          type="submit"
          variant="gold"
          size="sm"
          isLoading={isSubmitting}
          leftIcon={<Save className="w-4 h-4" />}
        >
          {isEditMode ? "Save Changes" : "Register Client"}
        </Button>
      </div>

      {/* 1. Contact & Identity Information */}
      <Card variant="glass">
        <CardHeader>
          <CardTitle>
            <Users className="w-4 h-4 text-amber-400" />
            Contact & Identity Details
          </CardTitle>
          <CardDescription>
            Basic client identification and contact information.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Full Name *"
              placeholder="e.g. Babar Azam"
              value={formData.full_name}
              onChange={(e) =>
                setFormData({ ...formData, full_name: e.target.value })
              }
              error={errors.full_name}
              required
            />

            <Input
              label="Phone Number *"
              placeholder="e.g. +92-300-1234567"
              value={formData.phone_number}
              onChange={(e) =>
                setFormData({ ...formData, phone_number: e.target.value })
              }
              error={errors.phone_number}
              leftIcon={<Phone className="w-4 h-4" />}
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Email Address"
              type="email"
              placeholder="e.g. client@example.com"
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
              error={errors.email}
              leftIcon={<Mail className="w-4 h-4" />}
            />

            <Input
              label="CNIC Number (Optional)"
              placeholder="e.g. 42101-1234567-1"
              value={formData.cnic}
              onChange={(e) =>
                setFormData({ ...formData, cnic: e.target.value })
              }
            />
          </div>

          <Input
            label="Residential / Business Address"
            placeholder="e.g. House 14, Street 5, Sector F-8/3, Islamabad"
            value={formData.address}
            onChange={(e) =>
              setFormData({ ...formData, address: e.target.value })
            }
          />
        </CardContent>
      </Card>

      {/* 2. Client Classification & Assignment */}
      <Card variant="glass">
        <CardHeader>
          <CardTitle>
            <UserCheck className="w-4 h-4 text-emerald-400" />
            Classification & Agent Assignment
          </CardTitle>
          <CardDescription>
            Pipeline role, lead acquisition channel, and handling agent.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Select
            label="Client Type *"
            value={formData.client_type}
            onChange={(e) =>
              setFormData({
                ...formData,
                client_type: e.target.value as ClientType,
              })
            }
            options={[
              { value: "buyer", label: "Buyer (Investor / Homeowner)" },
              { value: "seller", label: "Seller (Property Owner)" },
              { value: "tenant", label: "Tenant (Renter)" },
              { value: "landlord", label: "Landlord (Rental Owner)" },
            ]}
          />

          <Select
            label="Lead Source *"
            value={formData.source}
            onChange={(e) =>
              setFormData({
                ...formData,
                source: e.target.value as ClientSource,
              })
            }
            options={[
              { value: "walk_in", label: "Walk-in Agency Visit" },
              { value: "referral", label: "Client / Agent Referral" },
              { value: "website", label: "Website Inquiry" },
              { value: "social_media", label: "Social Media (IG / FB)" },
              { value: "portal_zameen", label: "Zameen.com Portal" },
              { value: "portal_olx", label: "OLX Portal" },
              { value: "direct_call", label: "Direct Phone Call" },
              { value: "other", label: "Other" },
            ]}
          />

          {/* Assigned Agent: Editable for ADMIN, Disabled/Auto for AGENT */}
          {isAdmin ? (
            <Select
              label="Assigned Agent"
              value={formData.assigned_agent || ""}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  assigned_agent: e.target.value || null,
                })
              }
              options={agentOptions}
              helperText="Admin privilege: assign or reassign handling agent."
            />
          ) : (
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                Assigned Agent
              </label>
              <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800 text-xs text-slate-300 flex items-center justify-between">
                <span className="font-semibold text-amber-300">
                  {initialData?.assigned_agent_name || user?.full_name || "Self (Assigned to You)"}
                </span>
                <span className="text-[10px] text-slate-500 font-mono">Agent-Locked</span>
              </div>
              <p className="text-[11px] text-slate-500">
                Only Admin can reassign handling agents.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 3. Property Requirements & Budget Range */}
      <Card variant="glass">
        <CardHeader>
          <CardTitle>
            <DollarSign className="w-4 h-4 text-sky-400" />
            Requirements & Budget Parameters
          </CardTitle>
          <CardDescription>
            Target criteria for automated inventory matching and deal proposals.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select
              label="Preferred Property Type"
              value={formData.preferred_property_type || ""}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  preferred_property_type: e.target.value as PropertyType,
                })
              }
              options={[
                { value: "", label: "Any Property Type" },
                { value: "residential", label: "Residential" },
                { value: "commercial", label: "Commercial" },
                { value: "plot", label: "Plot / Land" },
                { value: "rental", label: "Rental Residence" },
              ]}
            />

            <Select
              label="Transaction Preference"
              value={formData.preferred_listing_type || ""}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  preferred_listing_type: e.target.value as ListingType,
                })
              }
              options={[
                { value: "", label: "Any (Sale or Rent)" },
                { value: "sale", label: "For Purchase / Sale" },
                { value: "rent", label: "For Rent / Lease" },
              ]}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Min Budget (PKR)"
              type="number"
              placeholder="e.g. 50000000"
              value={formData.budget_min || ""}
              onChange={(e) =>
                setFormData({ ...formData, budget_min: e.target.value })
              }
              error={errors.budget_min}
            />

            <Input
              label="Max Budget (PKR)"
              type="number"
              placeholder="e.g. 120000000"
              value={formData.budget_max || ""}
              onChange={(e) =>
                setFormData({ ...formData, budget_max: e.target.value })
              }
              error={errors.budget_max}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Preferred City"
              placeholder="e.g. Islamabad, Lahore"
              value={formData.preferred_city || ""}
              onChange={(e) =>
                setFormData({ ...formData, preferred_city: e.target.value })
              }
            />

            <Input
              label="Preferred Locality / Sector"
              placeholder="e.g. Sector F-7, DHA Phase 2"
              value={formData.preferred_locality || ""}
              onChange={(e) =>
                setFormData({ ...formData, preferred_locality: e.target.value })
              }
            />
          </div>
        </CardContent>
      </Card>

      {/* 4. Agent Remarks & Notes */}
      <Card variant="glass">
        <CardHeader>
          <CardTitle>
            <FileText className="w-4 h-4 text-purple-400" />
            Agent Remarks & Interaction Notes
          </CardTitle>
          <CardDescription>
            Special preferences, meeting notes, or schedule constraints.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <textarea
            rows={4}
            placeholder="Record client timeline, payment preference (cash vs installments), specific family requirements..."
            value={formData.notes || ""}
            onChange={(e) =>
              setFormData({ ...formData, notes: e.target.value })
            }
            className="w-full bg-slate-900/80 text-slate-100 text-sm rounded-xl border border-slate-800 p-3.5 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500"
          />
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
            {isEditMode ? "Save Changes" : "Register Client"}
          </Button>
        </CardFooter>
      </Card>
    </form>
  );
};
