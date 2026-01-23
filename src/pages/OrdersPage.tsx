import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { authFetch } from "../api/client";
import NuevoEquipoModal from "../components/NuevoEquipoModal";
import { useToast } from "../ui/toast/ToastProvider";
import OrdenesFilters from "../components/ordenes/OrdenesFilters";

type Orden = {
  id: number;
  codigo: string;
  estado: string;
  cliente: { nombre: string } | null;
  equipo: { marca: string; modelo: string; serial?: string | null } | null;
  fechaIngreso: string;
  tecnicoAsignadoId?: number | null;
  tecnicoId?: number | null;
};

type Tecnico = {
  id: number;
  nombre: string;
};

export default function OrdersPage() {
  const navigate = useNavigate();
  const toast = useToast();

  const [openNuevoEquipo, setOpenNuevoEquipo] = useState(false);
  const [ordenes, setOrdenes] = useState<Orden[]>([]);
  const [tecnicos, setTecnicos] = useState<Tecnico[]>([]);
  const [loading, setLoading] = useState(true);

  // filtros
  const [q, setQ] = useState("");
  const [estadoFiltro, setEstadoFiltro] = useState("ALL");
  const [tecnicoId, setTecnicoId] = useState("ALL");
  const [desde, setDesde] = useState("");
  const [hasta, setHasta] = useState("");

  const clearFilters = () => {
    setQ("");
    setEstadoFiltro("ALL");
    setTecnicoId("ALL");
    setDesde("");
    setHasta("");
  };

  const fetchOrdenes = async () => {
    try {
      setLoading(true);
      const data = await authFetch("/api/ordenes");
      setOrdenes(data);
    } catch (err: any) {
      console.error("Error cargando órdenes:", err);
      toast.error(err?.message || "No se pudieron cargar las órdenes", "Error");
    } finally {
      setLoading(false);
    }
  };

  const fetchTecnicos = async () => {
    try {
      const data = await authFetch("/api/tecnicos");
      setTecnicos(Array.isArray(data) ? data : []);
    } catch (err) {
      console.warn("No se pudieron cargar técnicos (filtros):", err);
      setTecnicos([]);
    }
  };

  useEffect(() => {
    fetchOrdenes();
    fetchTecnicos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const badgeEstado = (estado: string) => {
    const map: Record<string, string> = {
      ABIERTA: "bg-blue-100 text-blue-700",
      EN_PROCESO: "bg-amber-100 text-amber-700",
      FINALIZADA: "bg-emerald-100 text-emerald-700",
      ENTREGADA: "bg-slate-200 text-slate-700",
    };

    const cls = map[estado] || "bg-slate-100 text-slate-700";

    return (
      <span className={`rounded px-2 py-1 text-xs font-semibold ${cls}`}>
        {estado}
      </span>
    );
  };

  const norm = (v: any) =>
    String(v ?? "")
      .toLowerCase()
      .trim();

  const filteredOrdenes = useMemo(() => {
    const qn = norm(q);

    return (ordenes || [])
      .filter((o) => {
        if (!qn) return true;

        const hay = [
          o.codigo,
          o.cliente?.nombre,
          o.equipo?.marca,
          o.equipo?.modelo,
          o.equipo?.serial,
        ]
          .map(norm)
          .join(" ");

        return hay.includes(qn);
      })
      .filter((o) =>
        estadoFiltro === "ALL" ? true : o.estado === estadoFiltro
      )
      .filter((o) => {
        if (tecnicoId === "ALL") return true;
        const tid = o.tecnicoAsignadoId ?? o.tecnicoId ?? null;
        return String(tid ?? "") === tecnicoId;
      })
      .filter((o) => {
        if (!desde && !hasta) return true;

        const d = new Date(o.fechaIngreso);
        if (Number.isNaN(d.getTime())) return true;

        if (desde) {
          const from = new Date(`${desde}T00:00:00`);
          if (d < from) return false;
        }
        if (hasta) {
          const to = new Date(`${hasta}T23:59:59`);
          if (d > to) return false;
        }
        return true;
      });
  }, [ordenes, q, estadoFiltro, tecnicoId, desde, hasta]);

  const hasOrdenes = !loading && ordenes.length > 0;
  const hasResultados = !loading && filteredOrdenes.length > 0;

  return (
    <>
      {/* Header (sin botón) */}
      <div className="mb-4">
        <h1 className="text-xl font-bold text-slate-800">
          Órdenes de servicio
        </h1>
        <p className="text-xs text-slate-500">Vista global</p>
      </div>

      {/* Panel de filtros (Opción B) */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4">
        {/* Header del panel */}
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="text-sm font-extrabold text-slate-900">Filtros</div>
            <div className="text-xs font-semibold text-slate-500">
              Mostrando{" "}
              <span className="font-extrabold text-slate-800">
                {filteredOrdenes.length}
              </span>{" "}
              de{" "}
              <span className="font-extrabold text-slate-800">
                {ordenes.length}
              </span>
            </div>
          </div>

          <button
            onClick={() => setOpenNuevoEquipo(true)}
            className="w-full rounded-xl bg-emerald-500 px-4 py-2 text-sm font-extrabold text-white shadow-sm hover:bg-emerald-600 md:w-auto"
          >
            + Registrar maquinaria
          </button>
        </div>

        {/* Body filtros */}
        <div className="mt-4">
          <OrdenesFilters
            q={q}
            setQ={setQ}
            estado={estadoFiltro}
            setEstado={setEstadoFiltro}
            tecnicoId={tecnicoId}
            setTecnicoId={setTecnicoId}
            desde={desde}
            setDesde={setDesde}
            hasta={hasta}
            setHasta={setHasta}
            tecnicos={tecnicos}
            onClear={clearFilters}
          />
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="mt-4 text-center text-slate-600">
          Cargando órdenes...
        </div>
      )}

      {/* Empty state: no hay órdenes */}
      {!loading && ordenes.length === 0 && (
        <div className="mt-4 rounded-xl bg-white p-10 text-center shadow">
          <p className="text-slate-600">No hay órdenes registradas aún.</p>
        </div>
      )}

      {/* Empty state: hay órdenes pero filtros dejan 0 */}
      {hasOrdenes && !hasResultados && (
        <div className="mt-4 rounded-xl bg-white p-10 text-center shadow">
          <p className="text-slate-600">
            No hay resultados con los filtros actuales.
          </p>
          <button
            type="button"
            onClick={clearFilters}
            className="mt-3 rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            Limpiar filtros
          </button>
        </div>
      )}

      {/* Tabla */}
      {hasResultados && (
        <div className="mt-4 overflow-hidden rounded-xl bg-white shadow">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-100 text-slate-700">
              <tr>
                <th className="px-4 py-3 text-left">Código</th>
                <th className="px-4 py-3 text-left">Cliente</th>
                <th className="px-4 py-3 text-left">Equipo</th>
                <th className="px-4 py-3 text-left">Estado</th>
                <th className="px-4 py-3 text-left">Fecha ingreso</th>
                <th className="px-4 py-3 text-right">Acciones</th>
              </tr>
            </thead>

            <tbody>
              {filteredOrdenes.map((o) => (
                <tr
                  key={o.id}
                  className="border-t border-slate-200 hover:bg-slate-50"
                >
                  <td className="px-4 py-3 font-medium">{o.codigo}</td>
                  <td className="px-4 py-3">{o.cliente?.nombre || "-"}</td>
                  <td className="px-4 py-3">
                    {o.equipo ? `${o.equipo.marca} ${o.equipo.modelo}` : "-"}
                  </td>
                  <td className="px-4 py-3">{badgeEstado(o.estado)}</td>
                  <td className="px-4 py-3">
                    {new Date(o.fechaIngreso).toLocaleString()}
                  </td>

                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => navigate(`/ordenes/${o.id}`)}
                      className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                    >
                      Ver detalle
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal */}
      <NuevoEquipoModal
        open={openNuevoEquipo}
        onClose={() => setOpenNuevoEquipo(false)}
        onCreated={() => {
          setOpenNuevoEquipo(false);
          toast.success("Equipo registrado", "Listo");
        }}
      />
    </>
  );
}
