import { useState } from "react";

const mockData = [
  { id: 1, horodatage: "2026-02-17 14:31:02", source: "SCADA", operateur: "Ahmed B.", poste: "Poste A1", reference: "REF-4521-X", valeur: "78.4°C", statut: "Normal" },
  { id: 2, horodatage: "2026-02-17 14:30:45", source: "QDC",   operateur: "Sara M.",  poste: "Poste B2", reference: "LOT-8821",   valeur: "PASS",     statut: "OK" },
  { id: 3, horodatage: "2026-02-17 14:29:18", source: "AGV",   operateur: "Auto",     poste: "Zone B",   reference: "TRAJ-124",   valeur: "2 km/h",   statut: "Running" },
  { id: 4, horodatage: "2026-02-17 14:28:55", source: "SCADA", operateur: "Karim L.", poste: "Poste C3", reference: "REF-7890",   valeur: "87.4°C",   statut: "Alerte" },
  { id: 5, horodatage: "2026-02-17 14:27:10", source: "WMS",   operateur: "Ahmed B.", poste: "Entrepôt", reference: "SKU-2210",   valeur: "Sortie x12",statut: "OK" },
  { id: 6, horodatage: "2026-02-17 14:25:33", source: "QDC",   operateur: "Sara M.",  poste: "Poste D4", reference: "LOT-8820",   valeur: "2 défauts", statut: "Warn" },
  { id: 7, horodatage: "2026-02-17 14:24:10", source: "SCADA", operateur: "Karim L.", poste: "Poste A2", reference: "REF-1234",   valeur: "72.1°C",   statut: "Normal" },
  { id: 8, horodatage: "2026-02-17 14:22:48", source: "WMS",   operateur: "Ahmed B.", poste: "Entrepôt", reference: "SKU-3301",   valeur: "Entrée x5", statut: "OK" },
];

const sourceConfig: Record<string, { bg: string; color: string; border: string; dot: string }> = {
  SCADA: { bg: "#dbeafe", color: "#1d4ed8", border: "#93c5fd", dot: "#3b82f6" },
  QDC:   { bg: "#ede9fe", color: "#6d28d9", border: "#c4b5fd", dot: "#8b5cf6" },
  AGV:   { bg: "#fef9c3", color: "#854d0e", border: "#fcd34d", dot: "#f59e0b" },
  WMS:   { bg: "#d1fae5", color: "#047857", border: "#6ee7b7", dot: "#10b981" },
};

const statutConfig: Record<string, { bg: string; color: string; border: string; icon: string; glow: string }> = {
  Normal:  { bg: "#dcfce7", color: "#15803d", border: "#86efac", icon: "✓", glow: "#22c55e" },
  OK:      { bg: "#dcfce7", color: "#15803d", border: "#86efac", icon: "✓", glow: "#22c55e" },
  Running: { bg: "#dbeafe", color: "#1d4ed8", border: "#93c5fd", icon: "▶", glow: "#3b82f6" },
  Alerte:  { bg: "#fee2e2", color: "#dc2626", border: "#fca5a5", icon: "⚠", glow: "#ef4444" },
  Warn:    { bg: "#fef3c7", color: "#d97706", border: "#fcd34d", icon: "⚠", glow: "#f59e0b" },
};

const handlePrintAll = (data: typeof mockData) => {
  const win = window.open("", "_blank");
  if (!win) return;
  const rows = data.map(r => `<tr><td>${r.horodatage}</td><td>${r.source}</td><td>${r.operateur}</td><td>${r.poste}</td><td>${r.reference}</td><td>${r.valeur}</td><td>${r.statut}</td></tr>`).join("");
  win.document.write(`<html><head><title>Export</title><style>body{font-family:Inter,sans-serif;padding:2rem;color:#1e293b}h2{color:#1d4ed8}table{width:100%;border-collapse:collapse;font-size:13px}th{background:#eff6ff;color:#1d4ed8;padding:10px 14px;text-align:left;font-size:10px;text-transform:uppercase;letter-spacing:.1em;border-bottom:2px solid #bfdbfe}td{padding:10px 14px;border-bottom:1px solid #f1f5f9}tr:nth-child(even) td{background:#fafbff}.footer{margin-top:2rem;font-size:11px;color:#94a3b8;text-align:center}</style></head><body><h2>🔍 Requête de données — ${data.length} enregistrements</h2><p style="color:#94a3b8;font-size:12px">Exporté le ${new Date().toLocaleDateString("fr-FR")} à ${new Date().toLocaleTimeString("fr-FR",{hour:"2-digit",minute:"2-digit"})}</p><table><thead><tr><th>Horodatage</th><th>Source</th><th>Opérateur</th><th>Poste</th><th>Référence</th><th>Valeur</th><th>Statut</th></tr></thead><tbody>${rows}</tbody></table><div class="footer">L-mobile WAS v2.4 · ISO 9001</div></body></html>`);
  win.document.close(); win.print();
};

