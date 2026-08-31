"use client";

import React, { useState, useEffect, useCallback, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Users,
  Phone,
  Mail,
  MapPin,
  DollarSign,
  Building,
  UserCheck,
  Edit,
  Trash2,
  ArrowLeft,
  Handshake,
  FileText,
  CreditCard,
  CheckCircle2,
  ShieldAlert,
  Calendar,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/components/ui/Toast";
import { Button } from "@/components/ui/Button";
import { Badge, BadgeVariant } from "@/components/ui/Badge";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { Modal } from "@/components/ui/Modal";
import { Skeleton } from "@/components/ui/Skeleton";
import {
  ClientDetail,
  fetchClient,
  deleteClient,
  ClientType,
} from "@/lib/clients";

export default function ClientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const clientId = resolvedParams.id;

  const router = useRouter();
  const { user } = useAuth();
  const { showToast } = useToast();

  const isEditor = user?.role === "admin" || user?.role === "agent";

  const [client, setClient] = useState<ClientDetail | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isUnauthorized, setIsUnauthorized] = useState<boolean>(false);

  // Modals state
  const [showDeleteModal, setShowDeleteModal] = useState<boolean>(false);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  const loadClient = useCallback(async () => {
    setIsLoading(true);
    setIsUnauthorized(false);
    try {
      const data = await fetchClient(clientId);
      setClient(data);
    } catch (err: any) {
      if (err?.status === 404 || err?.status === 403) {
        setIsUnauthorized(true);
      } else {
        showToast({
          type: "error",
          title: "Load Error",
          message: err?.message || "Failed to load client details.",
        });
      }
    } finally {
      setIsLoading(false);
    }
  }, [clientId, showToast]);

  useEffect(() => {
    loadClient();
  }, [loadClient]);

  const handleDeleteClient = async () => {
    setIsDeleting(true);
    try {
      await deleteClient(clientId);
      showToast({
        type: "success",
        title: "Client Removed",
        message: "The client record has been permanently removed.",
      });
      router.push("/clients");
    } catch (err: any) {
      showToast({
        type: "error",
        title: "Delete Failed",
        message: err?.message || "Failed to delete client.",
      });
      setIsDeleting(false);
      setShowDeleteModal(false);
    }
  };

  const formatBudget = (min?: string | null, max?: string | null) => {
    if (!min && !max) return "Unspecified";
    const formatNumber = (val: string) => {
      const n = Number(val);
      if (isNaN(n)) return val;
      if (n >= 10000000) return `${(n / 10000000).toFixed(2)} Crore`;
      if (n >= 100000) return `${(n / 100000).toFixed(2)} Lakh`;
      return n.toLocaleString();
    };

    if (min && max) return `PKR ${formatNumber(min)} - PKR ${formatNumber(max)}`;
    if (min) return `Min: PKR ${formatNumber(min)}`;
    if (max) return `Max: PKR ${formatNumber(max)}`;
    return "N/A";
  };

  const getClientTypeBadgeVariant = (type: ClientType): BadgeVariant => {
    switch (type) {
      case "buyer":
        return "sold";
      case "seller":
        return "gold";
      case "tenant":
        return "rented";
      case "landlord":
        return "admin";
      default:
        return "neutral";
    }
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

  if (isUnauthorized || !client) {
    return (
      <div className="glass-panel max-w-lg mx-auto my-12 p-8 rounded-2xl text-center space-y-4 border border-rose-800/40">
        <div className="w-14 h-14 mx-auto rounded-2xl bg-rose-950/60 border border-rose-700/50 flex items-center justify-center text-rose-400 shadow-xl shadow-rose-950/30">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h3 className="text-lg font-bold text-white tracking-tight">
          Client Profile Not Accessible
        </h3>
        <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed">
          This client record either does not exist or is assigned to another agency agent. Agent access is strictly restricted to assigned portfolios.
        </p>
        <Link href="/clients" className="inline-block mt-2">
          <Button variant="gold" size="sm" leftIcon={<ArrowLeft className="w-4 h-4" />}>
            Return to Your Clients
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Top Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <Link href="/clients">
          <Button
            variant="outline"
            size="sm"
            leftIcon={<ArrowLeft className="w-4 h-4" />}
          >
            All Clients
          </Button>
        </Link>

        {isEditor && (
          <div className="flex items-center gap-2.5">
            <Link href={`/clients/${client.id}/edit`}>
              <Button
                variant="outline"
                size="sm"
                leftIcon={<Edit className="w-4 h-4 text-amber-400" />}
              >
                Edit Profile
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
          </div>
        )}
      </div>

      {/* Client Header Card */}
      <Card variant="glass">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-600 to-amber-400 flex items-center justify-center text-slate-950 font-black text-xl shadow-lg shadow-amber-950/30 flex-shrink-0">
                {client.full_name.charAt(0).toUpperCase()}
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Badge variant={getClientTypeBadgeVariant(client.client_type)}>
                    {client.client_type_display}
                  </Badge>
                  <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold">
                    via {client.source_display}
                  </span>
                </div>
                <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">
                  {client.full_name}
                </h1>
                <div className="flex flex-wrap items-center gap-4 mt-2 text-xs text-slate-400">
                  <span className="flex items-center gap-1 font-mono text-slate-300">
                    <Phone className="w-3.5 h-3.5 text-slate-500" />
                    {client.phone_number}
                  </span>
                  {client.email && (
                    <span className="flex items-center gap-1 text-slate-300">
                      <Mail className="w-3.5 h-3.5 text-slate-500" />
                      {client.email}
                    </span>
                  )}
                  {client.cnic && (
                    <span className="font-mono text-slate-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                      CNIC: {client.cnic}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 text-left md:text-right">
              <span className="text-[11px] uppercase font-semibold text-slate-500 block">Assigned Handling Agent</span>
              <span className="text-sm font-bold text-amber-300 flex items-center md:justify-end gap-1.5 mt-0.5">
                <UserCheck className="w-4 h-4 text-amber-400" />
                {client.assigned_agent_details?.full_name || client.assigned_agent_name || "Unassigned"}
              </span>
              <span className="block text-[11px] text-slate-500 mt-0.5">
                {client.assigned_agent_details?.email || "Agency Portfolio"}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Details Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column: Requirements & Notes */}
        <div className="md:col-span-2 space-y-6">
          {/* Target Requirements */}
          <Card variant="glass">
            <CardHeader>
              <CardTitle>
                <DollarSign className="w-4 h-4 text-emerald-400" />
                Target Property Requirements & Budget
              </CardTitle>
              <CardDescription>
                Criteria used for matching available agency listings.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800">
                <span className="text-slate-500 font-semibold block uppercase">Budget Range</span>
                <span className="text-sm font-bold text-emerald-400 font-mono mt-0.5 block">
                  {formatBudget(client.budget_min, client.budget_max)}
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800">
                <span className="text-slate-500 font-semibold block uppercase">Transaction Preference</span>
                <span className="text-sm font-bold text-white capitalize mt-0.5 block">
                  {client.preferred_listing_type ? `For ${client.preferred_listing_type}` : "Any (Sale or Rent)"}
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800">
                <span className="text-slate-500 font-semibold block uppercase">Target City</span>
                <span className="text-sm font-bold text-white mt-0.5 block">
                  {client.preferred_city || "Any City"}
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800">
                <span className="text-slate-500 font-semibold block uppercase">Target Locality / Sector</span>
                <span className="text-sm font-bold text-white mt-0.5 block">
                  {client.preferred_locality || "Unspecified Locality"}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Interaction Notes */}
          <Card variant="glass">
            <CardHeader>
              <CardTitle>
                <FileText className="w-4 h-4 text-purple-400" />
                Agent Notes & Discussion History
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-line">
                {client.notes || "No special interaction notes recorded for this client."}
              </p>
            </CardContent>
          </Card>

          {/* Linked Deals Section (Placeholder ready for Deals module) */}
          <Card variant="glass">
            <CardHeader>
              <CardTitle>
                <Handshake className="w-4 h-4 text-blue-400" />
                Linked Deals & Transactions
              </CardTitle>
              <CardDescription>
                Active agreements, bookings, and closed contracts involving this client.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="p-6 rounded-xl bg-slate-950/40 border border-slate-800/80 text-center space-y-2">
                <Handshake className="w-8 h-8 mx-auto text-slate-600" />
                <p className="text-xs font-semibold text-slate-400">
                  No Active Deal Contracts Linked Yet
                </p>
                <p className="text-[11px] text-slate-500 max-w-sm mx-auto">
                  When a sale or rental deal is booked with this client in the Deals module, transaction terms and installment schedules will appear here.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Contact & Address Record */}
        <div className="space-y-6">
          <Card variant="glass">
            <CardHeader>
              <CardTitle>
                <MapPin className="w-4 h-4 text-sky-400" />
                Address Record
              </CardTitle>
            </CardHeader>
            <CardContent className="text-xs space-y-3">
              <div>
                <span className="text-slate-500 font-semibold block uppercase">Residential / Business Address</span>
                <span className="text-slate-200 mt-1 block leading-relaxed">
                  {client.address || "No formal address entered"}
                </span>
              </div>

              <div className="pt-3 border-t border-slate-800/80 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Registered:</span>
                  <span className="text-slate-300 font-mono">
                    {new Date(client.created_at).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Last Profile Update:</span>
                  <span className="text-slate-300 font-mono">
                    {new Date(client.updated_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Delete Client Profile?"
        description="This action cannot be undone. Removing this client will unbind contact history and related leads."
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
              onClick={handleDeleteClient}
            >
              Confirm Delete
            </Button>
          </>
        }
      >
        <p className="text-sm text-slate-300">
          Are you sure you want to delete <strong className="text-white">"{client.full_name}"</strong> from the agency CRM?
        </p>
      </Modal>
    </div>
  );
}
