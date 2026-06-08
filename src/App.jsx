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
  8: ["H","I","J","K","L","M","SUM"],
};

// ─── USUARIOS PREDEFINIDOS ────────────────────────────────────────────────────
const USUARIOS = [
  { id: "u1",  nombre: "Antonella Pasero",  rol: "Oficina Técnica", admin: true,  activo: true, pass: "ccobra2024" },
  { id: "u2",  nombre: "Agustina Avila",    rol: "Oficina Técnica", admin: false, activo: true, pass: "ccobra2024" },
  { id: "u3",  nombre: "Camila Lopez",      rol: "Oficina Técnica", admin: false, activo: true, pass: "ccobra2024" },
  { id: "u4",  nombre: "Geronimo Dolso",    rol: "Oficina Técnica", admin: false, activo: true, pass: "ccobra2024" },
  { id: "u5",  nombre: "Lucila Zuchelli",   rol: "Oficina Técnica", admin: false, activo: true, pass: "ccobra2024" },
  { id: "u6",  nombre: "Agustin Soria",     rol: "Obra",            admin: false, activo: true, pass: "ccobra2024" },
  { id: "u7",  nombre: "Carolina Gomez",    rol: "Obra",            admin: false, activo: true, pass: "ccobra2024" },
  { id: "u8",  nombre: "Facundo Puertas",   rol: "Obra",            admin: false, activo: true, pass: "ccobra2024" },
  { id: "u9",  nombre: "Julian Diez",       rol: "Gerencia",        admin: false, activo: true, pass: "ccobra2024" },
  { id: "u10", nombre: "Martin Diez",       rol: "Gerencia",        admin: false, activo: true, pass: "ccobra2024" },
  { id: "u11", nombre: "Sin Nombre",        rol: "Coordinador",     admin: false, activo: true, pass: "ccobra2024" },
];

// Relevamientos permitidos por rol
const RELEV_POR_ROL = {
  "Obra":            ["RP"],
  "Coordinador":     ["RF"],
  "Oficina Técnica": ["RP", "RF"],
  "Gerencia":        ["RF"],
};

// ─── FASES Y RUBROS ───────────────────────────────────────────────────────────
const FASES = [
  {
    id: "F1", nombre: "Fase 1",
    rubros: [
      { id: "FUNDACIONES",   nombre: "Fundaciones",            items: [] },
      { id: "ESTRUCTURA",    nombre: "Estructura Resistente",  items: [] },
      {
        id: "MAMPOSTERIA", nombre: "Mampostería",
        items: [
          { id: 1, tipo: "APLOMADO / ESCUADRA", local: "GENERAL", desc: "Paredes aplomadas" },
          { id: 2, tipo: "APLOMADO / ESCUADRA", local: "GENERAL", desc: "Ángulos interiores a 90°" },
        ],
      },
      {
        id: "MOCHETAS", nombre: "Mochetas, Vanos y Premarcos",
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
        id: "REVOQUE_BC", nombre: "Revoque (Baños y Cocinas)",
        items: [
          { id: 58, tipo: "REVOQUE GRUESO",           local: "GENERAL", desc: "Paredes aplomadas y a escuadra" },
          { id: 59, tipo: "PROTECCIÓN INSTALACIONES", local: "GENERAL", desc: "Bocas, tomas y llaves identificadas y protegidas" },
        ],
      },
    ],
  },
  {
    id: "F2", nombre: "Fase 2",
    rubros: [
      {
        id: "ELECTRICO", nombre: "Instalación Eléctrica",
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
        id: "SANITARIA", nombre: "Instalación Sanitaria",
        items: [
          { id: 36, tipo: "CLOACAS",                  local: "GENERAL", desc: "Tapas pegadas en cañerías de cloaca/pluvial" },
          { id: 37, tipo: "CLOACAS",                  local: "GENERAL", desc: "Montantes compactas" },
          { id: 38, tipo: "CLOACAS Y AGUA FRÍA/CAL.", local: "BAÑO",    desc: "Distancias de ejes corresponden a plano" },
          { id: 39, tipo: "CLOACAS Y AGUA FRÍA/CAL.", local: "BAÑO",    desc: "Chequeo general de posición y correcto engrampado" },
          { id: 40, tipo: "CLOACAS Y AGUA FRÍA/CAL.", local: "COCINA",  desc: "Distancias de ejes corresponden a plano" },
          { id: 41, tipo: "AGUA FRÍA/CALIENTE",       local: "COCINA",  desc: "Ejes de caldera/termotanque corresponden con plano" },
        ],
      },
      {
        id: "GAS", nombre: "Instalación de Gas",
        items: [
          { id: 42, tipo: "GAS", local: "COCINA",      desc: "Distancias de ejes corresponden a plano" },
          { id: 43, tipo: "GAS", local: "GENERAL SC",  desc: "Ventilaciones replanteadas con calandro" },
          { id: 44, tipo: "GAS", local: "GENERAL SC",  desc: "Conducto de ventilaciones con pendiente hacia afuera de 1 cm" },
        ],
      },
      {
        id: "AIREACOND", nombre: "Aire Acondicionado",
        items: [
          { id: 51, tipo: "AIRE ACOND.", local: "GENERAL", desc: "Corrugado llega a caja de preinstalación" },
          { id: 52, tipo: "AIRE ACOND.", local: "GENERAL", desc: "Caja a plomo con la pared" },
          { id: 53, tipo: "AIRE ACOND.", local: "GENERAL", desc: "Desagüe presente" },
          { id: 54, tipo: "AIRE ACOND.", local: "GENERAL", desc: "Cobre presente" },
          { id: 55, tipo: "AIRE ACOND.", local: "GENERAL", desc: "Mangueras no salen del ángulo 90° entre pared y piso" },
          { id: 56, tipo: "AIRE ACOND.", local: "GENERAL", desc: "Manguera no sobresale de la carpeta (a 3 cm de NPT)" },
          { id: 57, tipo: "AIRE ACOND.", local: "GENERAL", desc: "Caja exterior correctamente instalada (Plomo 2 cm, h=20, nivel)" },
        ],
      },
      {
        id: "CALEFACCION", nombre: "Calefacción",
        items: [
          { id: 45, tipo: "LOSA RADIANTE", local: "COLECTORES SC", desc: "Caja de colectores a plomo con ladrillo y a nivel" },
          { id: 46, tipo: "LOSA RADIANTE", local: "COLECTORES SC", desc: "Correcto sentido de ingreso de agua" },
          { id: 47, tipo: "LOSA RADIANTE", local: "CIRCUITO SC",   desc: "Mangueras no salen del ángulo 90° entre pared y piso" },
          { id: 48, tipo: "LOSA RADIANTE", local: "CIRCUITO SC",   desc: "No ingresan a duchas, placares ni banquinas (distancia a 10 cm)" },
          { id: 49, tipo: "LOSA RADIANTE", local: "CIRCUITO SC",   desc: "Buena densidad de distribución en baño" },
          { id: 50, tipo: "LOSA RADIANTE", local: "GENERAL",       desc: "Manguera no sobresale de la carpeta (a 3 cm de NPT)" },
        ],
      },
      { id: "CARPETAS",      nombre: "Carpetas y Banquinas",           items: [] },
      { id: "YESO_ARM",      nombre: "Yeso (Armados)",                 items: [] },
      { id: "HERRERIA",      nombre: "Herrería",                       items: [] },
      { id: "CARPETAS_BAL",  nombre: "Carpetas Balcones",              items: [] },
      { id: "YESO",          nombre: "Yeso",                           items: [] },
      { id: "ICI",           nombre: "Inst. Contra Incendio",          items: [] },
      { id: "ISB",           nombre: "Inst. Señales Débiles",          items: [] },
      { id: "CUBIERTAS1",    nombre: "Cubiertas",                      items: [] },
      { id: "INST_SAN_VENT", nombre: "Inst. Sanitaria (Ventilaciones)",items: [] },
      { id: "REV_EXT",       nombre: "Revoque Exterior",               items: [] },
      { id: "CUBIERTAS2",    nombre: "Cubiertas (2)",                  items: [] },
    ],
  },
  {
    id: "F3", nombre: "Fase 3",
    rubros: [
      { id: "SOLADOS",       nombre: "Solados",                                    items: [] },
      { id: "REV_COCINA",    nombre: "Revestimientos Cocina",                      items: [] },
      { id: "CONST_SECO",    nombre: "Construcción en Seco (Cielorasos Balcones)", items: [] },
      { id: "CARP_ALU",      nombre: "Carpintería Aluminio",                       items: [] },
      { id: "OBRAS_EXT",     nombre: "Obras Externas/Anexas",                      items: [] },
      { id: "CARP_MAD1",     nombre: "Carpintería de Madera",                      items: [] },
      { id: "INST_ELEC",     nombre: "Inst. Eléctrica",                            items: [] },
      { id: "REV_BANIOS",    nombre: "Revestimientos Baños",                       items: [] },
      { id: "CARP_MAD2",     nombre: "Carpintería de Madera (terminación)",        items: [] },
      { id: "ZOCALOS",       nombre: "Zócalos",                                    items: [] },
      { id: "ART_SAN_BAN",   nombre: "Artefactos Sanitarios y Grifería Baños",     items: [] },
      { id: "CARP_MEL1",     nombre: "Carpintería Melamina",                       items: [] },
      { id: "PINTURA_INT1",  nombre: "Pintura Interior",                           items: [] },
      { id: "CARP_MEL2",     nombre: "Carpintería Melamina (cocina)",              items: [] },
      { id: "CARP_MEL3",     nombre: "Carpintería Melamina (dormitorios)",         items: [] },
    ],
  },
  {
    id: "F4", nombre: "Fase 4",
    rubros: [
      { id: "ART_ELEC",      nombre: "Artefactos Eléctricos",                      items: [] },
      { id: "INST_GAS",      nombre: "Inst. Gas",                                  items: [] },
      { id: "PINTURA_INT2",  nombre: "Pintura Interior",                           items: [] },
      { id: "PINTURA_EXT1",  nombre: "Pintura Exterior",                           items: [] },
      { id: "PINTURA_EXT2",  nombre: "Pintura Exterior (terminación)",             items: [] },
      { id: "EQUIP_AMB1",    nombre: "Equipamiento y Amoblamiento",                items: [] },
      { id: "VIDRIOS",       nombre: "Vidrios y Espejos",                          items: [] },
      { id: "MARMOLERIA",    nombre: "Marmolería",                                 items: [] },
      { id: "SENIALES_DEB",  nombre: "Señales Débiles",                            items: [] },
      { id: "HERRAJES",      nombre: "Herrajes y Cerrajería",                      items: [] },
      { id: "SENIALETICA",   nombre: "Señalética",                                 items: [] },
      { id: "ART_SAN_COC",   nombre: "Artefactos Sanitarios y Grifería Cocina",    items: [] },
      { id: "DISP_SEG",      nombre: "Dispositivos de Seguridad",                  items: [] },
      { id: "FACHADA",       nombre: "Fachada",                                    items: [] },
      { id: "REVESTIMIENTOS",nombre: "Revestimientos",                             items: [] },
      { id: "PINTURA_INT3",  nombre: "Pintura Interior (final)",                   items: [] },
      { id: "PAISAJISMO",    nombre: "Paisajismo",                                 items: [] },
      { id: "EQUIP_AMB2",    nombre: "Equipamiento y Amoblamiento (final)",        items: [] },
      { id: "LIMPIEZA",      nombre: "Limpieza Final",                             items: [] },
    ],
  },
];


const TODOS_ITEMS = FASES.flatMap(f => f.rubros.flatMap(r => r.items));

