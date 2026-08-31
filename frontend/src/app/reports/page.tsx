"use client";

import React from "react";
import { BarChart3 } from "lucide-react";
import { EmptyState } from "@/components/ui/EmptyState";
import { Card, CardContent } from "@/components/ui/Card";

export default function ReportsPlaceholderPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl md:text-2xl font-bold text-white tracking-tight flex items-center gap-2">
          <BarChart3 className="w-6 h-6 text-amber-400" />
          Analytics & Agency Reports
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          Revenue performance, agent sales volume, deal closure velocities, and aging collections.
        </p>
      </div>

      <Card variant="glass">
        <CardContent>
          <EmptyState
            icon={<BarChart3 className="w-8 h-8" />}
            title="Reports & Analytics Coming Soon"
            description="Detailed financial breakdowns, agent commission payouts, and lead conversion reports will be built in the Reports module task."
            actionLabel="Return to Dashboard"
            onAction={() => window.location.href = "/"}
          />
        </CardContent>
      </Card>
    </div>
  );
}
