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
  "Obra":            ["R0", "R1"],
  "Coordinador":     ["R0", "R1", "R2"],
  "Oficina Técnica": ["R0", "R1", "R2"],
  "Gerencia":        ["R0", "R1", "R2"],
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

const RELEVAMIENTOS_TODOS = ["R0", "R1", "R2"];
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
    id: row.id, piso: row.piso, depto: row.depto,
    relevamiento: row.relevamiento, responsable: row.responsable,
    rol: row.rol, fecha: row.fecha,
    fase: row.fase || "F1",
    items: typeof row.items === "string" ? JSON.parse(row.items) : (row.items || {}),
    anulado: row.anulado ?? false,
    esCorrección: row.es_correccion ?? false,
    corrigenA: row.corrigen_a ?? null,
  };
}

function getItemData(registro, itemId) {
  return registro.items[String(itemId)] || registro.items[itemId] || null;
}

function getEstadoVigente(registros, piso, depto, itemId, fase) {
  const relevantes = registros
    .filter(r => r.piso === piso && r.depto === depto && !r.anulado &&
      (!fase || r.fase === fase) && getItemData(r, itemId))
    .sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
  if (relevantes.length === 0) return null;
  const r = relevantes[0];
  const d = getItemData(r, itemId);
  return { ...d, relevamiento: r.relevamiento, responsable: r.responsable, fecha: r.fecha, fase: r.fase };
}

function getAptoCertificar(registros, piso, depto, itemId, fase) {
  const v = getEstadoVigente(registros, piso, depto, itemId, fase);
  return v?.relevamiento === "R2" && v?.estado === "VERIFICA";
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
    body { background: white; color: black; }
  }
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

