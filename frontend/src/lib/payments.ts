import { apiClient } from "./api";

export type PaymentStatus = "pending" | "partial" | "paid" | "overdue";

export type PaymentEffectiveStatus =
  | "paid"
  | "partial_overdue"
  | "overdue"
  | "partial"
  | "pending";

export type PaymentMethod =
  | "cash"
  | "bank_transfer"
  | "cheque"
  | "online"
  | "other";

export interface PaymentListItem {
  id: string;
  deal: string;
  property_title: string;
  client_name: string;
  agent_name: string;
  amount: string;
  amount_paid: string;
  remaining_balance: string;
  due_date: string;
  paid_date?: string | null;
  payment_status: PaymentStatus;
  payment_status_display: string;
  effective_status: PaymentEffectiveStatus;
  is_overdue: boolean;
  payment_method: PaymentMethod;
  payment_method_display: string;
  installment_number?: number | null;
  total_installments?: number | null;
  transaction_reference?: string;
  created_at: string;
  updated_at: string;
}

export interface PaymentDealSummary {
  id: string;
  deal_type: string;
  deal_status: string;
  agreed_price: string;
  booking_amount: string;
  property_title: string;
  property_city: string;
  client_name: string;
  client_phone: string;
  agent_name: string;
}

export interface PaymentDetail extends PaymentListItem {
  deal_details?: PaymentDealSummary;
  notes?: string;
}

export interface PaymentReceiptData {
  receipt_number: string;
  payment_id: string;
  amount: string;
  amount_paid: string;
  remaining_balance: string;
  payment_status: string;
  payment_status_display: string;
  effective_status: string;
  payment_method: string;
  payment_method_display: string;
  transaction_reference: string;
  due_date: string;
  paid_date?: string | null;
  installment_number?: number | null;
  total_installments?: number | null;
  deal: {
    id: string;
    deal_type: string;
    deal_status: string;
    agreed_price: string;
    booking_amount: string;
  };
  property: {
    id: string;
    title: string;
    property_type: string;
    listing_type: string;
    city: string;
    locality?: string;
    address: string;
  };
  client: {
    id: string;
    full_name: string;
    phone_number: string;
    email?: string;
    cnic?: string;
    address?: string;
  };
  agent: {
    id: string;
    full_name: string;
    email: string;
    phone_number?: string;
  };
  issued_at: string;
}

export interface PaginatedPaymentsResponse {
  count: number;
  total_pages: number;
  current_page: number;
  page_size: number;
  next: string | null;
  previous: string | null;
  results: PaymentListItem[];
}

export interface PaymentFormData {
  deal: string;
  amount: number | string;
  amount_paid?: number | string;
  due_date: string;
  paid_date?: string | null;
  payment_method?: PaymentMethod;
  installment_number?: number | string | null;
  total_installments?: number | string | null;
  transaction_reference?: string;
  notes?: string;
}

export async function fetchPayments(
  params: Record<string, string | number | boolean | undefined> = {}
): Promise<PaginatedPaymentsResponse> {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, val]) => {
    if (val !== undefined && val !== "" && val !== null) {
      query.append(key, String(val));
    }
  });

  const queryString = query.toString() ? `?${query.toString()}` : "";
  return apiClient<PaginatedPaymentsResponse>(`/api/v1/payments/${queryString}`);
}

export async function fetchPayment(id: string): Promise<PaymentDetail> {
  return apiClient<PaymentDetail>(`/api/v1/payments/${id}/`);
}

export async function createPayment(data: PaymentFormData): Promise<PaymentDetail> {
  return apiClient<PaymentDetail>("/api/v1/payments/", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updatePayment(
  id: string,
  data: Partial<PaymentFormData>
): Promise<PaymentDetail> {
  return apiClient<PaymentDetail>(`/api/v1/payments/${id}/`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export async function deletePayment(id: string): Promise<void> {
  return apiClient<void>(`/api/v1/payments/${id}/`, {
    method: "DELETE",
  });
}

export async function fetchPaymentReceipt(id: string): Promise<PaymentReceiptData> {
  return apiClient<PaymentReceiptData>(`/api/v1/payments/${id}/receipt/`);
}
