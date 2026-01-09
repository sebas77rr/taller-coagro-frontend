import { useEffect, useState } from "react";

interface Evidencia {
  id: number;
  tipo: "FOTO" | "VIDEO";
  url: string;
  thumbnail?: string | null;
  createdAt: string;
}

interface Props {
  ordenId: number;
}

const API = "https://indigo-lark-430359.hostingersite.com";

export default function EvidenciasOrden({ ordenId }: Props) {
  const [items, setItems] = useState<Evidencia[]>([]);
  const [loading, setLoading] = useState(false);

  const token = localStorage.getItem("taller_token");

  const cargar = async () => {
    const r = await fetch(`${API}/api/ordenes/${ordenId}/evidencias`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await r.json();
    setItems(Array.isArray(data) ? data : []);
  };

  useEffect(() => {
    cargar();
  }, [ordenId]);

  const subir = async (file: File) => {
    setLoading(true);
    const fd = new FormData();
    fd.append("file", file);

    const r = await fetch(`${API}/api/ordenes/${ordenId}/evidencias`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: fd,
    });

    setLoading(false);

    if (!r.ok) {
      const err = await r.json().catch(() => ({}));
      alert(err?.error || "Error subiendo evidencia");
      return;
    }

    cargar();
  };

  const abrirSelector = () => {
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
    <div
      style={{
        background: "#fff",
        border: "1px solid #e8eef5",
        borderRadius: 14,
        padding: 18,
        minHeight: 260,
      }}
    >
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <div style={{ fontSize: 14, color: "#667085", fontWeight: 600 }}>EVIDENCIAS</div>
          <div style={{ fontSize: 20, fontWeight: 800, marginTop: 2 }}>
            Fotos & videos ({items.length})
          </div>
        </div>

        <button
          onClick={abrirSelector}
          disabled={loading}
          style={{
            padding: "10px 14px",
            borderRadius: 10,
            border: "1px solid #d6e4ff",
            background: loading ? "#f2f4f7" : "#eaf2ff",
            cursor: loading ? "not-allowed" : "pointer",
            fontWeight: 700,
          }}
        >
          {loading ? "Subiendo..." : "+ Agregar"}
        </button>
      </div>

      {/* Grid */}
      {items.length === 0 ? (
        <div
          style={{
            marginTop: 18,
            height: 180,
            borderRadius: 12,
            border: "2px dashed #d0d5dd",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#667085",
            fontWeight: 600,
          }}
        >
          No hay evidencias aún. Sube una foto o video para documentar el trabajo.
        </div>
      ) : (
        <div
          style={{
            marginTop: 18,
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))",
            gap: 12,
          }}
        >
          {items.map((ev) => (
            <div
              key={ev.id}
              style={{
                borderRadius: 12,
                overflow: "hidden",
                border: "1px solid #eef2f6",
                background: "#fafafa",
              }}
              title={ev.tipo}
            >
              {ev.tipo === "FOTO" ? (
                <img
                  src={`${API}${ev.url}`}
                  style={{ width: "100%", height: 120, objectFit: "cover", display: "block" }}
                />
              ) : (
                <video
                  src={`${API}${ev.url}`}
                  style={{ width: "100%", height: 120, objectFit: "cover", display: "block" }}
                  controls
                />
              )}

              <div style={{ padding: 10, display: "flex", justifyContent: "space-between" }}>
                <span style={{ fontSize: 12, fontWeight: 800, color: "#344054" }}>
                  {ev.tipo}
                </span>
                <span style={{ fontSize: 12, color: "#667085" }}>
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