function NavBar({ vista, setVista, usuario, onLogout }) {
  const tabs = [
    { id: "form",   label: "Relevamiento", icon: "📋" },
    { id: "dash",   label: "Dashboard",    icon: "📊" },
    { id: "cert",   label: "Certificación",icon: "✅" },
    { id: "informe",label: "Informe",      icon: "📄" },
    ...(usuario?.admin ? [{ id: "admin", label: "Usuarios", icon: "👤" }] : []),
  ];
  return (
    <nav style={{ position: "sticky", top: 0, zIndex: 100, background: G.surface, borderBottom: `1px solid ${G.border}` }}>
      <div style={{ display: "flex", alignItems: "center", height: 48, padding: "0 12px", borderBottom: `1px solid ${G.border}`, gap: 8 }}>
        <span style={{ fontSize: 18 }}>🏗️</span>
        <span style={{ fontWeight: 700, fontSize: 12, color: G.accent, letterSpacing: 1, flex: 1 }}>CC OBRA</span>
        <span style={{ fontSize: 11, color: G.textMuted, maxWidth: 140, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{usuario?.nombre}</span>
        <span style={{ fontSize: 10, background: G.surface2, border: `1px solid ${G.border}`, borderRadius: 10, padding: "2px 8px", color: G.textDim }}>{usuario?.rol}</span>
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
  const [nombre, setNombre] = useState("");
  const [pass, setPass]     = useState("");
  const [error, setError]   = useState("");

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
          <div style={{ fontWeight: 700, fontSize: 20, color: G.accent }}>CC OBRA</div>
          <div style={{ fontSize: 13, color: G.textMuted, marginTop: 4 }}>Control de Calidad en Obra</div>
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
          <input type="password" value={pass} onChange={e => { setPass(e.target.value); setError(""); }}
            onKeyDown={e => e.key === "Enter" && intentarLogin()} placeholder="••••••••" />
        </div>
        {error && <div style={{ color: "#f87171", fontSize: 13, marginBottom: 16, textAlign: "center" }}>{error}</div>}
        <button onClick={intentarLogin} style={{ width: "100%", padding: "14px", borderRadius: 10, background: G.accent, border: "none", color: "#fff", fontWeight: 700, fontSize: 15 }}>
          Ingresar
        </button>
        <div style={{ marginTop: 16, fontSize: 11, color: G.textMuted, textAlign: "center" }}>
          Clave inicial: <span style={{ color: G.textDim, fontFamily: G.mono }}>ccobra2024</span>
        </div>
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
function VistaFormulario({ onGuardar, prefill, setPrefill, usuario }) {
  const relevPermitidos = RELEV_POR_ROL[usuario.rol] || [];
  const [piso, setPiso]   = useState(prefill?.piso?.toString() || "");
  const [depto, setDepto] = useState(prefill?.depto || "");
  const [faseId, setFaseId] = useState(prefill?.fase || "");
  const [relev, setRelev] = useState(() => {
    if (prefill?.relevamiento && relevPermitidos.includes(prefill.relevamiento)) return prefill.relevamiento;
    return relevPermitidos[0] || "R0";
  });
  const [rubrosOpen, setRubrosOpen] = useState({});
  const [itemsForm, setItemsForm]   = useState(() => {
    if (!prefill?.items) return {};
    const norm = {};
    Object.entries(prefill.items).forEach(([k, v]) => { norm[String(k)] = v; });
    return norm;
  });
  const [estadoGuardar, setEstadoGuardar] = useState("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [errores, setErrores]   = useState([]);

  const deptos = piso ? PISOS[parseInt(piso)] : [];
  const faseSeleccionada = FASES.find(f => f.id === faseId);
  const rubrosConItems = faseSeleccionada?.rubros.filter(r => r.items.length > 0) || [];

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

  async function guardar() {
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
      setEstadoGuardar("ok");
      setItemsForm({}); setPiso(""); setDepto(""); setFaseId(""); setRubrosOpen({});
      setPrefill(null);
      onGuardar();
      setTimeout(() => setEstadoGuardar("idle"), 3000);
    } catch (e) {
      setEstadoGuardar("error");
      setErrorMsg(e.message || "Error al guardar. Intentá de nuevo.");
    }
  }

  const contados = useMemo(() => {
    const c = { VERIFICA: 0, VERIFICA_OBS: 0, NO_VERIFICA: 0, PENDIENTE: 0, sin: 0 };
    const itemsFase = faseSeleccionada?.rubros.flatMap(r => r.items) || [];
    itemsFase.forEach(item => {
      const e = itemsForm[String(item.id)]?.estado;
      if (e && c[e] !== undefined) c[e]++; else c.sin++;
    });
    return c;
  }, [itemsForm, faseSeleccionada]);

  const guardando = estadoGuardar === "guardando";

  return (
    <div style={{ padding: "0 0 80px", maxWidth: 700, margin: "0 auto" }}>
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
            { k: "PENDIENTE", lbl: "P", col: "#6b7280" },
            { k: "sin", lbl: "Sin", col: "#374151" },
          ].map(({ k, lbl, col }) => (
            <div key={k} style={{ background: G.surface, border: `1px solid ${G.border}`, borderRadius: 8, padding: "8px 4px", textAlign: "center" }}>
              <div style={{ fontSize: 18, fontWeight: 700, color: col, fontFamily: G.mono }}>{contados[k]}</div>
              <div style={{ fontSize: 10, color: G.textMuted }}>{lbl}</div>
            </div>
          ))}
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
          {rubrosConItems.map(rubro => (
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
                              fontSize: 11, fontWeight: 700,
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
        <button onClick={guardar} disabled={guardando} style={{
          width: "100%", padding: "16px", borderRadius: 12,
          background: guardando ? G.accentDim : G.accent,
          border: "none", color: "#fff", fontWeight: 700, fontSize: 16, opacity: guardando ? .7 : 1,
        }}>
          {guardando ? "Guardando…" : prefill ? "Guardar Corrección" : "Guardar Relevamiento"}
        </button>
      </div>
    </div>
  );
}

// ─── HISTORIAL INLINE ─────────────────────────────────────────────────────────
function HistorialInline({ piso, depto, itemId, faseId, registros, setPrefill, setVista, onClose }) {
  const item = TODOS_ITEMS.find(i => i.id === itemId);
  const historial = getHistorial(registros, piso, depto, itemId);
  return (
    <div style={{ background: G.surface2, border: `1px solid ${G.accent}`, borderRadius: 10, padding: 14, marginTop: 8 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
        <div>
          <div style={{ fontSize: 10, color: G.textMuted, fontFamily: G.mono }}>Piso {piso} · Dto {depto} · #{itemId}</div>
          <div style={{ fontSize: 13, fontWeight: 600, color: G.text, marginTop: 2 }}>{item?.desc}</div>
        </div>
        <button onClick={onClose} style={{ background: "none", border: "none", color: G.textMuted, fontSize: 18, padding: "0 4px" }}>×</button>
      </div>
      {historial.length === 0 && <div style={{ color: G.textMuted, fontSize: 12 }}>Sin relevamientos</div>}
      {historial.map(r => {
        const d = getItemData(r, itemId);
        return (
          <div key={r.id} style={{ borderLeft: `3px solid ${r.anulado ? G.border : ESTADOS[d?.estado]?.border || G.border}`, paddingLeft: 10, marginBottom: 10, opacity: r.anulado ? .4 : 1 }}>
            <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
              <span style={{ fontFamily: G.mono, fontWeight: 700, fontSize: 12, color: G.accent }}>{r.relevamiento}</span>
              <EstadoBadge estado={d?.estado} />
              {r.anulado && <span style={{ background: "#3f0a0a", color: "#ef4444", fontSize: 10, padding: "1px 6px", borderRadius: 10 }}>ANULADO</span>}
              {r.esCorrección && <span style={{ background: "#1c1a00", color: "#fbbf24", fontSize: 10, padding: "1px 6px", borderRadius: 10 }}>CORRECCIÓN</span>}
            </div>
            <div style={{ fontSize: 11, color: G.textMuted, marginTop: 2 }}>{formatFecha(r.fecha)} · {r.responsable}</div>
            {d?.obs && <div style={{ fontSize: 12, color: G.textDim, marginTop: 3, fontStyle: "italic" }}>"{d.obs}"</div>}
            {!r.anulado && (
              <button onClick={() => { setPrefill({ ...r }); setVista("form"); onClose(); }} style={{ marginTop: 6, padding: "4px 10px", borderRadius: 6, border: `1px solid ${G.border}`, background: G.surface, color: G.textDim, fontSize: 11 }}>
                ✏️ Corregir
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── DASHBOARD ───────────────────────────────────────────────────────────────
function VistaDashboard({ registros, setPrefill, setVista }) {
  const [piso, setPiso]       = useState(1);
  const [faseOpen, setFaseOpen] = useState({ F1: true });
  const [rubroOpen, setRubroOpen] = useState({});
  const [sel, setSel]         = useState(null);
  const deptos = PISOS[piso];

  function handleCelda(piso, depto, itemId, faseId) {
    const key = `${piso}-${depto}-${itemId}-${faseId}`;
    setSel(prev => prev === key ? null : key);
  }

  function parseSelKey(key) {
    if (!key) return null;
    const parts = key.split("-");
    return { piso: parseInt(parts[0]), depto: parts[1], itemId: parseInt(parts[2]), faseId: parts[3] };
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

        return (
          <div key={fase.id} style={{ margin: "10px 16px 0" }}>
            <button onClick={() => setFaseOpen(prev => ({ ...prev, [fase.id]: !prev[fase.id] }))} style={{
              width: "100%", padding: "10px 14px", background: G.surface, border: `1px solid ${G.border}`,
              borderRadius: faseAbierta ? "10px 10px 0 0" : 10,
              color: G.accent, display: "flex", justifyContent: "space-between", alignItems: "center", fontWeight: 700, fontSize: 13,
            }}>
              <span>{fase.nombre}</span>
              <span style={{ fontSize: 16, color: G.textMuted }}>{faseAbierta ? "▾" : "▸"}</span>
            </button>

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
                      <table style={{ borderCollapse: "separate", borderSpacing: 3, minWidth: "max-content" }}>
                        <thead>
                          <tr>
                            <th style={{ textAlign: "left", fontSize: 10, color: G.textMuted, padding: "0 8px 6px 0", fontWeight: 400, minWidth: 180 }}>Ítem</th>
                            {deptos.map(d => <th key={d} style={{ fontSize: 11, fontWeight: 700, color: G.accent, textAlign: "center", padding: "0 1px 6px", minWidth: 34 }}>{d}</th>)}
                          </tr>
                        </thead>
                        <tbody>
                          {rubro.items.map(item => {
                            const selKey = `${piso}-${deptos[0]}-${item.id}-${fase.id}`;
                            return (
                              <>
                                <tr key={item.id}>
                                  <td style={{ fontSize: 11, color: G.textDim, paddingRight: 10, whiteSpace: "nowrap", paddingBottom: 3 }}>
                                    <span style={{ fontFamily: G.mono, fontSize: 9, color: G.textMuted, marginRight: 4 }}>#{item.id}</span>
                                    {item.local !== "GENERAL" && <span style={{ color: G.textMuted, marginRight: 3 }}>[{item.local}]</span>}
                                    {item.desc.length > 35 ? item.desc.slice(0, 35) + "…" : item.desc}
                                  </td>
                                  {deptos.map(d => {
                                    const vigente = getEstadoVigente(registros, piso, d, item.id, fase.id);
                                    const eKey = vigente?.estado || "PENDIENTE";
                                    const e = ESTADOS[eKey];
                                    const apto = getAptoCertificar(registros, piso, d, item.id, fase.id);
                                    const cellKey = `${piso}-${d}-${item.id}-${fase.id}`;
                                    const isSelected = sel === cellKey;
                                    return (
                                      <td key={d} onClick={() => handleCelda(piso, d, item.id, fase.id)}
                                        title={`${e.label}${vigente?.obs ? ": " + vigente.obs : ""}${apto ? " ✅ R2" : ""}`}
                                        style={{
                                          width: 34, height: 34, minWidth: 34,
                                          background: isSelected ? e.color + "55" : e.bg,
                                          border: `2px solid ${isSelected ? e.color : vigente ? e.border : G.border}`,
                                          borderRadius: 5, cursor: "pointer", textAlign: "center",
                                          fontSize: 9, fontWeight: 700, color: e.color, position: "relative", userSelect: "none",
                                        }}>
                                        {e.short}
                                        {apto && <span style={{ position: "absolute", top: -3, right: -3, width: 9, height: 9, borderRadius: "50%", background: "#22c55e", border: "2px solid #0a0c10" }} />}
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
function VistaCertificaciones({ registros, setVista }) {
  const [piso, setPiso] = useState(1);
  const deptos = PISOS[piso];

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
          return (
            <div key={fase.id} style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: G.accent, letterSpacing: 1, marginBottom: 10 }}>{fase.nombre.toUpperCase()}</div>
              {rubrosConItems.map(rubro => {
                return (
                  <div key={rubro.id} style={{ marginBottom: 10 }}>
                    <div style={{ fontSize: 11, color: G.textDim, fontWeight: 600, marginBottom: 6 }}>{rubro.nombre}</div>
                    <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 4 }}>
                      {deptos.map(d => {
                        const cert = getCertRubro(registros, piso, d, rubro, fase.id);
                        const apto = !cert.sinItems && cert.aptos === cert.total;
                        const parcial = !cert.sinItems && cert.aptos > 0 && !apto;
                        const bc = apto ? "#16a34a" : parcial ? "#a16207" : G.border;
                        const tc = apto ? "#22c55e" : parcial ? "#eab308" : G.textMuted;
                        const bg = apto ? "#052e16" : parcial ? "#1c1a02" : G.surface2;
                        return (
                          <div key={d} style={{ minWidth: 72, background: G.surface, border: `2px solid ${bc}`, borderRadius: 10, padding: "8px 8px 6px", textAlign: "center", flexShrink: 0 }}>
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
                              {cert.sinItems ? "SIN ITEMS" : apto ? "✅ APTO" : parcial ? "⏳ PARCIAL" : "⛔ SIN R2"}
                            </div>
                          </div>
                        );
                      })}
                    </div>
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
  const pendientes = useMemo(() => {
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

  function descargarPDF() {
    window.print();
  }

  if (pendientes.length === 0) {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 60, gap: 16 }}>
        <div style={{ fontSize: 64 }}>✅</div>
        <div style={{ fontSize: 18, fontWeight: 700, color: "#4ade80", textAlign: "center" }}>Todos los ítems verificados</div>
        <div style={{ fontSize: 14, color: G.textMuted, textAlign: "center" }}>Certificación habilitada</div>
      </div>
    );
  }

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
      <div className="no-print" style={{ padding: "12px 16px", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: `1px solid ${G.border}` }}>
        <div style={{ fontSize: 13, color: G.textMuted }}>
          <span style={{ fontFamily: G.mono, fontWeight: 700, color: "#ef4444", fontSize: 18 }}>{pendientes.length}</span> ítems pendientes
        </div>
        <button onClick={descargarPDF} style={{
          padding: "8px 16px", borderRadius: 8, background: G.accent, border: "none",
          color: "#fff", fontWeight: 600, fontSize: 13,
        }}>📄 Descargar PDF</button>
      </div>

      {/* Encabezado para impresión */}
      <div style={{ padding: "16px 16px 0", display: "none" }} className="print-header">
        <div style={{ fontSize: 20, fontWeight: 700, marginBottom: 4 }}>INFORME DE CONTROL DE CALIDAD</div>
        <div style={{ fontSize: 12, color: "#666", marginBottom: 16 }}>Fecha: {new Date().toLocaleDateString("es-AR")} · Ítems pendientes: {pendientes.length}</div>
      </div>

      <div style={{ padding: "12px 16px 0" }}>
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
      </div>
    </div>
  );
}

// ─── APP ROOT ─────────────────────────────────────────────────────────────────
export default function App() {
  const [vista, setVista]           = useState("form");
  const [registros, setRegistros]   = useState([]);
  const [usuarios, setUsuarios]     = useState([]);
  const [usuario, setUsuario]       = useState(null);
  const [prefill, setPrefill]       = useState(null);
  const [cargando, setCargando]     = useState(true);
  const [syncOk, setSyncOk]         = useState(true);
  const [guardando]                 = useState(false);
  const [ultimaSync, setUltimaSync] = useState(null);
  const pollingRef = useRef(null);

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
    setUsuario(u);
    setVista("form");
  }

  function handleLogout() {
    setUsuario(null);
    setVista("form");
  }

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
      <style>{css}</style>
      <div style={{ minHeight: "100vh", background: G.bg, fontFamily: G.font }}>
        <NavBar vista={vista} setVista={setVista} usuario={usuario} onLogout={handleLogout} />
        <BarraSync syncOk={syncOk} guardando={guardando} ultimaSync={ultimaSync} onActualizar={cargar} />
        {vista === "form"    && <VistaFormulario onGuardar={onGuardar} prefill={prefill} setPrefill={setPrefill} usuario={usuario} />}
        {vista === "dash"    && <VistaDashboard registros={registros} setPrefill={setPrefill} setVista={setVista} />}
        {vista === "cert"    && <VistaCertificaciones registros={registros} setVista={setVista} />}
        {vista === "informe" && <VistaInforme registros={registros} />}
        {vista === "admin"   && usuario?.admin && <VistaAdmin usuarios={usuarios} setUsuarios={setUsuarios} />}
      </div>
    </>
  );
}