const ESTADOS = {
  VERIFICA:     { label: "Verifica",       short: "V",  color: "#22c55e", bg: "#052e16", border: "#16a34a" },
  VERIFICA_OBS: { label: "Verifica c/Obs", short: "VO", color: "#eab308", bg: "#1c1a02", border: "#a16207" },
  NO_VERIFICA:  { label: "No Verifica",    short: "NV", color: "#ef4444", bg: "#2d0a0a", border: "#b91c1c" },
  PENDIENTE:    { label: "Pendiente",      short: "P",  color: "#6b7280", bg: "#111827", border: "#374151" },
};

const RELEVAMIENTOS_TODOS = ["RP", "RF"];
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

function normalizarRelevamiento(r) {
  // Migración: R0 y R1 → RP, R2 → RF
  if (r === "R0" || r === "R1") return "RP";
  if (r === "R2") return "RF";
  return r;
}

function normalizarRegistro(row) {
  return {
    id: row.id, piso: row.piso, depto: row.depto,
    relevamiento: normalizarRelevamiento(row.relevamiento),
    responsable: row.responsable,
    rol: row.rol, fecha: row.fecha,
    fase: row.fase || "F1",
    items: typeof row.items === "string" ? JSON.parse(row.items) : (row.items || {}),
    anulado: row.anulado ?? false,
    esCorrección: row.es_correccion ?? false,
    corrigenA: row.corrigen_a ?? null,
    esActualizacion: row.es_actualizacion ?? false,
  };
}

function getItemData(registro, itemId) {
  return registro.items[String(itemId)] || registro.items[itemId] || null;
}

function getEstadoVigente(registros, piso, depto, itemId, fase) {
  const relevantes = registros
    .filter(r => r.piso === piso && r.depto === depto && !r.anulado &&
      (!fase || r.fase === fase) && getItemData(r, itemId) &&
      getItemData(r, itemId)?.estado !== "ANULADO_ERROR") // ignorar errores de carga anulados
    .sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
  if (relevantes.length === 0) return null;
  const r = relevantes[0];
  const d = getItemData(r, itemId);
  return { ...d, relevamiento: r.relevamiento, responsable: r.responsable, fecha: r.fecha, fase: r.fase };
}

function getAptoCertificar(registros, piso, depto, itemId, fase) {
  const v = getEstadoVigente(registros, piso, depto, itemId, fase);
  return v?.relevamiento === "RF" && v?.estado === "VERIFICA";
}

function getCertRubro(registros, piso, depto, rubro, faseId) {
  if (rubro.items.length === 0) return { aptos: 0, total: 0, pct: 0, sinItems: true };
  const total = rubro.items.length;
  const aptos = rubro.items.filter(i => getAptoCertificar(registros, piso, depto, i.id, faseId)).length;
  return { aptos, total, pct: Math.round((aptos / total) * 100), sinItems: false };
}

function getHistorial(registros, piso, depto, itemId) {
  return registros
    .filter(r => r.piso === piso && r.depto === depto && getItemData(r, itemId))
    .sort((a, b) => new Date(a.fecha) - new Date(b.fecha));
}

// ─── SUPABASE ─────────────────────────────────────────────────────────────────
async function cargarRegistros() {
  const { data, error } = await supabase.from("registros").select("*").order("fecha", { ascending: true });
  if (error) throw new Error(error.message);
  return (data || []).map(normalizarRegistro);
}

async function insertarRegistro(registro, intento = 0) {
  const row = {
    id: registro.id, piso: registro.piso, depto: registro.depto,
    relevamiento: registro.relevamiento, responsable: registro.responsable,
    rol: registro.rol, fecha: registro.fecha, fase: registro.fase,
    items: registro.items, anulado: registro.anulado,
    es_correccion: registro.esCorrección, corrigen_a: registro.corrigenA,
  };
  const { error } = await supabase.from("registros").insert(row);
  if (error) {
    if (intento < MAX_REINTENTOS) { await sleep(DELAY_REINTENTO * (intento + 1)); return insertarRegistro(registro, intento + 1); }
    throw new Error(error.message);
  }
}

async function anularRegistro(id, intento = 0) {
  const { error } = await supabase.from("registros").update({ anulado: true }).eq("id", id);
  if (error) {
    if (intento < MAX_REINTENTOS) { await sleep(DELAY_REINTENTO * (intento + 1)); return anularRegistro(id, intento + 1); }
    throw new Error(error.message);
  }
}

// Usuarios — guardados en Supabase tabla "usuarios"
async function cargarUsuarios() {
  const { data, error } = await supabase.from("usuarios").select("*");
  if (error || !data || data.length === 0) {
    // Primera vez: sembrar usuarios
    await supabase.from("usuarios").insert(USUARIOS);
    return USUARIOS;
  }
  return data;
}

async function guardarUsuario(u) {
  const { error } = await supabase.from("usuarios").upsert(u);
  if (error) throw new Error(error.message);
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
  @media print {
    .no-print { display: none !important; }
    .print-only { display: block !important; }
    nav { display: none !important; }
    * { 
      background: white !important; 
      color: black !important; 
      border-color: #ccc !important;
      box-shadow: none !important;
    }
    body { background: white !important; color: black !important; }
    img { filter: none !important; mix-blend-mode: multiply !important; }
  }
  .print-only { display: none; }
`;

// ─── COMPONENTES BASE ─────────────────────────────────────────────────────────
function EstadoBadge({ estado }) {
  if (!estado || !ESTADOS[estado]) return <span style={{ color: G.textMuted, fontSize: 12 }}>—</span>;
  const e = ESTADOS[estado];
  return (
    <span style={{ background: e.bg, color: e.color, border: `1px solid ${e.border}`, borderRadius: 20, padding: "3px 8px", fontSize: 11, fontWeight: 600, display: "inline-block", whiteSpace: "nowrap" }}>
      {e.label}
    </span>
  );
}

function NavBar({ vista, setVista, usuario, onLogout, tema, toggleTema, T = G }) {
  const tabs = [
    { id: "form",   label: "Relevamiento", icon: "📋" },
    { id: "dash",   label: "Dashboard",    icon: "📊" },
    { id: "cert",   label: "Certificación",icon: "✅" },
    { id: "informe",label: "Informe",      icon: "📄" },
    ...(usuario?.admin ? [{ id: "admin", label: "Usuarios", icon: "👤" }] : []),
  ];
  return (
    <nav className="no-print" style={{ position: "sticky", top: 0, zIndex: 100, background: G.surface, borderBottom: `1px solid ${G.border}` }}>
      <div style={{ display: "flex", alignItems: "center", height: 48, padding: "0 12px", borderBottom: `1px solid ${G.border}`, gap: 8 }}>
        <span style={{ fontSize: 18 }}>🏗️</span>
        <span style={{ fontWeight: 700, fontSize: 12, color: G.accent, letterSpacing: 1, flex: 1 }}>CC OBRA</span>
        <span style={{ fontSize: 11, color: G.textMuted, maxWidth: 140, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{usuario?.nombre}</span>
        <span style={{ fontSize: 10, background: G.surface2, border: `1px solid ${G.border}`, borderRadius: 10, padding: "2px 8px", color: G.textDim }}>{usuario?.rol}</span>
        <button onClick={toggleTema} title={tema === "dark" ? "Modo día" : "Modo noche"} style={{ background: "none", border: `1px solid ${G.border}`, borderRadius: 6, padding: "3px 8px", fontSize: 14 }}>
          {tema === "dark" ? "☀️" : "🌙"}
        </button>
        <button onClick={onLogout} style={{ background: "none", border: `1px solid ${G.border}`, borderRadius: 6, padding: "3px 10px", fontSize: 11, color: G.textMuted }}>Salir</button>
      </div>
      <div style={{ display: "flex", height: 48, overflowX: "auto" }}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => setVista(t.id)} style={{
            flex: "0 0 auto", minWidth: 70, border: "none", background: "transparent",
            color: vista === t.id ? G.accent : G.textMuted,
            borderBottom: `2px solid ${vista === t.id ? G.accent : "transparent"}`,
            padding: "0 8px", fontSize: 11, fontWeight: 600,
            display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 1,
          }}>
            <span style={{ fontSize: 16 }}>{t.icon}</span>
            <span style={{ fontSize: 9, letterSpacing: .3, whiteSpace: "nowrap" }}>{t.label}</span>
          </button>
        ))}
      </div>
    </nav>
  );
}

function BarraSync({ syncOk, guardando, ultimaSync, onActualizar }) {
  return (
    <div className="no-print" style={{ padding: "4px 16px", background: G.surface, borderBottom: `1px solid ${G.border}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <span style={{ width: 7, height: 7, borderRadius: "50%", flexShrink: 0, display: "inline-block", background: guardando ? "#eab308" : syncOk ? "#22c55e" : "#ef4444" }} />
        <span style={{ fontSize: 11, color: G.textMuted }}>
          {guardando ? "Guardando…" : syncOk ? (ultimaSync ? `Sync ${ultimaSync.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" })}` : "Conectado") : "Error de conexión"}
        </span>
      </div>
      <button onClick={onActualizar} disabled={guardando} style={{ background: "none", border: `1px solid ${G.border}`, borderRadius: 6, padding: "2px 8px", fontSize: 11, color: G.textMuted }}>↻</button>
    </div>
  );
}

// ─── LOGIN ────────────────────────────────────────────────────────────────────
function VistaLogin({ onLogin, usuarios }) {
  const [nombre, setNombre]     = useState("");
  const [pass, setPass]         = useState("");
  const [verPass, setVerPass]   = useState(false);
  const [error, setError]       = useState("");

  function intentarLogin() {
    const u = usuarios.find(u => u.nombre === nombre && u.pass === pass && u.activo);
    if (u) { onLogin(u); }
    else { setError("Usuario o contraseña incorrectos"); }
  }

  return (
    <div style={{ minHeight: "100vh", background: G.bg, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div style={{ width: "100%", maxWidth: 360, background: G.surface, border: `1px solid ${G.border}`, borderRadius: 16, padding: 32 }}>
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{ fontSize: 48, marginBottom: 8 }}>🏗️</div>
          <div style={{ fontWeight: 700, fontSize: 20, color: G.accent }}>CQ DyA</div>
          <div style={{ fontSize: 13, color: G.textMuted, marginTop: 4 }}>Control de Calidad Edificios — DyA</div>
        </div>
        <div style={{ marginBottom: 16 }}>
          <label style={{ fontSize: 12, color: G.textMuted, display: "block", marginBottom: 6 }}>Usuario</label>
          <select value={nombre} onChange={e => { setNombre(e.target.value); setError(""); }}>
            <option value="">— Seleccioná tu nombre —</option>
            {usuarios.filter(u => u.activo).map(u => <option key={u.id} value={u.nombre}>{u.nombre}</option>)}
          </select>
        </div>
        <div style={{ marginBottom: 24 }}>
          <label style={{ fontSize: 12, color: G.textMuted, display: "block", marginBottom: 6 }}>Contraseña</label>
          <div style={{ position: "relative" }}>
            <input
              type={verPass ? "text" : "password"}
              value={pass}
              onChange={e => { setPass(e.target.value); setError(""); }}
              onKeyDown={e => e.key === "Enter" && intentarLogin()}
              placeholder="••••••••"
              style={{ paddingRight: 44 }}
            />
            <button
              onClick={() => setVerPass(v => !v)}
              style={{
                position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)",
                background: "none", border: "none", cursor: "pointer", fontSize: 18,
                color: G.textMuted, padding: 4,
              }}
              title={verPass ? "Ocultar contraseña" : "Ver contraseña"}
            >
              {verPass ? "🙈" : "👁️"}
            </button>
          </div>
        </div>
        {error && <div style={{ color: "#f87171", fontSize: 13, marginBottom: 16, textAlign: "center" }}>{error}</div>}
        <button onClick={intentarLogin} style={{ width: "100%", padding: "14px", borderRadius: 10, background: G.accent, border: "none", color: "#fff", fontWeight: 700, fontSize: 15 }}>
          Ingresar
        </button>
      </div>
    </div>
  );
}

