import { apiClient } from "./api";
import { PropertyType, ListingType } from "./properties";

export type ClientType = "buyer" | "seller" | "tenant" | "landlord";

export type ClientSource =
  | "referral"
  | "walk_in"
  | "website"
  | "social_media"
  | "portal_zameen"
  | "portal_olx"
  | "direct_call"
  | "other";

export interface AgentUser {
  id: string;
  email: string;
  full_name: string;
  role: string;
  phone_number?: string;
}

export interface ClientListItem {
  id: string;
  full_name: string;
  phone_number: string;
  email?: string;
  cnic?: string;
  client_type: ClientType;
  client_type_display: string;
  source: ClientSource;
  source_display: string;
  preferred_property_type?: PropertyType;
  preferred_listing_type?: ListingType;
  budget_min?: string | null;
  budget_max?: string | null;
  preferred_city?: string;
  preferred_locality?: string;
  assigned_agent?: string | null;
  assigned_agent_name?: string;
  created_at: string;
  updated_at: string;
}

export interface ClientDetail extends ClientListItem {
  address?: string;
  notes?: string;
  assigned_agent_details?: AgentUser | null;
}

export interface PaginatedClientsResponse {
  count: number;
  total_pages: number;
  current_page: number;
  page_size: number;
  next: string | null;
  previous: string | null;
  results: ClientListItem[];
}

export interface ClientFormData {
  full_name: string;
  phone_number: string;
  email?: string;
  cnic?: string;
  address?: string;
  client_type: ClientType;
  source: ClientSource;
  preferred_property_type?: PropertyType | "";
  preferred_listing_type?: ListingType | "";
  budget_min?: string | number;
  budget_max?: string | number;
  preferred_city?: string;
  preferred_locality?: string;
  assigned_agent?: string | null;
  notes?: string;
}

export async function fetchClients(
  params: Record<string, string | number | undefined> = {}
): Promise<PaginatedClientsResponse> {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, val]) => {
    if (val !== undefined && val !== "" && val !== null) {
      query.append(key, String(val));
    }
  });

  const queryString = query.toString() ? `?${query.toString()}` : "";
  return apiClient<PaginatedClientsResponse>(`/api/v1/clients/${queryString}`);
}

export async function fetchClient(id: string): Promise<ClientDetail> {
  return apiClient<ClientDetail>(`/api/v1/clients/${id}/`);
}

export async function createClient(data: ClientFormData): Promise<ClientDetail> {
  return apiClient<ClientDetail>("/api/v1/clients/", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateClient(
  id: string,
  data: Partial<ClientFormData>
): Promise<ClientDetail> {
  return apiClient<ClientDetail>(`/api/v1/clients/${id}/`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export async function deleteClient(id: string): Promise<void> {
  return apiClient<void>(`/api/v1/clients/${id}/`, {
    method: "DELETE",
  });
}

export async function fetchAgents(): Promise<AgentUser[]> {
  try {
    const res = await apiClient<AgentUser[]>("/api/v1/auth/users/");
    return res || [];
  } catch {
    return [];
  }
}
