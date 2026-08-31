"use client";

import React from "react";
import { DealForm } from "@/components/deals/DealForm";

export default function NewDealPage() {
  return (
    <div className="py-2">
      <DealForm isEditMode={false} />
    </div>
  );
}
