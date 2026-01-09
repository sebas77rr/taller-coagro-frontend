import { useCallback, useEffect, useMemo, useState } from "react";
import { authFetch } from "../api/client";
import { Plus, Trash2, X } from "lucide-react";

type Evidencia = {
  id: number;
  tipo: "FOTO" | "VIDEO";
  url: string;
  thumbnail?: string | null;
  createdAt: string;
};

type EvidenciasOrdenProps = {
  ordenId: number;
  disabled?: boolean;
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

  // Base para mostrar archivos
  // Si VITE_API_URL = "https://indigo-lark-430359.hostingersite.com"
  // y ev.url = "/uploads/..." => queda perfecto
  const FILE_BASE = useMemo(() => import.meta.env.VITE_API_URL || "", []);

  const openViewer = (ev: Evidencia) => {
    setViewerItem(ev);
    setViewerOpen(true);
  };

  const closeViewer = () => {
    setViewerOpen(false);
    setViewerItem(null);
  };

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

      // NO Content-Type manual
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

  const eliminar = async (ev: Evidencia) => {
    if (disabled) return;

    const ok = window.confirm(
      "¿Eliminar esta evidencia? Esta acción no se puede deshacer."
    );
    if (!ok) return;

    try {
      // Optimista: la saco ya del UI
      setItems((prev) => prev.filter((x) => x.id !== ev.id));

      await authFetch(`/api/ordenes/${ordenId}/evidencias/${ev.id}`, {
        method: "DELETE",
      });

      // Si estaba abierta en viewer, la cierro
      if (viewerItem?.id === ev.id) closeViewer();
    } catch (e: any) {
      alert(e?.message || "No se pudo eliminar");
      // Rollback
      await cargar();
    }
  };

  return (
    <>
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
            className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Plus size={18} />
            {loading ? "Subiendo..." : "Agregar"}
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
                className="group relative overflow-hidden rounded-xl border border-slate-200 bg-white"
                title={ev.tipo}
              >
                {/* media clickable */}
                <button
                  type="button"
                  onClick={() => openViewer(ev)}
                  className="block w-full cursor-zoom-in"
                >
                  {ev.tipo === "FOTO" ? (
                    <img
                      src={`${FILE_BASE}${ev.url}`}
                      className="h-28 w-full object-cover"
                      alt="Evidencia"
                      loading="lazy"
                    />
                  ) : (
                    <video
                      src={`${FILE_BASE}${ev.url}`}
                      className="h-28 w-full object-cover"
                      controls
                    />
                  )}
                </button>

                {/* delete */}
                {!disabled && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      eliminar(ev);
                    }}
                    className="absolute right-2 top-2 inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white/95 p-2 opacity-0 shadow-sm transition group-hover:opacity-100"
                    title="Eliminar"
                  >
                    <Trash2 size={16} className="text-slate-800" />
                  </button>
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

      {/* Viewer modal */}
      {viewerOpen && viewerItem && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
          onClick={closeViewer}
        >
          <div
            className="relative w-full max-w-4xl overflow-hidden rounded-2xl bg-white"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
              <div className="text-sm font-extrabold text-slate-900">
                Evidencia · {viewerItem.tipo}
              </div>

              <button
                type="button"
                onClick={closeViewer}
                className="inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white p-2 hover:bg-slate-50"
                title="Cerrar"
              >
                <X size={18} />
              </button>
            </div>

            <div className="max-h-[75vh] overflow-auto bg-black">
              {viewerItem.tipo === "FOTO" ? (
                <img
                  src={`${FILE_BASE}${viewerItem.url}`}
                  className="mx-auto max-h-[75vh] w-auto object-contain"
                  alt="Evidencia ampliada"
                />
              ) : (
                <video
                  src={`${FILE_BASE}${viewerItem.url}`}
                  className="mx-auto max-h-[75vh] w-full"
                  controls
                  autoPlay
                />
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
