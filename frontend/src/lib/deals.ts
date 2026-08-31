import { apiClient } from "./api";
import { PropertyListItem } from "./properties";
import { ClientListItem, AgentUser } from "./clients";

export type DealType = "sale" | "rent";

export type DealStatus =
  | "negotiation"
  | "booked"
  | "in_progress"
  | "completed"
  | "cancelled";

export type CommissionStatus = "pending" | "paid";

export type InstallmentFrequency =
  | "monthly"
  | "quarterly"
  | "bi_annually"
  | "annually";

export interface PropertySummary {
  id: string;
  title: string;
  property_type: string;
  listing_type: string;
  status: string;
  city: string;
  locality?: string;
  address: string;
  size: string;
  size_unit: string;
  price: string;
}

export interface ClientSummary {
  id: string;
  full_name: string;
  phone_number: string;
  email?: string;
  cnic?: string;
  client_type: string;
}

export interface DealListItem {
  id: string;
  property: string;
  property_title: string;
  property_city: string;
  client: string;
  client_name: string;
  client_phone: string;
  agent: string;
  agent_name: string;
  deal_type: DealType;
  deal_type_display: string;
  deal_status: DealStatus;
  deal_status_display: string;
  agreed_price: string;
  booking_amount: string;
  commission_amount?: string | null;
  commission_status: CommissionStatus;
  commission_status_display: string;
  is_installment: boolean;
  deal_date: string;
  expected_completion_date?: string | null;
  created_at: string;
  updated_at: string;
}

export interface DealDetail extends DealListItem {
  property_details?: PropertySummary;
  client_details?: ClientSummary;
  agent_details?: AgentUser;
  commission_percentage?: string | null;
  number_of_installments?: number | null;
  installment_frequency?: InstallmentFrequency | null;
  installment_frequency_display?: string;
  payment_terms_notes?: string;
  notes?: string;
}

export interface PaginatedDealsResponse {
  count: number;
  total_pages: number;
  current_page: number;
  page_size: number;
  next: string | null;
  previous: string | null;
  results: DealListItem[];
}

export interface DealFormData {
  property: string;
  client: string;
  agent?: string | null;
  deal_type: DealType;
  deal_status: DealStatus;
  agreed_price: number | string;
  booking_amount?: number | string;
  commission_percentage?: number | string | null;
  commission_amount?: number | string | null;
  commission_status?: CommissionStatus;
  is_installment: boolean;
  number_of_installments?: number | string | null;
  installment_frequency?: InstallmentFrequency | "" | null;
  payment_terms_notes?: string;
  deal_date: string;
  expected_completion_date?: string;
  notes?: string;
}

export async function fetchDeals(
  params: Record<string, string | number | boolean | undefined> = {}
): Promise<PaginatedDealsResponse> {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, val]) => {
    if (val !== undefined && val !== "" && val !== null) {
      query.append(key, String(val));
    }
  });

  const queryString = query.toString() ? `?${query.toString()}` : "";
  return apiClient<PaginatedDealsResponse>(`/api/v1/deals/${queryString}`);
}

export async function fetchDeal(id: string): Promise<DealDetail> {
  return apiClient<DealDetail>(`/api/v1/deals/${id}/`);
}

export async function createDeal(data: DealFormData): Promise<DealDetail> {
  return apiClient<DealDetail>("/api/v1/deals/", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateDeal(
  id: string,
  data: Partial<DealFormData>
): Promise<DealDetail> {
  return apiClient<DealDetail>(`/api/v1/deals/${id}/`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export async function updateDealCommissionStatus(
  id: string,
  commission_status: CommissionStatus
): Promise<DealDetail> {
  return apiClient<DealDetail>(`/api/v1/deals/${id}/`, {
    method: "PATCH",
    body: JSON.stringify({ commission_status }),
  });
}

export async function deleteDeal(id: string): Promise<void> {
  return apiClient<void>(`/api/v1/deals/${id}/`, {
    method: "DELETE",
  });
}

export async function generateInstallmentPlan(
  dealId: string,
  force: boolean = false
): Promise<any> {
  return apiClient<any>(`/api/v1/deals/${dealId}/generate-installment-plan/`, {
    method: "POST",
    body: JSON.stringify({ force }),
  });
}
