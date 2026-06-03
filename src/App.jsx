import { useState, useMemo, useEffect, useCallback, useRef } from "react";
import { supabase } from "./supabase.js";

// ─── ESTRUCTURA DEL EDIFICIO ──────────────────────────────────────────────────
const PISOS = {
  1: ["A","B","C","D","E","F","G","H","I"],
  2: ["A","B","C","D","E","F","G","H","I"],
  3: ["A","B","C","D","E","F","G","H","I"],
  4: ["A","B","C","D","E","F","G","H","I"],
  5: ["A","B","E","F","G","H","I","K","L","M"],
  6: ["E","F","G","H","I","J","K","L","M"],
  7: ["E","F","G","H","I","J","K","L","M"],
  8: ["H","I","J","K","L","M"],
};

const RUBROS = [
  {
    id: "MAMPOSTERIA", nombre: "Mampostería",
    items: [
      { id: 1, tipo: "APLOMADO / ESCUADRA", local: "GENERAL", desc: "Paredes aplomadas" },
      { id: 2, tipo: "APLOMADO / ESCUADRA", local: "GENERAL", desc: "Ángulos interiores a 90°" },
    ],
  },
  {
    id: "MOCHETAS", nombre: "Mochetas y Vanos",
    items: [
      { id: 3,  tipo: "ANCHO VANO",  local: "INGRESO",         desc: "Ancho de 0,92 m" },
      { id: 4,  tipo: "ALTURA VANO", local: "INGRESO",         desc: "Alto en ambos extremos: 2,06 m" },
      { id: 5,  tipo: "ANCHO VANO",  local: "DORMITORIO 1",    desc: "Ancho de 0,82 m" },
      { id: 6,  tipo: "ALTURA VANO", local: "DORMITORIO 1",    desc: "Alto en ambos extremos: 2,06 m" },
      { id: 7,  tipo: "ANCHO VANO",  local: "DORMITORIO 2/SC", desc: "Ancho de 0,82 m" },
      { id: 8,  tipo: "ALTURA VANO", local: "DORMITORIO 2/SC", desc: "Alto en ambos extremos: 2,06 m" },
      { id: 9,  tipo: "ANCHO VANO",  local: "COCINA/SC",       desc: "Ancho de 0,82 m" },
      { id: 10, tipo: "ALTURA VANO", local: "COCINA/SC",       desc: "Alto en ambos extremos: 2,06 m" },
      { id: 11, tipo: "ANCHO VANO",  local: "BAÑO",            desc: "Ancho de 0,72 m" },
      { id: 12, tipo: "ALTURA VANO", local: "BAÑO",            desc: "Alto en ambos extremos: 2,06 m" },
      { id: 13, tipo: "MOCHETA",     local: "GENERAL",         desc: "Cada mocheta tiene ancho mínimo de 7 cm" },
      { id: 14, tipo: "DINTELES",    local: "GENERAL",         desc: "Dintel terminado y sin curvatura" },
      { id: 15, tipo: "PREMARCO",    local: "GENERAL",         desc: "A plomo (1 cm despegado del ladrillo)" },
      { id: 16, tipo: "PREMARCO",    local: "GENERAL",         desc: "Altura 2,06 m" },
    ],
  },
  {
    id: "ELECTRICO", nombre: "Canaleteado Eléctrico",
    items: [
      { id: 17, tipo: "CANALETEADO",       local: "GENERAL",       desc: "Sin picar elementos estructurales (columnas/vigas)" },
      { id: 18, tipo: "CORRUGADOS",        local: "GENERAL",       desc: "No salen del ángulo 90° entre pared y cielorraso" },
      { id: 19, tipo: "TOMAS",             local: "GENERAL",       desc: "Cantidades corresponden según plano" },
      { id: 20, tipo: "TOMAS",             local: "GENERAL",       desc: "Alturas corresponden según plano" },
      { id: 21, tipo: "LLAVES",            local: "GENERAL",       desc: "No quedan detrás de puertas" },
      { id: 22, tipo: "LLAVES",            local: "GENERAL",       desc: "Altura a eje 1,20 m (Tolerancia hasta 2 cm)" },
      { id: 23, tipo: "LLAVES",            local: "GENERAL",       desc: "Cantidades corresponden según plano" },
      { id: 24, tipo: "PORTERO ELÉCTRICO", local: "GENERAL",       desc: "Posición y cota según plano" },
      { id: 25, tipo: "TERMOSTATO",        local: "GENERAL",       desc: "Posición y cota según plano" },
      { id: 26, tipo: "TABLERO",           local: "GENERAL",       desc: "Posición y cota según plano" },
      { id: 27, tipo: "AIRE ACOND.",       local: "GENERAL",       desc: "Corrugado llega a caja de preinstalación" },
      { id: 28, tipo: "TOMAS",             local: "COCINA",        desc: "Alineados" },
      { id: 29, tipo: "TOMAS",             local: "COCINA",        desc: "Altura según plano" },
      { id: 30, tipo: "TOMAS",             local: "COCINA",        desc: "Distancia según plano" },
      { id: 31, tipo: "TOMAS",             local: "COCINA",        desc: "Sin interferencia con otros servicios" },
      { id: 32, tipo: "TOMAS",             local: "BAÑO",          desc: "Altura a eje 1,35 m (tolerancia hasta 2 cm hacia arriba)" },
      { id: 33, tipo: "TOMAS",             local: "BAÑO",          desc: "Distancia de brazo en pared en eje con centro de vanitory a revoque" },
      { id: 34, tipo: "TOMAS",             local: "ESTAR",         desc: "Toma TV colocado según plano" },
      { id: 35, tipo: "TOMAS",             local: "DORMITORIO SC", desc: "Toma TV colocado según plano" },
    ],
  },
  {
    id: "SANITARIAS", nombre: "Instalaciones Sanitarias",
    items: [
      { id: 36, tipo: "CLOACAS",                  local: "GENERAL",       desc: "Tapas pegadas en cañerías de cloaca/pluvial" },
      { id: 37, tipo: "CLOACAS",                  local: "GENERAL",       desc: "Montantes compactas" },
      { id: 38, tipo: "CLOACAS Y AGUA FRÍA/CAL.", local: "BAÑO",          desc: "Distancias de ejes corresponden a plano" },
      { id: 39, tipo: "CLOACAS Y AGUA FRÍA/CAL.", local: "BAÑO",          desc: "Chequeo general de posición y correcto engrampado" },
      { id: 40, tipo: "CLOACAS Y AGUA FRÍA/CAL.", local: "COCINA",        desc: "Distancias de ejes corresponden a plano" },
      { id: 41, tipo: "AGUA FRÍA/CALIENTE",       local: "COCINA",        desc: "Ejes de caldera/termotanque corresponden con plano" },
      { id: 42, tipo: "GAS",                      local: "COCINA",        desc: "Distancias de ejes corresponden a plano" },
      { id: 43, tipo: "GAS",                      local: "GENERAL SC",    desc: "Ventilaciones replanteadas con calandro" },
      { id: 44, tipo: "GAS",                      local: "GENERAL SC",    desc: "Conducto de ventilaciones con pendiente hacia afuera de 1 cm" },
      { id: 45, tipo: "LOSA RADIANTE",            local: "COLECTORES SC", desc: "Caja de colectores a plomo con ladrillo y a nivel" },
      { id: 46, tipo: "LOSA RADIANTE",            local: "COLECTORES SC", desc: "Correcto sentido de ingreso de agua" },
      { id: 47, tipo: "LOSA RADIANTE",            local: "CIRCUITO SC",   desc: "Mangueras no salen del ángulo 90° entre pared y piso" },
      { id: 48, tipo: "LOSA RADIANTE",            local: "CIRCUITO SC",   desc: "No ingresan a duchas, placares ni banquinas (distancia a 10 cm)" },
      { id: 49, tipo: "LOSA RADIANTE",            local: "CIRCUITO SC",   desc: "Buena densidad de distribución en baño" },
      { id: 50, tipo: "LOSA RADIANTE",            local: "GENERAL",       desc: "Manguera no sobresale de la carpeta (a 3 cm de NPT)" },
      { id: 51, tipo: "AIRE ACOND.",              local: "GENERAL",       desc: "Corrugado llega a caja de preinstalación" },
      { id: 52, tipo: "AIRE ACOND.",              local: "GENERAL",       desc: "Caja a plomo con la pared" },
      { id: 53, tipo: "AIRE ACOND.",              local: "GENERAL",       desc: "Desagüe presente" },
      { id: 54, tipo: "AIRE ACOND.",              local: "GENERAL",       desc: "Cobre presente" },
      { id: 55, tipo: "AIRE ACOND.",              local: "GENERAL",       desc: "Mangueras no salen del ángulo 90° entre pared y piso" },
      { id: 56, tipo: "AIRE ACOND.",              local: "GENERAL",       desc: "Manguera no sobresale de la carpeta (a 3 cm de NPT)" },
      { id: 57, tipo: "AIRE ACOND.",              local: "GENERAL",       desc: "Caja exterior correctamente instalada (Plomo 2 cm, h=20, nivel)" },
    ],
  },
  {
    id: "REVOQUES", nombre: "Revoques — Cocinas y Baños",
    items: [
      { id: 58, tipo: "REVOQUE GRUESO",           local: "GENERAL", desc: "Paredes aplomadas y a escuadra" },
      { id: 59, tipo: "PROTECCIÓN INSTALACIONES", local: "GENERAL", desc: "Bocas, tomas y llaves identificadas y protegidas" },
    ],
  },
];

