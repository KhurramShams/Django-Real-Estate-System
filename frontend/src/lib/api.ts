import { getAccessToken, getRefreshToken, clearAuthSession, setAuthSession, isTokenExpired } from "./auth";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export interface ApiErrorResponse {
  error?: string;
  detail?: string;
  [key: string]: any;
}

export class ApiError extends Error {
  status: number;
  data: any;

  constructor(status: number, message: string, data?: any) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.data = data;
  }
}

export async function apiClient<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  let accessToken = getAccessToken();

  // If token is expired, try refreshing or clear session
  if (accessToken && isTokenExpired(accessToken)) {
    const refreshToken = getRefreshToken();
    if (refreshToken && !isTokenExpired(refreshToken)) {
      try {
        const refreshResp = await fetch(`${API_BASE_URL}/api/v1/auth/refresh/`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ refresh: refreshToken }),
        });
        if (refreshResp.ok) {
          const tokenData = await refreshResp.json();
          accessToken = tokenData.access;
          localStorage.setItem("realty_access_token", accessToken!);
        } else {
          clearAuthSession();
          if (typeof window !== "undefined" && !window.location.pathname.includes("/login")) {
            window.location.href = "/login";
          }
        }
      } catch {
        clearAuthSession();
      }
    } else {
      clearAuthSession();
      if (typeof window !== "undefined" && !window.location.pathname.includes("/login")) {
        window.location.href = "/login";
      }
    }
  }

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };

  if (accessToken) {
    headers["Authorization"] = `Bearer ${accessToken}`;
  }

  const url = endpoint.startsWith("http") ? endpoint : `${API_BASE_URL}${endpoint}`;

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    clearAuthSession();
    if (typeof window !== "undefined" && !window.location.pathname.includes("/login")) {
      window.location.href = "/login";
    }
    throw new ApiError(401, "Your session has expired. Please log in again.");
  }

  if (response.status === 204) {
    return {} as T;
  }

  let data: any = null;
  try {
    data = await response.json();
  } catch {
    data = null;
  }

  if (!response.ok) {
    let errorMessage = "An unexpected error occurred.";
    if (data) {
      if (typeof data.error === "string") {
        errorMessage = data.error;
      } else if (typeof data.detail === "string") {
        errorMessage = data.detail;
      } else if (typeof data === "object") {
        // Concatenate field errors nicely
        const errorEntries = Object.entries(data);
        if (errorEntries.length > 0) {
          const [field, err] = errorEntries[0];
          const errText = Array.isArray(err) ? err.join(" ") : String(err);
          errorMessage = `${field}: ${errText}`;
        }
      }
    }
    throw new ApiError(response.status, errorMessage, data);
  }

  return data as T;
}
