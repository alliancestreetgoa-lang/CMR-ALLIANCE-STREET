const BASE_URL = import.meta.env.VITE_API_URL || "";

function getToken(): string | null {
  return localStorage.getItem("erp_token");
}

export async function apiFetch(url: string, options: RequestInit = {}) {
  const token = getToken();
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string> || {}),
  };
  
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  
  if (options.body && typeof options.body === "string") {
    headers["Content-Type"] = "application/json";
  }

  // Ensure absolute URL if BASE_URL is provided, otherwise relative
  const fullUrl = url.startsWith("http") ? url : `${BASE_URL}${url.startsWith("/") ? "" : "/"}${url}`;

  const res = await fetch(fullUrl, { ...options, headers });
  
  if (res.status === 401) {
    localStorage.removeItem("erp_token");
    window.location.href = "/login";
    throw new Error("Session expired");
  }
  
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(err.message || "Request failed");
  }
  
  return res.json();
}

export const api = {
  get: (url: string) => apiFetch(url),
  post: (url: string, data: any) => apiFetch(url, { method: "POST", body: JSON.stringify(data) }),
  patch: (url: string, data: any) => apiFetch(url, { method: "PATCH", body: JSON.stringify(data) }),
  delete: (url: string) => apiFetch(url, { method: "DELETE" }),
};