const TODOS_ITEMS = RUBROS.flatMap(r => r.items);

const ESTADOS = {
  VERIFICA:     { label: "Verifica",       short: "V",  color: "#22c55e", bg: "#052e16", border: "#16a34a" },
  VERIFICA_OBS: { label: "Verifica c/Obs", short: "VO", color: "#eab308", bg: "#1c1a02", border: "#a16207" },
  NO_VERIFICA:  { label: "No Verifica",    short: "NV", color: "#ef4444", bg: "#2d0a0a", border: "#b91c1c" },
  PENDIENTE:    { label: "Pendiente",      short: "P",  color: "#6b7280", bg: "#111827", border: "#374151" },
};

const RELEVAMIENTOS = ["R0", "R1", "R2"];
const ROLES = ["Obra", "Coordinador", "Oficina Técnica"];
const MAX_REINTENTOS = 3;
const DELAY_REINTENTO = 2000;

// ─── HELPERS ─────────────────────────────────────────────────────────────────
function uid() {
  return typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2) + Date.now().toString(36);
}

function formatFecha(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit", year: "2-digit" }) +
    " " + d.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" });
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

function normalizarRegistro(row) {
  return {
    id: row.id,
    piso: row.piso,
    depto: row.depto,
    relevamiento: row.relevamiento,
    responsable: row.responsable,
    rol: row.rol,
    fecha: row.fecha,
    items: typeof row.items === "string" ? JSON.parse(row.items) : (row.items || {}),
    anulado: row.anulado ?? false,
    esCorrección: row.es_correccion ?? false,
    corrigenA: row.corrigen_a ?? null,
  };
}

function getItemData(registro, itemId) {
  return registro.items[String(itemId)] || registro.items[itemId] || null;
}

function getEstadoVigente(registros, piso, depto, itemId) {
  const relevantes = registros
    .filter(r => r.piso === piso && r.depto === depto && !r.anulado && getItemData(r, itemId))
    .sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
  if (relevantes.length === 0) return null;
  const r = relevantes[0];
  const d = getItemData(r, itemId);
  return { ...d, relevamiento: r.relevamiento, responsable: r.responsable, fecha: r.fecha };
}

function getAptoCertificar(registros, piso, depto, itemId) {
  const v = getEstadoVigente(registros, piso, depto, itemId);
  return v?.relevamiento === "R2" && v?.estado === "VERIFICA";
}

function getCertificacionDepto(registros, piso, depto) {
  const total = TODOS_ITEMS.length;
  const aptos = TODOS_ITEMS.filter(i => getAptoCertificar(registros, piso, depto, i.id)).length;
  return { aptos, total, pct: Math.round((aptos / total) * 100) };
}

function getHistorial(registros, piso, depto, itemId) {
  return registros
    .filter(r => r.piso === piso && r.depto === depto && getItemData(r, itemId))
    .sort((a, b) => new Date(a.fecha) - new Date(b.fecha));
}

// ─── SUPABASE ─────────────────────────────────────────────────────────────────
async function cargarRegistros() {
  const { data, error } = await supabase
    .from("registros")
    .select("*")
    .order("fecha", { ascending: true });
  if (error) throw new Error(error.message);
  return (data || []).map(normalizarRegistro);
}

async function insertarRegistro(registro, intento = 0) {
  const row = {
    id: registro.id,
    piso: registro.piso,
    depto: registro.depto,
    relevamiento: registro.relevamiento,
    responsable: registro.responsable,
    rol: registro.rol,
    fecha: registro.fecha,
    items: registro.items,
    anulado: registro.anulado,
    es_correccion: registro.esCorrección,
    corrigen_a: registro.corrigenA,
  };
  const { error } = await supabase.from("registros").insert(row);
  if (error) {
    if (intento < MAX_REINTENTOS) {
      await sleep(DELAY_REINTENTO * (intento + 1));
      return insertarRegistro(registro, intento + 1);
    }
    throw new Error(error.message);
  }
}

async function anularRegistro(id, intento = 0) {
  const { error } = await supabase.from("registros").update({ anulado: true }).eq("id", id);
  if (error) {
    if (intento < MAX_REINTENTOS) {
      await sleep(DELAY_REINTENTO * (intento + 1));
      return anularRegistro(id, intento + 1);
    }
    throw new Error(error.message);
  }
}

// ─── ESTILOS ─────────────────────────────────────────────────────────────────
const G = {
  bg: "#0a0c10", surface: "#111318", surface2: "#181c24",
  border: "#1e2330", accent: "#f97316", accentDim: "#7c3811",
  text: "#e8eaf0", textMuted: "#6b7280", textDim: "#9ca3af",
  font: "'DM Sans', system-ui, sans-serif",
  mono: "'JetBrains Mono', monospace",
};

const css = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;600&display=swap');
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { background: ${G.bg}; color: ${G.text}; font-family: ${G.font}; -webkit-tap-highlight-color: transparent; }
  ::-webkit-scrollbar { width: 4px; }
  ::-webkit-scrollbar-track { background: ${G.surface}; }
  ::-webkit-scrollbar-thumb { background: ${G.border}; border-radius: 2px; }
  input, textarea, select {
    background: ${G.surface2}; border: 1px solid ${G.border}; color: ${G.text};
    border-radius: 8px; padding: 10px 14px; font-family: ${G.font}; font-size: 15px;
    outline: none; width: 100%; -webkit-appearance: none;
  }
  input:focus, textarea:focus, select:focus { border-color: ${G.accent}; }
  select option { background: ${G.surface2}; }
  textarea { resize: vertical; min-height: 72px; }
  button { cursor: pointer; font-family: ${G.font}; -webkit-tap-highlight-color: transparent; }
  button:active { opacity: .82; }
`;

// ─── COMPONENTES ─────────────────────────────────────────────────────────────
function EstadoBadge({ estado }) {
  if (!estado || !ESTADOS[estado]) return <span style={{ color: G.textMuted, fontSize: 12 }}>—</span>;
  const e = ESTADOS[estado];
  return (
    <span style={{
      background: e.bg, color: e.color, border: `1px solid ${e.border}`,
      borderRadius: 20, padding: "3px 8px", fontSize: 11, fontWeight: 600,
      display: "inline-block", whiteSpace: "nowrap",
    }}>{e.label}</span>
  );
}

function NavBar({ vista, setVista }) {
  const tabs = [
    { id: "form",      label: "Relevamiento", icon: "📋" },
    { id: "dashboard", label: "Dashboard",    icon: "📊" },
    { id: "informe",   label: "Informe",      icon: "📄" },
  ];
  return (
    <nav style={{ position: "sticky", top: 0, zIndex: 100, background: G.surface, borderBottom: `1px solid ${G.border}`, display: "flex", alignItems: "center" }}>
      <div style={{ padding: "0 16px", borderRight: `1px solid ${G.border}`, display: "flex", alignItems: "center", gap: 8, height: 56, flexShrink: 0 }}>
        <span style={{ fontSize: 20 }}>🏗️</span>
        <span style={{ fontWeight: 700, fontSize: 13, color: G.accent, letterSpacing: 1, whiteSpace: "nowrap" }}>CC OBRA</span>
      </div>
      <div style={{ display: "flex", flex: 1, height: 56 }}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => setVista(t.id)} style={{
            flex: 1, border: "none", background: "transparent",
            color: vista === t.id ? G.accent : G.textMuted,
            borderBottom: `2px solid ${vista === t.id ? G.accent : "transparent"}`,
            padding: "0 4px", fontSize: 13, fontWeight: 600,
            display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 2,
          }}>
            <span style={{ fontSize: 18 }}>{t.icon}</span>
            <span style={{ fontSize: 10 }}>{t.label}</span>
          </button>
        ))}
      </div>
    </nav>
  );
}

function BarraSync({ syncOk, guardando, ultimaSync, onActualizar }) {
  return (
    <div style={{ padding: "5px 16px", background: G.surface, borderBottom: `1px solid ${G.border}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <span style={{ width: 7, height: 7, borderRadius: "50%", flexShrink: 0, display: "inline-block", background: guardando ? "#eab308" : syncOk ? "#22c55e" : "#ef4444" }} />
        <span style={{ fontSize: 11, color: G.textMuted }}>
          {guardando ? "Guardando…" : syncOk
            ? (ultimaSync ? `Sincronizado ${ultimaSync.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" })}` : "Conectado")
            : "Error de conexión"}
        </span>
      </div>
      <button onClick={onActualizar} disabled={guardando} style={{ background: "none", border: `1px solid ${G.border}`, borderRadius: 6, padding: "2px 10px", fontSize: 11, color: G.textMuted, opacity: guardando ? .5 : 1 }}>
        ↻ Actualizar
      </button>
    </div>
  );
}

