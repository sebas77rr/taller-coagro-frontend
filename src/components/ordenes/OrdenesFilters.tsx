import React from "react";

type Tecnico = { id: number | string; nombre: string };

type Props = {
  q: string;
  setQ: (v: string) => void;

  estado: string;
  setEstado: (v: string) => void;

  tecnicoId: string;
  setTecnicoId: (v: string) => void;

  desde: string;
  setDesde: (v: string) => void;

  hasta: string;
  setHasta: (v: string) => void;

  tecnicos: Tecnico[];
  onClear: () => void;
};

export default function OrdenesFilters({
  q,
  setQ,
  estado,
  setEstado,
  tecnicoId,
  setTecnicoId,
  desde,
  setDesde,
  hasta,
  setHasta,
  tecnicos,
  onClear,
}: Props) {
  return (
    <div>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-6">
        {/* Buscar */}
        <div className="md:col-span-2">
          <label className="mb-1 block text-xs font-extrabold text-slate-700">
            Buscar
          </label>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Código, cliente, equipo o serial…"
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-slate-400"
          />
        </div>

        {/* Estado */}
        <div>
          <label className="mb-1 block text-xs font-extrabold text-slate-700">
            Estado
          </label>
          <select
            value={estado}
            onChange={(e) => setEstado(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-slate-400"
          >
            <option value="ALL">Todas</option>
            <option value="ABIERTA">Abierta</option>
            <option value="EN_PROCESO">En proceso</option>
            <option value="FINALIZADA">Finalizada</option>
            <option value="ENTREGADA">Entregada</option>
          </select>
        </div>

        {/* Técnico */}
        <div>
          <label className="mb-1 block text-xs font-extrabold text-slate-700">
            Técnico
          </label>
          <select
            value={tecnicoId}
            onChange={(e) => setTecnicoId(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-slate-400"
          >
            <option value="ALL">Todos</option>
            {tecnicos.map((t) => (
              <option key={String(t.id)} value={String(t.id)}>
                {t.nombre}
              </option>
            ))}
          </select>
        </div>

        {/* Desde */}
        <div>
          <label className="mb-1 block text-xs font-extrabold text-slate-700">
            Desde
          </label>
          <input
            type="date"
            value={desde}
            onChange={(e) => setDesde(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-slate-400"
          />
        </div>

        {/* Hasta */}
        <div>
          <label className="mb-1 block text-xs font-extrabold text-slate-700">
            Hasta
          </label>
          <input
            type="date"
            value={hasta}
            onChange={(e) => setHasta(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-slate-400"
          />
        </div>
      </div>

      {/* Acciones */}
      <div className="mt-3 flex items-center justify-end">
        <button
          type="button"
          onClick={onClear}
          className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-extrabold text-slate-700 hover:bg-slate-50 md:w-auto"
        >
          Limpiar filtros
        </button>
      </div>
    </div>
  );
}
