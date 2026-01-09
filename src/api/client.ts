// src/api/client.ts
import { getToken, logout } from "../hooks/useAuth";

const API_URL = import.meta.env.VITE_API_URL;

export async function authFetch(
  path: string,
  options: RequestInit = {}
): Promise<any> {
  const token = getToken();

  // Detectar si body es FormData (uploads)
  const isFormData = options.body instanceof FormData;

  // Construir headers sin romper multipart
  const headers = new Headers(options.headers || {});

  // Solo poner JSON si NO es FormData y si aún no lo enviaron
  if (!isFormData && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  // Auth
  if (token && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
  });

  // 401 → token malo o vencido
  if (res.status === 401) {
    console.warn("Token inválido o expirado, cerrando sesión...");
    logout();
    window.location.href = "/login";
    throw new Error("Token inválido o expirado");
  }

  // Leer respuesta robusta (json o texto)
  const contentType = res.headers.get("content-type") || "";
  const payload = contentType.includes("application/json")
    ? await res.json()
    : await res.text();

  if (!res.ok) {
    // intenta sacar mensaje bonito
    const msg =
      (payload as any)?.error ||
      (payload as any)?.message ||
      (typeof payload === "string" ? payload : `Error HTTP ${res.status}`);
    throw new Error(msg);
  }

  return payload;
} 