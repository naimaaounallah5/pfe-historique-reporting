import React from "react";
import logoLmobile from "../../../assets/logo-lmobile.jpg";
import { useLoginViewModel } from "../../authentification/viewmodels/Login.viewmodel";

export default function LoginPage() {
  const vm = useLoginViewModel();
  const {
    state, mounted, focused, isValid,
    onIdentifiantChange, onPasswordChange,
    onTogglePassword, onFocus, onBlur, onSubmit,
  } = vm;

  const inputStyle = (field: string): React.CSSProperties => ({
    width: "100%",
    boxSizing: "border-box",
    padding: "15px 50px 15px 22px",
    background: focused === field
      ? "rgba(59,130,246,0.07)"
      : "rgba(255,255,255,0.85)",
    border: `1.5px solid ${focused === field ? "#3b82f6" : "rgba(203,213,225,0.8)"}`,
    borderRadius: "16px",
    color: "#1e293b",
    fontSize: "15px",
    outline: "none",
    transition: "all 0.3s ease",
    caretColor: "#3b82f6",
    fontFamily: "inherit",
    letterSpacing: field === "pwd" && !state.showPassword ? "5px" : "0.3px",
    boxShadow: focused === field ? "0 0 0 4px rgba(59,130,246,0.12), 0 4px 16px rgba(59,130,246,0.10)" : "0 2px 8px rgba(0,0,0,0.06)",
  });

  return (
    <div style={{
      minHeight: "100vh",
      /* Ciel bleu dégradé de haut en bas */
      background: "linear-gradient(180deg, #bae6fd 0%, #7dd3fc 20%, #38bdf8 40%, #0ea5e9 60%, #0284c7 80%, #0369a1 100%)",
      display: "flex", alignItems: "center", justifyContent: "center",
      fontFamily: "'Segoe UI', sans-serif",
      position: "relative", overflow: "hidden",
    }}>

      {/* Nuages blancs flottants */}
      {[
        { top: "8%",  left: "5%",  w: "180px", h: "55px",  delay: "0s",   dur: "20s" },
        { top: "18%", left: "60%", w: "220px", h: "65px",  delay: "-8s",  dur: "25s" },
        { top: "5%",  left: "35%", w: "150px", h: "45px",  delay: "-4s",  dur: "18s" },
        { top: "30%", left: "75%", w: "130px", h: "40px",  delay: "-12s", dur: "22s" },
        { top: "40%", left: "-2%", w: "160px", h: "50px",  delay: "-6s",  dur: "28s" },
      ].map((c, i) => (
        <div key={i} style={{
          position: "absolute", top: c.top, left: c.left,
          width: c.w, height: c.h,
          background: "rgba(255,255,255,0.75)",
          borderRadius: "50px",
          filter: "blur(6px)",
          animation: `cloudFloat ${c.dur} linear infinite`,
          animationDelay: c.delay,
          boxShadow: "0 4px 20px rgba(255,255,255,0.4)",
        }} />
      ))}

      {/* Reflets lumineux sur l'eau en bas */}
      <div style={{
        position: "absolute", bottom: 0, left: 0, right: 0, height: "200px",
        background: "linear-gradient(180deg, transparent 0%, rgba(255,255,255,0.15) 50%, rgba(255,255,255,0.25) 100%)",
        backgroundImage: `repeating-linear-gradient(
          90deg,
          transparent,
          transparent 40px,
          rgba(255,255,255,0.08) 40px,
          rgba(255,255,255,0.08) 41px
        )`,
        animation: "shimmerWater 4s ease-in-out infinite",
      }} />

      {/* Particules lumineuses (bulles d'air) */}
      {Array.from({ length: 18 }).map((_, i) => (
        <div key={i} style={{
          position: "absolute",
          left: `${(i * 71 + 13) % 100}%`,
          top: `${(i * 43 + 9) % 100}%`,
          width: `${(i % 3) + 3}px`,
          height: `${(i % 3) + 3}px`,
          borderRadius: "50%",
          background: "rgba(255,255,255,0.85)",
          opacity: 0.4 + (i % 5) * 0.08,
          animation: `floatUp ${10 + (i % 10)}s linear infinite`,
          animationDelay: `${-(i * 1.5)}s`,
          boxShadow: `0 0 ${6 + (i % 4)}px rgba(255,255,255,0.8)`,
        }} />
      ))}

      {/* Beam horizontal lumineux */}
      <div style={{
        position: "absolute", top: "25%", left: "-5%", width: "110%", height: "1px",
        background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.5), rgba(255,255,255,0.8), rgba(255,255,255,0.5), transparent)",
        animation: "beamPulse 6s ease-in-out infinite",
      }} />
      <div style={{
        position: "absolute", top: "65%", left: "-5%", width: "110%", height: "1px",
        background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.3), rgba(255,255,255,0.6), rgba(255,255,255,0.3), transparent)",
        animation: "beamPulse 8s ease-in-out infinite reverse",
      }} />

      {/* CARD */}
      <div style={{
        position: "relative", zIndex: 10,
        width: "460px", maxWidth: "94vw",
        opacity: mounted ? 1 : 0,
        transform: mounted ? "translateY(0) scale(1)" : "translateY(40px) scale(0.94)",
        transition: "all 0.9s cubic-bezier(0.16,1,0.3,1)",
      }}>

        {/* Halo extérieur blanc-bleu */}
        <div style={{
          position: "absolute", inset: "-4px", borderRadius: "30px",
          background: "linear-gradient(135deg, #ffffff, #bae6fd, #7dd3fc, #ffffff, #e0f2fe)",
          backgroundSize: "400% 400%",
          filter: "blur(3px)",
          animation: "borderRotate 5s linear infinite",
          opacity: 0.85,
        }} />

        {/* Halo intérieur glow */}
        <div style={{
          position: "absolute", inset: "-1px", borderRadius: "28px",
          boxShadow: "0 0 40px rgba(255,255,255,0.50), 0 0 80px rgba(14,165,233,0.20)",
        }} />

        <div style={{
          position: "relative",
          background: "linear-gradient(160deg, rgba(255,255,255,0.97) 0%, rgba(240,249,255,0.98) 100%)",
          borderRadius: "27px",
          border: "1px solid rgba(255,255,255,0.90)",
          padding: "36px 46px 32px",
          boxShadow: "0 30px 80px rgba(2,132,199,0.25), inset 0 1px 0 rgba(255,255,255,1), 0 4px 24px rgba(0,0,0,0.10)",
        }}>

          {/* Top glow line bleu ciel */}
          <div style={{
            position: "absolute", top: 0, left: "15%", width: "70%", height: "2px",
            background: "linear-gradient(90deg, transparent, #7dd3fc, #38bdf8, #0ea5e9, transparent)",
            borderRadius: "0 0 6px 6px",
            animation: "shimmerLine 2s ease-in-out infinite",
            boxShadow: "0 0 16px rgba(56,189,248,0.6)",
          }} />

          {/* Coins décoratifs bleu ciel */}
          {[
            { top: "16px", left: "16px", borderTop: "2px solid #38bdf8", borderLeft: "2px solid #38bdf8" },
            { top: "16px", right: "16px", borderTop: "2px solid #38bdf8", borderRight: "2px solid #38bdf8" },
            { bottom: "16px", left: "16px", borderBottom: "2px solid #0ea5e9", borderLeft: "2px solid #0ea5e9" },
            { bottom: "16px", right: "16px", borderBottom: "2px solid #0ea5e9", borderRight: "2px solid #0ea5e9" },
          ].map((s, i) => (
            <div key={i} style={{ position: "absolute", width: "18px", height: "18px", borderRadius: "2px", ...s }} />
          ))}

          {/* LOGO — agrandi */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: "20px" }}>
            <div style={{ position: "relative", width: "110px", height: "110px", marginBottom: "14px" }}>
              {/* Anneau 1 */}
              <div style={{
                position: "absolute", inset: "-14px", borderRadius: "50%",
                border: "2px solid transparent",
                borderTopColor: "#38bdf8", borderRightColor: "rgba(56,189,248,0.2)",
                animation: "spin 2.5s linear infinite",
                boxShadow: "0 0 22px rgba(56,189,248,0.5)",
              }} />
              {/* Anneau 2 */}
              <div style={{
                position: "absolute", inset: "-22px", borderRadius: "50%",
                border: "1.5px solid transparent",
                borderBottomColor: "#0ea5e9", borderLeftColor: "rgba(14,165,233,0.3)",
                animation: "spin 4s linear infinite reverse",
              }} />
              {/* Anneau 3 */}
              <div style={{
                position: "absolute", inset: "-30px", borderRadius: "50%",
                border: "1px solid transparent",
                borderTopColor: "rgba(186,230,253,0.7)", borderRightColor: "rgba(186,230,253,0.2)",
                animation: "spin 7s linear infinite",
              }} />
              <div style={{
                width: "110px", height: "110px",
                background: "linear-gradient(145deg, #ffffff, #e0f2fe)",
                borderRadius: "28px",
                display: "flex", alignItems: "center", justifyContent: "center",
                boxShadow: "0 20px 50px rgba(14,165,233,0.30), 0 4px 20px rgba(0,0,0,0.10)",
                overflow: "hidden",
              }}>
                <img src={logoLmobile} alt="L-Mobile"
                  style={{ width: "110px", height: "110px", objectFit: "contain" }} />
              </div>
            </div>

            <div style={{
              fontSize: "10px", fontWeight: "800", letterSpacing: "4px",
              textTransform: "uppercase", marginBottom: "10px",
              background: "linear-gradient(90deg, #0284c7, #0ea5e9, #0284c7)",
              backgroundSize: "200%",
              WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
              animation: "gradientShift 3s ease infinite",
            }}>
              L-Mobile Enterprise
            </div>

            <h1 style={{
              margin: "0 0 2px 0", fontSize: "30px", fontWeight: "900",
              textAlign: "center", letterSpacing: "-0.5px",
              background: "linear-gradient(180deg, #0c4a6e 0%, #075985 100%)",
              WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
            }}>
              Historical Data
            </h1>
            <h2 style={{
              margin: "0 0 10px 0", fontSize: "24px", fontWeight: "700", textAlign: "center",
              background: "linear-gradient(90deg, #0284c7, #0ea5e9, #38bdf8, #0ea5e9)",
              backgroundSize: "300%",
              WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
              animation: "gradientShift 4s ease infinite",
            }}>&amp; Reporting</h2>

            <div style={{
              fontSize: "12.5px", textAlign: "center", fontStyle: "italic", fontWeight: "600",
              background: "linear-gradient(90deg, #0369a1, #0ea5e9, #38bdf8)",
              WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
              letterSpacing: "0.4px",
              filter: "drop-shadow(0 0 6px rgba(14,165,233,0.2))",
            }}>
              "Transformez vos données en décisions intelligentes"
            </div>

            <div style={{ marginTop: "10px", display: "flex", alignItems: "center", gap: "12px", width: "100%" }}>
              <div style={{ flex: 1, height: "1px", background: "linear-gradient(90deg, transparent, rgba(14,165,233,0.5))" }} />
              <div style={{
                width: "8px", height: "8px", borderRadius: "50%",
                background: "#38bdf8", boxShadow: "0 0 12px #38bdf8, 0 0 24px rgba(56,189,248,0.4)",
                animation: "dotPulse 2s ease-in-out infinite",
              }} />
              <div style={{ flex: 1, height: "1px", background: "linear-gradient(90deg, rgba(14,165,233,0.5), transparent)" }} />
            </div>
          </div>

          {/* ERROR */}
          {state.error && (
            <div style={{
              background: "rgba(254,226,226,0.9)", border: "1px solid rgba(252,165,165,0.8)",
              borderRadius: "14px", padding: "12px 18px", color: "#dc2626",
              fontSize: "13px", marginBottom: "20px",
              display: "flex", alignItems: "center", gap: "8px",
              animation: "shakeX 0.4s ease",
              boxShadow: "0 4px 16px rgba(220,38,38,0.08)",
            }}>⚠️ {state.error}</div>
          )}

          {/* SUCCESS */}
          {state.success && (
            <div style={{
              background: "rgba(240,253,244,0.9)", border: "1px solid rgba(134,239,172,0.8)",
              borderRadius: "14px", padding: "12px 18px", color: "#16a34a",
              fontSize: "13px", marginBottom: "20px",
              display: "flex", alignItems: "center", gap: "8px",
              boxShadow: "0 4px 16px rgba(22,163,74,0.08)",
            }}>✅ Connexion réussie ! Redirection...</div>
          )}

          {/* IDENTIFIANT */}
          <div style={{ marginBottom: "16px" }}>
            <label style={{
              display: "flex", alignItems: "center", gap: "8px",
              fontSize: "11px", fontWeight: "800",
              color: focused === "id" ? "#0ea5e9" : "#64748b",
              textTransform: "uppercase", letterSpacing: "1.5px",
              marginBottom: "10px", transition: "color 0.2s",
            }}>
              <span>👤</span> Identifiant
            </label>
            <div style={{ position: "relative" }}>
              <input
                type="text"
                value={state.identifiant}
                onChange={e => onIdentifiantChange(e.target.value)}
                onFocus={() => onFocus("id")}
                onBlur={onBlur}
                onKeyDown={e => e.key === "Enter" && onSubmit()}
                placeholder="Votre identifiant"
                style={inputStyle("id")}
              />
              {focused === "id" && (
                <div style={{
                  position: "absolute", bottom: "-1px", left: "8%", width: "84%", height: "2px",
                  background: "linear-gradient(90deg, transparent, #7dd3fc, #38bdf8, #7dd3fc, transparent)",
                  animation: "slideIn 0.3s ease",
                  boxShadow: "0 0 10px rgba(56,189,248,0.6)",
                }} />
              )}
            </div>
          </div>

          {/* MOT DE PASSE */}
          <div style={{ marginBottom: "24px" }}>
            <label style={{
              display: "flex", alignItems: "center", gap: "8px",
              fontSize: "11px", fontWeight: "800",
              color: focused === "pwd" ? "#0284c7" : "#64748b",
              textTransform: "uppercase", letterSpacing: "1.5px",
              marginBottom: "10px", transition: "color 0.2s",
            }}>
              <span>🔒</span> Mot de passe
            </label>
            <div style={{ position: "relative" }}>
              <input
                type={state.showPassword ? "text" : "password"}
                value={state.password}
                onChange={e => onPasswordChange(e.target.value)}
                onFocus={() => onFocus("pwd")}
                onBlur={onBlur}
                onKeyDown={e => e.key === "Enter" && onSubmit()}
                placeholder="••••••••••••"
                style={inputStyle("pwd")}
              />
              {focused === "pwd" && (
                <div style={{
                  position: "absolute", bottom: "-1px", left: "8%", width: "84%", height: "2px",
                  background: "linear-gradient(90deg, transparent, #0ea5e9, #38bdf8, #0ea5e9, transparent)",
                  animation: "slideIn 0.3s ease",
                  boxShadow: "0 0 10px rgba(14,165,233,0.6)",
                }} />
              )}
              <button onClick={onTogglePassword} style={{
                position: "absolute", right: "16px", top: "50%",
                transform: "translateY(-50%)",
                background: "none", border: "none",
                color: "#94a3b8", cursor: "pointer",
                fontSize: "18px", padding: "4px",
                transition: "color 0.2s, transform 0.2s",
              }}>
                {state.showPassword ? "🙈" : "👁"}
              </button>
            </div>
          </div>

          {/* BOUTON */}
          <button
            onClick={onSubmit}
            disabled={!isValid || state.loading}
            style={{
              width: "100%", padding: "17px",
              background: !isValid || state.loading
                ? "rgba(226,232,240,0.8)"
                : "linear-gradient(135deg, #0369a1 0%, #0284c7 50%, #0ea5e9 100%)",
              border: !isValid || state.loading
                ? "1px solid rgba(203,213,225,0.8)"
                : "1px solid rgba(56,189,248,0.5)",
              borderRadius: "16px",
              color: !isValid || state.loading ? "#94a3b8" : "white",
              fontSize: "16px", fontWeight: "800",
              cursor: !isValid || state.loading ? "not-allowed" : "pointer",
              boxShadow: isValid && !state.loading
                ? "0 10px 40px rgba(2,132,199,0.45), 0 4px 16px rgba(14,165,233,0.25), inset 0 1px 0 rgba(255,255,255,0.25)"
                : "none",
              transition: "all 0.3s",
              position: "relative", overflow: "hidden",
              display: "flex", alignItems: "center",
              justifyContent: "center", gap: "10px",
              letterSpacing: "0.5px",
            }}
          >
            {isValid && !state.loading && (
              <div style={{
                position: "absolute", inset: 0,
                background: "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.18) 50%, transparent 100%)",
                backgroundSize: "200% 100%",
                animation: "shimmerBtn 1.8s linear infinite",
              }} />
            )}
            {isValid && !state.loading && (
              <div style={{
                position: "absolute", top: 0, left: "20%", width: "60%", height: "1px",
                background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.7), transparent)",
              }} />
            )}
            {state.loading ? (
              <>
                <div style={{
                  width: "20px", height: "20px",
                  border: "2.5px solid rgba(255,255,255,0.3)",
                  borderTopColor: "white", borderRadius: "50%",
                  animation: "spin 0.7s linear infinite",
                }} />
                Authentification en cours...
              </>
            ) : (
              <><span>🔐</span> Se connecter →</>
            )}
          </button>

          {/* Footer */}
          <div style={{ marginTop: "22px", display: "flex", flexDirection: "column", alignItems: "center", gap: "6px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <div style={{
                width: "8px", height: "8px", borderRadius: "50%",
                background: "#38bdf8",
                boxShadow: "0 0 10px #38bdf8, 0 0 20px rgba(56,189,248,0.4)",
                animation: "dotPulse 2s ease-in-out infinite",
              }} />
              <span style={{ fontSize: "11.5px", fontWeight: "600", color: "#64748b" }}>
                Connexion sécurisée — Accès réservé aux utilisateurs autorisés
              </span>
            </div>
            <span style={{
              fontSize: "11px", fontWeight: "500",
              background: "linear-gradient(90deg, rgba(2,132,199,0.9), rgba(14,165,233,0.9))",
              WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
            }}>
              L-Mobile 2026 · Historical Data &amp; Reporting 
            </span>
          </div>
        </div>
      </div>

      <style>{`
        * { box-sizing: border-box; }
        input::placeholder { color: rgba(148,163,184,0.70); }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes gridDrift { to { transform: translateY(55px); } }
        @keyframes floatUp { 0%{transform:translateY(0) scale(1);opacity:0.5} 100%{transform:translateY(-100vh) scale(0.5);opacity:0} }
        @keyframes beamPulse { 0%,100%{opacity:.10;transform:scaleY(1)} 50%{opacity:0.8;transform:scaleY(2)} }
        @keyframes shimmerLine { 0%,100%{opacity:.5;transform:scaleX(0.8)} 50%{opacity:1;transform:scaleX(1)} }
        @keyframes gradientShift { 0%,100%{background-position:0%} 50%{background-position:100%} }
        @keyframes dotPulse { 0%,100%{transform:scale(1);opacity:1} 50%{transform:scale(1.8);opacity:.5} }
        @keyframes slideIn { from{transform:scaleX(0);opacity:0} to{transform:scaleX(1);opacity:1} }
        @keyframes shakeX { 0%,100%{transform:translateX(0)} 20%{transform:translateX(-8px)} 40%{transform:translateX(8px)} 60%{transform:translateX(-5px)} 80%{transform:translateX(5px)} }
        @keyframes breathe { 0%,100%{transform:scale(1)} 50%{transform:scale(1.12)} }
        @keyframes borderRotate { 0%{background-position:0% 50%} 50%{background-position:100% 50%} 100%{background-position:0% 50%} }
        @keyframes shimmerBtn { 0%{background-position:200% 0} 100%{background-position:-200% 0} }
        @keyframes linePulse { 0%,100%{opacity:0} 50%{opacity:1} }
        @keyframes cloudFloat { 0%{transform:translateX(-120%)} 100%{transform:translateX(110vw)} }
        @keyframes shimmerWater { 0%,100%{opacity:0.6} 50%{opacity:1} }
      `}</style>
    </div>
  );
}