// ─── ADMIN DE USUARIOS ────────────────────────────────────────────────────────
function VistaAdmin({ usuarios, setUsuarios }) {
  const [editando, setEditando] = useState(null);
  const [form, setForm]         = useState({});
  const [guardando, setGuardando] = useState(false);
  const [msg, setMsg]           = useState("");

  function abrirNuevo() {
    setForm({ id: uid(), nombre: "", rol: "Obra", admin: false, activo: true, pass: "ccobra2024" });
    setEditando("nuevo");
  }

  function abrirEditar(u) { setForm({ ...u }); setEditando(u.id); }

  async function guardar() {
    if (!form.nombre.trim()) { setMsg("El nombre es obligatorio"); return; }
    setGuardando(true);
    try {
      await guardarUsuario(form);
      setUsuarios(prev => {
        const existe = prev.find(u => u.id === form.id);
        return existe ? prev.map(u => u.id === form.id ? form : u) : [...prev, form];
      });
      setEditando(null);
      setMsg("Guardado correctamente");
      setTimeout(() => setMsg(""), 3000);
    } catch (e) { setMsg("Error: " + e.message); }
    finally { setGuardando(false); }
  }

  async function toggleActivo(u) {
    const actualizado = { ...u, activo: !u.activo };
    try {
      await guardarUsuario(actualizado);
      setUsuarios(prev => prev.map(x => x.id === u.id ? actualizado : x));
    } catch (e) { setMsg("Error: " + e.message); }
  }

  return (
    <div style={{ padding: "16px 16px 80px", maxWidth: 600, margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: G.accent }}>Gestión de Usuarios</div>
        <button onClick={abrirNuevo} style={{ padding: "8px 16px", borderRadius: 8, background: G.accent, border: "none", color: "#fff", fontWeight: 600, fontSize: 13 }}>+ Nuevo</button>
      </div>

      {msg && <div style={{ marginBottom: 12, padding: "8px 12px", borderRadius: 8, background: G.surface2, border: `1px solid ${G.border}`, fontSize: 13, color: G.textDim }}>{msg}</div>}

      {editando && (
        <div style={{ marginBottom: 16, background: G.surface, border: `1px solid ${G.accent}`, borderRadius: 12, padding: 16 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: G.accent, marginBottom: 12 }}>{editando === "nuevo" ? "NUEVO USUARIO" : "EDITAR USUARIO"}</div>
          <div style={{ display: "grid", gap: 10 }}>
            <div>
              <label style={{ fontSize: 12, color: G.textMuted, display: "block", marginBottom: 4 }}>Nombre completo</label>
              <input value={form.nombre} onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))} placeholder="Nombre y Apellido" />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <div>
                <label style={{ fontSize: 12, color: G.textMuted, display: "block", marginBottom: 4 }}>Rol</label>
                <select value={form.rol} onChange={e => setForm(f => ({ ...f, rol: e.target.value }))}>
                  {["Obra","Coordinador","Oficina Técnica","Gerencia"].map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize: 12, color: G.textMuted, display: "block", marginBottom: 4 }}>Contraseña</label>
                <input value={form.pass} onChange={e => setForm(f => ({ ...f, pass: e.target.value }))} />
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <label style={{ fontSize: 13, color: G.textDim, display: "flex", alignItems: "center", gap: 6 }}>
                <input type="checkbox" checked={form.admin} onChange={e => setForm(f => ({ ...f, admin: e.target.checked }))}
                  style={{ width: "auto", accentColor: G.accent }} />
                Administrador
              </label>
              <label style={{ fontSize: 13, color: G.textDim, display: "flex", alignItems: "center", gap: 6 }}>
                <input type="checkbox" checked={form.activo} onChange={e => setForm(f => ({ ...f, activo: e.target.checked }))}
                  style={{ width: "auto", accentColor: G.accent }} />
                Activo
              </label>
            </div>
          </div>
          <div style={{ display: "flex", gap: 10, marginTop: 14 }}>
            <button onClick={guardar} disabled={guardando} style={{ flex: 1, padding: "10px", borderRadius: 8, background: G.accent, border: "none", color: "#fff", fontWeight: 600 }}>
              {guardando ? "Guardando…" : "Guardar"}
            </button>
            <button onClick={() => setEditando(null)} style={{ padding: "10px 16px", borderRadius: 8, border: `1px solid ${G.border}`, background: "none", color: G.textMuted }}>
              Cancelar
            </button>
          </div>
        </div>
      )}

      {usuarios.map(u => (
        <div key={u.id} style={{ background: G.surface, border: `1px solid ${G.border}`, borderRadius: 10, padding: "12px 14px", marginBottom: 8, display: "flex", alignItems: "center", gap: 10, opacity: u.activo ? 1 : .5 }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: G.text }}>{u.nombre}</div>
            <div style={{ fontSize: 11, color: G.textMuted, marginTop: 2 }}>
              {u.rol}{u.admin ? " · Admin" : ""}{!u.activo ? " · Inactivo" : ""}
            </div>
          </div>
          <button onClick={() => abrirEditar(u)} style={{ padding: "5px 10px", borderRadius: 6, border: `1px solid ${G.border}`, background: G.surface2, color: G.textDim, fontSize: 12 }}>Editar</button>
          <button onClick={() => toggleActivo(u)} style={{ padding: "5px 10px", borderRadius: 6, border: `1px solid ${G.border}`, background: G.surface2, color: u.activo ? "#f87171" : "#4ade80", fontSize: 12 }}>
            {u.activo ? "Desactivar" : "Activar"}
          </button>
        </div>
      ))}
    </div>
  );
}

