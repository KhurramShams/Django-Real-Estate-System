import { apiClient } from "./api";

export type PropertyType = "residential" | "commercial" | "plot" | "rental";
export type ListingType = "sale" | "rent";
export type PropertyStatus = "available" | "under_negotiation" | "sold" | "rented";
export type SizeUnit = "marla" | "sq_ft" | "sq_yd" | "kanal";

export interface Amenity {
  id: string;
  name: string;
  icon?: string;
  description?: string;
}

export interface PropertyImage {
  id: string;
  image_url: string;
  storage_path?: string;
  caption?: string;
  is_primary: boolean;
  display_order: number;
  created_at: string;
}

export interface PropertyListItem {
  id: string;
  title: string;
  property_type: PropertyType;
  property_type_display: string;
  listing_type: ListingType;
  listing_type_display: string;
  status: PropertyStatus;
  status_display: string;
  city: string;
  locality?: string;
  address: string;
  size: string;
  size_unit: SizeUnit;
  size_unit_display: string;
  price: string;
  primary_image_url?: string | null;
  amenities: Amenity[];
  created_at: string;
  updated_at: string;
}

export interface PropertyDetail extends PropertyListItem {
  description?: string;
  postal_code?: string;
  latitude?: string | null;
  longitude?: string | null;
  owner_name?: string;
  owner_contact?: string;
  owner_email?: string;
  images: PropertyImage[];
}

export interface PaginatedPropertiesResponse {
  count: number;
  total_pages: number;
  current_page: number;
  page_size: number;
  next: string | null;
  previous: string | null;
  results: PropertyListItem[];
}

export interface PropertyFormData {
  title: string;
  description?: string;
  property_type: PropertyType;
  listing_type: ListingType;
  status: PropertyStatus;
  address: string;
  city: string;
  locality?: string;
  postal_code?: string;
  latitude?: string;
  longitude?: string;
  size: number | string;
  size_unit: SizeUnit;
  price: number | string;
  owner_name?: string;
  owner_contact?: string;
  owner_email?: string;
  amenity_ids?: string[];
}

export async function fetchProperties(
  params: Record<string, string | number | undefined> = {}
): Promise<PaginatedPropertiesResponse> {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, val]) => {
    if (val !== undefined && val !== "" && val !== null) {
      query.append(key, String(val));
    }
  });

  const queryString = query.toString() ? `?${query.toString()}` : "";
  return apiClient<PaginatedPropertiesResponse>(`/api/v1/properties/${queryString}`);
}

export async function fetchProperty(id: string): Promise<PropertyDetail> {
  return apiClient<PropertyDetail>(`/api/v1/properties/${id}/`);
}

export async function createProperty(data: PropertyFormData): Promise<PropertyDetail> {
  return apiClient<PropertyDetail>("/api/v1/properties/", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateProperty(
  id: string,
  data: Partial<PropertyFormData>
): Promise<PropertyDetail> {
  return apiClient<PropertyDetail>(`/api/v1/properties/${id}/`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export async function deleteProperty(id: string): Promise<void> {
  return apiClient<void>(`/api/v1/properties/${id}/`, {
    method: "DELETE",
  });
}

export async function uploadPropertyImage(
  propertyId: string,
  formData: FormData
): Promise<PropertyImage> {
  const token = typeof window !== "undefined" ? localStorage.getItem("realty_access_token") : null;
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

  const response = await fetch(`${baseUrl}/api/v1/properties/${propertyId}/upload-image/`, {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: formData,
  });

  if (!response.ok) {
    let errorData;
    try {
      errorData = await response.json();
    } catch {
      errorData = null;
    }
    const msg = errorData?.image?.[0] || errorData?.error || errorData?.detail || "Failed to upload image.";
    throw new Error(msg);
  }

  return response.json();
}

export async function deletePropertyImage(
  propertyId: string,
  imageId: string
): Promise<void> {
  return apiClient<void>(`/api/v1/properties/${propertyId}/delete-image/${imageId}/`, {
    method: "DELETE",
  });
}

export async function setPrimaryPropertyImage(
  propertyId: string,
  imageId: string
): Promise<PropertyImage> {
  return apiClient<PropertyImage>(`/api/v1/properties/${propertyId}/set-primary-image/${imageId}/`, {
    method: "POST",
  });
}

export async function fetchAmenities(): Promise<Amenity[]> {
  try {
    const res = await apiClient<{ results?: Amenity[] } | Amenity[]>("/api/v1/amenities/");
    if (Array.isArray(res)) return res;
    return res.results || [];
  } catch {
    return [];
  }
}
