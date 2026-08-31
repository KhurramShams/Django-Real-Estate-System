"use client";

import React, { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { PropertyDetail, fetchProperty } from "@/lib/properties";
import { PropertyForm } from "@/components/properties/PropertyForm";
import { Skeleton } from "@/components/ui/Skeleton";
import { useToast } from "@/components/ui/Toast";

export default function EditPropertyPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const propertyId = resolvedParams.id;

  const router = useRouter();
  const { showToast } = useToast();
  const [property, setProperty] = useState<PropertyDetail | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    fetchProperty(propertyId)
      .then((data) => {
        setProperty(data);
      })
      .catch((err) => {
        showToast({
          type: "error",
          title: "Load Error",
          message: err?.message || "Failed to load property for editing.",
        });
        router.push("/properties");
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [propertyId, router, showToast]);

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto space-y-6 py-4 animate-pulse">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-64 w-full rounded-2xl" />
        <Skeleton className="h-48 w-full rounded-2xl" />
      </div>
    );
  }

  if (!property) return null;

  return (
    <div className="py-2">
      <PropertyForm initialData={property} isEditMode={true} />
    </div>
  );
}
