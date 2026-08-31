import { apiClient } from "./api";

export interface DashboardSummaryData {
  scope: "agent" | "agency";
  user: {
    id: string;
    full_name: string;
    role: string;
  };
  month_label: string;
  properties: {
    total: number;
    available: number;
    under_negotiation: number;
    sold: number;
    rented: number;
    off_market: number;
  };
  deals: {
    total: number;
    active: number;
    completed_this_month: number;
    revenue_this_month: string;
    commission_this_month: string;
  };
  payments: {
    pending_count: number;
    pending_amount: string;
    overdue_count: number;
    overdue_amount: string;
    collected_this_month: string;
  };
  clients: {
    total_active: number;
  };
}

export async function fetchDashboardSummary(): Promise<DashboardSummaryData> {
  return apiClient<DashboardSummaryData>("/api/v1/dashboard/summary/");
}
