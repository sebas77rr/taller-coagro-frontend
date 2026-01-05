import { useEffect, useState } from "react";
import { authFetch } from "../api/client";
import { useToast } from "../ui/toast/ToastProvider";

type Props = {
  open: boolean;
  onClose: () => void;
  ordenId: number;
  item: any | null; // item de orden (OrdenRepuesto)
  esCerrada: boolean;
  onSaved: (updatedItem: any) => void;
};

export default function EditarRepuestoModal({
  open,
  onClose,
  ordenId,
  item,
  esCerrada,
  onSaved,
}: Props) {
  const toast = useToast();

  const [cantidad, setCantidad] = useState<string>("1");
  const [esGarantia, setEsGarantia] = useState<boolean>(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open || !item) return;
    setCantidad(String(item.cantidad ?? 1));
    setEsGarantia(Boolean(item.esGarantia));
  }, [open, item]);

  if (!open) return null;

  const handleGuardar = async () => {
    if (esCerrada) {
      toast.info("Orden cerrada", "Solo lectura");
      return;
    }
    if (!item) return;

    const cantidadNum = Number(cantidad);
    if (Number.isNaN(cantidadNum) || cantidadNum <= 0) {
      toast.warning("Cantidad inválida", "Validación");
      return;
    }

    try {
      setSaving(true);

      const upd = await authFetch(`/api/ordenes/${ordenId}/repuestos/${item.id}`, {
        method: "PATCH",
        body: JSON.stringify({
          cantidad: cantidadNum,
          esGarantia,
        }),
      });

      toast.success("Repuesto actualizado", "Listo");
      onSaved(upd);
      onClose();
    } catch (e: any) {
      console.error(e);
      toast.error(e?.message || "No se pudo actualizar", "Error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-lg rounded-xl bg-white p-5 shadow-xl">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h3 className="text-base font-semibold text-slate-900">
              Editar repuesto
            </h3>
            <p className="text-xs text-slate-500">
              {item?.repuesto?.descripcion || "Repuesto"} · cambios quedan auditados
            </p>
          </div>

          <button
            type="button"
            className="rounded-md px-2 py-1 text-sm text-slate-500 hover:bg-slate-100"
            onClick={onClose}
            disabled={saving}
            aria-label="Cerrar"
          >
            ✕
          </button>
        </div>

        <div className="space-y-3">
          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-700">
              Cantidad
            </label>
            <input
              type="number"
              min={1}
              step={1}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-slate-400"
              value={cantidad}
              onChange={(e) => setCantidad(e.target.value)}
              disabled={saving}
            />
          </div>

          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={esGarantia}
              onChange={(e) => setEsGarantia(e.target.checked)}
              disabled={saving}
            />
            Es garantía
          </label>
        </div>

        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            onClick={onClose}
            disabled={saving}
          >
            Cancelar
          </button> 

          <button
            type="button"
            className="rounded-lg bg-slate-900 px-3 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-60"
            onClick={handleGuardar}
            disabled={saving}
          >
            {saving ? "Guardando..." : "Guardar cambios"}
          </button>
        </div>
      </div>
    </div>
  );
} 