// ─── FORMULARIO ──────────────────────────────────────────────────────────────
function VistaFormulario({ onGuardar, prefill, setPrefill }) {
  const [piso, setPiso]           = useState(prefill?.piso?.toString() || "");
  const [depto, setDepto]         = useState(prefill?.depto || "");
  const [relev, setRelev]         = useState(prefill?.relevamiento || "R0");
  const [responsable, setResp]    = useState(prefill?.responsable || "");
  const [rol, setRol]             = useState(prefill?.rol || "Obra");
  const [rubrosOpen, setRubrosOpen] = useState({});
  const [itemsForm, setItemsForm] = useState(() => {
    if (!prefill?.items) return {};
    // Normalizar claves a string
    const norm = {};
    Object.entries(prefill.items).forEach(([k, v]) => { norm[String(k)] = v; });
    return norm;
  });
  const [estadoGuardar, setEstadoGuardar] = useState("idle"); // idle | guardando | ok | error
  const [errorMsg, setErrorMsg]   = useState("");
  const [errores, setErrores]     = useState([]);

  const deptos = piso ? PISOS[parseInt(piso)] : [];

  function setItemEstado(itemId, est) {
    setItemsForm(prev => ({ ...prev, [String(itemId)]: { estado: est, obs: prev[String(itemId)]?.obs || "" } }));
  }
  function setItemObs(itemId, obs) {
    setItemsForm(prev => ({ ...prev, [String(itemId)]: { ...prev[String(itemId)], obs } }));
  }

  function validar() {
    const errs = [];
    if (!piso) errs.push("Seleccioná el piso");
    if (!depto) errs.push("Seleccioná el departamento");
    if (!responsable.trim()) errs.push("Ingresá el nombre del responsable");
    if (Object.keys(itemsForm).length === 0) errs.push("Completá al menos un ítem");
    Object.entries(itemsForm).forEach(([id, val]) => {
      if ((val.estado === "NO_VERIFICA" || val.estado === "VERIFICA_OBS") && !val.obs?.trim()) {
        const item = TODOS_ITEMS.find(i => i.id === parseInt(id));
        errs.push(`#${id} ${item?.desc || ""}: observación requerida`);
      }
    });
    return errs;
  }

  async function guardar() {
    const errs = validar();
    setErrores(errs);
    if (errs.length > 0) return;

    setEstadoGuardar("guardando");
    setErrorMsg("");

    const registro = {
      id: uid(),
      piso: parseInt(piso), depto, relevamiento: relev,
      responsable: responsable.trim(), rol,
      fecha: new Date().toISOString(),
      items: itemsForm,
      anulado: false,
      esCorrección: !!prefill,
      corrigenA: prefill?.id || null,
    };

    try {
      if (prefill?.id) await anularRegistro(prefill.id);
      await insertarRegistro(registro);
      // Solo limpiamos DESPUÉS de confirmación de Supabase
      setEstadoGuardar("ok");
      setItemsForm({});
      setPiso(""); setDepto(""); setResp(""); setRol("Obra"); setRubrosOpen({});
      setPrefill(null);
      onGuardar();
      setTimeout(() => setEstadoGuardar("idle"), 3000);
    } catch (e) {
      // No limpiamos el formulario — el usuario puede reintentar
      setEstadoGuardar("error");
      setErrorMsg(e.message || "Error al guardar. Los datos no se perdieron — intentá de nuevo.");
    }
  }

  const contados = useMemo(() => {
    const c = { VERIFICA: 0, VERIFICA_OBS: 0, NO_VERIFICA: 0, PENDIENTE: 0, sin: 0 };
    TODOS_ITEMS.forEach(item => {
      const e = itemsForm[String(item.id)]?.estado;
      if (e && c[e] !== undefined) c[e]++; else c.sin++;
    });
    return c;
  }, [itemsForm]);

  const guardando = estadoGuardar === "guardando";

  return (
    <div style={{ padding: "0 0 80px", maxWidth: 700, margin: "0 auto" }}>
      {prefill && (
        <div style={{ margin: "12px 16px 0", background: "#1c1200", border: "1px solid #92400e", borderRadius: 10, padding: "10px 14px", fontSize: 13, color: "#fbbf24" }}>
          ✏️ Modo corrección — registro del {formatFecha(prefill.fecha)}
          <button onClick={() => setPrefill(null)} style={{ marginLeft: 12, background: "none", border: "none", color: "#f97316", fontSize: 13, textDecoration: "underline" }}>Cancelar</button>
        </div>
      )}

      {/* Paso 1 */}
      <div style={{ margin: "16px 16px 0", background: G.surface, border: `1px solid ${G.border}`, borderRadius: 12, padding: 16 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: G.accent, letterSpacing: 1, marginBottom: 12 }}>PASO 1 — UBICACIÓN</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <div>
            <label style={{ fontSize: 12, color: G.textMuted, display: "block", marginBottom: 6 }}>Piso</label>
            <select value={piso} onChange={e => { setPiso(e.target.value); setDepto(""); }}>
              <option value="">— Piso —</option>
              {Object.keys(PISOS).map(p => <option key={p} value={p}>Piso {p}</option>)}
            </select>
          </div>
          <div>
            <label style={{ fontSize: 12, color: G.textMuted, display: "block", marginBottom: 6 }}>Departamento</label>
            <select value={depto} onChange={e => setDepto(e.target.value)} disabled={!piso}>
              <option value="">— Depto —</option>
              {deptos.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* Paso 2 */}
      <div style={{ margin: "12px 16px 0", background: G.surface, border: `1px solid ${G.border}`, borderRadius: 12, padding: 16 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: G.accent, letterSpacing: 1, marginBottom: 12 }}>PASO 2 — RELEVAMIENTO</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 12 }}>
          {RELEVAMIENTOS.map(r => (
            <button key={r} onClick={() => setRelev(r)} style={{
              padding: "12px 0", borderRadius: 8,
              border: `2px solid ${relev === r ? G.accent : G.border}`,
              background: relev === r ? G.accentDim : G.surface2,
              color: relev === r ? G.accent : G.textDim,
              fontWeight: 700, fontSize: 18,
            }}>{r}</button>
          ))}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <div>
            <label style={{ fontSize: 12, color: G.textMuted, display: "block", marginBottom: 6 }}>Responsable</label>
            <input value={responsable} onChange={e => setResp(e.target.value)} placeholder="Nombre completo" />
          </div>
          <div>
            <label style={{ fontSize: 12, color: G.textMuted, display: "block", marginBottom: 6 }}>Rol</label>
            <select value={rol} onChange={e => setRol(e.target.value)}>
              {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* KPIs */}
      <div style={{ margin: "12px 16px 0", display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 6 }}>
        {[
          { k: "VERIFICA", lbl: "V", col: "#22c55e" },
          { k: "VERIFICA_OBS", lbl: "VO", col: "#eab308" },
          { k: "NO_VERIFICA", lbl: "NV", col: "#ef4444" },
          { k: "PENDIENTE", lbl: "P", col: "#6b7280" },
          { k: "sin", lbl: "Sin", col: "#374151" },
        ].map(({ k, lbl, col }) => (
          <div key={k} style={{ background: G.surface, border: `1px solid ${G.border}`, borderRadius: 8, padding: "8px 4px", textAlign: "center" }}>
            <div style={{ fontSize: 18, fontWeight: 700, color: col, fontFamily: G.mono }}>{contados[k]}</div>
            <div style={{ fontSize: 10, color: G.textMuted }}>{lbl}</div>
          </div>
        ))}
      </div>

      {/* Ítems */}
      <div style={{ margin: "12px 16px 0", fontSize: 11, fontWeight: 700, color: G.accent, letterSpacing: 1 }}>PASO 3 — ÍTEMS</div>
      {RUBROS.map(rubro => (
        <div key={rubro.id} style={{ margin: "8px 16px 0", background: G.surface, border: `1px solid ${G.border}`, borderRadius: 12, overflow: "hidden" }}>
          <button onClick={() => setRubrosOpen(prev => ({ ...prev, [rubro.id]: !prev[rubro.id] }))} style={{
            width: "100%", padding: "14px 16px", background: "none", border: "none",
            color: G.text, display: "flex", justifyContent: "space-between", alignItems: "center", fontWeight: 600, fontSize: 14,
          }}>
            <span>{rubro.nombre}</span>
            <span style={{ fontSize: 18, color: G.textMuted }}>{rubrosOpen[rubro.id] ? "▾" : "▸"}</span>
          </button>
          {rubrosOpen[rubro.id] && (
            <div style={{ borderTop: `1px solid ${G.border}` }}>
              {rubro.items.map((item, idx) => {
                const key = String(item.id);
                const curr = itemsForm[key];
                const needsObs = curr?.estado === "VERIFICA_OBS" || curr?.estado === "NO_VERIFICA";
                const obsVacia = needsObs && !curr?.obs?.trim();
                return (
                  <div key={item.id} style={{
                    padding: "12px 16px",
                    borderTop: idx > 0 ? `1px solid ${G.border}` : "none",
                    background: curr?.estado ? ESTADOS[curr.estado]?.bg + "44" : "transparent",
                  }}>
                    <div style={{ fontSize: 10, marginBottom: 3, fontFamily: G.mono, display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
                      <span style={{ color: G.accent, fontWeight: 700 }}>#{item.id}</span>
                      <span style={{ color: G.border }}>·</span>
                      <span style={{ color: G.accent, fontWeight: 600, textTransform: "uppercase", letterSpacing: .5 }}>{item.tipo}</span>
                      {item.local !== "GENERAL" && <>
                        <span style={{ color: G.border }}>·</span>
                        <span style={{ background: G.surface2, border: `1px solid ${G.border}`, borderRadius: 4, padding: "1px 6px", color: G.textDim }}>{item.local}</span>
                      </>}
                    </div>
                    <div style={{ fontSize: 14, color: G.text, marginBottom: 10, lineHeight: 1.4 }}>{item.desc}</div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 6 }}>
                      {Object.entries(ESTADOS).map(([k, e]) => (
                        <button key={k} onClick={() => setItemEstado(item.id, k)} style={{
                          padding: "10px 4px", borderRadius: 8,
                          border: `2px solid ${curr?.estado === k ? e.color : G.border}`,
                          background: curr?.estado === k ? e.bg : G.surface2,
                          color: curr?.estado === k ? e.color : G.textMuted,
                          fontSize: 11, fontWeight: 700, lineHeight: 1.2,
                        }}>{e.short}</button>
                      ))}
                    </div>
                    {needsObs && (
                      <textarea
                        style={{ marginTop: 8, borderColor: obsVacia ? "#b91c1c" : G.border }}
                        placeholder={`Observación obligatoria para ${ESTADOS[curr.estado]?.label}`}
                        value={curr?.obs || ""}
                        onChange={e => setItemObs(item.id, e.target.value)}
                      />
                    )}
                    {obsVacia && <div style={{ fontSize: 11, color: "#f87171", marginTop: 4 }}>⚠ Escribí la observación antes de guardar</div>}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ))}

      {errores.length > 0 && (
        <div style={{ margin: "12px 16px 0", background: "#2d0a0a", border: "1px solid #b91c1c", borderRadius: 10, padding: "10px 14px" }}>
          {errores.map((e, i) => <div key={i} style={{ color: "#f87171", fontSize: 13 }}>⚠ {e}</div>)}
        </div>
      )}
      {estadoGuardar === "ok" && (
        <div style={{ margin: "12px 16px 0", background: "#052e16", border: "1px solid #16a34a", borderRadius: 10, padding: "10px 14px", color: "#4ade80", fontSize: 13 }}>
          ✓ Relevamiento guardado y confirmado en la base de datos
        </div>
      )}
      {estadoGuardar === "error" && (
        <div style={{ margin: "12px 16px 0", background: "#2d0a0a", border: "1px solid #b91c1c", borderRadius: 10, padding: "12px 14px" }}>
          <div style={{ color: "#f87171", fontSize: 13, marginBottom: 8 }}>⚠ {errorMsg}</div>
          <button onClick={guardar} style={{ padding: "8px 16px", borderRadius: 8, border: "1px solid #b91c1c", background: "#3f0a0a", color: "#f87171", fontSize: 13, fontWeight: 600 }}>
            Reintentar
          </button>
        </div>
      )}

      <div style={{ padding: "16px 16px 0" }}>
        <button onClick={guardar} disabled={guardando} style={{
          width: "100%", padding: "16px", borderRadius: 12,
          background: guardando ? G.accentDim : G.accent,
          border: "none", color: "#fff", fontWeight: 700, fontSize: 16,
          opacity: guardando ? .7 : 1,
        }}>
          {guardando ? "Guardando…" : prefill ? "Guardar Corrección" : "Guardar Relevamiento"}
        </button>
      </div>
    </div>
  );
}

// ─── CELDA DASHBOARD ─────────────────────────────────────────────────────────
function CeldaDashboard({ piso, depto, itemId, registros, onSelect, selected }) {
  const vigente = getEstadoVigente(registros, piso, depto, itemId);
  const eKey = vigente?.estado || "PENDIENTE";
  const e = ESTADOS[eKey];
  const apto = getAptoCertificar(registros, piso, depto, itemId);
  return (
    <td onClick={() => onSelect({ piso, depto, itemId })}
      title={`${e.label}${vigente?.obs ? ": " + vigente.obs : ""}${apto ? " ✅ R2" : ""}`}
      style={{
        width: 36, height: 36, minWidth: 36,
        background: selected ? e.color + "55" : e.bg,
        border: `2px solid ${selected ? e.color : vigente ? e.border : G.border}`,
        borderRadius: 6, cursor: "pointer", textAlign: "center",
        fontSize: 10, fontWeight: 700, color: e.color, position: "relative", userSelect: "none",
      }}>
      {e.short}
      {apto && <span style={{ position: "absolute", top: -4, right: -4, width: 10, height: 10, borderRadius: "50%", background: "#22c55e", border: "2px solid #0a0c10" }} />}
    </td>
  );
}

// ─── HISTORIAL ───────────────────────────────────────────────────────────────
function PanelHistorial({ sel, registros, setPrefill, setVista }) {
  if (!sel) return null;
  const { piso, depto, itemId } = sel;
  const item = TODOS_ITEMS.find(i => i.id === itemId);
  const historial = getHistorial(registros, piso, depto, itemId);
  return (
    <div style={{ background: G.surface, border: `1px solid ${G.border}`, borderRadius: 12, margin: "12px 16px", padding: 16 }}>
      <div style={{ fontSize: 11, color: G.textMuted, fontFamily: G.mono, marginBottom: 4 }}>Piso {piso} · Depto {depto} · #{itemId}</div>
      <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 14 }}>{item?.desc}</div>
      {historial.length === 0 && <div style={{ color: G.textMuted, fontSize: 13 }}>Sin relevamientos registrados</div>}
      {historial.map(r => {
        const d = getItemData(r, itemId);
        return (
          <div key={r.id} style={{ borderLeft: `3px solid ${r.anulado ? G.border : ESTADOS[d?.estado]?.border || G.border}`, paddingLeft: 12, marginBottom: 12, opacity: r.anulado ? .4 : 1 }}>
            <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
              <span style={{ fontFamily: G.mono, fontWeight: 700, fontSize: 13, color: G.accent }}>{r.relevamiento}</span>
              <EstadoBadge estado={d?.estado} />
              {r.anulado && <span style={{ background: "#3f0a0a", color: "#ef4444", fontSize: 10, padding: "2px 7px", borderRadius: 20, border: "1px solid #7f1d1d" }}>ANULADO</span>}
              {r.esCorrección && <span style={{ background: "#1c1a00", color: "#fbbf24", fontSize: 10, padding: "2px 7px", borderRadius: 20, border: "1px solid #78350f" }}>CORRECCIÓN</span>}
            </div>
            <div style={{ fontSize: 12, color: G.textMuted, marginTop: 3 }}>{formatFecha(r.fecha)} · {r.responsable} · {r.rol}</div>
            {d?.obs && <div style={{ fontSize: 13, color: G.textDim, marginTop: 4, fontStyle: "italic" }}>"{d.obs}"</div>}
            {!r.anulado && (
              <button onClick={() => { setPrefill({ ...r }); setVista("form"); }} style={{
                marginTop: 8, padding: "5px 12px", borderRadius: 6,
                border: `1px solid ${G.border}`, background: G.surface2, color: G.textDim, fontSize: 12,
              }}>✏️ Corregir entrada</button>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── DASHBOARD ───────────────────────────────────────────────────────────────
function VistaDashboard({ registros, setPrefill, setVista }) {
  const [piso, setPiso] = useState(1);
  const [sel, setSel]   = useState(null);
  const deptos = PISOS[piso];

  function handleSelect(info) {
    setSel(prev => prev?.piso === info.piso && prev?.depto === info.depto && prev?.itemId === info.itemId ? null : info);
  }

  function kpisDepto(depto) {
    const c = { VERIFICA: 0, VERIFICA_OBS: 0, NO_VERIFICA: 0, PENDIENTE: 0 };
    TODOS_ITEMS.forEach(item => {
      const v = getEstadoVigente(registros, piso, depto, item.id);
      const k = v?.estado || "PENDIENTE";
      if (c[k] !== undefined) c[k]++;
    });
    return c;
  }

  return (
    <div style={{ paddingBottom: 60 }}>
      <div style={{ padding: "12px 16px", display: "flex", gap: 8, flexWrap: "wrap", borderBottom: `1px solid ${G.border}` }}>
        {Object.keys(PISOS).map(p => (
          <button key={p} onClick={() => { setPiso(parseInt(p)); setSel(null); }} style={{
            padding: "8px 14px", borderRadius: 8,
            border: `2px solid ${piso === parseInt(p) ? G.accent : G.border}`,
            background: piso === parseInt(p) ? G.accentDim : G.surface,
            color: piso === parseInt(p) ? G.accent : G.textMuted,
            fontWeight: 700, fontSize: 14,
          }}>P{p}</button>
        ))}
      </div>

      {/* Grilla */}
      <div style={{ overflowX: "auto", padding: "12px 16px 0" }}>
        <table style={{ borderCollapse: "separate", borderSpacing: 4, minWidth: "max-content" }}>
          <thead>
            <tr>
              <th style={{ textAlign: "left", fontSize: 11, color: G.textMuted, padding: "0 8px 8px 0", fontWeight: 400, whiteSpace: "nowrap", minWidth: 220 }}>Ítem</th>
              {deptos.map(d => <th key={d} style={{ fontSize: 12, fontWeight: 700, color: G.accent, textAlign: "center", padding: "0 2px 8px", minWidth: 36 }}>{d}</th>)}
            </tr>
          </thead>
          <tbody>
            {TODOS_ITEMS.map(item => {
              const rubro = RUBROS.find(r => r.items.some(i => i.id === item.id));
              const isFirst = rubro?.items[0]?.id === item.id;
              return (
                <>
                  {isFirst && (
                    <tr key={`h-${rubro.id}`}>
                      <td colSpan={deptos.length + 1} style={{ padding: "10px 4px 4px", fontSize: 10, fontWeight: 700, color: G.accent, letterSpacing: 1, textTransform: "uppercase" }}>
                        {rubro.nombre}
                      </td>
                    </tr>
                  )}
                  <tr key={item.id}>
                    <td style={{ fontSize: 12, color: G.textDim, paddingRight: 12, whiteSpace: "nowrap", paddingBottom: 4 }}>
                      <span style={{ fontFamily: G.mono, fontSize: 10, color: G.textMuted, marginRight: 6 }}>#{item.id}</span>
                      {item.local !== "GENERAL" && <span style={{ color: G.textMuted, marginRight: 4 }}>[{item.local}]</span>}
                      {item.desc.length > 40 ? item.desc.slice(0, 40) + "…" : item.desc}
                    </td>
                    {deptos.map(d => (
                      <CeldaDashboard key={d} piso={piso} depto={d} itemId={item.id}
                        registros={registros} onSelect={handleSelect}
                        selected={sel?.piso === piso && sel?.depto === d && sel?.itemId === item.id} />
                    ))}
                  </tr>
                </>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* KPIs */}
      <div style={{ overflowX: "auto", padding: "12px 16px 0" }}>
        <table style={{ borderCollapse: "separate", borderSpacing: 4, minWidth: "max-content" }}>
          <thead>
            <tr>
              <th style={{ fontSize: 11, color: G.textMuted, fontWeight: 400, textAlign: "left", padding: "0 8px 6px 0", minWidth: 220 }}>KPIs</th>
              {deptos.map(d => <th key={d} style={{ fontSize: 12, color: G.accent, fontWeight: 700, minWidth: 36, textAlign: "center" }}>{d}</th>)}
            </tr>
          </thead>
          <tbody>
            {[
              { k: "VERIFICA", col: "#22c55e" },
              { k: "VERIFICA_OBS", col: "#eab308" },
              { k: "NO_VERIFICA", col: "#ef4444" },
              { k: "PENDIENTE", col: "#6b7280" },
            ].map(({ k, col }) => (
              <tr key={k}>
                <td style={{ fontSize: 11, color: col, paddingRight: 12, paddingBottom: 4 }}>{ESTADOS[k].label}</td>
                {deptos.map(d => {
                  const v = kpisDepto(d)[k];
                  return <td key={d} style={{ textAlign: "center", fontSize: 12, fontWeight: 700, color: v > 0 ? col : G.border, fontFamily: G.mono, paddingBottom: 4 }}>{v}</td>;
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Certificación */}
      <div style={{ overflowX: "auto", padding: "16px 16px 0" }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: G.accent, letterSpacing: 1, marginBottom: 10 }}>CERTIFICACIÓN — R2 VERIFICA</div>
        <div style={{ display: "flex", gap: 8, minWidth: "max-content" }}>
          {deptos.map(d => {
            const cert = getCertificacionDepto(registros, piso, d);
            const apto = cert.aptos === cert.total;
            const parcial = cert.aptos > 0 && !apto;
            const bc = apto ? "#16a34a" : parcial ? "#a16207" : G.border;
            const tc = apto ? "#22c55e" : parcial ? "#eab308" : G.textMuted;
            const bg = apto ? "#052e16" : parcial ? "#1c1a02" : G.surface2;
            return (
              <div key={d} style={{ minWidth: 80, background: G.surface, border: `2px solid ${bc}`, borderRadius: 10, padding: "10px 10px 8px", textAlign: "center" }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: G.accent, marginBottom: 6 }}>Dto {d}</div>
                <div style={{ height: 4, background: G.border, borderRadius: 2, marginBottom: 6, overflow: "hidden" }}>
                  <div style={{ height: "100%", borderRadius: 2, width: `${cert.pct}%`, background: tc }} />
                </div>
                <div style={{ fontSize: 11, fontFamily: G.mono, color: tc, marginBottom: 6 }}>{cert.aptos}/{cert.total}</div>
                <div style={{ fontSize: 10, fontWeight: 700, color: tc, background: bg, border: `1px solid ${bc}`, borderRadius: 6, padding: "3px 6px" }}>
                  {apto ? "✅ APTO" : parcial ? "⏳ PARCIAL" : "⛔ SIN R2"}
                </div>
              </div>
            );
          })}
        </div>
        <div style={{ fontSize: 10, color: G.textMuted, marginTop: 8 }}>
          Punto verde = R2 Verifica · APTO = los {TODOS_ITEMS.length} ítems en R2 Verifica
        </div>
      </div>

      <PanelHistorial sel={sel} registros={registros} setPrefill={setPrefill} setVista={setVista} />
    </div>
  );
}

// ─── INFORME ─────────────────────────────────────────────────────────────────
function VistaInforme({ registros }) {
  const pendientes = useMemo(() => {
    const result = [];
    Object.keys(PISOS).forEach(ps => {
      const piso = parseInt(ps);
      PISOS[piso].forEach(depto => {
        TODOS_ITEMS.forEach(item => {
          const v = getEstadoVigente(registros, piso, depto, item.id);
          if (v && (v.estado === "NO_VERIFICA" || v.estado === "VERIFICA_OBS"))
            result.push({ piso, depto, item, vigente: v });
        });
      });
    });
    return result;
  }, [registros]);

  if (pendientes.length === 0) {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 60, gap: 16 }}>
        <div style={{ fontSize: 64 }}>✅</div>
        <div style={{ fontSize: 18, fontWeight: 700, color: "#4ade80", textAlign: "center" }}>Todos los ítems verificados</div>
        <div style={{ fontSize: 14, color: G.textMuted, textAlign: "center" }}>Certificación habilitada</div>
      </div>
    );
  }

  const grupos = {};
  pendientes.forEach(({ piso, depto, item, vigente }) => {
    const rubro = RUBROS.find(r => r.items.some(i => i.id === item.id))?.nombre || "Otro";
    if (!grupos[piso]) grupos[piso] = {};
    if (!grupos[piso][depto]) grupos[piso][depto] = {};
    if (!grupos[piso][depto][rubro]) grupos[piso][depto][rubro] = [];
    grupos[piso][depto][rubro].push({ item, vigente });
  });

  return (
    <div style={{ padding: "12px 16px 80px" }}>
      <div style={{ marginBottom: 16, fontSize: 13, color: G.textMuted }}>
        <span style={{ fontFamily: G.mono, fontWeight: 700, color: "#ef4444", fontSize: 18 }}>{pendientes.length}</span> ítems con observaciones o no-conformidades vigentes
      </div>
      {Object.keys(grupos).sort((a, b) => a - b).map(piso => (
        <div key={piso} style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: G.accent, letterSpacing: 1, padding: "8px 12px", background: G.surface, borderRadius: "8px 8px 0 0", border: `1px solid ${G.border}`, borderBottom: "none" }}>
            PISO {piso}
          </div>
          {Object.keys(grupos[piso]).sort().map(depto => (
            <div key={depto} style={{ border: `1px solid ${G.border}`, borderTop: "none", background: G.surface2 }}>
              <div style={{ padding: "8px 12px", borderBottom: `1px solid ${G.border}`, fontSize: 12, fontWeight: 600, color: G.textDim, background: G.surface }}>
                Departamento {depto}
              </div>
              {Object.keys(grupos[piso][depto]).map(rubro => (
                <div key={rubro}>
                  <div style={{ padding: "6px 12px", fontSize: 10, fontWeight: 700, color: G.textMuted, letterSpacing: 1, borderBottom: `1px solid ${G.border}`, textTransform: "uppercase" }}>{rubro}</div>
                  {grupos[piso][depto][rubro].map(({ item, vigente }) => (
                    <div key={item.id} style={{ padding: "10px 12px", borderBottom: `1px solid ${G.border}`, borderLeft: `3px solid ${ESTADOS[vigente.estado]?.color}` }}>
                      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "flex-start", marginBottom: 4 }}>
                        <span style={{ fontFamily: G.mono, fontSize: 10, color: G.textMuted }}>#{item.id}</span>
                        <span style={{ fontSize: 13, color: G.text, flex: 1 }}>{item.desc}</span>
                        <EstadoBadge estado={vigente.estado} />
                      </div>
                      <div style={{ fontSize: 11, color: G.textMuted, display: "flex", gap: 12, flexWrap: "wrap" }}>
                        <span>{vigente.relevamiento}</span>
                        <span>{vigente.responsable}</span>
                        <span>{formatFecha(vigente.fecha)}</span>
                      </div>
                      {vigente.obs && <div style={{ fontSize: 12, color: G.textDim, marginTop: 4, fontStyle: "italic" }}>"{vigente.obs}"</div>}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

// ─── APP ROOT ─────────────────────────────────────────────────────────────────
export default function App() {
  const [vista, setVista]           = useState("form");
  const [registros, setRegistros]   = useState([]);
  const [prefill, setPrefill]       = useState(null);
  const [cargando, setCargando]     = useState(true);
  const [syncOk, setSyncOk]         = useState(true);
  const [guardando, setGuardando]   = useState(false);
  const [ultimaSync, setUltimaSync] = useState(null);
  const [errorCarga, setErrorCarga] = useState(null);
  const pollingRef = useRef(null);

  const cargar = useCallback(async () => {
    try {
      const r = await cargarRegistros();
      setRegistros(r);
      setUltimaSync(new Date());
      setSyncOk(true);
      setErrorCarga(null);
    } catch (e) {
      setSyncOk(false);
      setErrorCarga(e.message);
    }
  }, []);

  useEffect(() => {
    cargarRegistros()
      .then(r => { setRegistros(r); setUltimaSync(new Date()); setSyncOk(true); })
      .catch(e => { setSyncOk(false); setErrorCarga(e.message); })
      .finally(() => setCargando(false));
    pollingRef.current = setInterval(cargar, 30000);
    return () => clearInterval(pollingRef.current);
  }, [cargar]);

  const onGuardar = useCallback(() => { cargar(); }, [cargar]);

  if (cargando) {
    return (
      <>
        <style>{css}</style>
        <div style={{ minHeight: "100vh", background: G.bg, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16 }}>
          <div style={{ fontSize: 40 }}>🏗️</div>
          <div style={{ fontSize: 14, color: G.textMuted }}>Conectando con la base de datos…</div>
          {errorCarga && <div style={{ fontSize: 12, color: "#f87171", maxWidth: 280, textAlign: "center" }}>{errorCarga}</div>}
        </div>
      </>
    );
  }

  return (
    <>
      <style>{css}</style>
      <div style={{ minHeight: "100vh", background: G.bg, fontFamily: G.font }}>
        <NavBar vista={vista} setVista={setVista} />
        <BarraSync syncOk={syncOk} guardando={guardando} ultimaSync={ultimaSync} onActualizar={cargar} />
        {vista === "form"      && <VistaFormulario onGuardar={onGuardar} prefill={prefill} setPrefill={setPrefill} />}
        {vista === "dashboard" && <VistaDashboard registros={registros} setPrefill={setPrefill} setVista={setVista} />}
        {vista === "informe"   && <VistaInforme registros={registros} />}
      </div>
    </>
  );
}
