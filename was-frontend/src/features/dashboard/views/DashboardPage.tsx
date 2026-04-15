// features/dashboard/views/DashboardPage.tsx
import { useState, useEffect, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import * as signalR from "@microsoft/signalr";
import AchatsView from "./AchatsView";
import ProductionView from "./ProductionView";
import RentabiliteView from "./RentabiliteView";
import TempsArretView from "./TempsArretView";
import QualiteView from "./QualiteView";
import StockDisponibleView from "./StockDisponibleView";
import ChiffreAffairesView from "./ChiffreAffairesView";

const HUB_URL = "http://localhost:5088/hubs/dashboard";

type TabId = "achats" | "ventes" | "production" | "qualite" | "stock";

const TABS = [
  { id: "achats"     as TabId, label: "Achats",     icon: "🛒" },
  { id: "ventes"     as TabId, label: "Ventes",     icon: "💵" },
  { id: "production" as TabId, label: "Production", icon: "🏭" },
  { id: "qualite"    as TabId, label: "Qualité",    icon: "✅" },
  { id: "stock"      as TabId, label: "Stock",      icon: "📦" },
];

let _connection: signalR.HubConnection | null = null;
let _connectionPromise: Promise<void> | null  = null;

function getConnection(): signalR.HubConnection {
  if (!_connection) {
    _connection = new signalR.HubConnectionBuilder()
      .withUrl(HUB_URL)
      .withAutomaticReconnect([0, 2000, 5000, 10000, 30000])
      .configureLogging(signalR.LogLevel.Warning)
      .build();
  }
  return _connection;
}

async function startConnection(): Promise<void> {
  const conn = getConnection();
  if (conn.state === signalR.HubConnectionState.Connected)  return;
  if (conn.state === signalR.HubConnectionState.Connecting) return;
  if (!_connectionPromise) {
    _connectionPromise = conn.start()
      .then(()   => console.log("✅ Dashboard - Connecté en temps réel"))
      .catch(err => console.error("❌ Dashboard - Erreur connexion:", err))
      .finally(() => { _connectionPromise = null; });
  }
  return _connectionPromise;
}

const ProductionTabs = () => {
  const [subTab, setSubTab] = useState<'cout' | 'rentabilite' | 'tempsarret'>('cout');

  const subBtns = [
    { id:'cout'        as const, label:'Coût de Production', icon:'🏭', active:'bg-orange-500'  },
    { id:'rentabilite' as const, label:'Rentabilité Machine', icon:'📈', active:'bg-emerald-500' },
    { id:'tempsarret'  as const, label:"Temps d'Arrêt",       icon:'⏱️', active:'bg-red-500'     },
  ];

  return (
    <div className="space-y-4">
      <div className="flex gap-2 bg-white rounded-2xl border border-gray-100 shadow-sm p-2 w-fit">
        {subBtns.map(b => (
          <button key={b.id} onClick={() => setSubTab(b.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
              subTab === b.id ? `${b.active} text-white shadow` : 'text-gray-500 hover:bg-gray-100'
            }`}>
            {b.icon} {b.label}
          </button>
        ))}
      </div>
      {subTab === 'cout'        && <ProductionView />}
      {subTab === 'rentabilite' && <RentabiliteView />}
      {subTab === 'tempsarret'  && <TempsArretView />}
    </div>
  );
};

const DashboardPage = () => {
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState<TabId>("achats");
  const [connexionStatut, setConnexionStatut] =
    useState<'connecting' | 'connected' | 'disconnected'>('connecting');
  const [derniereMAJ, setDerniereMAJ] = useState<Date>(new Date());
  const fetchRef = useRef<(() => void) | null>(null);

  // ✅ Lire ?tab=stock depuis l'URL et activer l'onglet + scroll
  useEffect(() => {
    const tab = searchParams.get("tab") as TabId | null;
    if (tab && TABS.find(t => t.id === tab)) {
      setActiveTab(tab);
      if (tab === "stock") {
        setTimeout(() => {
          const el = document.getElementById("alertes-stock");
          if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
        }, 600);
      }
    }
  }, [searchParams]);

  useEffect(() => {
    const conn = getConnection();

    conn.on("DashboardMisAJour", () => {
      console.log("📡 Dashboard - Mise à jour reçue");
      setDerniereMAJ(new Date());
    });

    conn.onreconnecting(() => {
      console.log("🔄 Dashboard - Reconnexion...");
      setConnexionStatut('connecting');
    });
    conn.onreconnected(() => {
      console.log("✅ Dashboard - Reconnecté");
      setConnexionStatut('connected');
      setDerniereMAJ(new Date());
    });
    conn.onclose(() => {
      console.log("🔌 Dashboard - Connexion fermée");
      setConnexionStatut('disconnected');
    });

    startConnection()
      .then(() => {
        setConnexionStatut('connected');
        setDerniereMAJ(new Date());
      })
      .catch(() => setConnexionStatut('disconnected'));

    return () => {
      conn.off("DashboardMisAJour");
    };
  }, []);

  return (
    <div className="min-h-screen bg-slate-50">

      {/* ── Header ── */}
      <div className="bg-white border-b border-slate-100">
        <div className="px-6 py-5 max-w-screen-2xl mx-auto">
          <div className="flex items-center justify-between">
            <div>
              <div style={{ marginBottom: 8 }}>
                <span style={{
                  display: 'inline-flex', alignItems: 'center', gap: 7,
                  background: '#f1f5f9', border: '1px solid #e2e8f0',
                  borderRadius: 20, padding: '4px 14px',
                  fontSize: 11, fontWeight: 700, letterSpacing: '0.08em',
                  textTransform: 'uppercase', color: '#475569',
                }}>
                  <span style={{
                    width: 7, height: 7, borderRadius: '50%',
                    background: '#94a3b8', display: 'inline-block', flexShrink: 0,
                  }} />
                  DASHBOARD PERFORMANCE
                  <span style={{
                    display: 'inline-flex', alignItems: 'center', gap: 4,
                    background: connexionStatut === 'connected'  ? '#10b981'
                              : connexionStatut === 'connecting' ? '#f59e0b'
                              : '#ef4444',
                    color: '#fff', borderRadius: 20,
                    padding: '2px 9px 2px 7px',
                    fontSize: 10, fontWeight: 700, marginLeft: 4,
                  }}>
                    <span style={{
                      width: 6, height: 6, borderRadius: '50%',
                      background: '#fff', display: 'inline-block', flexShrink: 0,
                      animation: connexionStatut === 'connected' ? 'pulse 1.5s infinite' : 'none',
                    }} />
                    {connexionStatut === 'connected'  ? 'LIVE'
                   : connexionStatut === 'connecting' ? 'Connexion...'
                   : 'Déconnecté'}
                  </span>
                </span>
              </div>
              <h1 className="text-2xl font-black text-slate-800 tracking-tight">
                Performance Industrielle
              </h1>
            </div>

            <div style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '8px 16px', borderRadius: 12,
              background: connexionStatut === 'connected'  ? '#f0fdf4'
                        : connexionStatut === 'connecting' ? '#fffbeb'
                        : '#fff1f2',
              border: `1px solid ${
                connexionStatut === 'connected'  ? '#bbf7d0'
              : connexionStatut === 'connecting' ? '#fde68a'
              : '#fecdd3'}`,
            }}>
              <span style={{
                width: 7, height: 7, borderRadius: '50%', display: 'inline-block',
                background: connexionStatut === 'connected'  ? '#16a34a'
                          : connexionStatut === 'connecting' ? '#d97706'
                          : '#dc2626',
                animation: connexionStatut === 'connected' ? 'pulse 2s infinite' : 'none',
              }} />
              <span style={{
                fontSize: 12, fontWeight: 700, fontFamily: 'monospace',
                color: connexionStatut === 'connected'  ? '#15803d'
                     : connexionStatut === 'connecting' ? '#b45309'
                     : '#dc2626',
              }}>
                Dernière mise à jour : {derniereMAJ.toLocaleTimeString('fr-FR')}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Navigation ── */}
      <div className="bg-white border-b border-slate-100 sticky top-0 z-40 shadow-sm">
        <div className="px-6 max-w-screen-2xl mx-auto">
          <div className="flex items-center gap-0 overflow-x-auto">
            {TABS.map((tab) => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                className={`relative flex items-center gap-2.5 px-5 py-4 text-sm font-semibold border-b-2 transition-all ${
                  activeTab === tab.id
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-slate-500 hover:text-slate-700"
                }`}>
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Contenu ── */}
      <div className="px-6 py-6 max-w-screen-2xl mx-auto">
        {activeTab === "achats"     && <AchatsView />}
        {activeTab === "ventes"     && <ChiffreAffairesView />}
        {activeTab === "production" && <ProductionTabs />}
        {activeTab === "qualite"    && <QualiteView />}
        {activeTab === "stock"      && <StockDisponibleView />}
      </div>
    </div>
  );
};

export default DashboardPage;