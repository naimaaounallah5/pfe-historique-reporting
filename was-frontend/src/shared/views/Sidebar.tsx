import { NavLink, useNavigate } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import { AuthService } from "../../features/authentification/services/Auth.service";
import logo from "../../assets/logo-lmobile.jpg";

const navItems = [
  { label: "Accueil",                path: "/vue-ensemble", icon: "🏠" },
  { label: "Dashboard",              path: "/dashboard",    icon: "📊" },
  { label: "Historique des données", path: "/historique",   icon: "🗂️" },
  { label: "Générateur de rapport",  path: "/rapports",     icon: "📄" },
  { label: "Ordres de production",   path: "/orders",       icon: "📦" },
];

const sources = [
  { label: "SCADA",           color: "#22c55e" },
  { label: "QDC Inspections", color: "#22c55e" },
  { label: "WMS",             color: "#22c55e" },
  { label: "AGV / Forklift",  color: "#22c55e" },
];

const styles = `
  @keyframes bell-shake {
    0%, 50%, 100% { transform: rotate(0deg); }
    10%  { transform: rotate(20deg); }
    20%  { transform: rotate(-20deg); }
    30%  { transform: rotate(15deg); }
    40%  { transform: rotate(-15deg); }
  }
  @keyframes badge-pulse {
    0%, 100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(239,68,68,0.6); }
    50%      { transform: scale(1.2); box-shadow: 0 0 0 6px rgba(239,68,68,0); }
  }
  @keyframes border-glow {
    0%, 100% { box-shadow: 0 0 6px rgba(239,68,68,0.2); border-color: #ef4444; }
    50%      { box-shadow: 0 0 16px rgba(239,68,68,0.6); border-color: #f87171; }
  }
  .bell-icon    { animation: bell-shake 2.5s infinite; display: inline-block; font-size: 14px; }
  .badge-pulse  { animation: badge-pulse 2s infinite; }
  .border-glow  { animation: border-glow 2s infinite; }
`;

