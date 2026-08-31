"use client";

import React from "react";
import { PropertyForm } from "@/components/properties/PropertyForm";

export default function NewPropertyPage() {
  return (
    <div className="py-2">
      <PropertyForm isEditMode={false} />
    </div>
  );
}
