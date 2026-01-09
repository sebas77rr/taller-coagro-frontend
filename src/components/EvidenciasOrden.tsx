import { useCallback, useEffect, useMemo, useState } from "react";
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
  disabled?: boolean; // si la orden está cerrada
};

export default function EvidenciasOrden({
  ordenId,
  disabled = false,
}: EvidenciasOrdenProps) {
  const [items, setItems] = useState<Evidencia[]>([]);
  const [loading, setLoading] = useState(false);

  // Viewer (zoom)
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerItem, setViewerItem] = useState<Evidencia | null>(null);

  const API_URL = useMemo(() => import.meta.env.VITE_API_URL || "", []);

  const openViewer = (ev: Evidencia) => {
    setViewerItem(ev);
    setViewerOpen(true);
  };

  const closeViewer = () => {
    setViewerOpen(false);
    setViewerItem(null);
  };

  // Cargar evidencias
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

  // Cerrar viewer con ESC
  useEffect(() => {
    if (!viewerOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeViewer();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [viewerOpen]);

  // Subir evidencia
  const subir = async (file: File) => {
    if (disabled) return;

    setLoading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);

      // ⚠️ IMPORTANTE: authFetch debe NO forzar content-type JSON si body es FormData.
      await authFetch(`/api/ordenes/${ordenId}/evidencias`, {
        method: "POST",
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

  // Eliminar evidencia (requiere endpoint DELETE en backend)
  const eliminar = async (ev: Evidencia) => {
    if (disabled) return;

    const ok = window.confirm(
      "¿Eliminar esta evidencia? Esta acción no se puede deshacer."
    );
    if (!ok) return;

    try {
      await authFetch(`/api/ordenes/${ordenId}/evidencias/${ev.id}`, {
        method: "DELETE",
      });
      await cargar();
    } catch (e: any) {
      console.error(e);
      alert(e?.message || "No se pudo eliminar la evidencia");
    }
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
              className="relative overflow-hidden rounded-xl border border-slate-200 bg-white"
              title={ev.tipo}
            >
              {/* Botón eliminar */}
              {!disabled && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    eliminar(ev);
                  }}
                  className="absolute right-2 top-2 z-10 rounded-lg border border-slate-200 bg-white/95 px-2 py-1 text-xs font-extrabold text-slate-700 hover:bg-slate-50"
                  title="Eliminar"
                >
                  🗑️
                </button>
              )}

              {/* Media (click = zoom) */}
              <div onClick={() => openViewer(ev)} className="cursor-zoom-in">
                {ev.tipo === "FOTO" ? (
                  <img
                    src={`${API_URL}${ev.url}`}
                    className="h-28 w-full object-cover"
                    alt="Evidencia"
                    loading="lazy"
                  />
                ) : (
                  <video
                    src={`${API_URL}${ev.url}`}
                    className="h-28 w-full object-cover"
                    controls
                  />
                )}
              </div>

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

      {/* Viewer */}
      {viewerOpen && viewerItem && (
        <div
          onClick={closeViewer}
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 p-5"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-[min(980px,95vw)] overflow-hidden rounded-2xl bg-white shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
              <div className="text-sm font-extrabold text-slate-900">
                {viewerItem.tipo} ·{" "}
                {new Date(viewerItem.createdAt).toLocaleString()}
              </div>

              <button
                onClick={closeViewer}
                className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-extrabold text-slate-700 hover:bg-slate-50"
              >
                ✕
              </button>
            </div>

            <div className="flex justify-center bg-slate-950 p-4">
              {viewerItem.tipo === "FOTO" ? (
                <img
                  src={`${API_URL}${viewerItem.url}`}
                  className="max-h-[70vh] max-w-full rounded-xl object-contain"
                  alt="Evidencia"
                />
              ) : (
                <video
                  src={`${API_URL}${viewerItem.url}`}
                  controls
                  className="max-h-[70vh] max-w-full rounded-xl"
                />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
