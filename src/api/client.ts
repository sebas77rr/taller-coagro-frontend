// src/api/client.ts
import { getToken, logout } from "../hooks/useAuth";

const RAW_API_URL = import.meta.env.VITE_API_URL;
const API_URL = RAW_API_URL?.replace(/\/+$/, ""); // quita slash final

export async function authFetch(
  path: string,
  options: RequestInit = {}
): Promise<any> {
  if (!API_URL) {
    throw new Error("VITE_API_URL no está definido en el frontend (.env)");
  }

  const token = getToken();
  const isFormData = options.body instanceof FormData;

  const headers = new Headers(options.headers || {});

  if (!isFormData && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  if (token && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
  });

  if (res.status === 401) {
    logout();
    window.location.href = "/login";
    throw new Error("Token inválido o expirado");
  }

  if (res.status === 204) return null;

  const contentType = res.headers.get("content-type") || "";
  const payload = contentType.includes("application/json")
    ? await res.json()
    : await res.text();

  if (!res.ok) {
    const raw =
      (payload as any)?.error ||
      (payload as any)?.message ||
      (typeof payload === "string" ? payload : `Error HTTP ${res.status}`);

    const msg =
      typeof raw === "string" ? raw.slice(0, 300) : `Error HTTP ${res.status}`;

    throw new Error(msg);
  }

  return payload;
}