const handlePrintRow = (row: typeof mockData[0]) => {
  const win = window.open("", "_blank");
  if (!win) return;
  win.document.write(`<html><head><title>Détail ${row.reference}</title><style>body{font-family:Inter,sans-serif;padding:2rem;color:#1e293b}h2{color:#1d4ed8}.card{border:1.5px solid #e2e8f0;border-radius:12px;overflow:hidden}.row{display:flex;justify-content:space-between;padding:.75rem 1.25rem;border-bottom:1px solid #f1f5f9;font-size:13.5px}.row:nth-child(even){background:#fafbff}.label{color:#94a3b8;font-weight:700;font-size:11px;text-transform:uppercase}.value{color:#1e293b;font-weight:600}.footer{margin-top:2rem;font-size:11px;color:#94a3b8;text-align:center}</style></head><body><h2>🔍 Détail — ${row.reference}</h2><div class="card">${[["Horodatage",row.horodatage],["Source",row.source],["Opérateur",row.operateur],["Poste",row.poste],["Référence",row.reference],["Valeur",row.valeur],["Statut",row.statut]].map(([l,v])=>`<div class="row"><span class="label">${l}</span><span class="value">${v}</span></div>`).join("")}</div><div class="footer">L-mobile WAS v2.4 · ISO 9001</div></body></html>`);
  win.document.close(); win.print();
};

// ─── Icônes SVG multicolores ───────────────────────────────────────

const IconPrintColor = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
    <rect x="6" y="2" width="12" height="6" rx="1.5" fill="#93c5fd" />
    <rect x="6" y="15" width="12" height="7" rx="1.5" fill="#bfdbfe" />
    <path d="M6 9h12a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2z" fill="#3b82f6" />
    <circle cx="18" cy="12" r="1.3" fill="#22c55e" />
    <rect x="9" y="17" width="6" height="1.2" rx=".6" fill="#3b82f6" />
    <rect x="9" y="19" width="4" height="1.2" rx=".6" fill="#93c5fd" />
  </svg>
);

const IconPDFColor = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
    <rect x="4" y="2" width="16" height="20" rx="2" fill="#fee2e2" />
    <path d="M14 2v6h6" fill="#fca5a5" />
    <path d="M14 2L20 8H14V2z" fill="#ef4444" />
    <rect x="6" y="11" width="5" height="1.5" rx=".75" fill="#dc2626" />
    <rect x="6" y="14" width="8" height="1.5" rx=".75" fill="#dc2626" />
    <rect x="6" y="17" width="6" height="1.5" rx=".75" fill="#fca5a5" />
    <text x="7.5" y="10.5" fontSize="4.5" fontWeight="900" fill="#dc2626" fontFamily="sans-serif">PDF</text>
  </svg>
);

const IconExcelColor = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
    <rect x="4" y="2" width="16" height="20" rx="2" fill="#d1fae5" />
    <path d="M14 2L20 8H14V2z" fill="#10b981" />
    <rect x="6" y="11" width="12" height="1.2" rx=".6" fill="#a7f3d0" />
    <rect x="6" y="13.5" width="12" height="1.2" rx=".6" fill="#a7f3d0" />
    <rect x="6" y="16" width="12" height="1.2" rx=".6" fill="#a7f3d0" />
    <rect x="9.5" y="10" width="1.2" height="9" rx=".6" fill="#6ee7b7" />
    <rect x="13.5" y="10" width="1.2" height="9" rx=".6" fill="#6ee7b7" />
    <text x="6.5" y="9.5" fontSize="4.5" fontWeight="900" fill="#047857" fontFamily="sans-serif">XLS</text>
  </svg>
);

const IconRapportColor = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
    <rect x="3" y="3" width="18" height="18" rx="3" fill="#eff6ff" />
    <rect x="3" y="3" width="18" height="6" rx="3" fill="#3b82f6" />
    <rect x="7" y="13" width="10" height="1.5" rx=".75" fill="#93c5fd" />
    <rect x="7" y="16" width="7" height="1.5" rx=".75" fill="#bfdbfe" />
    <circle cx="18" cy="18" r="5" fill="#2563eb" />
    <line x1="18" y1="15.5" x2="18" y2="20.5" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" />
    <line x1="15.5" y1="18" x2="20.5" y2="18" stroke="#bfdbfe" strokeWidth="1.8" strokeLinecap="round" />
  </svg>
);

