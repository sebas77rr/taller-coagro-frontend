// src/api/client.ts
import { getToken, logout } from "../hooks/useAuth";

// Si no existe VITE_API_URL, usa mismo dominio (relative)
const API_URL = (import.meta.env.VITE_API_URL || "").replace(/\/$/, "");

export async function authFetch(path: string, options: RequestInit = {}) {
  const token = getToken();
  const isFormData = options.body instanceof FormData;

  const headers = new Headers(options.headers || {});
  if (!isFormData && !headers.has("Content-Type")) headers.set("Content-Type", "application/json");
  if (token && !headers.has("Authorization")) headers.set("Authorization", `Bearer ${token}`);

  const url = `${API_URL}${path}`; // si API_URL="", queda "/api/..."
  const res = await fetch(url, { ...options, headers });

  if (res.status === 401) {
    logout();
    window.location.href = "/login";
    throw new Error("Token inválido o expirado");
  }

  if (res.status === 204) return null;

  const contentType = res.headers.get("content-type") || "";
  const payload = contentType.includes("application/json") ? await res.json() : await res.text();

  if (!res.ok) {
    const msg =
      (payload as any)?.error ||
      (payload as any)?.message ||
      (typeof payload === "string" ? payload : `Error HTTP ${res.status}`);
    throw new Error(msg);
  }

  return payload;
}