// ─── FORMULARIO ──────────────────────────────────────────────────────────────
function VistaFormulario({ onGuardar, prefill, setPrefill, usuario, T = G }) {
  const relevPermitidos = RELEV_POR_ROL[usuario.rol] || [];
  const dk = draftKey(usuario.id);

  // Cargar borrador si existe
  const borradorInicial = !prefill ? (lsGet(dk) || null) : null;
  const [mostrarBorrador, setMostrarBorrador] = useState(!!borradorInicial);

  const [piso, setPiso]     = useState(borradorInicial?.piso?.toString() || prefill?.piso?.toString() || "");
  const [depto, setDepto]   = useState(borradorInicial?.depto || prefill?.depto || "");
  const [faseId, setFaseId] = useState(borradorInicial?.faseId || prefill?.fase || "");
  const [relev, setRelev]   = useState(() => {
    const saved = borradorInicial?.relev || prefill?.relevamiento;
    if (saved && relevPermitidos.includes(saved)) return saved;
    return relevPermitidos[0] || "RP";
  });
  const [rubrosOpen, setRubrosOpen] = useState({});
  const [itemsForm, setItemsForm]   = useState(() => {
    const src = borradorInicial?.items || prefill?.items;
    if (!src) return {};
    const norm = {};
    Object.entries(src).forEach(([k, v]) => { norm[String(k)] = v; });
    return norm;
  });
  const [estadoGuardar, setEstadoGuardar] = useState("idle");
  const [navDepto, setNavDepto]           = useState(null); // "prev"|"next"
  const [errorMsg, setErrorMsg] = useState("");
  const [errores, setErrores]   = useState([]);

  const deptos = piso ? PISOS[parseInt(piso)] : [];
  const faseSeleccionada = FASES.find(f => f.id === faseId);
  const rubrosConItems = faseSeleccionada?.rubros.filter(r => r.items.length > 0) || [];

  // Auto-guardar borrador cada vez que cambia algo
  useEffect(() => {
    if (prefill) return; // no guardar borrador en modo corrección
    if (!piso && !depto && !faseId && Object.keys(itemsForm).length === 0) return;
    lsSet(dk, { piso, depto, faseId, relev, items: itemsForm, ts: Date.now() });
  }, [piso, depto, faseId, relev, itemsForm]);

  function descartarBorrador() { lsDel(dk); setMostrarBorrador(false); }
  function continuarBorrador() { setMostrarBorrador(false); }
  function empezarDeCero() {
    lsDel(dk);
    setPiso(""); setDepto(""); setFaseId(""); setItemsForm({}); setRubrosOpen({});
    setMostrarBorrador(false);
  }

  function setItemEstado(itemId, est) {
    if (est === null) {
      // Destildar — quitar el ítem del formulario (quedará como sin marcar = gris en dashboard)
      setItemsForm(prev => {
        const next = { ...prev };
        delete next[String(itemId)];
        return next;
      });
    } else {
      setItemsForm(prev => ({ ...prev, [String(itemId)]: { estado: est, obs: prev[String(itemId)]?.obs || "" } }));
    }
  }
  function setItemObs(itemId, obs) {
    setItemsForm(prev => ({ ...prev, [String(itemId)]: { ...prev[String(itemId)], obs } }));
  }

  function validar() {
    const errs = [];
    if (!piso) errs.push("Seleccioná el piso");
    if (!depto) errs.push("Seleccioná el departamento");
    if (!faseId) errs.push("Seleccioná la fase");
    if (Object.keys(itemsForm).length === 0) errs.push("Completá al menos un ítem");
    Object.entries(itemsForm).forEach(([id, val]) => {
      if ((val.estado === "NO_VERIFICA" || val.estado === "VERIFICA_OBS") && !val.obs?.trim()) {
        const item = TODOS_ITEMS.find(i => i.id === parseInt(id));
        errs.push(`#${id} ${item?.desc || ""}: observación requerida`);
      }
    });
    return errs;
  }

  async function guardar(irA = null) {
    const errs = validar();
    setErrores(errs);
    if (errs.length > 0) return;
    setEstadoGuardar("guardando");
    setErrorMsg("");
    const registro = {
      id: uid(), piso: parseInt(piso), depto,
      relevamiento: relev, fase: faseId,
      responsable: usuario.nombre, rol: usuario.rol,
      fecha: new Date().toISOString(),
      items: itemsForm, anulado: false,
      esCorrección: !!prefill, corrigenA: prefill?.id || null,
    };
    try {
      if (prefill?.id) await anularRegistro(prefill.id);
      await insertarRegistro(registro);
      lsDel(dk); // limpiar borrador al guardar exitosamente
      setEstadoGuardar("ok");
      setPrefill(null);
      onGuardar();

      // Navegación rápida entre deptos
      if (irA && piso && faseId) {
        const listaDeptos = PISOS[parseInt(piso)];
        const idxActual   = listaDeptos.indexOf(depto);
        const idxNuevo    = irA === "next" ? idxActual + 1 : idxActual - 1;
        if (idxNuevo >= 0 && idxNuevo < listaDeptos.length) {
          setDepto(listaDeptos[idxNuevo]);
          setItemsForm({});
          setRubrosOpen({});
          setEstadoGuardar("idle");
          return;
        }
      }
      setItemsForm({}); setPiso(""); setDepto(""); setFaseId(""); setRubrosOpen({});
      setTimeout(() => setEstadoGuardar("idle"), 3000);
    } catch (e) {
      setEstadoGuardar("error");
      setErrorMsg(e.message || "Error al guardar. Intentá de nuevo.");
    }
  }

  const contados = useMemo(() => {
    const c = { VERIFICA: 0, VERIFICA_OBS: 0, NO_VERIFICA: 0, sin: 0 };
    const itemsFase = faseSeleccionada?.rubros.flatMap(r => r.items) || [];
    itemsFase.forEach(item => {
      const e = itemsForm[String(item.id)]?.estado;
      if (e && c[e] !== undefined) c[e]++; else c.sin++;
    });
    return c;
  }, [itemsForm, faseSeleccionada]);

  // Progreso total de la fase
  const totalFase = faseSeleccionada?.rubros.flatMap(r => r.items).length || 0;
  const completadosFase = totalFase - contados.sin;

  const guardando = estadoGuardar === "guardando";

  // Calcular índice actual del depto para habilitar botones de nav
  const listaDeptos    = piso ? PISOS[parseInt(piso)] : [];
  const idxDeptoActual = listaDeptos.indexOf(depto);
  const hayAnterior    = idxDeptoActual > 0;
  const haySiguiente   = idxDeptoActual >= 0 && idxDeptoActual < listaDeptos.length - 1;

  return (
    <div style={{ padding: "0 0 80px", maxWidth: 700, margin: "0 auto" }}>

      {/* Aviso de borrador */}
      {mostrarBorrador && borradorInicial && (
        <div style={{ margin: "12px 16px 0", background: "#1c1a00", border: "1px solid #a16207", borderRadius: 12, padding: 16 }}>
          <div style={{ fontSize: 13, color: "#fbbf24", fontWeight: 600, marginBottom: 8 }}>
            📝 Tenés un borrador guardado
          </div>
          <div style={{ fontSize: 12, color: "#d97706", marginBottom: 12 }}>
            Piso {borradorInicial.piso} · Depto {borradorInicial.depto} · {FASES.find(f=>f.id===borradorInicial.faseId)?.nombre || borradorInicial.faseId} · {borradorInicial.relev}
            <span style={{ marginLeft: 8, opacity: .7 }}>— {new Date(borradorInicial.ts).toLocaleTimeString("es-AR",{hour:"2-digit",minute:"2-digit"})}</span>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={continuarBorrador} style={{ flex: 1, padding: "9px", borderRadius: 8, background: "#a16207", border: "none", color: "#fff", fontWeight: 700, fontSize: 13 }}>
              Continuar borrador
            </button>
            <button onClick={empezarDeCero} style={{ flex: 1, padding: "9px", borderRadius: 8, background: "none", border: "1px solid #a16207", color: "#d97706", fontWeight: 600, fontSize: 13 }}>
              Empezar de cero
            </button>
          </div>
        </div>
      )}

      {prefill && (
        <div style={{ margin: "12px 16px 0", background: "#1c1200", border: "1px solid #92400e", borderRadius: 10, padding: "10px 14px", fontSize: 13, color: "#fbbf24" }}>
          ✏️ Modo corrección — registro del {formatFecha(prefill.fecha)}
          <button onClick={() => setPrefill(null)} style={{ marginLeft: 12, background: "none", border: "none", color: "#f97316", fontSize: 13, textDecoration: "underline" }}>Cancelar</button>
        </div>
      )}

      {/* Paso 1 — Ubicación */}
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

      {/* Paso 2 — Fase y Relevamiento */}
      <div style={{ margin: "12px 16px 0", background: G.surface, border: `1px solid ${G.border}`, borderRadius: 12, padding: 16 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: G.accent, letterSpacing: 1, marginBottom: 12 }}>PASO 2 — FASE Y RELEVAMIENTO</div>
        <div style={{ marginBottom: 12 }}>
          <label style={{ fontSize: 12, color: G.textMuted, display: "block", marginBottom: 6 }}>Fase</label>
          <select value={faseId} onChange={e => { setFaseId(e.target.value); setItemsForm({}); setRubrosOpen({}); }}>
            <option value="">— Seleccioná la fase —</option>
            {FASES.map(f => <option key={f.id} value={f.id}>{f.nombre}</option>)}
          </select>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10 }}>
          {RELEVAMIENTOS_TODOS.map(r => {
            const habilitado = relevPermitidos.includes(r);
            return (
              <button key={r} onClick={() => habilitado && setRelev(r)} style={{
                padding: "12px 0", borderRadius: 8,
                border: `2px solid ${relev === r ? G.accent : habilitado ? G.border : G.border}`,
                background: relev === r ? G.accentDim : habilitado ? G.surface2 : G.surface,
                color: relev === r ? G.accent : habilitado ? G.textDim : G.border,
                fontWeight: 700, fontSize: 18,
                cursor: habilitado ? "pointer" : "not-allowed",
                opacity: habilitado ? 1 : .35,
              }}>{r}</button>
            );
          })}
        </div>
        <div style={{ marginTop: 8, fontSize: 11, color: G.textMuted }}>
          Responsable: <span style={{ color: G.textDim, fontWeight: 600 }}>{usuario.nombre}</span> · {usuario.rol}
        </div>
      </div>

      {/* KPIs */}
      {faseId && (
        <div style={{ margin: "12px 16px 0", display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 6 }}>
          {[
            { k: "VERIFICA", lbl: "V", col: "#22c55e" },
            { k: "VERIFICA_OBS", lbl: "VO", col: "#eab308" },
            { k: "NO_VERIFICA", lbl: "NV", col: "#ef4444" },
            { k: "sin", lbl: "Sin marcar", col: "#374151" },
          ].map(({ k, lbl, col }) => (
            <div key={k} style={{ background: G.surface, border: `1px solid ${G.border}`, borderRadius: 8, padding: "8px 4px", textAlign: "center" }}>
              <div style={{ fontSize: 18, fontWeight: 700, color: col, fontFamily: G.mono }}>{contados[k]}</div>
              <div style={{ fontSize: 10, color: G.textMuted }}>{lbl}</div>
            </div>
          ))}
        </div>
      )}

      {/* Barra de progreso total */}
      {faseId && totalFase > 0 && (
        <div style={{ margin: "10px 16px 0", background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, padding: "10px 14px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
            <span style={{ fontSize: 11, color: T.textMuted }}>Progreso de la fase</span>
            <span style={{ fontSize: 11, fontFamily: G.mono, color: completadosFase === totalFase ? "#22c55e" : T.textDim, fontWeight: 700 }}>
              {completadosFase}/{totalFase} ítems
            </span>
          </div>
          <div style={{ height: 6, background: T.border, borderRadius: 3, overflow: "hidden" }}>
            <div style={{ height: "100%", borderRadius: 3, width: `${Math.round((completadosFase/totalFase)*100)}%`, background: completadosFase === totalFase ? "#22c55e" : G.accent, transition: "width .3s" }} />
          </div>
        </div>
      )}

      {/* Paso 3 — Ítems */}
      {faseId && (
        <>
          <div style={{ margin: "12px 16px 0", fontSize: 11, fontWeight: 700, color: G.accent, letterSpacing: 1 }}>PASO 3 — ÍTEMS</div>
          {rubrosConItems.length === 0 && (
            <div style={{ margin: "12px 16px 0", background: G.surface, border: `1px solid ${G.border}`, borderRadius: 12, padding: 24, textAlign: "center", color: G.textMuted, fontSize: 13 }}>
              Esta fase aún no tiene ítems de control definidos
            </div>
          )}
          {rubrosConItems.map(rubro => {
            const completadosRubro = rubro.items.filter(i => !!itemsForm[String(i.id)]?.estado).length;
            const totalRubro = rubro.items.length;
            const rubroCompleto = completadosRubro === totalRubro;
            return (
            <div key={rubro.id} style={{ margin: "8px 16px 0", background: T.surface, border: `1px solid ${rubroCompleto ? "#16a34a" : T.border}`, borderRadius: 12, overflow: "hidden" }}>
              <button onClick={() => setRubrosOpen(prev => ({ ...prev, [rubro.id]: !prev[rubro.id] }))} style={{
                width: "100%", padding: "12px 16px", background: "none", border: "none",
                color: T.text, display: "flex", justifyContent: "space-between", alignItems: "center", fontWeight: 600, fontSize: 14,
              }}>
                <span style={{ flex: 1, textAlign: "left" }}>{rubro.nombre}</span>
                <span style={{ fontSize: 11, fontFamily: G.mono, color: rubroCompleto ? "#22c55e" : T.textMuted, marginRight: 10 }}>
                  {rubroCompleto ? "✓" : `${completadosRubro}/${totalRubro}`}
                </span>
                <span style={{ fontSize: 18, color: T.textMuted }}>{rubrosOpen[rubro.id] ? "▾" : "▸"}</span>
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
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 6 }}>
                          {Object.entries(ESTADOS).filter(([k]) => k !== "PENDIENTE").map(([k, e]) => {
                            const seleccionado = curr?.estado === k;
                            return (
                              <button key={k} onClick={() => seleccionado ? setItemEstado(item.id, null) : setItemEstado(item.id, k)} style={{
                                padding: "12px 4px", borderRadius: 8,
                                border: `2px solid ${seleccionado ? e.color : G.border}`,
                                background: seleccionado ? e.bg : G.surface2,
                                color: seleccionado ? e.color : G.textMuted,
                                fontSize: 12, fontWeight: 700,
                              }}>{e.short}</button>
                            );
                          })}
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
            );
          })}
        </>
      )}

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
          <button onClick={guardar} style={{ padding: "8px 16px", borderRadius: 8, border: "1px solid #b91c1c", background: "#3f0a0a", color: "#f87171", fontSize: 13, fontWeight: 600 }}>Reintentar</button>
        </div>
      )}

      <div style={{ padding: "16px 16px 0" }}>
        <button onClick={() => guardar(null)} disabled={guardando} style={{
          width: "100%", padding: "16px", borderRadius: 12,
          background: guardando ? G.accentDim : G.accent,
          border: "none", color: "#fff", fontWeight: 700, fontSize: 16, opacity: guardando ? .7 : 1,
          marginBottom: (!prefill && piso && depto) ? 10 : 0,
        }}>
          {guardando ? "Guardando…" : prefill ? "Guardar Corrección" : "Guardar Relevamiento"}
        </button>

        {/* Botones navegación rápida — solo si no es corrección y hay depto seleccionado */}
        {!prefill && piso && depto && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <button onClick={() => guardar("prev")} disabled={guardando || !hayAnterior} style={{
              padding: "12px", borderRadius: 10, border: `1px solid ${G.border}`,
              background: T.surface2, color: hayAnterior ? T.textDim : T.border,
              fontWeight: 600, fontSize: 13, opacity: !hayAnterior ? .4 : 1,
            }}>
              ← Guardar e ir al depto anterior
            </button>
            <button onClick={() => guardar("next")} disabled={guardando || !haySiguiente} style={{
              padding: "12px", borderRadius: 10, border: `1px solid ${G.border}`,
              background: T.surface2, color: haySiguiente ? T.textDim : T.border,
              fontWeight: 600, fontSize: 13, opacity: !haySiguiente ? .4 : 1,
            }}>
              Guardar e ir al siguiente →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── HISTORIAL INLINE ─────────────────────────────────────────────────────────
function MiniCorrector({ piso, depto, itemId, faseId, registroOriginal, registros, usuario, onGuardar, onClose }) {
  const item = TODOS_ITEMS.find(i => i.id === itemId);
  const relevPermitidos = RELEV_POR_ROL[usuario.rol] || [];
  const datoOriginal = getItemData(registroOriginal, itemId);
  const [estado, setEstado]   = useState(datoOriginal?.estado || "");
  const [obs, setObs]         = useState(datoOriginal?.obs || "");
  const [relev, setRelev]     = useState(registroOriginal.relevamiento || relevPermitidos[0] || "RP");
  const [guardando, setGuard] = useState(false);
  const [error, setError]     = useState("");

  const needsObs = estado === "NO_VERIFICA" || estado === "VERIFICA_OBS";
  const obsVacia = needsObs && !obs.trim();

  async function guardar() {
    if (!estado) { setError("Seleccioná un estado"); return; }
    if (obsVacia) { setError("La observación es obligatoria para este estado"); return; }
    setGuard(true); setError("");
    // Paso 1: marcar el ítem original como anulado por error (sin tocar el registro completo)
    const anulacionError = {
      id: uid(), piso, depto, relevamiento: registroOriginal.relevamiento, fase: faseId,
      responsable: usuario.nombre, rol: usuario.rol,
      fecha: new Date().toISOString(),
      items: { [String(itemId)]: { estado: "ANULADO_ERROR", obs: "Anulado por corrección de error de carga" } },
      anulado: false, esCorrección: true, corrigenA: registroOriginal.id,
    };
    // Paso 2: nueva entrada con el estado correcto
    const registro = {
      id: uid(), piso, depto, relevamiento: relev, fase: faseId,
      responsable: usuario.nombre, rol: usuario.rol,
      fecha: new Date(Date.now() + 1).toISOString(), // 1ms después para que sea el más reciente
      items: { [String(itemId)]: { estado, obs: obs.trim() } },
      anulado: false, esCorrección: true, corrigenA: registroOriginal.id,
    };
    try {
      await insertarRegistro(anulacionError);
      await insertarRegistro(registro);
      onGuardar();
      onClose();
    } catch (e) {
      setError("Error al guardar. Intentá de nuevo.");
      setGuard(false);
    }
  }

  return (
    <div style={{ marginTop: 12, background: "#1c1200", border: "1px solid #92400e", borderRadius: 10, padding: 14 }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: "#fbbf24", marginBottom: 10, letterSpacing: .5 }}>
        ✏️ CORREGIR ERROR — #{itemId} · {item?.desc}
      </div>
      <div style={{ fontSize: 11, color: "#d97706", marginBottom: 10 }}>
        Registro original: {registroOriginal.relevamiento} · {formatFecha(registroOriginal.fecha)} · {registroOriginal.responsable}
      </div>

      {/* Relevamiento */}
      <div style={{ marginBottom: 10 }}>
        <div style={{ fontSize: 11, color: "#fbbf24", marginBottom: 6 }}>Relevamiento correcto</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 6 }}>
          {RELEVAMIENTOS_TODOS.map(r => {
            const hab = relevPermitidos.includes(r);
            return (
              <button key={r} onClick={() => hab && setRelev(r)} style={{
                padding: "8px 0", borderRadius: 8, fontWeight: 700, fontSize: 16,
                border: `2px solid ${relev === r ? "#f97316" : "#1e2330"}`,
                background: relev === r ? "#1c1200" : "#111318",
                color: relev === r ? "#f97316" : hab ? "#6b7280" : "#374151",
                opacity: hab ? 1 : .35, cursor: hab ? "pointer" : "not-allowed",
              }}>{r}</button>
            );
          })}
        </div>
      </div>

      {/* Estado */}
      <div style={{ marginBottom: 10 }}>
        <div style={{ fontSize: 11, color: "#fbbf24", marginBottom: 6 }}>Estado correcto</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 6 }}>
          {Object.entries(ESTADOS).map(([k, e]) => (
            <button key={k} onClick={() => { setEstado(k); setError(""); }} style={{
              padding: "10px 4px", borderRadius: 8, fontWeight: 700, fontSize: 11,
              border: `2px solid ${estado === k ? e.color : G.border}`,
              background: estado === k ? e.bg : G.surface2,
              color: estado === k ? e.color : G.textMuted,
            }}>{e.short}</button>
          ))}
        </div>
      </div>

      {/* Observación */}
      <div style={{ marginBottom: 10 }}>
        <div style={{ fontSize: 11, color: "#fbbf24", marginBottom: 6 }}>
          Observación {needsObs ? "(obligatoria)" : "(opcional)"}
        </div>
        <textarea value={obs} onChange={e => { setObs(e.target.value); setError(""); }}
          placeholder="Describí el error de carga o la corrección"
          style={{ borderColor: obsVacia && error ? "#b91c1c" : "#92400e", background: "#0a0800", color: "#e8eaf0" }} />
      </div>

      {error && <div style={{ fontSize: 12, color: "#f87171", marginBottom: 8 }}>⚠ {error}</div>}

      <div style={{ display: "flex", gap: 8 }}>
        <button onClick={guardar} disabled={guardando} style={{
          flex: 1, padding: "10px", borderRadius: 8, border: "none",
          background: guardando ? "#92400e88" : "#92400e", color: "#fff", fontWeight: 700, fontSize: 13,
        }}>
          {guardando ? "Corrigiendo…" : "Guardar corrección"}
        </button>
        <button onClick={onClose} style={{ padding: "10px 14px", borderRadius: 8, border: "1px solid #92400e", background: "none", color: "#fbbf24", fontSize: 13 }}>
          Cancelar
        </button>
      </div>
    </div>
  );
}