const IconSearch = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none">
    <circle cx="11" cy="11" r="7" fill="#dbeafe" stroke="#3b82f6" strokeWidth="2" />
    <circle cx="11" cy="11" r="3.5" fill="#93c5fd" />
    <line x1="17" y1="17" x2="21" y2="21" stroke="#1d4ed8" strokeWidth="2.5" strokeLinecap="round" />
  </svg>
);

const IconReset = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
    <path d="M3.51 15a9 9 0 1 0 .49-3.56" stroke="#94a3b8" strokeWidth="2.5" strokeLinecap="round" fill="none" />
    <polyline points="1 4 1 10 7 10" stroke="#64748b" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const IconEye = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" fill="#f5f3ff" stroke="#8b5cf6" strokeWidth="2" />
    <circle cx="12" cy="12" r="3" fill="#c4b5fd" stroke="#7c3aed" strokeWidth="1.5" />
    <circle cx="12" cy="12" r="1.2" fill="#6d28d9" />
  </svg>
);

const IconPrintRow = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
    <rect x="6" y="2" width="12" height="6" rx="1.2" fill="#93c5fd" />
    <rect x="6" y="15" width="12" height="7" rx="1.2" fill="#bfdbfe" />
    <path d="M6 9h12a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2z" fill="#3b82f6" />
    <circle cx="18" cy="12" r="1.2" fill="#22c55e" />
  </svg>
);

