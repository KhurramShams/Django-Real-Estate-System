"use client";

import React from "react";
import { ClientForm } from "@/components/clients/ClientForm";

export default function NewClientPage() {
  return (
    <div className="py-2">
      <ClientForm isEditMode={false} />
    </div>
  );
}