function MiniActualizador({ piso, depto, itemId, faseId, registros, usuario, onGuardar, onClose }) {
  const item = TODOS_ITEMS.find(i => i.id === itemId);
  const relevPermitidos = RELEV_POR_ROL[usuario.rol] || [];
  const [estado, setEstado]   = useState("");
  const [obs, setObs]         = useState("");
  const [relev, setRelev]     = useState(relevPermitidos[relevPermitidos.length - 1] || "RP");
  const [guardando, setGuard] = useState(false);
  const [error, setError]     = useState("");

  const needsObs = estado === "NO_VERIFICA" || estado === "VERIFICA_OBS";
  const obsVacia = needsObs && !obs.trim();

  async function guardar() {
    if (!estado) { setError("Seleccioná un estado"); return; }
    if (obsVacia) { setError("La observación es obligatoria para este estado"); return; }
    setGuard(true); setError("");
    const registro = {
      id: uid(), piso, depto, relevamiento: relev, fase: faseId,
      responsable: usuario.nombre, rol: usuario.rol,
      fecha: new Date().toISOString(),
      items: { [String(itemId)]: { estado, obs: obs.trim() } },
      anulado: false, esCorrección: false, corrigenA: null,
      esActualizacion: true,
    };
    try {
      await insertarRegistro(registro);
      onGuardar();
      onClose();
    } catch (e) {
      setError("Error al guardar. Intentá de nuevo.");
      setGuard(false);
    }
  }

  return (
    <div style={{ marginTop: 12, background: "#052e16", border: "1px solid #16a34a", borderRadius: 10, padding: 14 }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: "#4ade80", marginBottom: 10, letterSpacing: .5 }}>
        ✏️ ACTUALIZAR ESTADO — #{itemId} · {item?.desc}
      </div>

      {/* Relevamiento */}
      <div style={{ marginBottom: 10 }}>
        <div style={{ fontSize: 11, color: "#86efac", marginBottom: 6 }}>Relevamiento</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 6 }}>
          {RELEVAMIENTOS_TODOS.map(r => {
            const hab = relevPermitidos.includes(r);
            return (
              <button key={r} onClick={() => hab && setRelev(r)} style={{
                padding: "8px 0", borderRadius: 8, fontWeight: 700, fontSize: 16,
                border: `2px solid ${relev === r ? "#22c55e" : hab ? "#1e2330" : "#1e2330"}`,
                background: relev === r ? "#052e16" : "#111318",
                color: relev === r ? "#22c55e" : hab ? "#6b7280" : "#374151",
                opacity: hab ? 1 : .35, cursor: hab ? "pointer" : "not-allowed",
              }}>{r}</button>
            );
          })}
        </div>
      </div>

      {/* Estado */}
      <div style={{ marginBottom: 10 }}>
        <div style={{ fontSize: 11, color: "#86efac", marginBottom: 6 }}>Nuevo estado</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 6 }}>
          {Object.entries(ESTADOS).map(([k, e]) => (
            <button key={k} onClick={() => { setEstado(k); setError(""); }} style={{
              padding: "10px 4px", borderRadius: 8, fontWeight: 700, fontSize: 11,
              border: `2px solid ${estado === k ? e.color : G.border}`,
              background: estado === k ? e.bg : G.surface2,
              color: estado === k ? e.color : G.textMuted,
            }}>{e.short}</button>
          ))}
        </div>
      </div>

      {/* Observación */}
      <div style={{ marginBottom: 10 }}>
        <div style={{ fontSize: 11, color: "#86efac", marginBottom: 6 }}>
          Motivo / observación {needsObs ? "(obligatorio)" : "(opcional — recomendado)"}
        </div>
        <textarea
          value={obs}
          onChange={e => { setObs(e.target.value); setError(""); }}
          placeholder={needsObs ? "Describí el motivo del cambio de estado" : "Ej: Corregido por subcontratista — muro aplomado"}
          style={{ borderColor: obsVacia && error ? "#b91c1c" : "#16a34a", background: "#0a1a0a", color: "#e8eaf0" }}
        />
      </div>

      {error && <div style={{ fontSize: 12, color: "#f87171", marginBottom: 8 }}>⚠ {error}</div>}

      <div style={{ display: "flex", gap: 8 }}>
        <button onClick={guardar} disabled={guardando} style={{
          flex: 1, padding: "10px", borderRadius: 8, border: "none",
          background: guardando ? "#16a34a88" : "#16a34a", color: "#fff", fontWeight: 700, fontSize: 13,
        }}>
          {guardando ? "Guardando…" : "Guardar actualización"}
        </button>
        <button onClick={onClose} style={{ padding: "10px 14px", borderRadius: 8, border: "1px solid #16a34a", background: "none", color: "#4ade80", fontSize: 13 }}>
          Cancelar
        </button>
      </div>
    </div>
  );
}