const Sidebar = () => {
  const navigate = useNavigate();
  const user = AuthService.getUser();

  const [alertes,      setAlertes]      = useState<any[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const styleEl = document.createElement("style");
    styleEl.innerHTML = styles;
    document.head.appendChild(styleEl);
    return () => { document.head.removeChild(styleEl); };
  }, []);

  useEffect(() => {
    fetch("http://localhost:5088/api/stock/dashboard")
      .then(r => r.json())
      .then(data => {
        const produits = data?.parProduit || data?.produits || [];
        setAlertes(produits.filter((p: any) => p.stockDisponible < 100));
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node))
        setShowDropdown(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleLogout = () => {
    AuthService.logout();
    navigate("/login");
  };

  const allerVersAlertes = () => {
    setShowDropdown(false);
    navigate("/dashboard?tab=stock");
    setTimeout(() => {
      const el = document.getElementById("alertes-stock");
      if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 800);
  };

  return (
    <aside style={{
      width: "230px", minWidth: "230px",
      background: "#1e1e2e", color: "#fff",
      display: "flex", flexDirection: "column",
      padding: "1rem 0", height: "100vh", overflowY: "auto",
    }}>

      {/* Logo */}
      <div style={{
        padding: "0.75rem 1rem 1rem",
        borderBottom: "1px solid #2e2e42",
        marginBottom: "0.5rem",
        display: "flex", alignItems: "center", gap: "0.75rem",
      }}>
        <div style={{
          width: "36px", height: "36px", borderRadius: "8px",
          overflow: "hidden", background: "#fff",
          display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
        }}>
          <img src={logo} alt="L-mobile" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
        </div>
        <div>
          <div style={{ fontWeight: 700, fontSize: "0.9rem" }}>I-mobile</div>
          <div style={{ fontSize: "0.7rem", color: "#888" }}>Historical Data & Reporting</div>
        </div>
      </div>

      {/* Navigation */}
      <div style={{ padding: "0.5rem 1rem 0.25rem", fontSize: "0.68rem", color: "#666", letterSpacing: "0.1em" }}>
        NAVIGATION
      </div>
      <nav style={{ display: "flex", flexDirection: "column", gap: "0.15rem", marginBottom: "0.75rem" }}>
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            style={({ isActive }) => ({
              display: "flex", alignItems: "center", gap: "0.75rem",
              padding: "0.65rem 1rem", textDecoration: "none",
              color: isActive ? "#fff" : "#aaa",
              background: isActive ? "#3b3b5c" : "transparent",
              borderLeft: isActive ? "3px solid #6366f1" : "3px solid transparent",
              borderRadius: "0 8px 8px 0",
              fontWeight: isActive ? 600 : 400,
              fontSize: "0.88rem", transition: "all 0.15s",
            })}
          >
            <span>{item.icon}</span>
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      {/* ── ALERTES STOCK ── */}
      {alertes.length > 0 && (
        <div ref={dropdownRef} style={{ padding: "0 0.75rem", marginBottom: "1rem", position: "relative" }}>

          {/* Bouton principal */}
          <button
            onClick={() => setShowDropdown(v => !v)}
            className="border-glow"
            style={{
              width: "100%", padding: "0.6rem 0.75rem",
              borderRadius: "8px", border: "1px solid #ef4444",
              background: showDropdown ? "#3d2020" : "#2a1f1f",
              display: "flex", alignItems: "center", justifyContent: "space-between",
              cursor: "pointer", transition: "background 0.15s",
            }}
            onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.background = "#3d2020"}
            onMouseLeave={e => { if (!showDropdown) (e.currentTarget as HTMLButtonElement).style.background = "#2a1f1f"; }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <span className="bell-icon">🔔</span>
              <span style={{ color: "#f87171", fontSize: "0.82rem", fontWeight: 600 }}>Alertes Stock</span>
            </div>
            <div
              className="badge-pulse"
              style={{
                background: "#ef4444", color: "white",
                fontSize: "0.65rem", fontWeight: 700,
                minWidth: "20px", height: "20px", borderRadius: "10px",
                display: "flex", alignItems: "center", justifyContent: "center", padding: "0 5px",
              }}
            >
              {alertes.length}
            </div>
          </button>

          {/* Dropdown */}
          {showDropdown && (
            <div style={{
              position: "absolute", left: "0.75rem", right: "0.75rem",
              top: "calc(100% + 4px)", zIndex: 100,
              background: "#1a1f2e", border: "1px solid #2d3748",
              borderRadius: "12px", overflow: "hidden",
              boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
            }}>
              {/* Header */}
              <div style={{
                padding: "12px 14px",
                display: "flex", alignItems: "center", gap: "6px",
              }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#f87171" strokeWidth="2">
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                  <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
                </svg>
                <span style={{ color: "white", fontSize: "0.75rem", fontWeight: 600 }}>Alertes stock</span>
                <span style={{
                  background: "#3d1515", color: "#f87171",
                  fontSize: "0.62rem", fontWeight: 700,
                  padding: "1px 6px", borderRadius: "10px", border: "1px solid #5c1e1e",
                }}>
                  {alertes.length} produits
                </span>
              </div>

              {/* Bouton Voir tout */}
              <div style={{ padding: "0 10px 10px" }}>
                <button
                  onClick={allerVersAlertes}
                  style={{
                    width: "100%", padding: "10px",
                    background: "#ef4444", border: "none",
                    borderRadius: "8px", color: "white",
                    fontSize: "0.75rem", fontWeight: 600, cursor: "pointer",
                    display: "flex", alignItems: "center", justifyContent: "center", gap: "6px",
                    transition: "background 0.15s",
                  }}
                  onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.background = "#b91c1c"}
                  onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.background = "#ef4444"}
                >
                  Voir le tableau stock complet ↓
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Sources de données */}
      <div style={{ padding: "0.5rem 1rem 0.25rem", fontSize: "0.68rem", color: "#666", letterSpacing: "0.1em" }}>
        SOURCES DE DONNÉES
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: "0.1rem", padding: "0 0.5rem" }}>
        {sources.map((src) => (
          <div key={src.label} style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            padding: "0.45rem 0.75rem", borderRadius: "8px", fontSize: "0.83rem", color: "#ccc",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: src.color, display: "inline-block" }} />
              {src.label}
            </div>
            <span style={{
              fontSize: "0.62rem", background: "#22c55e22",
              color: "#22c55e", padding: "1px 6px",
              borderRadius: "4px", fontWeight: 700, letterSpacing: "0.05em",
            }}>ON</span>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div style={{ marginTop: "auto", padding: "1rem", borderTop: "1px solid #2e2e42" }}>
        {user && (
          <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", marginBottom: "0.75rem" }}>
            <div style={{
              width: "32px", height: "32px", borderRadius: "50%",
              background: "#6366f1", display: "flex", alignItems: "center",
              justifyContent: "center", fontSize: "0.8rem", fontWeight: 700,
              color: "#fff", flexShrink: 0,
            }}>
              {user.prenom[0]}{user.nom[0]}
            </div>
            <div>
              <div style={{ fontSize: "0.8rem", fontWeight: 600, color: "#ddd" }}>{user.prenom} {user.nom}</div>
              <div style={{ fontSize: "0.65rem", color: "#888" }}>{user.role}</div>
            </div>
          </div>
        )}
        <button
          onClick={handleLogout}
          style={{
            width: "100%", padding: "0.55rem",
            background: "transparent", border: "1px solid #ef4444",
            borderRadius: "8px", color: "#ef4444",
            fontSize: "0.8rem", fontWeight: 600, cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center",
            gap: "0.5rem", transition: "all 0.2s",
          }}
          onMouseEnter={e => { e.currentTarget.style.background = "#ef4444"; e.currentTarget.style.color = "#fff"; }}
          onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#ef4444"; }}
        >
          🚪 Se déconnecter
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;