const QueryPage = () => {
  const [source, setSource] = useState("Toutes les sources");
  const [dateDebut, setDateDebut] = useState("2026-01-02");
  const [dateFin, setDateFin] = useState("2026-02-17");
  const [operateur, setOperateur] = useState("Tous");
  const [statut, setStatut] = useState("Tous");
  const [reference, setReference] = useState("");
  const [executed, setExecuted] = useState(true);
  const [hoveredRow, setHoveredRow] = useState<number | null>(null);
  const [selectedRow, setSelectedRow] = useState<number | null>(null);
  const [hoveredBtn, setHoveredBtn] = useState<string | null>(null);

  const filteredData = mockData.filter((row) => {
    if (source !== "Toutes les sources" && row.source !== source) return false;
    if (operateur !== "Tous" && row.operateur !== operateur) return false;
    if (statut !== "Tous" && row.statut !== statut) return false;
    if (reference && !row.reference.toLowerCase().includes(reference.toLowerCase())) return false;
    return true;
  });

  // Numéro de ligne affiché (position dans filteredData)
  const selectedLineNumber = selectedRow
    ? filteredData.findIndex(r => r.id === selectedRow) + 1
    : null;
  const selectedRowData = selectedRow ? filteredData.find(r => r.id === selectedRow) : null;

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "0.7rem 1rem",
    borderRadius: "11px",
    border: "1.5px solid #e2e8f0",
    fontSize: "0.87rem",
    color: "#1e293b",
    background: "#fff",
    outline: "none",
    boxSizing: "border-box",
    fontFamily: "inherit",
    transition: "all 0.2s",
  };

  const selectStyle: React.CSSProperties = {
    ...inputStyle,
    appearance: "none",
    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='11' height='11' viewBox='0 0 12 12'%3E%3Cpath fill='%2394a3b8' d='M6 8L1 3h10z'/%3E%3C/svg%3E")`,
    backgroundRepeat: "no-repeat",
    backgroundPosition: "right 1rem center",
    paddingRight: "2.5rem",
    cursor: "pointer",
  };

  const labelStyle: React.CSSProperties = {
    fontSize: "0.68rem",
    fontWeight: 700,
    color: "#94a3b8",
    letterSpacing: "0.12em",
    textTransform: "uppercase",
    display: "block",
    marginBottom: "0.45rem",
  };

  // Bouton blanc avec icône colorée
  const WhiteBtn = ({
    id, icon, label, onClick, borderColor = "#e2e8f0", hoverBg = "#f8faff",
  }: {
    id: string; icon: React.ReactNode; label: string;
    onClick?: () => void; borderColor?: string; hoverBg?: string;
  }) => (
    <button
      onClick={onClick}
      onMouseEnter={() => setHoveredBtn(id)}
      onMouseLeave={() => setHoveredBtn(null)}
      style={{
        display: "flex", alignItems: "center", gap: "0.5rem",
        padding: "0.6rem 1.1rem",
        borderRadius: "11px",
        border: `1.5px solid ${hoveredBtn === id ? borderColor : "#e2e8f0"}`,
        background: hoveredBtn === id ? hoverBg : "#fff",
        color: "#374151",
        fontSize: "0.83rem",
        fontWeight: 600,
        cursor: "pointer",
        boxShadow: hoveredBtn === id
          ? "0 4px 16px rgba(0,0,0,0.08)"
          : "0 2px 6px rgba(0,0,0,0.05)",
        transform: hoveredBtn === id ? "translateY(-1px)" : "translateY(0)",
        transition: "all 0.2s",
      }}
    >
      {icon}
      {label}
    </button>
  );

  return (
    <div style={{
      padding: "2rem",
      fontFamily: "'Inter', -apple-system, sans-serif",
      background: "#f0f4ff",
      minHeight: "100vh",
    }}>

      {/* ── Header bannière ── */}
      <div style={{
        background: "linear-gradient(135deg, #1d4ed8 0%, #2563eb 45%, #7c3aed 100%)",
        borderRadius: "22px",
        padding: "1.75rem 2rem",
        marginBottom: "1.75rem",
        color: "#fff",
        position: "relative",
        overflow: "hidden",
        boxShadow: "0 16px 48px rgba(37,99,235,0.35), inset 0 1px 0 rgba(255,255,255,0.15)",
      }}>
        <div style={{ position:"absolute", top:"-60px", right:"-60px", width:"200px", height:"200px", borderRadius:"50%", background:"rgba(255,255,255,0.06)", pointerEvents:"none" }} />
        <div style={{ position:"absolute", bottom:"-40px", left:"38%", width:"160px", height:"160px", borderRadius:"50%", background:"rgba(255,255,255,0.04)", pointerEvents:"none" }} />

        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", position:"relative", zIndex:1 }}>
          {/* Titre */}
          <div style={{ display:"flex", alignItems:"center", gap:"1rem" }}>
            <div style={{
              width:"52px", height:"52px", borderRadius:"16px",
              background:"rgba(255,255,255,0.18)", backdropFilter:"blur(10px)",
              border:"1.5px solid rgba(255,255,255,0.3)",
              display:"flex", alignItems:"center", justifyContent:"center",
              fontSize:"1.5rem",
              boxShadow:"0 4px 16px rgba(0,0,0,0.15)",
            }}>🔍</div>
            <div>
              <div style={{ display:"flex", alignItems:"center", gap:"0.6rem", marginBottom:"0.3rem" }}>
                <span style={{ background:"rgba(255,255,255,0.18)", backdropFilter:"blur(10px)", border:"1px solid rgba(255,255,255,0.25)", borderRadius:"20px", padding:"2px 12px", fontSize:"0.68rem", fontWeight:700, color:"#e0e7ff", letterSpacing:"0.08em", textTransform:"uppercase" }}>Module 02</span>
                <span style={{ background:"rgba(34,197,94,0.2)", border:"1px solid rgba(34,197,94,0.4)", borderRadius:"20px", padding:"2px 12px", fontSize:"0.68rem", color:"#bbf7d0", fontWeight:700 }}>● LIVE</span>
              </div>
              <h1 style={{ margin:0, fontSize:"1.5rem", fontWeight:900, color:"#fff", letterSpacing:"-0.03em" }}>
                Requête de données
              </h1>
              <p style={{ margin:"0.2rem 0 0", color:"rgba(255,255,255,0.7)", fontSize:"0.83rem" }}>
                Interrogez le data lake via OData endpoints avec filtres multi-dimensions
              </p>
            </div>
          </div>

          {/* ── Boutons header — fond blanc, icônes colorées ── */}
          <div style={{ display:"flex", gap:"0.6rem", alignItems:"center" }}>
            <WhiteBtn
              id="print"
              icon={<IconPrintColor />}
              label="Imprimer"
              onClick={() => handlePrintAll(filteredData)}
              borderColor="#93c5fd"
              hoverBg="#eff6ff"
            />
            <WhiteBtn
              id="pdf"
              icon={<IconPDFColor />}
              label="PDF"
              borderColor="#fca5a5"
              hoverBg="#fff5f5"
            />
            <WhiteBtn
              id="excel"
              icon={<IconExcelColor />}
              label="Excel"
              borderColor="#6ee7b7"
              hoverBg="#f0fdf9"
            />

            {/* Séparateur */}
            <div style={{ width:"1px", height:"32px", background:"rgba(255,255,255,0.2)", margin:"0 0.1rem" }} />

            {/* Créer rapport */}
            <button
              onMouseEnter={() => setHoveredBtn("rapport")}
              onMouseLeave={() => setHoveredBtn(null)}
              style={{
                display:"flex", alignItems:"center", gap:"0.6rem",
                padding:"0.65rem 1.3rem",
                borderRadius:"12px",
                border:"none",
                background: hoveredBtn === "rapport" ? "#fff" : "rgba(255,255,255,0.95)",
                color:"#1d4ed8",
                fontSize:"0.85rem",
                fontWeight:700,
                cursor:"pointer",
                boxShadow: hoveredBtn === "rapport"
                  ? "0 8px 28px rgba(0,0,0,0.2)"
                  : "0 4px 14px rgba(0,0,0,0.15)",
                transform: hoveredBtn === "rapport" ? "translateY(-2px)" : "translateY(0)",
                transition:"all 0.2s",
              }}
            >
              <IconRapportColor />
              Créer rapport
            </button>
          </div>
        </div>
      </div>

      {/* ── Filtres ── */}
      <div style={{
        background:"#fff",
        borderRadius:"20px",
        padding:"1.75rem",
        marginBottom:"1.5rem",
        border:"1.5px solid #e2e8f0",
        boxShadow:"0 4px 24px rgba(0,0,0,0.05)",
      }}>
        <div style={{ display:"flex", alignItems:"center", gap:"0.75rem", marginBottom:"1.5rem" }}>
          <div style={{
            width:"34px", height:"34px", borderRadius:"10px",
            background:"linear-gradient(135deg, #eff6ff, #dbeafe)",
            border:"1.5px solid #bfdbfe",
            display:"flex", alignItems:"center", justifyContent:"center", fontSize:"1rem",
          }}>🎛️</div>
          <div>
            <h2 style={{ margin:0, fontSize:"0.95rem", fontWeight:800, color:"#0f172a" }}>Filtres de recherche</h2>
            <p style={{ margin:0, fontSize:"0.75rem", color:"#94a3b8" }}>Affinez votre requête avec les filtres ci-dessous</p>
          </div>
        </div>

        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:"1rem", marginBottom:"1rem" }}>
          <div>
            <label style={labelStyle}><span style={{ color:"#3b82f6", marginRight:"4px" }}>◉</span>Source de données</label>
            <select style={selectStyle} value={source} onChange={e => setSource(e.target.value)}>
              <option>Toutes les sources</option>
              <option>SCADA</option><option>QDC</option><option>WMS</option><option>AGV</option>
            </select>
          </div>
          <div>
            <label style={labelStyle}><span style={{ color:"#10b981", marginRight:"4px" }}>◉</span>Date début</label>
            <input type="date" style={inputStyle} value={dateDebut} onChange={e => setDateDebut(e.target.value)} />
          </div>
          <div>
            <label style={labelStyle}><span style={{ color:"#f59e0b", marginRight:"4px" }}>◉</span>Date fin</label>
            <input type="date" style={inputStyle} value={dateFin} onChange={e => setDateFin(e.target.value)} />
          </div>
        </div>

        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:"1rem", marginBottom:"1.5rem" }}>
          <div>
            <label style={labelStyle}><span style={{ color:"#8b5cf6", marginRight:"4px" }}>◉</span>Opérateur</label>
            <select style={selectStyle} value={operateur} onChange={e => setOperateur(e.target.value)}>
              <option>Tous</option><option>Ahmed B.</option><option>Sara M.</option>
              <option>Karim L.</option><option>Auto</option>
            </select>
          </div>
          <div>
            <label style={labelStyle}><span style={{ color:"#ec4899", marginRight:"4px" }}>◉</span>Produit / Référence</label>
            <input type="text" placeholder="REF-XXXX" style={inputStyle} value={reference} onChange={e => setReference(e.target.value)} />
          </div>
          <div>
            <label style={labelStyle}><span style={{ color:"#dc2626", marginRight:"4px" }}>◉</span>Statut</label>
            <select style={selectStyle} value={statut} onChange={e => setStatut(e.target.value)}>
              <option>Tous</option><option>Normal</option><option>OK</option>
              <option>Running</option><option>Alerte</option><option>Warn</option>
            </select>
          </div>
        </div>

        <div style={{ display:"flex", alignItems:"center", gap:"0.75rem", paddingTop:"1.25rem", borderTop:"1.5px solid #f1f5f9" }}>
          <button
            onClick={() => setExecuted(true)}
            onMouseEnter={() => setHoveredBtn("search")}
            onMouseLeave={() => setHoveredBtn(null)}
            style={{
              display:"flex", alignItems:"center", gap:"0.6rem",
              padding:"0.75rem 1.75rem",
              borderRadius:"12px", border:"none",
              background: hoveredBtn === "search"
                ? "linear-gradient(135deg, #1d4ed8, #7c3aed)"
                : "linear-gradient(135deg, #2563eb, #3b82f6)",
              color:"#fff", fontSize:"0.9rem", fontWeight:700, cursor:"pointer",
              boxShadow: hoveredBtn === "search" ? "0 8px 28px rgba(37,99,235,0.5)" : "0 4px 16px rgba(37,99,235,0.35)",
              transform: hoveredBtn === "search" ? "translateY(-2px)" : "translateY(0)",
              transition:"all 0.2s",
            }}
          >
            <IconSearch />
            Rechercher
          </button>

          <button
            onClick={() => { setSource("Toutes les sources"); setOperateur("Tous"); setStatut("Tous"); setReference(""); setSelectedRow(null); }}
            onMouseEnter={() => setHoveredBtn("reset")}
            onMouseLeave={() => setHoveredBtn(null)}
            style={{
              display:"flex", alignItems:"center", gap:"0.5rem",
              padding:"0.75rem 1.25rem", borderRadius:"12px",
              border:"1.5px solid #e2e8f0",
              background: hoveredBtn === "reset" ? "#f8faff" : "#fff",
              color:"#64748b", fontSize:"0.88rem", fontWeight:600, cursor:"pointer",
              transition:"all 0.2s",
            }}
          >
            <IconReset />
            Réinitialiser
          </button>

          {/* Stats sources */}
          <div style={{ marginLeft:"auto", display:"flex", gap:"0.5rem" }}>
            {[
              { label:"SCADA", count:mockData.filter(d=>d.source==="SCADA").length, color:"#3b82f6", bg:"#eff6ff", border:"#bfdbfe" },
              { label:"QDC",   count:mockData.filter(d=>d.source==="QDC").length,   color:"#8b5cf6", bg:"#f5f3ff", border:"#ddd6fe" },
              { label:"WMS",   count:mockData.filter(d=>d.source==="WMS").length,   color:"#10b981", bg:"#ecfdf5", border:"#a7f3d0" },
              { label:"AGV",   count:mockData.filter(d=>d.source==="AGV").length,   color:"#f59e0b", bg:"#fffbeb", border:"#fde68a" },
            ].map(s => (
              <div key={s.label} style={{
                display:"flex", alignItems:"center", gap:"0.4rem",
                background:s.bg, border:`1.5px solid ${s.border}`,
                borderRadius:"9px", padding:"0.35rem 0.75rem",
                fontSize:"0.75rem", color:s.color, fontWeight:700,
              }}>
                <span style={{ width:"6px", height:"6px", borderRadius:"50%", background:s.color, display:"inline-block", boxShadow:`0 0 5px ${s.color}` }} />
                {s.label} · {s.count}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Tableau ── */}
      {executed && (
        <div style={{
          background:"#fff", borderRadius:"20px",
          border:"1.5px solid #e2e8f0",
          boxShadow:"0 4px 24px rgba(0,0,0,0.05)",
          overflow:"hidden",
        }}>
          {/* Header tableau */}
          <div style={{
            display:"flex", alignItems:"center", justifyContent:"space-between",
            padding:"1.25rem 1.75rem",
            borderBottom:"1.5px solid #f1f5f9",
            background:"linear-gradient(135deg, #fafbff, #f5f8ff)",
          }}>
            <div style={{ display:"flex", alignItems:"center", gap:"0.75rem", flexWrap:"wrap" }}>
              <div style={{
                width:"32px", height:"32px", borderRadius:"9px",
                background:"linear-gradient(135deg, #eff6ff, #dbeafe)",
                border:"1.5px solid #bfdbfe",
                display:"flex", alignItems:"center", justifyContent:"center", fontSize:"0.9rem",
              }}>📋</div>
              <span style={{ fontSize:"1rem", fontWeight:800, color:"#0f172a" }}>Résultats</span>

              {/* Badge nombre */}
              <span style={{
                background:"linear-gradient(135deg, #eff6ff, #dbeafe)",
                border:"1.5px solid #bfdbfe", borderRadius:"20px",
                padding:"3px 14px", fontSize:"0.77rem", color:"#1d4ed8", fontWeight:700,
              }}>
                {filteredData.length} enregistrements
              </span>

              {/* Badge ligne sélectionnée — avec numéro et référence */}
              {selectedRow && selectedLineNumber && selectedRowData && (
                <div style={{
                  display:"flex", alignItems:"center", gap:"0.5rem",
                  background:"linear-gradient(135deg, #faf5ff, #ede9fe)",
                  border:"1.5px solid #c4b5fd",
                  borderRadius:"20px",
                  padding:"4px 14px",
                  fontSize:"0.77rem",
                  color:"#6d28d9",
                  fontWeight:700,
                  boxShadow:"0 2px 8px rgba(139,92,246,0.15)",
                }}>
                  <span style={{
                    width:"20px", height:"20px", borderRadius:"50%",
                    background:"linear-gradient(135deg, #8b5cf6, #7c3aed)",
                    color:"#fff", fontSize:"0.68rem", fontWeight:800,
                    display:"flex", alignItems:"center", justifyContent:"center",
                  }}>
                    {selectedLineNumber}
                  </span>
                  <span>Ligne <strong>#{selectedLineNumber}</strong> — {selectedRowData.reference}</span>
                  <button
                    onClick={() => setSelectedRow(null)}
                    style={{
                      background:"#c4b5fd", border:"none", borderRadius:"50%",
                      width:"16px", height:"16px", cursor:"pointer",
                      display:"flex", alignItems:"center", justifyContent:"center",
                      fontSize:"0.6rem", color:"#4c1d95", fontWeight:900,
                      padding:0, marginLeft:"2px",
                    }}
                  >✕</button>
                </div>
              )}
            </div>

            <button
              onClick={() => handlePrintAll(filteredData)}
              onMouseEnter={() => setHoveredBtn("printTable")}
              onMouseLeave={() => setHoveredBtn(null)}
              style={{
                display:"flex", alignItems:"center", gap:"0.5rem",
                padding:"0.55rem 1.1rem", borderRadius:"10px",
                border:"1.5px solid #e2e8f0",
                background: hoveredBtn === "printTable" ? "#eff6ff" : "#fff",
                color:"#475569", fontSize:"0.82rem", fontWeight:600, cursor:"pointer",
                transition:"all 0.2s",
              }}
            >
              <IconPrintColor />
              Imprimer tout
            </button>
          </div>

          {/* Table */}
          <div style={{ overflowX:"auto" }}>
            <table style={{ width:"100%", borderCollapse:"collapse" }}>
              <thead>
                <tr style={{ background:"linear-gradient(135deg, #f8faff, #f0f4ff)" }}>
                  {["#","Horodatage","Source","Opérateur","Poste","Référence","Valeur","Statut","Actions"].map(col => (
                    <th key={col} style={{
                      padding:"0.85rem 1rem", textAlign:"left",
                      fontSize:"0.66rem", fontWeight:800, color:"#94a3b8",
                      letterSpacing:"0.12em", textTransform:"uppercase",
                      borderBottom:"2px solid #e8f0ff", whiteSpace:"nowrap",
                    }}>{col}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredData.map((row, index) => {
                  const src  = sourceConfig[row.source]  || { bg:"#f1f5f9", color:"#475569", border:"#e2e8f0", dot:"#94a3b8" };
                  const stat = statutConfig[row.statut]  || { bg:"#f1f5f9", color:"#475569", border:"#e2e8f0", icon:"•", glow:"#94a3b8" };
                  const isSelected = selectedRow === row.id;
                  const isHovered  = hoveredRow  === row.id;
                  const lineNum    = index + 1;

                  return (
                    <tr
                      key={row.id}
                      onClick={() => setSelectedRow(isSelected ? null : row.id)}
                      onMouseEnter={() => setHoveredRow(row.id)}
                      onMouseLeave={() => setHoveredRow(null)}
                      style={{
                        background: isSelected
                          ? "linear-gradient(135deg, #faf5ff, #eff6ff)"
                          : isHovered
                          ? "#f5f8ff"
                          : index % 2 === 0 ? "#fff" : "#fafbff",
                        borderBottom:"1px solid #f1f5f9",
                        borderLeft: isSelected ? "4px solid #8b5cf6" : "4px solid transparent",
                        cursor:"pointer",
                        transition:"all 0.18s ease",
                      }}
                    >
                      {/* Numéro ligne */}
                      <td style={{ padding:"1rem 1rem", textAlign:"center" }}>
                        <span style={{
                          display:"inline-flex", alignItems:"center", justifyContent:"center",
                          width:"24px", height:"24px", borderRadius:"50%",
                          background: isSelected
                            ? "linear-gradient(135deg, #8b5cf6, #7c3aed)"
                            : "#f1f5f9",
                          color: isSelected ? "#fff" : "#94a3b8",
                          fontSize:"0.72rem", fontWeight:800,
                          transition:"all 0.18s",
                        }}>
                          {lineNum}
                        </span>
                      </td>

                      <td style={{ padding:"1rem 1rem", fontSize:"0.8rem", color:"#64748b", fontFamily:"monospace", whiteSpace:"nowrap" }}>
                        {row.horodatage}
                      </td>

                      <td style={{ padding:"1rem 1rem" }}>
                        <span style={{
                          display:"inline-flex", alignItems:"center", gap:"5px",
                          background:src.bg, color:src.color, border:`1.5px solid ${src.border}`,
                          borderRadius:"8px", padding:"4px 10px",
                          fontSize:"0.72rem", fontWeight:700, letterSpacing:"0.04em",
                        }}>
                          <span style={{ width:"6px", height:"6px", borderRadius:"50%", background:src.dot, boxShadow:`0 0 5px ${src.dot}50` }} />
                          {row.source}
                        </span>
                      </td>

                      <td style={{ padding:"1rem 1rem" }}>
                        <div style={{ display:"flex", alignItems:"center", gap:"0.5rem" }}>
                          <div style={{
                            width:"28px", height:"28px", borderRadius:"50%",
                            background:"linear-gradient(135deg, #e0e7ff, #c7d2fe)",
                            display:"flex", alignItems:"center", justifyContent:"center",
                            fontSize:"0.65rem", fontWeight:800, color:"#4f46e5", flexShrink:0,
                          }}>
                            {row.operateur === "Auto" ? "🤖" : row.operateur.split(" ").map(n=>n[0]).join("")}
                          </div>
                          <span style={{ fontSize:"0.84rem", color:"#1e293b", fontWeight:600 }}>{row.operateur}</span>
                        </div>
                      </td>

                      <td style={{ padding:"1rem 1rem", fontSize:"0.84rem", color:"#64748b" }}>{row.poste}</td>

                      <td style={{ padding:"1rem 1rem" }}>
                        <span style={{
                          fontFamily:"monospace", fontSize:"0.8rem", color:"#475569",
                          background:"#f8faff", border:"1px solid #e2e8f0",
                          borderRadius:"6px", padding:"3px 8px", fontWeight:600,
                        }}>{row.reference}</span>
                      </td>

                      <td style={{ padding:"1rem 1rem", fontSize:"0.85rem", color:"#0f172a", fontWeight:700 }}>
                        {row.valeur}
                      </td>

                      <td style={{ padding:"1rem 1rem" }}>
                        <span style={{
                          display:"inline-flex", alignItems:"center", gap:"5px",
                          background:stat.bg, color:stat.color, border:`1.5px solid ${stat.border}`,
                          borderRadius:"9px", padding:"5px 11px",
                          fontSize:"0.72rem", fontWeight:700,
                          boxShadow:`0 2px 8px ${stat.glow}20`,
                        }}>
                          <span style={{ fontSize:"0.65rem" }}>{stat.icon}</span>
                          {row.statut}
                        </span>
                      </td>

                      <td style={{ padding:"1rem 1rem" }}>
                        <div style={{ display:"flex", gap:"0.4rem", alignItems:"center" }}>
                          <button
                            onClick={e => { e.stopPropagation(); setSelectedRow(row.id); }}
                            title="Voir détails"
                            style={{
                              width:"34px", height:"34px", borderRadius:"10px",
                              border:"1.5px solid #ddd6fe",
                              background:"linear-gradient(135deg, #f5f3ff, #ede9fe)",
                              cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center",
                              boxShadow:"0 2px 6px rgba(139,92,246,0.12)", transition:"all 0.15s",
                            }}
                          ><IconEye /></button>
                          <button
                            onClick={e => { e.stopPropagation(); handlePrintRow(row); }}
                            title="Imprimer cette ligne"
                            style={{
                              width:"34px", height:"34px", borderRadius:"10px",
                              border:"1.5px solid #bfdbfe",
                              background:"linear-gradient(135deg, #eff6ff, #dbeafe)",
                              cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center",
                              boxShadow:"0 2px 6px rgba(59,130,246,0.12)", transition:"all 0.15s",
                            }}
                          ><IconPrintRow /></button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Footer tableau */}
          <div style={{
            padding:"1rem 1.75rem", borderTop:"1.5px solid #f1f5f9",
            background:"#fafbff", display:"flex", alignItems:"center", justifyContent:"space-between",
          }}>
            <span style={{ fontSize:"0.78rem", color:"#94a3b8" }}>
              Affichage de <strong style={{ color:"#475569" }}>{filteredData.length}</strong> enregistrements sur <strong style={{ color:"#475569" }}>{mockData.length}</strong> au total
            </span>
            <div style={{ display:"flex", gap:"0.4rem" }}>
              {[1,2,3].map(p => (
                <button key={p} style={{
                  width:"32px", height:"32px", borderRadius:"9px",
                  border: p===1 ? "none" : "1.5px solid #e2e8f0",
                  background: p===1 ? "linear-gradient(135deg, #2563eb, #3b82f6)" : "#fff",
                  color: p===1 ? "#fff" : "#64748b",
                  fontSize:"0.82rem", fontWeight:700, cursor:"pointer",
                  boxShadow: p===1 ? "0 4px 12px rgba(37,99,235,0.3)" : "none",
                }}>{p}</button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default QueryPage;