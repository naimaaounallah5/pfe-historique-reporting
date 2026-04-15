import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import logo from "../../../assets/logo-lmobile.jpg";
import { AuthService } from "../../authentification/services/Auth.service";

const modules = [
  {
    id: "01",
    title: "Dashboard ",
    description: "Vue consolidée de toute la production. KPIs Achats, Ventes, Production, Qualité et Stock avec graphiques de tendance et exports PDF.",
    tags: ["KPIs", "Graphiques","temps réel"],
    path: "/dashboard",
    gradient: "linear-gradient(135deg,#1d4ed8 0%,#3b82f6 100%)",
    clair: "#eff6ff",
    titleColor: "#1d4ed8",
    tagBg: "#dbeafe",
    tagColor: "#1e40af",
    icon: "📊",
    accent: "#3b82f6",
    glow: "rgba(59,130,246,0.18)",
  },
  {
    id: "02",
    title: "Historique des données",
    description: "Consultez l'historique complet SCADA, WMS, QDC Inspections et AGV/Telemetry.",
    tags: ["SCADA", "WMS", "QDC ","AGV","temps réel"],
    path: "/historique",
    gradient: "linear-gradient(135deg,#6d28d9 0%,#8b5cf6 100%)",
    clair: "#f5f3ff",
    titleColor: "#6d28d9",
    tagBg: "#ede9fe",
    tagColor: "#5b21b6",
    icon: "🗄️",
    accent: "#8b5cf6",
    glow: "rgba(139,92,246,0.18)",
  },
  {
    id: "03",
    title: "Générateur de rapport",
    description: "Créez des rapports PDF ou Excel professionnels. Consultez, envoyez par email et gérez tous vos rapports Production, Qualité, Stock et Maintenance.",
    tags: ["PDF", "Excel","temps réel"],
    path: "/rapports",
    gradient: "linear-gradient(135deg,#047857 0%,#10b981 100%)",
    clair: "#ecfdf5",
    titleColor: "#047857",
    tagBg: "#d1fae5",
    tagColor: "#065f46",
    icon: "📄",
    accent: "#10b981",
    glow: "rgba(16,185,129,0.18)",
  },
  {
    id: "04",
    title: "Ordres de production",
    description: "Consultez tous les ordres de fabrication avec statut en temps réel, opérateur, lignes, composants et opérations. Export PDF et Excel disponibles.",
    tags: ["temps réel"],
    path: "/orders",
    gradient: "linear-gradient(135deg,#c2410c 0%,#f97316 100%)",
    clair: "#fff7ed",
    titleColor: "#c2410c",
    tagBg: "#ffedd5",
    tagColor: "#9a3412",
    icon: "🏭",
    accent: "#f97316",
    glow: "rgba(249,115,22,0.18)",
  },
];

