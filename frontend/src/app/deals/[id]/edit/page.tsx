"use client";

import React, { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { DealDetail, fetchDeal } from "@/lib/deals";
import { DealForm } from "@/components/deals/DealForm";
import { Skeleton } from "@/components/ui/Skeleton";
import { useToast } from "@/components/ui/Toast";

export default function EditDealPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const dealId = resolvedParams.id;

  const router = useRouter();
  const { showToast } = useToast();
  const [deal, setDeal] = useState<DealDetail | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    fetchDeal(dealId)
      .then((data) => {
        setDeal(data);
      })
      .catch((err) => {
        showToast({
          type: "error",
          title: "Load Error",
          message: err?.message || "Failed to load deal for editing.",
        });
        router.push("/deals");
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [dealId, router, showToast]);

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto space-y-6 py-4 animate-pulse">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-64 w-full rounded-2xl" />
        <Skeleton className="h-48 w-full rounded-2xl" />
      </div>
    );
  }

  if (!deal) return null;

  return (
    <div className="py-2">
      <DealForm initialData={deal} isEditMode={true} />
    </div>
  );
}