function HistorialInline({ piso, depto, itemId, faseId, registros, setPrefill, setVista, onClose, onGuardar, usuario }) {
  const item = TODOS_ITEMS.find(i => i.id === itemId);
  const historial = getHistorial(registros, piso, depto, itemId);
  const [modoActualizar, setModoActualizar] = useState(false);
  const [modoCorregir, setModoCorregir]     = useState(null);

  return (
    <div style={{ background: G.surface2, border: `1px solid ${G.accent}`, borderRadius: 10, padding: 14, marginTop: 8 }}>
      {/* Encabezado */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
        <div>
          <div style={{ fontSize: 10, color: G.textMuted, fontFamily: G.mono }}>Piso {piso} · Dto {depto} · #{itemId} · {faseId}</div>
          <div style={{ fontSize: 13, fontWeight: 600, color: G.text, marginTop: 2 }}>{item?.desc}</div>
        </div>
        <button onClick={onClose} style={{ background: "none", border: "none", color: G.textMuted, fontSize: 18, padding: "0 4px" }}>×</button>
      </div>

      {/* Historial */}
      {historial.filter(r => getItemData(r, itemId)?.estado !== "ANULADO_ERROR").length === 0 && <div style={{ color: G.textMuted, fontSize: 12, marginBottom: 10 }}>Sin relevamientos registrados</div>}
      {historial.filter(r => getItemData(r, itemId)?.estado !== "ANULADO_ERROR").map(r => {
        const d = getItemData(r, itemId);
        const esEsteCorrigiendo = modoCorregir?.id === r.id;
        return (
          <div key={r.id}>
            <div style={{ borderLeft: `3px solid ${r.anulado ? G.border : ESTADOS[d?.estado]?.border || G.border}`, paddingLeft: 10, marginBottom: esEsteCorrigiendo ? 4 : 10, opacity: r.anulado ? .4 : 1 }}>
              <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
                <span style={{ fontFamily: G.mono, fontWeight: 700, fontSize: 12, color: G.accent }}>{r.relevamiento}</span>
                <EstadoBadge estado={d?.estado} />
                {r.anulado && <span style={{ background: "#3f0a0a", color: "#ef4444", fontSize: 10, padding: "1px 6px", borderRadius: 10 }}>ANULADO</span>}
                {r.esCorrección && <span style={{ background: "#1c1a00", color: "#fbbf24", fontSize: 10, padding: "1px 6px", borderRadius: 10 }}>CORRECCIÓN</span>}
                {r.esActualizacion && <span style={{ background: "#052e16", color: "#4ade80", fontSize: 10, padding: "1px 6px", borderRadius: 10 }}>ACTUALIZACIÓN</span>}
              </div>
              <div style={{ fontSize: 11, color: G.textMuted, marginTop: 2 }}>{formatFecha(r.fecha)} · {r.responsable}</div>
              {d?.obs && <div style={{ fontSize: 12, color: G.textDim, marginTop: 3, fontStyle: "italic" }}>"{d.obs}"</div>}
              {!r.anulado && !r.esActualizacion && (
                <button onClick={() => { setModoCorregir(esEsteCorrigiendo ? null : r); setModoActualizar(false); }}
                  style={{ marginTop: 6, padding: "4px 10px", borderRadius: 6, border: `1px solid ${G.border}`, background: G.surface, color: G.textDim, fontSize: 11 }}>
                  ✏️ Corregir error de carga
                </button>
              )}
            </div>
            {esEsteCorrigiendo && (
              <MiniCorrector
                piso={piso} depto={depto} itemId={itemId} faseId={faseId}
                registroOriginal={r} registros={registros} usuario={usuario}
                onGuardar={onGuardar} onClose={() => setModoCorregir(null)}
              />
            )}
          </div>
        );
      })}

      {/* Botón actualizar estado */}
      {!modoActualizar && !modoCorregir && (
        <button onClick={() => setModoActualizar(true)} style={{
          width: "100%", marginTop: 4, padding: "10px", borderRadius: 8,
          border: "1px solid #16a34a", background: "#052e16",
          color: "#4ade80", fontWeight: 600, fontSize: 13,
        }}>
          ✅ Actualizar estado de este ítem
        </button>
      )}

      {modoActualizar && (
        <MiniActualizador
          piso={piso} depto={depto} itemId={itemId} faseId={faseId}
          registros={registros} usuario={usuario}
          onGuardar={onGuardar} onClose={() => setModoActualizar(false)}
        />
      )}
    </div>
  );
}

// ─── DASHBOARD ───────────────────────────────────────────────────────────────
function VistaDashboard({ registros, setPrefill, setVista, onGuardar, usuario }) {
  const [piso, setPiso]         = useState(1);
  const [faseOpen, setFaseOpen] = useState({ F1: true });
  const [rubroOpen, setRubroOpen] = useState({});
  const [sel, setSel]           = useState(null);
  const deptos = PISOS[piso];

  // Ancho fijo de celda para alineación consistente
  const CELL_W = 34;
  const ITEM_COL_W = 190;

  function handleCelda(piso, depto, itemId, faseId) {
    const key = `${piso}-${depto}-${itemId}-${faseId}`;
    setSel(prev => prev === key ? null : key);
  }

  function parseSelKey(key) {
    if (!key) return null;
    const parts = key.split("-");
    return { piso: parseInt(parts[0]), depto: parts[1], itemId: parseInt(parts[2]), faseId: parts[3] };
  }

  function toggleTodosRubros(faseId, rubrosConItems, abrir) {
    const updates = {};
    rubrosConItems.forEach(r => { updates[`${faseId}-${r.id}`] = abrir; });
    setRubroOpen(prev => ({ ...prev, ...updates }));
  }

  const selParsed = parseSelKey(sel);

  return (
    <div style={{ paddingBottom: 60 }}>
      {/* Selector piso */}
      <div style={{ padding: "10px 16px", display: "flex", gap: 8, flexWrap: "wrap", borderBottom: `1px solid ${G.border}` }}>
        {Object.keys(PISOS).map(p => (
          <button key={p} onClick={() => { setPiso(parseInt(p)); setSel(null); }} style={{
            padding: "7px 12px", borderRadius: 8,
            border: `2px solid ${piso === parseInt(p) ? G.accent : G.border}`,
            background: piso === parseInt(p) ? G.accentDim : G.surface,
            color: piso === parseInt(p) ? G.accent : G.textMuted,
            fontWeight: 700, fontSize: 13,
          }}>P{p}</button>
        ))}
      </div>

      {/* Fases */}
      {FASES.map(fase => {
        const rubrosConItems = fase.rubros.filter(r => r.items.length > 0);
        if (rubrosConItems.length === 0) return null;
        const faseAbierta = !!faseOpen[fase.id];
        const todosAbiertos = rubrosConItems.every(r => !!rubroOpen[`${fase.id}-${r.id}`]);

        return (
          <div key={fase.id} style={{ margin: "10px 16px 0" }}>
            {/* Header de fase con botón abrir/cerrar todos */}
            <div style={{ display: "flex", alignItems: "center", gap: 0 }}>
              <button onClick={() => setFaseOpen(prev => ({ ...prev, [fase.id]: !prev[fase.id] }))} style={{
                flex: 1, padding: "10px 14px", background: G.surface, border: `1px solid ${G.border}`,
                borderRight: "none",
                borderRadius: faseAbierta ? "10px 0 0 0" : "10px 0 0 10px",
                color: G.accent, display: "flex", justifyContent: "space-between", alignItems: "center", fontWeight: 700, fontSize: 13,
              }}>
                <span>{fase.nombre}</span>
                <span style={{ fontSize: 16, color: G.textMuted }}>{faseAbierta ? "▾" : "▸"}</span>
              </button>
              {faseAbierta && (
                <button
                  onClick={() => toggleTodosRubros(fase.id, rubrosConItems, !todosAbiertos)}
                  title={todosAbiertos ? "Cerrar todos los rubros" : "Abrir todos los rubros"}
                  style={{
                    padding: "10px 12px", background: G.surface2, border: `1px solid ${G.border}`,
                    borderRadius: "0 10px 0 0",
                    color: G.textMuted, fontSize: 11, fontWeight: 600, whiteSpace: "nowrap",
                  }}>
                  {todosAbiertos ? "▴ Cerrar todos" : "▾ Abrir todos"}
                </button>
              )}
            </div>

            {faseAbierta && rubrosConItems.map(rubro => {
              const rubroKey = `${fase.id}-${rubro.id}`;
              const rubroAbierto = !!rubroOpen[rubroKey];
              return (
                <div key={rubro.id} style={{ border: `1px solid ${G.border}`, borderTop: "none" }}>
                  <button onClick={() => setRubroOpen(prev => ({ ...prev, [rubroKey]: !prev[rubroKey] }))} style={{
                    width: "100%", padding: "8px 14px", background: G.surface2, border: "none",
                    color: G.textDim, display: "flex", justifyContent: "space-between", alignItems: "center", fontWeight: 600, fontSize: 12,
                  }}>
                    <span>{rubro.nombre}</span>
                    <span style={{ fontSize: 14, color: G.textMuted }}>{rubroAbierto ? "▾" : "▸"}</span>
                  </button>

                  {rubroAbierto && (
                    <div style={{ overflowX: "auto", padding: "8px 12px" }}>
                      <table style={{ borderCollapse: "separate", borderSpacing: 3, tableLayout: "fixed", width: `${ITEM_COL_W + deptos.length * (CELL_W + 3) + 10}px` }}>
                        <colgroup>
                          <col style={{ width: ITEM_COL_W }} />
                          {deptos.map(d => <col key={d} style={{ width: CELL_W }} />)}
                        </colgroup>
                        <thead>
                          <tr>
                            <th style={{ textAlign: "left", fontSize: 10, color: G.textMuted, padding: "0 8px 6px 0", fontWeight: 400 }}>Ítem</th>
                            {deptos.map(d => <th key={d} style={{ fontSize: 11, fontWeight: 700, color: G.accent, textAlign: "center", padding: "0 0 6px" }}>{d}</th>)}
                          </tr>
                        </thead>
                        <tbody>
                          {rubro.items.map(item => {
                            return (
                              <>
                                <tr key={item.id}>
                                  <td style={{ fontSize: 11, color: G.textDim, paddingRight: 8, paddingBottom: 3, maxWidth: ITEM_COL_W }}>
                                    <div style={{ display: "flex", gap: 4, alignItems: "center", flexWrap: "nowrap", overflow: "hidden" }}>
                                      <span style={{ fontFamily: G.mono, fontSize: 8, color: G.textMuted, flexShrink: 0 }}>#{item.id}</span>
                                      <span style={{ fontSize: 8, color: G.accent, fontWeight: 700, flexShrink: 0, textTransform: "uppercase", letterSpacing: .3 }}>{item.tipo}</span>
                                      {item.local !== "GENERAL" && <span style={{ fontSize: 8, background: G.surface2, border: `1px solid ${G.border}`, borderRadius: 3, padding: "0 4px", color: G.textDim, flexShrink: 0 }}>{item.local}</span>}
                                    </div>
                                    <div style={{ fontSize: 10, color: G.textDim, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{item.desc}</div>
                                  </td>
                                  {deptos.map(d => {
                                    const vigente = getEstadoVigente(registros, piso, d, item.id, fase.id);
                                    const eKey = vigente?.estado || "PENDIENTE";
                                    const e = ESTADOS[eKey];
                                    const apto = getAptoCertificar(registros, piso, d, item.id, fase.id);
                                    // Punto naranja: hubo NV real que no fue corregido como error de carga
                                    // Un NV fue "error de carga" si existe una entrada ANULADO_ERROR posterior para ese ítem
                                    const tuvoNV = (() => {
                                      const nvsItem = registros.filter(r =>
                                        r.piso === piso && r.depto === d &&
                                        r.fase === fase.id && !r.anulado &&
                                        getItemData(r, item.id)?.estado === "NO_VERIFICA"
                                      );
                                      if (nvsItem.length === 0) return false;
                                      // Para cada NV, verificar si fue anulado por error de carga
                                      // (existe una entrada ANULADO_ERROR con fecha posterior)
                                      return nvsItem.some(nvReg => {
                                        const fechaNV = new Date(nvReg.fecha);
                                        const fueAnuladoPorError = registros.some(r =>
                                          r.piso === piso && r.depto === d &&
                                          r.fase === fase.id &&
                                          getItemData(r, item.id)?.estado === "ANULADO_ERROR" &&
                                          new Date(r.fecha) > fechaNV
                                        );
                                        return !fueAnuladoPorError;
                                      });
                                    })();
                                    const cellKey = `${piso}-${d}-${item.id}-${fase.id}`;
                                    const isSelected = sel === cellKey;
                                    return (
                                      <td key={d} onClick={() => handleCelda(piso, d, item.id, fase.id)}
                                        title={`${e.label}${vigente?.obs ? ": " + vigente.obs : ""}${apto ? " ✅ R2" : ""}${tuvoNV && eKey !== "NO_VERIFICA" ? " ⚠ Tuvo No Verifica anterior" : ""}`}
                                        style={{
                                          width: CELL_W, height: CELL_W, minWidth: CELL_W,
                                          background: isSelected ? e.color + "55" : e.bg,
                                          border: `2px solid ${isSelected ? e.color : vigente ? e.border : G.border}`,
                                          borderRadius: 5, cursor: "pointer", textAlign: "center",
                                          fontSize: 9, fontWeight: 700, color: e.color, position: "relative", userSelect: "none",
                                        }}>
                                        {e.short}
                                        {apto && <span style={{ position: "absolute", top: -3, right: -3, width: 9, height: 9, borderRadius: "50%", background: "#22c55e", border: "2px solid #0a0c10" }} />}
                                        {tuvoNV && eKey !== "NO_VERIFICA" && <span style={{ position: "absolute", bottom: -3, left: -3, width: 9, height: 9, borderRadius: "50%", background: "#f97316", border: "2px solid #0a0c10" }} />}
                                      </td>
                                    );
                                  })}
                                </tr>
                                {selParsed && selParsed.itemId === item.id && selParsed.faseId === fase.id && (
                                  <tr key={`hist-${item.id}`}>
                                    <td colSpan={deptos.length + 1} style={{ padding: "0 0 8px 0" }}>
                                      <HistorialInline
                                        piso={selParsed.piso} depto={selParsed.depto}
                                        itemId={selParsed.itemId} faseId={selParsed.faseId}
                                        registros={registros} setPrefill={setPrefill} setVista={setVista}
                                        onClose={() => setSel(null)}
                                        onGuardar={() => { onGuardar(); setSel(null); }} usuario={usuario}
                                      />
                                    </td>
                                  </tr>
                                )}
                              </>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              );
            })}
            {faseAbierta && <div style={{ borderBottom: `1px solid ${G.border}`, borderLeft: `1px solid ${G.border}`, borderRight: `1px solid ${G.border}`, borderRadius: "0 0 10px 10px", height: 4 }} />}
          </div>
        );
      })}
    </div>
  );
}

// ─── CERTIFICACIONES ──────────────────────────────────────────────────────────
function CertChip({ aptos, total, sinItems }) {
  const apto    = !sinItems && aptos === total;
  const parcial = !sinItems && aptos > 0 && !apto;
  const bc = apto ? "#16a34a" : parcial ? "#a16207" : G.border;
  const tc = apto ? "#22c55e" : parcial ? "#eab308" : G.textMuted;
  const bg = apto ? "#052e16" : parcial ? "#1c1a02" : G.surface2;
  return (
    <div style={{ background: bg, border: `2px solid ${bc}`, borderRadius: 8, padding: "4px 8px", textAlign: "center", minWidth: 60 }}>
      <div style={{ fontSize: 10, fontFamily: G.mono, color: tc, marginBottom: 2 }}>
        {sinItems ? "—" : `${aptos}/${total}`}
      </div>
      <div style={{ fontSize: 9, fontWeight: 700, color: tc }}>
        {sinItems ? "S/I" : apto ? "✅ APTO" : parcial ? "⏳ PARCIAL" : "⛔ SIN R2"}
      </div>
    </div>
  );
}

function VistaCertificaciones({ registros, setVista }) {
  const [piso, setPiso]         = useState(1);
  const [rubroOpen, setRubroOpen] = useState({});
  const deptos = PISOS[piso];

  function getCertRubroPiso(rubro, faseId) {
    if (rubro.items.length === 0) return { aptos: 0, total: 0, sinItems: true };
    const total = rubro.items.length * deptos.length;
    const aptos = deptos.reduce((acc, d) => {
      const c = getCertRubro(registros, piso, d, rubro, faseId);
      return acc + c.aptos;
    }, 0);
    return { aptos, total, sinItems: false };
  }

  function toggleRubro(key) {
    setRubroOpen(prev => ({ ...prev, [key]: !prev[key] }));
  }

  function toggleTodosFase(faseId, rubros, abrir) {
    const updates = {};
    rubros.forEach(r => { updates[`${faseId}-${r.id}`] = abrir; });
    setRubroOpen(prev => ({ ...prev, ...updates }));
  }

  return (
    <div style={{ paddingBottom: 60 }}>
      <div style={{ padding: "10px 16px", display: "flex", gap: 8, flexWrap: "wrap", borderBottom: `1px solid ${G.border}` }}>
        {Object.keys(PISOS).map(p => (
          <button key={p} onClick={() => setPiso(parseInt(p))} style={{
            padding: "7px 12px", borderRadius: 8,
            border: `2px solid ${piso === parseInt(p) ? G.accent : G.border}`,
            background: piso === parseInt(p) ? G.accentDim : G.surface,
            color: piso === parseInt(p) ? G.accent : G.textMuted,
            fontWeight: 700, fontSize: 13,
          }}>P{p}</button>
        ))}
      </div>

      <div style={{ padding: "12px 16px" }}>
        {FASES.map(fase => {
          const rubrosConItems = fase.rubros.filter(r => r.items.length > 0);
          if (rubrosConItems.length === 0) return null;
          const todosAbiertos = rubrosConItems.every(r => !!rubroOpen[`${fase.id}-${r.id}`]);

          return (
            <div key={fase.id} style={{ marginBottom: 24 }}>
              {/* Encabezado de fase con botón abrir/cerrar todos */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: G.accent, letterSpacing: 1 }}>{fase.nombre.toUpperCase()}</div>
                <button onClick={() => toggleTodosFase(fase.id, rubrosConItems, !todosAbiertos)} style={{
                  padding: "4px 10px", borderRadius: 6, border: `1px solid ${G.border}`,
                  background: G.surface2, color: G.textMuted, fontSize: 11, fontWeight: 600,
                }}>
                  {todosAbiertos ? "▴ Cerrar todos" : "▾ Abrir todos"}
                </button>
              </div>

              {rubrosConItems.map(rubro => {
                const certPiso = getCertRubroPiso(rubro, fase.id);
                const rubroKey = `${fase.id}-${rubro.id}`;
                const abierto  = !!rubroOpen[rubroKey];
                return (
                  <div key={rubro.id} style={{ marginBottom: 10, background: G.surface, border: `1px solid ${G.border}`, borderRadius: 10, overflow: "hidden" }}>
                    {/* Encabezado clickeable del rubro */}
                    <button onClick={() => toggleRubro(rubroKey)} style={{
                      width: "100%", padding: "10px 12px", background: G.surface2, border: "none",
                      display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, cursor: "pointer",
                    }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <span style={{ fontSize: 16, color: G.textMuted }}>{abierto ? "▾" : "▸"}</span>
                        <span style={{ fontSize: 12, fontWeight: 700, color: G.text }}>{rubro.nombre}</span>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <span style={{ fontSize: 10, color: G.textMuted, whiteSpace: "nowrap" }}>Piso {piso}:</span>
                        <CertChip {...certPiso} />
                      </div>
                    </button>
                    {/* Detalle por departamento — colapsable */}
                    {abierto && (
                      <div style={{ padding: "10px 12px" }}>
                        <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 4 }}>
                          {deptos.map(d => {
                            const cert = getCertRubro(registros, piso, d, rubro, fase.id);
                            const apto    = !cert.sinItems && cert.aptos === cert.total;
                            const parcial = !cert.sinItems && cert.aptos > 0 && !apto;
                            const bc = apto ? "#16a34a" : parcial ? "#a16207" : G.border;
                            const tc = apto ? "#22c55e" : parcial ? "#eab308" : G.textMuted;
                            const bg = apto ? "#052e16" : parcial ? "#1c1a02" : G.surface2;
                            return (
                              <div key={d} style={{ minWidth: 70, background: G.surface, border: `2px solid ${bc}`, borderRadius: 10, padding: "7px 7px 5px", textAlign: "center", flexShrink: 0 }}>
                                <div style={{ fontSize: 11, fontWeight: 700, color: G.accent, marginBottom: 4 }}>Dto {d}</div>
                                {!cert.sinItems && (
                                  <div style={{ height: 3, background: G.border, borderRadius: 2, marginBottom: 4, overflow: "hidden" }}>
                                    <div style={{ height: "100%", borderRadius: 2, width: `${cert.pct}%`, background: tc }} />
                                  </div>
                                )}
                                <div style={{ fontSize: 10, fontFamily: G.mono, color: tc, marginBottom: 4 }}>
                                  {cert.sinItems ? "—" : `${cert.aptos}/${cert.total}`}
                                </div>
                                <div style={{ fontSize: 9, fontWeight: 700, color: tc, background: bg, border: `1px solid ${bc}`, borderRadius: 5, padding: "2px 4px" }}>
                                  {cert.sinItems ? "S/I" : apto ? "✅ APTO" : parcial ? "⏳ PARCIAL" : "⛔ SIN R2"}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>

      <div style={{ padding: "0 16px" }}>
        <button onClick={() => setVista("dash")} style={{
          width: "100%", padding: "12px", borderRadius: 10,
          border: `1px solid ${G.border}`, background: G.surface, color: G.textDim, fontSize: 14, fontWeight: 600,
        }}>
          📊 Ir al Dashboard para revisar pendientes
        </button>
      </div>
    </div>
  );
}

// ─── INFORME FINAL ────────────────────────────────────────────────────────────
function VistaInforme({ registros }) {
  const [filtroFase, setFiltroFase]   = useState("TODAS");
  const [filtroRubro, setFiltroRubro] = useState("TODOS");
  const [filtroTipo, setFiltroTipo]   = useState("TODOS"); // TODOS | NO_VERIFICA | VERIFICA_OBS
  const todosPendientes = useMemo(() => {
    const result = [];
    FASES.forEach(fase => {
      fase.rubros.forEach(rubro => {
        if (rubro.items.length === 0) return;
        Object.keys(PISOS).forEach(ps => {
          const piso = parseInt(ps);
          PISOS[piso].forEach(depto => {
            rubro.items.forEach(item => {
              const v = getEstadoVigente(registros, piso, depto, item.id, fase.id);
              if (v && (v.estado === "NO_VERIFICA" || v.estado === "VERIFICA_OBS")) {
                result.push({ fase, rubro, piso, depto, item, vigente: v });
              }
            });
          });
        });
      });
    });
    return result;
  }, [registros]);

  const pendientes = useMemo(() => {
    return todosPendientes.filter(p => {
      if (filtroFase !== "TODAS" && p.fase.id !== filtroFase) return false;
      if (filtroRubro !== "TODOS" && p.rubro.id !== filtroRubro) return false;
      if (filtroTipo !== "TODOS" && p.vigente.estado !== filtroTipo) return false;
      return true;
    });
  }, [todosPendientes, filtroFase, filtroRubro, filtroTipo]);

  // Rubros disponibles según fase seleccionada
  const rubrosDisponibles = useMemo(() => {
    const fases = filtroFase === "TODAS" ? FASES : FASES.filter(f => f.id === filtroFase);
    const set = new Map();
    fases.forEach(f => f.rubros.forEach(r => {
      if (todosPendientes.some(p => p.rubro.id === r.id)) set.set(r.id, r.nombre);
    }));
    return Array.from(set.entries());
  }, [filtroFase, todosPendientes]);

  function descargarPDF() { window.print(); }

  // Agrupar: Piso → Depto → Fase → Rubro
  const grupos = {};
  pendientes.forEach(({ fase, rubro, piso, depto, item, vigente }) => {
    if (!grupos[piso]) grupos[piso] = {};
    if (!grupos[piso][depto]) grupos[piso][depto] = {};
    if (!grupos[piso][depto][fase.id]) grupos[piso][depto][fase.id] = { nombre: fase.nombre, rubros: {} };
    if (!grupos[piso][depto][fase.id].rubros[rubro.id]) grupos[piso][depto][fase.id].rubros[rubro.id] = { nombre: rubro.nombre, rows: [] };
    grupos[piso][depto][fase.id].rubros[rubro.id].rows.push({ item, vigente });
  });

  return (
    <div style={{ paddingBottom: 80 }}>
      {/* Cabecera */}
      <div className="no-print" style={{ padding: "12px 16px", borderBottom: `1px solid ${G.border}` }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
          <div style={{ fontSize: 13, color: G.textMuted }}>
            <span style={{ fontFamily: G.mono, fontWeight: 700, color: "#ef4444", fontSize: 18 }}>{pendientes.length}</span>
            <span style={{ marginLeft: 4 }}>de {todosPendientes.length} ítems pendientes</span>
          </div>
          <button onClick={descargarPDF} style={{ padding: "8px 16px", borderRadius: 8, background: G.accent, border: "none", color: "#fff", fontWeight: 600, fontSize: 13 }}>📄 PDF</button>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 8 }}>
          {[
            { val: "TODOS",       label: "Todos",                    color: G.textMuted,  bg: G.surface2,  border: G.border },
            { val: "NO_VERIFICA", label: "⛔ No Verifica",           color: "#ef4444",    bg: "#2d0a0a",   border: "#b91c1c" },
            { val: "VERIFICA_OBS",label: "⚠ Verifica c/Obs",        color: "#eab308",    bg: "#1c1a02",   border: "#a16207" },
          ].map(({ val, label, color, bg, border }) => (
            <button key={val} onClick={() => setFiltroTipo(val)} style={{
              padding: "7px 14px", borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: "pointer",
              border: `2px solid ${filtroTipo === val ? color : border}`,
              background: filtroTipo === val ? bg : G.surface2,
              color: filtroTipo === val ? color : G.textMuted,
            }}>{label}</button>
          ))}
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <select value={filtroFase} onChange={e => { setFiltroFase(e.target.value); setFiltroRubro("TODOS"); }}
            style={{ flex: 1, minWidth: 120, padding: "7px 10px", fontSize: 12 }}>
            <option value="TODAS">Todas las fases</option>
            {FASES.filter(f => f.rubros.some(r => r.items.length > 0)).map(f => (
              <option key={f.id} value={f.id}>{f.nombre}</option>
            ))}
          </select>
          <select value={filtroRubro} onChange={e => setFiltroRubro(e.target.value)}
            style={{ flex: 1, minWidth: 140, padding: "7px 10px", fontSize: 12 }}>
            <option value="TODOS">Todos los rubros</option>
            {rubrosDisponibles.map(([id, nombre]) => <option key={id} value={id}>{nombre}</option>)}
          </select>
        </div>
      </div>

      {/* Mensaje cuando el filtro no arroja resultados */}
      {pendientes.length === 0 && (
        <div style={{ margin: "32px 16px", background: G.surface, border: `1px solid ${G.border}`, borderRadius: 12, padding: 28, textAlign: "center" }}>
          <div style={{ fontSize: 36, marginBottom: 10 }}>🔍</div>
          <div style={{ fontSize: 15, fontWeight: 600, color: G.textDim, marginBottom: 6 }}>
            Sin ítems para mostrar con este filtro
          </div>
          <div style={{ fontSize: 13, color: G.textMuted }}>
            No hay {filtroTipo === "NO_VERIFICA" ? "No Verifica" : filtroTipo === "VERIFICA_OBS" ? "Verifica con Observaciones" : "pendientes"} en la selección actual.
            Cambiá los filtros para ver otros ítems.
          </div>
        </div>
      )}

      {/* Encabezado para impresión */}
      <div className="print-only" style={{ padding: "16px 24px 0", display: "none" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, borderBottom: "2px solid #ccc", paddingBottom: 16 }}>
          <div style={{ textAlign: "left" }}>
            <div style={{ fontSize: 16, fontWeight: 700 }}>INFORME DE CONTROL DE CALIDAD</div>
            <div style={{ fontSize: 11, color: "#444", marginTop: 2 }}>Edificio Porta Piazza · General Cabrera · DyA</div>
          </div>
          <img src="data:image/jpeg;base64,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" style={{ height: 30, objectFit: "contain", mixBlendMode: "multiply" }} alt="Porta Piazza" />
        </div>
        <div style={{ display: "flex", gap: 24, fontSize: 11, color: "#555", marginBottom: 12 }}>
          <span>Fecha de emisión: {new Date().toLocaleDateString("es-AR")}</span>
          <span>Total ítems pendientes: {pendientes.length}</span>
          <span>Ítems críticos (+5 días hábiles): {pendientes.filter(p => p.vigente?.estado === "NO_VERIFICA" && diasHabilesDesde(p.vigente.fecha) >= 5).length}</span>
        </div>
      </div>

      {pendientes.length > 0 && <div style={{ padding: "12px 16px 0" }}>
        {Object.keys(grupos).sort((a, b) => a - b).map(piso => (
          <div key={piso} style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: G.accent, letterSpacing: 1, padding: "8px 12px", background: G.surface, borderRadius: "8px 8px 0 0", border: `1px solid ${G.border}`, borderBottom: "none" }}>
              PISO {piso}
            </div>
            {Object.keys(grupos[piso]).sort().map(depto => (
              <div key={depto} style={{ border: `1px solid ${G.border}`, borderTop: "none", background: G.surface2 }}>
                <div style={{ padding: "8px 12px", borderBottom: `1px solid ${G.border}`, fontSize: 12, fontWeight: 600, color: G.textDim, background: G.surface }}>
                  Departamento {depto}
                </div>
                {Object.keys(grupos[piso][depto]).map(faseId => {
                  const faseData = grupos[piso][depto][faseId];
                  return (
                    <div key={faseId}>
                      <div style={{ padding: "6px 12px", fontSize: 11, fontWeight: 700, color: G.accent, borderBottom: `1px solid ${G.border}`, background: G.surface }}>
                        {faseData.nombre}
                      </div>
                      {Object.keys(faseData.rubros).map(rubroId => {
                        const rubroData = faseData.rubros[rubroId];
                        return (
                          <div key={rubroId}>
                            <div style={{ padding: "5px 12px", fontSize: 10, fontWeight: 700, color: G.textMuted, letterSpacing: 1, borderBottom: `1px solid ${G.border}`, textTransform: "uppercase" }}>
                              {rubroData.nombre}
                            </div>
                            {rubroData.rows.map(({ item, vigente }) => (
                              <div key={item.id} style={{ padding: "10px 12px", borderBottom: `1px solid ${G.border}`, borderLeft: `3px solid ${ESTADOS[vigente.estado]?.color}` }}>
                                <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "flex-start", marginBottom: 4 }}>
                                  <span style={{ fontFamily: G.mono, fontSize: 10, color: G.textMuted }}>#{item.id}</span>
                                  <div style={{ flex: 1 }}>
                                    <div style={{ fontSize: 11, color: G.textMuted, marginBottom: 2 }}>
                                      {item.tipo}{item.local !== "GENERAL" ? ` · ${item.local}` : ""}
                                    </div>
                                    <div style={{ fontSize: 13, color: G.text }}>{item.desc}</div>
                                  </div>
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
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        ))}
      </div>}
    </div>
  );
}

// ─── APP ROOT ─────────────────────────────────────────────────────────────────
// ─── HELPERS LOCALSTORAGE ────────────────────────────────────────────────────
const SESSION_KEY = "ccobra_session_v1";
const THEME_KEY   = "ccobra_theme_v1";
function draftKey(userId) { return `ccobra_draft_${userId}`; }

function lsGet(key) { try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : null; } catch { return null; } }
function lsSet(key, val) { try { localStorage.setItem(key, JSON.stringify(val)); } catch {} }
function lsDel(key) { try { localStorage.removeItem(key); } catch {} }

// ─── DIAS HABILES ─────────────────────────────────────────────────────────────
function diasHabilesDesde(fechaIso) {
  const inicio = new Date(fechaIso);
  const hoy    = new Date();
  let dias = 0;
  const cur = new Date(inicio);
  while (cur < hoy) {
    cur.setDate(cur.getDate() + 1);
    const dow = cur.getDay();
    if (dow !== 0 && dow !== 6) dias++;
  }
  return dias;
}

export default function App() {
  const [vista, setVista]           = useState("form");
  const [registros, setRegistros]   = useState([]);
  const [usuarios, setUsuarios]     = useState([]);
  const [usuario, setUsuario]       = useState(() => lsGet(SESSION_KEY));
  const [prefill, setPrefill]       = useState(null);
  const [cargando, setCargando]     = useState(true);
  const [syncOk, setSyncOk]         = useState(true);
  const [guardando]                 = useState(false);
  const [ultimaSync, setUltimaSync] = useState(null);
  const [tema, setTema]             = useState(() => lsGet(THEME_KEY) || "dark");
  const pollingRef = useRef(null);

  // Tema dinámico
  const T = tema === "light" ? {
    bg: "#f5f5f5", surface: "#ffffff", surface2: "#f0f0f0",
    border: "#d0d0d0", accent: "#c2410c", accentDim: "#fed7aa",
    text: "#111111", textMuted: "#555555", textDim: "#333333",
    font: G.font, mono: G.mono,
  } : G;

  function toggleTema() {
    const nuevo = tema === "dark" ? "light" : "dark";
    setTema(nuevo);
    lsSet(THEME_KEY, nuevo);
  }

  const cargar = useCallback(async () => {
    try {
      const r = await cargarRegistros();
      setRegistros(r);
      setUltimaSync(new Date());
      setSyncOk(true);
    } catch { setSyncOk(false); }
  }, []);

  useEffect(() => {
    Promise.all([cargarRegistros(), cargarUsuarios()])
      .then(([regs, usrs]) => {
        setRegistros(regs);
        setUsuarios(usrs);
        setUltimaSync(new Date());
        setSyncOk(true);
      })
      .catch(() => setSyncOk(false))
      .finally(() => setCargando(false));
    pollingRef.current = setInterval(cargar, 30000);
    return () => clearInterval(pollingRef.current);
  }, [cargar]);

  const onGuardar = useCallback(() => { cargar(); }, [cargar]);

  function handleLogin(u) {
    lsSet(SESSION_KEY, u);
    setUsuario(u);
    setVista("form");
  }

  function handleLogout() {
    lsDel(SESSION_KEY);
    setUsuario(null);
    setVista("form");
  }

  const cssActual = css
    .replace(/background: #0a0c10/g, `background: ${T.bg}`)
    .replace(/color: #e8eaf0/g, `color: ${T.text}`)
    .replace(/background: #181c24/g, `background: ${T.surface2}`)
    .replace(/border: 1px solid #1e2330/g, `border: 1px solid ${T.border}`);

  if (cargando) {
    return (
      <>
        <style>{css}</style>
        <div style={{ minHeight: "100vh", background: G.bg, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16 }}>
          <div style={{ fontSize: 40 }}>🏗️</div>
          <div style={{ fontSize: 14, color: G.textMuted }}>Conectando…</div>
        </div>
      </>
    );
  }

  if (!usuario) {
    return (
      <>
        <style>{css}</style>
        <VistaLogin onLogin={handleLogin} usuarios={usuarios} />
      </>
    );
  }

  return (
    <>
      <style>{cssActual}</style>
      <div style={{ minHeight: "100vh", background: T.bg, fontFamily: T.font, color: T.text }}>
        <NavBar vista={vista} setVista={setVista} usuario={usuario} onLogout={handleLogout} tema={tema} toggleTema={toggleTema} T={T} />
        <BarraSync syncOk={syncOk} guardando={guardando} ultimaSync={ultimaSync} onActualizar={cargar} T={T} />
        {vista === "form"    && <VistaFormulario onGuardar={onGuardar} prefill={prefill} setPrefill={setPrefill} usuario={usuario} T={T} />}
        {vista === "dash"    && <VistaDashboard registros={registros} setPrefill={setPrefill} setVista={setVista} T={T} onGuardar={onGuardar} usuario={usuario} />}
        {vista === "cert"    && <VistaCertificaciones registros={registros} setVista={setVista} T={T} />}
        {vista === "informe" && <VistaInforme registros={registros} T={T} />}
        {vista === "admin"   && usuario?.admin && <VistaAdmin usuarios={usuarios} setUsuarios={setUsuarios} T={T} />}
      </div>
    </>
  );
}