const VueEnsemblePages = () => {
  const navigate = useNavigate();
  const [currentDate, setCurrentDate] = useState("");
  const [hovered,     setHovered]     = useState<string | null>(null);

  const user       = AuthService.getUser();
  const nomComplet = user ? `${user.prenom} ${user.nom}` : "Administrateur";
  const initiale   = user?.prenom?.charAt(0).toUpperCase() ?? "A";

  useEffect(() => {
    const update = () => {
      const now  = new Date();
      const date = now.toLocaleDateString("fr-FR", { day:"2-digit", month:"2-digit", year:"numeric" });
      const time = now.toLocaleTimeString("fr-FR", { hour:"2-digit", minute:"2-digit" });
      setCurrentDate(`${date} · ${time}`);
    };
    update();
    const id = setInterval(update, 60000);
    return () => clearInterval(id);
  }, []);

  return (
    <div style={{
      padding: 24, maxWidth: 1200, margin: "0 auto",
      fontFamily: "'Inter',-apple-system,BlinkMacSystemFont,sans-serif",
      background: "#f8fafc", minHeight: "100vh",
    }}>

      {/* ── HERO ── */}
      <div style={{
        background: "linear-gradient(135deg,#0f172a 0%,#1e3a8a 45%,#2563eb 100%)",
        borderRadius: 24, padding: "32px 36px", marginBottom: 28,
        position: "relative", overflow: "hidden",
        boxShadow: "0 20px 60px rgba(37,99,235,0.28),0 4px 16px rgba(37,99,235,0.15)",
      }}>
        {/* Cercles déco */}
        <div style={{ position:"absolute",top:-80,right:-80,width:280,height:280,borderRadius:"50%",background:"rgba(255,255,255,0.06)",pointerEvents:"none" }} />
        <div style={{ position:"absolute",bottom:-50,left:"30%",width:200,height:200,borderRadius:"50%",background:"rgba(255,255,255,0.04)",pointerEvents:"none" }} />
        <div style={{ position:"absolute",top:20,left:"55%",width:100,height:100,borderRadius:"50%",background:"rgba(255,255,255,0.03)",pointerEvents:"none" }} />

        <div style={{ display:"flex",alignItems:"center",gap:28,position:"relative",zIndex:1,flexWrap:"wrap" }}>

          {/* Logo */}
          <div style={{
            width:80,height:80,borderRadius:20,overflow:"hidden",
            background:"#fff",display:"flex",alignItems:"center",justifyContent:"center",
            flexShrink:0,
            boxShadow:"0 8px 32px rgba(0,0,0,0.25),0 0 0 4px rgba(255,255,255,0.15)",
          }}>
            <img src={logo} alt="L-mobile" style={{ width:"88%",height:"88%",objectFit:"contain" }} />
          </div>

          {/* Texte central */}
          <div style={{ flex:1,minWidth:280 }}>
            <div style={{ display:"flex",alignItems:"center",gap:8,marginBottom:12,flexWrap:"wrap" }}>
        
              <span style={{
                display:"inline-flex",alignItems:"center",gap:5,
                background:"rgba(16,185,129,0.25)",border:"1px solid rgba(16,185,129,0.4)",
                borderRadius:20,padding:"4px 12px",fontSize:11,
                color:"#a7f3d0",fontWeight:700,letterSpacing:"0.06em",
              }}>
                <span style={{
                  width:6,height:6,borderRadius:"50%",background:"#34d399",
                  display:"inline-block",animation:"pulse 1.5s infinite",
                }} />
                LIVE
              </span>
            </div>

            <h1 style={{
              margin:"0 0 8px",fontSize:26,fontWeight:900,
              color:"#fff",letterSpacing:"-0.04em",
              textShadow:"0 2px 12px rgba(0,0,0,0.2)",
            }}>
              Historical Data & Reporting
            </h1>

            <p style={{
              color:"rgba(255,255,255,0.78)",fontSize:13.5,
              margin:"0 0 18px",lineHeight:1.7,maxWidth:560,
            }}>
              Bienvenue dans le module{" "}
              <strong style={{ color:"#fff" }}>Historical Data & Reporting</strong>.
              Ce module centralise toutes les données de production (SCADA, QDC, WMS, AGV).
              Elle vous permet de visualiser le Dashboard, de consulter l'historique des données, de générer des rapports PDF/Excel et de gérer les ordres de production.
              {/*et suivez les alertes — le tout conforme ISO 9001.*/ }
            </p>

            {/* Chips */}
            <div style={{ display:"flex",gap:8,flexWrap:"wrap" }}>
              {[
                { dot:"#86efac", text:`Date: ${currentDate}` },
                { icon:"📡",     text:"4 sources connectées" },
            
              ].map((b,i) => (
                <div key={i} style={{
                  display:"inline-flex",alignItems:"center",gap:6,
                  background:"rgba(255,255,255,0.12)",border:"1px solid rgba(255,255,255,0.2)",
                  borderRadius:12,padding:"6px 14px",fontSize:12,color:"#fff",fontWeight:600,
                }}>
                  {b.dot
                    ? <span style={{ width:7,height:7,borderRadius:"50%",background:b.dot,display:"inline-block" }} />
                    : <span style={{ fontSize:13 }}>{b.icon}</span>}
                  {b.text}
                </div>
              ))}
            </div>
          </div>

          {/* Admin */}
          <div style={{ textAlign:"right",flexShrink:0 }}>
            <div style={{ display:"flex",alignItems:"center",gap:10,justifyContent:"flex-end",marginBottom:8 }}>
              <div style={{
                width:42,height:42,borderRadius:"50%",
                background:"rgba(255,255,255,0.2)",
                display:"flex",alignItems:"center",justifyContent:"center",
                fontSize:16,fontWeight:800,color:"#fff",
                boxShadow:"0 0 0 3px rgba(255,255,255,0.25)",
              }}>
                {initiale}
              </div>
              <div>
                <div style={{ color:"#fff",fontWeight:700,fontSize:14 }}>{nomComplet}</div>
                
              </div>
            </div>
            <span style={{
              display:"inline-block",
              background:"rgba(255,255,255,0.15)",border:"1px solid rgba(255,255,255,0.2)",
              borderRadius:8,padding:"3px 12px",fontSize:11,
              color:"rgba(255,255,255,0.85)",fontWeight:700,
            }}>
              {user?.role ?? "ADMIN"}
            </span>
          </div>

        </div>
      </div>

      {/* ── TITRE SECTION ── */}
      <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:20 }}>
        <div>
          <h2 style={{ margin:0,fontSize:18,fontWeight:800,color:"#0f172a" }}>
            Modules disponibles
          </h2>
          <p style={{ margin:"4px 0 0",fontSize:13,color:"#94a3b8" }}>
            Cliquez sur une interface pour y accéder directement
          </p>
        </div>
        <span style={{
          background:"linear-gradient(135deg,#eff6ff,#dbeafe)",
          border:"1px solid #bfdbfe",borderRadius:10,
          padding:"6px 16px",fontSize:12,color:"#1d4ed8",fontWeight:700,
        }}>
          {modules.length} modules actifs
        </span>
      </div>

      {/* ── GRILLE MODULES ── */}
      <div style={{ display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:20 }}>
        {modules.map((mod) => (
          <div
            key={mod.id}
            onClick={() => navigate(mod.path)}
            onMouseEnter={() => setHovered(mod.id)}
            onMouseLeave={() => setHovered(null)}
            style={{
              background:"#fff",borderRadius:20,overflow:"hidden",cursor:"pointer",
              border: hovered===mod.id ? `2px solid ${mod.accent}` : "2px solid transparent",
              boxShadow: hovered===mod.id
                ? `0 16px 48px ${mod.glow},0 4px 16px rgba(0,0,0,0.08)`
                : "0 2px 12px rgba(0,0,0,0.07)",
              transform: hovered===mod.id ? "translateY(-5px) scale(1.01)" : "translateY(0) scale(1)",
              transition:"all 0.22s cubic-bezier(0.4,0,0.2,1)",
            }}
          >
            {/* Bande colorée */}
            <div style={{
              background:mod.gradient,padding:"18px 22px",
              display:"flex",alignItems:"center",justifyContent:"space-between",
              position:"relative",overflow:"hidden",
            }}>
              <div style={{
                position:"absolute",top:-30,right:-30,width:120,height:120,
                borderRadius:"50%",background:"rgba(255,255,255,0.08)",pointerEvents:"none",
              }} />
              <div style={{
                width:48,height:48,borderRadius:14,
                background:"rgba(255,255,255,0.22)",
                display:"flex",alignItems:"center",justifyContent:"center",
                fontSize:22,boxShadow:"0 4px 12px rgba(0,0,0,0.15)",
              }}>
                {mod.icon}
              </div>
              <span style={{
                fontSize:52,fontWeight:900,color:"rgba(255,255,255,0.18)",
                lineHeight:1,letterSpacing:"-0.04em",fontFamily:"monospace",
              }}>
                {mod.id}
              </span>
            </div>

            {/* Contenu */}
            <div style={{ padding:"20px 22px" }}>
              <h3 style={{ color:mod.titleColor,fontWeight:800,margin:"0 0 8px",fontSize:15 }}>
                {mod.title}
              </h3>
              <p style={{ color:"#64748b",fontSize:13,marginBottom:14,lineHeight:1.65 }}>
                {mod.description}
              </p>

              {/* Tags */}
              <div style={{ display:"flex",gap:6,flexWrap:"wrap",marginBottom:16 }}>
                {mod.tags.map(tag => (
                  <span key={tag} style={{
                    background:mod.tagBg,border:`1px solid ${mod.accent}25`,
                    borderRadius:8,padding:"4px 10px",
                    fontSize:11,color:mod.tagColor,fontWeight:700,
                  }}>
                    {tag}
                  </span>
                ))}
              </div>

              {/* Footer */}
              <div style={{
                display:"flex",alignItems:"center",justifyContent:"space-between",
                paddingTop:14,borderTop:`1px solid ${mod.clair}`,
              }}>
                <span style={{
                  color:mod.titleColor,fontWeight:700,fontSize:13,
                  display:"flex",alignItems:"center",gap:6,
                }}>
                  Accéder au module
                  <span style={{
                    display:"inline-flex",alignItems:"center",justifyContent:"center",
                    width:24,height:24,borderRadius:"50%",
                    background:mod.gradient,color:"#fff",fontSize:12,
                    boxShadow:`0 4px 10px ${mod.glow}`,
                    transform: hovered===mod.id ? "translateX(4px)" : "translateX(0)",
                    transition:"transform 0.2s",
                  }}>→</span>
                </span>
                <span style={{
                  fontSize:11,color:"#94a3b8",background:"#f8fafc",
                  borderRadius:8,padding:"3px 10px",border:"1px solid #e2e8f0",
                }}>
                  Module {mod.id}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.4}}`}</style>
    </div>
  );
};

export default VueEnsemblePages;