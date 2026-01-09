import { useCallback, useEffect, useState } from "react";
import { authFetch } from "../api/client";

type Evidencia = {
  id: number;
  tipo: "FOTO" | "VIDEO";
  url: string;
  thumbnail?: string | null;
  createdAt: string;
};

type EvidenciasOrdenProps = {
  ordenId: number;
  disabled?: boolean; // ✅ si la orden está cerrada
};

export default function EvidenciasOrden({
  ordenId,
  disabled = false,
}: EvidenciasOrdenProps) {
  const [items, setItems] = useState<Evidencia[]>([]);
  const [loading, setLoading] = useState(false);

  const cargar = useCallback(async () => {
    try {
      const data = await authFetch(`/api/ordenes/${ordenId}/evidencias`);
      setItems(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error("Error cargando evidencias:", e);
      setItems([]);
    }
  }, [ordenId]);

  useEffect(() => {
    if (!ordenId) return;
    cargar();
  }, [ordenId, cargar]);

  const subir = async (file: File) => {
    if (disabled) return;

    setLoading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);

      // 🔥 OJO: aquí NO ponemos Content-Type, el browser pone el boundary solo
      await authFetch(`/api/ordenes/${ordenId}/evidencias`, {
        method: "POST",
        headers: {}, // evita que authFetch meta Content-Type json
        body: fd as any,
      });

      await cargar();
    } catch (e: any) {
      console.error(e);
      alert(e?.message || "Error subiendo evidencia");
    } finally {
      setLoading(false);
    }
  };

  const abrirSelector = () => {
    if (disabled || loading) return;

    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*,video/*";

    input.onchange = () => {
      const file = input.files?.[0];
      if (file) subir(file);
    };

    input.click();
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="text-xs font-semibold uppercase text-slate-500">
            Evidencias
          </div>
          <div className="mt-1 text-lg font-extrabold text-slate-900">
            Fotos & videos ({items.length})
          </div>

          {disabled && (
            <div className="mt-1 text-xs text-slate-500">
              Orden cerrada · evidencias en solo lectura
            </div>
          )}
        </div>

        <button
          onClick={abrirSelector}
          disabled={loading || disabled}
          className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? "Subiendo..." : "+ Agregar"}
        </button>
      </div>

      {/* Grid */}
      {items.length === 0 ? (
        <div className="mt-4 flex h-44 items-center justify-center rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 px-6 text-center text-sm font-semibold text-slate-500">
          No hay evidencias aún. Sube una foto o video para documentar el
          trabajo.
        </div>
      ) : (
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          {items.map((ev) => (
            <div
              key={ev.id}
              className="overflow-hidden rounded-xl border border-slate-200 bg-white"
              title={ev.tipo}
            >
              {ev.tipo === "FOTO" ? (
                <img
                  src={`${import.meta.env.VITE_API_URL}${ev.url}`}
                  className="h-28 w-full object-cover"
                  alt="Evidencia"
                  loading="lazy"
                />
              ) : (
                <video
                  src={`${import.meta.env.VITE_API_URL}${ev.url}`}
                  className="h-28 w-full object-cover"
                  controls
                />
              )}

              <div className="flex items-center justify-between px-3 py-2">
                <span className="text-xs font-extrabold text-slate-800">
                  {ev.tipo}
                </span>
                <span className="text-xs text-slate-500">
                  {new Date(ev.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
