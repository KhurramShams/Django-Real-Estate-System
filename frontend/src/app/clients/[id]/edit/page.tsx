"use client";

import React, { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { ClientDetail, fetchClient } from "@/lib/clients";
import { ClientForm } from "@/components/clients/ClientForm";
import { Skeleton } from "@/components/ui/Skeleton";
import { useToast } from "@/components/ui/Toast";

export default function EditClientPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const clientId = resolvedParams.id;

  const router = useRouter();
  const { showToast } = useToast();
  const [client, setClient] = useState<ClientDetail | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    fetchClient(clientId)
      .then((data) => {
        setClient(data);
      })
      .catch((err) => {
        showToast({
          type: "error",
          title: "Load Error",
          message: err?.message || "Failed to load client for editing.",
        });
        router.push("/clients");
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [clientId, router, showToast]);

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto space-y-6 py-4 animate-pulse">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-64 w-full rounded-2xl" />
        <Skeleton className="h-48 w-full rounded-2xl" />
      </div>
    );
  }

  if (!client) return null;

  return (
    <div className="py-2">
      <ClientForm initialData={client} isEditMode={true} />
    </div>
  );
}
