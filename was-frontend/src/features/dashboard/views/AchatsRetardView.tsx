// features/dashboard/views/AchatsRetardView.tsx
import { useState, useRef, useEffect } from 'react';
import {
  Chart as ChartJS, CategoryScale, LinearScale, BarElement,
  LineElement, PointElement, Title, Tooltip, Legend, Filler
} from 'chart.js';
import { Bar, Line } from 'react-chartjs-2';
import jsPDF from 'jspdf';
import * as signalR from '@microsoft/signalr';
import { useAchatsViewModel } from '../viewmodels/achats.viewmodel';

ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, Title, Tooltip, Legend, Filler);

const HUB_URL = "http://localhost:5088/hubs/dashboard";

let globalConnection: signalR.HubConnection | null = null;
let globalConnectionCount = 0;

const C = {
  rouge:      '#e11d48',
  rougeClair: '#fff1f2',
  rougeBord:  '#fecdd3',
  orange:     '#ea580c',
  orangeClair:'#fff7ed',
  orangeBord: '#fed7aa',
  vert:       '#16a34a',
  vertClair:  '#f0fdf4',
  vertBord:   '#bbf7d0',
  slate:      '#1e293b',
  slateM:     '#475569',
  slateL:     '#94a3b8',
  bg:         '#f8fafc',
  white:      '#ffffff',
  bord:       '#e2e8f0',
};

const couleurTaux = (taux: number) =>
  taux > 15 ? 'rgba(225,29,72,0.80)'
: taux > 5  ? 'rgba(234,88,12,0.75)'
:             'rgba(22,163,74,0.70)';

const badgeTaux = (taux: number) =>
  taux > 15
    ? { bg: C.rougeClair, color: C.rouge, bord: C.rougeBord, label: '🔴 Critique' }
    : taux > 5
    ? { bg: C.orangeClair, color: C.orange, bord: C.orangeBord, label: '🟠 Attention' }
    : { bg: C.vertClair, color: C.vert, bord: C.vertBord, label: '🟢 Bon' };

// ── Plugin ligne moyenne verticale (barres horizontales) ────
const pluginLigneMoyenneH = (moyenne: number, label: string) => ({
  id: 'ligneMoyenneH',
  afterDraw: (chart: any) => {
    const ctx = chart.ctx;
    const xAxis = chart.scales['x'];
    const yAxis = chart.scales['y'];
    if (!xAxis || !yAxis) return;
    const x = xAxis.getPixelForValue(moyenne);
    ctx.save();
    ctx.beginPath();
    ctx.setLineDash([6, 3]);
    ctx.strokeStyle = 'rgba(225,29,72,0.85)';
    ctx.lineWidth = 2;
    ctx.moveTo(x, yAxis.top);
    ctx.lineTo(x, yAxis.bottom);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.font = 'bold 10px sans-serif';
    const textWidth = ctx.measureText(label).width;
    const textX = x + 4 > xAxis.right - textWidth - 10 ? x - textWidth - 8 : x + 4;
    ctx.fillStyle = 'rgba(255,255,255,0.88)';
    ctx.fillRect(textX - 2, yAxis.top + 4, textWidth + 6, 16);
    ctx.fillStyle = 'rgba(225,29,72,0.92)';
    ctx.textAlign = 'left';
    ctx.fillText(label, textX, yAxis.top + 15);
    ctx.restore();
  },
});

// ── Plugin ligne moyenne horizontale (barres verticales) ────
const pluginLigneMoyenneV = (moyenne: number, label: string) => ({
  id: 'ligneMoyenneV',
  afterDraw: (chart: any) => {
    const ctx = chart.ctx;
    const xAxis = chart.scales['x'];
    const yAxis = chart.scales['y'];
    if (!xAxis || !yAxis) return;
    const y = yAxis.getPixelForValue(moyenne);
    ctx.save();
    ctx.beginPath();
    ctx.setLineDash([6, 3]);
    ctx.strokeStyle = 'rgba(225,29,72,0.85)';
    ctx.lineWidth = 2;
    ctx.moveTo(xAxis.left, y);
    ctx.lineTo(xAxis.right, y);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.font = 'bold 10px sans-serif';
    const textWidth = ctx.measureText(label).width;
    ctx.fillStyle = 'rgba(255,255,255,0.88)';
    ctx.fillRect(xAxis.left + 6, y - 17, textWidth + 8, 16);
    ctx.fillStyle = 'rgba(225,29,72,0.92)';
    ctx.textAlign = 'left';
    ctx.fillText(label, xAxis.left + 10, y - 5);
    ctx.restore();
  },
});

const EmptyChart = ({ message = "Aucune donnée disponible" }: { message?: string }) => (
  <div className="flex flex-col items-center justify-center h-full gap-2 py-8">
    <span className="text-3xl opacity-30">📊</span>
    <p className="text-sm font-medium" style={{ color: C.slateL }}>{message}</p>
    <p className="text-xs" style={{ color: C.slateL, opacity: 0.7 }}>Aucune donnée ne correspond aux filtres</p>
  </div>
);

const ChartActions = ({ onDetails, chartRef, title }: {
  onDetails: () => void; chartRef: React.RefObject<any>; title: string;
}) => {
  const telechargerPDF = () => {
    if (!chartRef?.current) return;
    const imgData = chartRef.current.toBase64Image('image/png', 1);
    const pdf = new jsPDF('landscape', 'mm', 'a4');
    const w = pdf.internal.pageSize.getWidth();
    const h = pdf.internal.pageSize.getHeight();
    pdf.setFillColor(225, 29, 72);
    pdf.rect(0, 0, w, 18, 'F');
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(13);
    pdf.text(title, w / 2, 12, { align: 'center' });
    pdf.setTextColor(0, 0, 0);
    pdf.addImage(imgData, 'PNG', 10, 24, w - 20, h - 34);
    pdf.save(`${title}.pdf`);
  };

  const imprimerGraphique = () => {
    if (!chartRef?.current) return;
    const imgData = chartRef.current.toBase64Image('image/png', 1);
    const now = new Date();
    const win = window.open('', '_blank');
    if (!win) return;
    win.document.write(`
      <html><head><title>${title}</title>
      <style>body{margin:20px;font-family:Arial,sans-serif;}
      .hdr{text-align:center;margin-bottom:16px;padding-bottom:12px;border-bottom:2px solid #fecdd3;}
      h1{font-size:16px;font-weight:700;color:#e11d48;margin:0 0 4px;}
      p{font-size:11px;color:#64748b;margin:0;}
      img{max-width:100%;border:1px solid #e2e8f0;border-radius:8px;}
      @media print{@page{size:A4 landscape;margin:12mm;}}</style></head>
      <body><div class="hdr"><h1>${title}</h1>
      <p>Imprimé le ${now.toLocaleDateString('fr-TN')} à ${now.toLocaleTimeString('fr-TN')}</p></div>
      <img src="${imgData}" onload="window.print();window.close()"/></body></html>
    `);
    win.document.close();
  };

  return (
    <div className="flex items-center gap-1">
      <button onClick={onDetails}
        style={{ border: `1px solid ${C.bord}`, color: C.slateM, background: C.white }}
        className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold hover:bg-slate-50 transition-all shadow-sm">
        🔍 Détails
      </button>
      <button onClick={telechargerPDF}
        style={{ border: `1px solid ${C.rougeBord}`, color: C.rouge, background: C.white }}
        className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold hover:bg-rose-50 transition-all shadow-sm">
        📄 PDF
      </button>
      <button onClick={imprimerGraphique}
        style={{ border: `1px solid ${C.bord}`, color: C.slateM, background: C.white }}
        className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold hover:bg-slate-50 transition-all shadow-sm">
        🖨️
      </button>
    </div>
  );
};

const LegendeSeuils = () => (
  <div className="px-5 pt-2 pb-1 flex flex-wrap items-center gap-4 text-xs" style={{ color: C.slateL }}>
    <span className="flex items-center gap-1.5">
      <span className="inline-block w-3 h-3 rounded-sm" style={{ background: 'rgba(22,163,74,0.70)' }} />
      Bon (&lt;5%)
    </span>
    <span className="flex items-center gap-1.5">
      <span className="inline-block w-3 h-3 rounded-sm" style={{ background: 'rgba(234,88,12,0.75)' }} />
      Attention (5–15%)
    </span>
    <span className="flex items-center gap-1.5">
      <span className="inline-block w-3 h-3 rounded-sm" style={{ background: 'rgba(225,29,72,0.80)' }} />
      Critique (&gt;15%)
    </span>
    <span className="flex items-center gap-1.5">
      <span className="inline-block w-5 border-t-2 border-dashed" style={{ borderColor: C.rouge }} />
      Moyenne
    </span>
  </div>
);

const ModalRetard = ({ type, vm, onClose }: {
  type: 'retard-fournisseur' | 'retard-temps' | 'retard-produit' | null;
  vm: ReturnType<typeof useAchatsViewModel>;
  onClose: () => void;
}) => {
  const [tempsVue, setTempsVue] = useState<'mois' | 'trimestre' | 'annee'>('mois');
  if (!type) return null;

  const getTitle = () =>
    type === 'retard-fournisseur' ? '🚚 Taux de Retard par Fournisseur'
    : type === 'retard-temps'    ? '📅 Évolution Taux de Retard par Temps'
    : '📦 Taux de Retard de Livraison de L-Mobile par Produit (%)';

  const tempsData = tempsVue === 'mois' ? vm.retardParTempsMois
    : tempsVue === 'trimestre' ? vm.retardParTempsTrimestre
    : vm.retardParTempsAnnee;

  const retardProduitFiltre = vm.retardParProduit.filter(p => p.nombreCommandes >= 3);

  const isEmpty =
    (type === 'retard-fournisseur' && vm.retardParFournisseur.length === 0) ||
    (type === 'retard-temps'       && tempsData.length === 0) ||
    (type === 'retard-produit'     && retardProduitFiltre.length === 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(15,23,42,0.55)', backdropFilter: 'blur(4px)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[85vh] flex flex-col overflow-hidden"
        style={{ border: `1px solid ${C.bord}` }}>
        <div className="flex items-center justify-between px-6 py-4"
          style={{ borderBottom: `1px solid ${C.bord}`, background: 'linear-gradient(135deg,#fff1f2 0%,#fff 60%)' }}>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center text-base"
              style={{ background: C.rougeClair, border: `1px solid ${C.rougeBord}` }}>⏰</div>
            <div>
              <div className="text-xs font-bold uppercase tracking-widest" style={{ color: C.rouge }}>Analyse détaillée</div>
              <div className="font-bold text-sm" style={{ color: C.slate }}>{getTitle()}</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {type === 'retard-temps' && (
              <div className="flex gap-0.5 p-0.5 rounded-lg" style={{ background: '#f1f5f9' }}>
                {(['mois', 'trimestre', 'annee'] as const).map(v => (
                  <button key={v} onClick={() => setTempsVue(v)}
                    className="px-3 py-1 rounded-md text-xs font-semibold transition-all"
                    style={tempsVue === v
                      ? { background: C.white, color: C.rouge, boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }
                      : { color: C.slateL }}>
                    {v.charAt(0).toUpperCase() + v.slice(1)}
                  </button>
                ))}
              </div>
            )}
            <button onClick={onClose}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold"
              style={{ background: '#f1f5f9', color: C.slateM }}>✕</button>
          </div>
        </div>
        <div className="px-6 py-2 flex flex-wrap gap-3 text-xs"
          style={{ borderBottom: `1px solid ${C.bord}`, background: '#fafafa' }}>
          {[
            { color: C.vert,   bg: C.vertClair,   label: '🟢 Bon < 5%' },
            { color: C.orange, bg: C.orangeClair, label: '🟠 Attention 5–15%' },
            { color: C.rouge,  bg: C.rougeClair,  label: '🔴 Critique > 15%' },
          ].map((s, i) => (
            <span key={i} className="px-2 py-0.5 rounded-full font-semibold"
              style={{ background: s.bg, color: s.color }}>{s.label}</span>
          ))}
        </div>
        <div className="overflow-y-auto flex-1">
          {isEmpty ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <span className="text-4xl opacity-30">📊</span>
              <p className="text-sm font-medium" style={{ color: C.slateL }}>Aucune donnée disponible</p>
              <p className="text-xs" style={{ color: C.slateL, opacity: 0.7 }}>Aucune donnée ne correspond aux filtres</p>
            </div>
          ) : (
            <table className="w-full border-collapse">
              <thead style={{ background: '#f8fafc', position: 'sticky', top: 0 }}>
                <tr>
                  {type === 'retard-fournisseur' && <>
                    <th className="px-5 py-3 text-left text-xs font-bold uppercase tracking-wider" style={{ color: C.rouge }}>Fournisseur</th>
                    <th className="px-5 py-3 text-center text-xs font-bold uppercase tracking-wider" style={{ color: C.rouge }}>Nb Retards</th>
                    <th className="px-5 py-3 text-center text-xs font-bold uppercase tracking-wider" style={{ color: C.rouge }}>Nb Commandes</th>
                    <th className="px-5 py-3 text-center text-xs font-bold uppercase tracking-wider" style={{ color: C.rouge }}>Taux Retard</th>
                    <th className="px-5 py-3 text-center text-xs font-bold uppercase tracking-wider" style={{ color: C.rouge }}>Statut</th>
                  </>}
                  {type === 'retard-temps' && <>
                    <th className="px-5 py-3 text-left text-xs font-bold uppercase tracking-wider" style={{ color: C.rouge }}>Période</th>
                    <th className="px-5 py-3 text-center text-xs font-bold uppercase tracking-wider" style={{ color: C.rouge }}>Nb Retards</th>
                    <th className="px-5 py-3 text-center text-xs font-bold uppercase tracking-wider" style={{ color: C.rouge }}>Nb Commandes</th>
                    <th className="px-5 py-3 text-center text-xs font-bold uppercase tracking-wider" style={{ color: C.rouge }}>Taux Retard</th>
                    <th className="px-5 py-3 text-center text-xs font-bold uppercase tracking-wider" style={{ color: C.rouge }}>Statut</th>
                  </>}
                  {type === 'retard-produit' && <>
                    <th className="px-5 py-3 text-left text-xs font-bold uppercase tracking-wider" style={{ color: C.rouge }}>Produit</th>
                    <th className="px-5 py-3 text-left text-xs font-bold uppercase tracking-wider" style={{ color: C.rouge }}>Catégorie</th>
                    <th className="px-5 py-3 text-center text-xs font-bold uppercase tracking-wider" style={{ color: C.rouge }}>Nb Retards</th>
                    <th className="px-5 py-3 text-center text-xs font-bold uppercase tracking-wider" style={{ color: C.rouge }}>Nb Commandes</th>
                    <th className="px-5 py-3 text-center text-xs font-bold uppercase tracking-wider" style={{ color: C.rouge }}>Taux Retard</th>
                    <th className="px-5 py-3 text-center text-xs font-bold uppercase tracking-wider" style={{ color: C.rouge }}>Statut</th>
                  </>}
                </tr>
              </thead>
              <tbody>
                {type === 'retard-fournisseur' && vm.retardParFournisseur.map((f, i) => {
                  const b = badgeTaux(f.tauxRetard);
                  return (
                    <tr key={i} style={{ background: i % 2 === 0 ? C.white : '#f8fafc', borderBottom: `1px solid ${C.bord}` }}>
                      <td className="px-5 py-3 text-sm font-semibold" style={{ color: C.slate }}>{f.nomFournisseur}</td>
                      <td className="px-5 py-3 text-center text-sm font-bold" style={{ color: C.rouge }}>{f.nombreRetards}</td>
                      <td className="px-5 py-3 text-center text-sm" style={{ color: C.slateM }}>{f.nombreCommandes}</td>
                      <td className="px-5 py-3 text-center">
                        <span className="inline-flex px-2.5 py-1 rounded-full text-xs font-bold"
                          style={{ background: b.bg, color: b.color, border: `1px solid ${b.bord}` }}>
                          {f.tauxRetard.toFixed(1)}%
                        </span>
                      </td>
                      <td className="px-5 py-3 text-center text-xs font-semibold">{b.label}</td>
                    </tr>
                  );
                })}
                {type === 'retard-temps' && tempsData.map((t, i) => {
                  const b = badgeTaux(t.tauxRetard);
                  return (
                    <tr key={i} style={{ background: i % 2 === 0 ? C.white : '#f8fafc', borderBottom: `1px solid ${C.bord}` }}>
                      <td className="px-5 py-3 text-sm font-semibold" style={{ color: C.slate }}>{t.label}</td>
                      <td className="px-5 py-3 text-center text-sm font-bold" style={{ color: C.rouge }}>{t.nombreRetards}</td>
                      <td className="px-5 py-3 text-center text-sm" style={{ color: C.slateM }}>{t.nombreCommandes}</td>
                      <td className="px-5 py-3 text-center">
                        <span className="inline-flex px-2.5 py-1 rounded-full text-xs font-bold"
                          style={{ background: b.bg, color: b.color, border: `1px solid ${b.bord}` }}>
                          {t.tauxRetard.toFixed(1)}%
                        </span>
                      </td>
                      <td className="px-5 py-3 text-center text-xs font-semibold">{b.label}</td>
                    </tr>
                  );
                })}
                {type === 'retard-produit' && retardProduitFiltre.map((p, i) => {
                  const b = badgeTaux(p.tauxRetard);
                  return (
                    <tr key={i} style={{ background: i % 2 === 0 ? C.white : '#f8fafc', borderBottom: `1px solid ${C.bord}` }}>
                      <td className="px-5 py-3 text-sm font-semibold" style={{ color: C.slate }}>{p.description}</td>
                      <td className="px-5 py-3">
                        <span className="text-xs px-2.5 py-1 rounded-full font-semibold"
                          style={{ background: C.rougeClair, color: C.rouge, border: `1px solid ${C.rougeBord}` }}>
                          {p.categorie}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-center text-sm font-bold" style={{ color: C.rouge }}>{p.nombreRetards}</td>
                      <td className="px-5 py-3 text-center text-sm" style={{ color: C.slateM }}>{p.nombreCommandes}</td>
                      <td className="px-5 py-3 text-center">
                        <span className="inline-flex px-2.5 py-1 rounded-full text-xs font-bold"
                          style={{ background: b.bg, color: b.color, border: `1px solid ${b.bord}` }}>
                          {p.tauxRetard.toFixed(1)}%
                        </span>
                      </td>
                      <td className="px-5 py-3 text-center text-xs font-semibold">{b.label}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

const AchatsRetardView = () => {
  const vm = useAchatsViewModel();
  const [modal, setModal]       = useState<'retard-fournisseur' | 'retard-temps' | 'retard-produit' | null>(null);
  const [tempsVue, setTempsVue] = useState<'mois' | 'trimestre' | 'annee'>('mois');
  const [connexionStatut, setConnexionStatut] = useState<'connected' | 'connecting' | 'disconnected'>('connecting');
  const [derniereMAJ, setDerniereMAJ] = useState<Date | null>(null);

  const refRetardFourni  = useRef<any>(null);
  const refRetardTemps   = useRef<any>(null);
  const refRetardProduit = useRef<any>(null);

  useEffect(() => {
    let reconnectTimer: ReturnType<typeof setTimeout>;
    let mounted = true;
    const connectSignalR = async () => {
      try {
        globalConnectionCount++;
        if (globalConnection && globalConnection.state === signalR.HubConnectionState.Connected) {
          if (mounted) setConnexionStatut('connected');
          return;
        }
        const connection = new signalR.HubConnectionBuilder()
          .withUrl(HUB_URL).withAutomaticReconnect([0, 2000, 5000, 10000, 30000])
          .configureLogging(signalR.LogLevel.Error).build();
        connection.on('DashboardMisAJour', () => { if (mounted) { vm.refetch(); setDerniereMAJ(new Date()); } });
        connection.onreconnecting(() => { if (mounted) setConnexionStatut('connecting'); });
        connection.onreconnected(() => { if (mounted) { setConnexionStatut('connected'); vm.refetch(); } });
        connection.onclose(() => { if (mounted) setConnexionStatut('disconnected'); globalConnection = null; });
        await connection.start();
        if (mounted) { setConnexionStatut('connected'); globalConnection = connection; }
      } catch {
        if (mounted) { setConnexionStatut('disconnected'); reconnectTimer = setTimeout(connectSignalR, 5000); }
      }
    };
    connectSignalR();
    return () => {
      mounted = false;
      if (reconnectTimer) clearTimeout(reconnectTimer);
      globalConnectionCount--;
      if (globalConnectionCount === 0 && globalConnection) {
        globalConnection.stop().catch(() => {}); globalConnection = null;
      }
    };
  }, []);

  if (vm.loading) return (
    <div className="flex items-center justify-center py-32">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-t-transparent rounded-full animate-spin mx-auto mb-4"
          style={{ borderColor: `${C.rouge} transparent transparent transparent` }} />
        <p className="font-medium" style={{ color: C.slateM }}>Chargement…</p>
      </div>
    </div>
  );

  if (vm.error) return (
    <div className="flex items-center justify-center py-32">
      <div className="rounded-2xl px-8 py-6 text-center"
        style={{ background: C.rougeClair, border: `1px solid ${C.rougeBord}` }}>
        <div className="text-2xl mb-2">⚠️</div>
        <div className="font-semibold" style={{ color: C.rouge }}>{vm.error}</div>
      </div>
    </div>
  );

  if (!vm.global) return null;

  const { tauxRetard, nombreRetards, nombreCommandes } = vm.global;

  const tempsData = tempsVue === 'mois' ? vm.retardParTempsMois
    : tempsVue === 'trimestre' ? vm.retardParTempsTrimestre
    : vm.retardParTempsAnnee;

  const moyenneFournisseur = vm.retardParFournisseur.length > 0
    ? vm.retardParFournisseur.reduce((s, f) => s + f.tauxRetard, 0) / vm.retardParFournisseur.length : 0;
  const moyenneTemps = tempsData.length > 0
    ? tempsData.reduce((s, t) => s + t.tauxRetard, 0) / tempsData.length : 0;

  const labelMoyFourni  = `Moy. ${moyenneFournisseur.toFixed(1)}%`;

  const chartRetardFournisseur = {
    labels: vm.retardParFournisseur.map(f =>
      f.nomFournisseur.length > 18 ? f.nomFournisseur.slice(0, 18) + '…' : f.nomFournisseur),
    datasets: [{
      label: 'Taux de retard (%)',
      data: vm.retardParFournisseur.map(f => f.tauxRetard),
      backgroundColor: vm.retardParFournisseur.map(f => couleurTaux(f.tauxRetard)),
      borderRadius: 6,
      borderSkipped: false,
    }],
  };

  const chartRetardTemps = {
    labels: tempsData.map(t => t.label),
    datasets: [
      {
        label: 'Taux de retard (%)',
        data: tempsData.map(t => t.tauxRetard),
        borderColor: C.rouge,
        backgroundColor: 'rgba(225,29,72,0.07)',
        borderWidth: 2.5,
        fill: true,
        tension: 0.4,
        pointBackgroundColor: tempsData.map(t => couleurTaux(t.tauxRetard)),
        pointBorderColor: C.white,
        pointBorderWidth: 2,
        pointRadius: 5,
        type: 'line' as const,
      },
      {
        label: `— Moyenne (${moyenneTemps.toFixed(1)}%)`,
        data: tempsData.map(() => moyenneTemps),
        borderColor: 'rgba(225,29,72,0.6)',
        borderWidth: 2,
        borderDash: [6, 3],
        pointRadius: 0,
        fill: false,
        tension: 0,
        type: 'line' as const,
      },
    ],
  };

  // ── Filtrer : uniquement les produits avec >= 3 commandes ──
  const retardProduitFiltre = vm.retardParProduit.filter(p => p.nombreCommandes >= 3);
  const moyenneProduitFiltre = retardProduitFiltre.length > 0
    ? retardProduitFiltre.reduce((s, p) => s + p.tauxRetard, 0) / retardProduitFiltre.length : 0;
  const labelMoyProduitFiltre = `Moy. ${moyenneProduitFiltre.toFixed(1)}%`;

  const chartRetardProduit = {
    labels: retardProduitFiltre.map(p =>
      p.description.length > 18 ? p.description.slice(0, 18) + '…' : p.description),
    datasets: [{
      label: 'Taux de retard (%)',
      data: retardProduitFiltre.map(p => p.tauxRetard),
      backgroundColor: retardProduitFiltre.map(p => couleurTaux(p.tauxRetard)),
      borderRadius: 6,
      borderSkipped: false,
    }],
  };

  const tooltipPlugin = {
    backgroundColor: C.slate,
    titleColor: '#f8fafc',
    bodyColor: '#cbd5e1',
    padding: 10,
    cornerRadius: 8,
    callbacks: {
      label: (ctx: any) => {
        if (ctx.dataset.label?.startsWith('—')) return ctx.dataset.label;
        return `${ctx.dataset.label} : ${Number(ctx.raw).toFixed(1)}%`;
      },
    },
  };

  // ── CORRECTION ÉCHELLE : min:0, max fixe, stepSize:5 ──────────────────────

  const optionsBarH = {
    responsive: true,
    maintainAspectRatio: false,
    indexAxis: 'y' as const,
    plugins: { legend: { display: false }, tooltip: tooltipPlugin },
    scales: {
      x: {
        min: 0,
        max: 30,
        grid: { color: 'rgba(0,0,0,0.04)' },
        border: { display: false },
        ticks: {
          color: C.slateL,
          font: { size: 11 },
          callback: (val: any) => `${val}%`,
          stepSize: 5,
        },
      },
      y: {
        grid: { display: false },
        border: { display: false },
        ticks: { color: C.slate, font: { size: 11 } },
      },
    },
  };

  const optionsLine = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: 'top' as const,
        labels: { font: { size: 10 }, color: C.slateL, boxWidth: 20 },
      },
      tooltip: tooltipPlugin,
    },
    scales: {
      x: {
        grid: { display: false },
        border: { display: false },
        ticks: { color: C.slateL, font: { size: 11 } },
      },
      y: {
        min: 0,
        max: 40,
        grid: { color: 'rgba(0,0,0,0.04)' },
        border: { display: false },
        ticks: {
          color: C.slateL,
          font: { size: 11 },
          callback: (val: any) => `${val}%`,
          stepSize: 5,
        },
      },
    },
  };

  const optionsBarV = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false }, tooltip: tooltipPlugin },
    scales: {
      x: {
        grid: { display: false },
        border: { display: false },
        ticks: { color: C.slate, font: { size: 10 } },
      },
      y: {
        min: 0,
        max: 35,
        grid: { color: 'rgba(0,0,0,0.04)' },
        border: { display: false },
        ticks: {
          color: C.slateL,
          font: { size: 11 },
          callback: (val: any) => `${val}%`,
          stepSize: 5,
        },
      },
    },
  };

  // ─────────────────────────────────────────────────────────────────────────

  const statutGlobal = badgeTaux(tauxRetard);

  const exportDashboardPDF = () => {
    const pdf = new jsPDF('portrait', 'mm', 'a4');
    const w = pdf.internal.pageSize.getWidth();
    const pageH = pdf.internal.pageSize.getHeight();
    let y = 10;
    pdf.setFillColor(225, 29, 72); pdf.rect(0, 0, w, 22, 'F');
    pdf.setTextColor(255, 255, 255); pdf.setFontSize(16);
    pdf.text('Dashboard — Taux de Retard Livraison', w / 2, 14, { align: 'center' });
    pdf.setTextColor(30, 41, 59); y = 30; pdf.setFontSize(10);
    pdf.text(`Taux global : ${tauxRetard}%  |  ${nombreRetards} retards / ${nombreCommandes} commandes`, 10, y); y += 10;
    [
      { ref: refRetardFourni,  label: 'Taux de Retard par Fournisseur (%)' },
      { ref: refRetardTemps,   label: 'Évolution Taux de Retard par Temps (%)' },
      { ref: refRetardProduit, label: 'Taux de Retard de Livraison de L-Mobile par Produit (%)' },
    ].forEach(({ ref, label }) => {
      if (!ref.current) return;
      const imgH = 65;
      if (y + imgH > pageH - 10) { pdf.addPage(); y = 10; }
      pdf.setFontSize(10); pdf.setTextColor(225, 29, 72); pdf.text(label, 10, y);
      pdf.setTextColor(30, 41, 59); y += 5;
      pdf.addImage(ref.current.toBase64Image('image/png', 1), 'PNG', 10, y, w - 20, imgH);
      y += imgH + 8;
    });
    pdf.save('Dashboard_Retard_Livraison.pdf');
  };

  const imprimerDashboard = () => {
    const images = [
      { ref: refRetardFourni,  label: '🚚 Taux de Retard par Fournisseur (%)' },
      { ref: refRetardTemps,   label: '📅 Évolution Taux de Retard par Temps (%)' },
      { ref: refRetardProduit, label: '📦 Taux de Retard de Livraison de L-Mobile par Produit (%)' },
    ].map(({ ref, label }) => ({ label, img: ref.current ? ref.current.toBase64Image('image/png', 1) : null }));
    const now = new Date();
    const win = window.open('', '_blank');
    if (!win) { alert('Autorisez les popups pour ce site.'); return; }
    win.document.write(`<!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8"/>
      <title>Dashboard Taux Retard</title>
      <style>*{margin:0;padding:0;box-sizing:border-box;}body{font-family:Arial,sans-serif;padding:20px;color:#1e293b;}
      .hdr{background:#e11d48;color:white;padding:16px;border-radius:10px;margin-bottom:16px;text-align:center;}
      .kpi{padding:14px;border-radius:10px;border:2px solid #fecdd3;background:#fff1f2;margin-bottom:16px;}
      .cw{margin-bottom:16px;page-break-inside:avoid;}
      .cw h3{font-size:12px;font-weight:700;color:#e11d48;margin-bottom:8px;padding-left:8px;border-left:3px solid #e11d48;}
      .cw img{width:100%;border:1px solid #e2e8f0;border-radius:8px;}
      .ftr{margin-top:16px;padding-top:10px;border-top:1px solid #e2e8f0;text-align:center;font-size:10px;color:#94a3b8;}
      @media print{@page{margin:1cm;}}</style></head><body>
      <div class="hdr"><h1>⏰ Taux de Retard Livraison</h1>
      <p>Imprimé le ${now.toLocaleDateString('fr-TN')} à ${now.toLocaleTimeString('fr-TN')}</p></div>
      <div class="kpi">
        <div style="font-size:9px;color:#9f1239;font-weight:700;text-transform:uppercase;">📊 Taux Global</div>
        <div style="font-size:28px;font-weight:800;color:#e11d48;">${tauxRetard}%</div>
        <div style="font-size:10px;color:#f43f5e;">${nombreRetards} retards sur ${nombreCommandes} commandes</div>
      </div>
      ${images.filter(i => i.img).map(i => `<div class="cw"><h3>${i.label}</h3><img src="${i.img}"/></div>`).join('')}
      <div class="ftr">I-mobile WAS v2.4 — Dashboard Retard | ${now.toLocaleDateString('fr-TN')}</div>
      <script>window.onload=function(){setTimeout(function(){window.print();window.close();},500);};<\/script>
      </body></html>`);
    win.document.close();
  };

  return (
    <div className="space-y-5" style={{ background: C.bg, minHeight: '100%' }}>
      <ModalRetard type={modal} vm={vm} onClose={() => setModal(null)} />

      {/* ── Filtres ── */}
      <div className="rounded-2xl p-4"
        style={{ background: C.white, border: `1px solid ${C.bord}`, boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
        <div className="flex flex-wrap items-center gap-3">
          {[
            { val: vm.queryParams.annee ?? '',      cb: (v: string) => vm.setAnnee(v ? Number(v) : undefined),    opts: vm.availableFilters.annees.map(a => ({ v: a, l: String(a) })),     ph: 'Toutes les années' },
            { val: vm.queryParams.trimestre ?? '',   cb: (v: string) => vm.setTrimestre(v ? Number(v) : undefined), opts: vm.availableFilters.trimestres.map(t => ({ v: t, l: `T${t}` })), ph: 'Tous les trimestres' },
            { val: vm.queryParams.fournisseur ?? '', cb: (v: string) => vm.setFournisseur(v || undefined),           opts: vm.availableFilters.fournisseurs.map(f => ({ v: f, l: f })),     ph: 'Tous les fournisseurs' },
            { val: vm.queryParams.produit ?? '',     cb: (v: string) => vm.setProduit(v || undefined),               opts: vm.availableFilters.produits.map(p => ({ v: p, l: p })),         ph: 'Tous les produits' },
          ].map((s, i) => (
            <select key={i} value={String(s.val)} onChange={e => s.cb(e.target.value)}
              className="text-sm rounded-xl px-3 py-2 transition-all outline-none"
              style={{ border: `1px solid ${C.bord}`, color: C.slate, background: C.white }}>
              <option value="">{s.ph}</option>
              {s.opts.map(o => <option key={String(o.v)} value={String(o.v)}>{o.l}</option>)}
            </select>
          ))}
          <button onClick={vm.resetFilters}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold transition-all"
            style={{ background: '#f1f5f9', color: C.slateM, border: `1px solid ${C.bord}` }}>
            🔄 Réinitialiser
          </button>
          <div className="ml-auto flex items-center gap-2">
            <button onClick={exportDashboardPDF}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold shadow-sm"
              style={{ background: C.rouge, color: C.white }}>📥 PDF</button>
            <button onClick={imprimerDashboard}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold shadow-sm"
              style={{ background: C.slate, color: C.white }}>🖨️ Imprimer</button>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold"
              style={connexionStatut === 'connected'
                ? { background: '#f0fdf4', color: '#15803d', border: '1px solid #bbf7d0' }
                : connexionStatut === 'connecting'
                ? { background: '#fffbeb', color: '#b45309', border: '1px solid #fde68a' }
                : { background: C.rougeClair, color: C.rouge, border: `1px solid ${C.rougeBord}` }}>
              <div className="w-1.5 h-1.5 rounded-full animate-pulse"
                style={{ background: connexionStatut === 'connected' ? '#16a34a' : connexionStatut === 'connecting' ? '#d97706' : C.rouge }} />
              {connexionStatut === 'connected' ? 'Temps réel' : connexionStatut === 'connecting' ? 'Connexion...' : 'Déconnecté'}
            </div>
            {derniereMAJ && (
              <span className="text-xs font-mono" style={{ color: C.slateL }}>
                MAJ : {derniereMAJ.toLocaleTimeString('fr-FR')}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ── KPI Unique ── */}
      <div className="rounded-2xl overflow-hidden"
        style={{ background: C.white, border: `1px solid ${C.bord}`, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
        <div className="h-1.5 w-full" style={{ background: `linear-gradient(90deg, ${C.rouge}, ${C.orange})` }} />
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="text-xs font-bold uppercase tracking-widest" style={{ color: C.rouge }}>📊 Taux de Retard Global</div>
            <span className="text-xs font-bold px-3 py-1 rounded-full"
              style={{ background: statutGlobal.bg, color: statutGlobal.color, border: `1px solid ${statutGlobal.bord}` }}>
              {statutGlobal.label}
            </span>
          </div>
          <div className="flex items-end gap-3 mb-4">
            <span className="text-6xl font-black" style={{ color: C.rouge }}>{tauxRetard}</span>
            <span className="text-2xl font-semibold mb-1" style={{ color: '#fda4af' }}>%</span>
            <span className="text-sm mb-2" style={{ color: C.slateL }}>
              = {nombreRetards} retards sur {nombreCommandes} commandes
            </span>
          </div>
          <div className="rounded-full h-3 mb-2" style={{ background: '#f1f5f9' }}>
            <div className="h-3 rounded-full transition-all"
              style={{ width: `${Math.min(tauxRetard, 100)}%`, background: `linear-gradient(90deg, ${C.orange}, ${C.rouge})` }} />
          </div>
          <div className="flex justify-between text-xs mt-1" style={{ color: C.slateL }}>
            <span style={{ color: C.vert }}>🟢 Bon &lt;5%</span>
            <span style={{ color: C.orange }}>🟠 Attention 5–15%</span>
            <span style={{ color: C.rouge }}>🔴 Critique &gt;15%</span>
          </div>
        </div>
      </div>

      {/* ── Graphiques ligne 1 ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

        {/* Par Fournisseur */}
        <div className="rounded-2xl overflow-hidden"
          style={{ background: C.white, border: `1px solid ${C.bord}`, boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
          <div className="px-5 py-3.5 flex items-center justify-between"
            style={{ borderBottom: `1px solid ${C.bord}`, background: '#fafafa' }}>
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center text-sm"
                style={{ background: C.rougeClair, border: `1px solid ${C.rougeBord}` }}>🚚</div>
              <div>
                <div className="text-sm font-bold" style={{ color: C.slate }}>Taux de Retard par Fournisseur</div>
                <div className="text-xs" style={{ color: C.slateL }}>% commandes en retard — moyenne : {moyenneFournisseur.toFixed(1)}%</div>
              </div>
            </div>
            <ChartActions onDetails={() => setModal('retard-fournisseur')} chartRef={refRetardFourni} title="Taux de Retard par Fournisseur" />
          </div>
          <LegendeSeuils />
          <div className="p-5" style={{ height: 380 }}>
            {vm.retardParFournisseur.length === 0 ? <EmptyChart /> : (
              <Bar
                ref={refRetardFourni}
                data={chartRetardFournisseur}
                options={optionsBarH}
                plugins={[pluginLigneMoyenneH(moyenneFournisseur, labelMoyFourni)]}
              />
            )}
          </div>
        </div>

        {/* Par Temps */}
        <div className="rounded-2xl overflow-hidden"
          style={{ background: C.white, border: `1px solid ${C.bord}`, boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
          <div className="px-5 py-3.5 flex items-center justify-between flex-wrap gap-2"
            style={{ borderBottom: `1px solid ${C.bord}`, background: '#fafafa' }}>
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center text-sm"
                style={{ background: C.rougeClair, border: `1px solid ${C.rougeBord}` }}>📈</div>
              <div>
                <div className="text-sm font-bold" style={{ color: C.slate }}>Évolution Taux de Retard</div>
                <div className="text-xs" style={{ color: C.slateL }}>Tendance temporelle en %</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex gap-0.5 p-0.5 rounded-lg" style={{ background: '#f1f5f9' }}>
                {(['mois', 'trimestre', 'annee'] as const).map(v => (
                  <button key={v} onClick={() => setTempsVue(v)}
                    className="px-2.5 py-1 rounded-md text-xs font-semibold transition-all"
                    style={tempsVue === v
                      ? { background: C.white, color: C.rouge, boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }
                      : { color: C.slateL }}>
                    {v.charAt(0).toUpperCase() + v.slice(1)}
                  </button>
                ))}
              </div>
              <ChartActions onDetails={() => setModal('retard-temps')} chartRef={refRetardTemps} title="Évolution Taux de Retard par Temps" />
            </div>
          </div>
          <LegendeSeuils />
          <div className="p-5" style={{ height: 380 }}>
            {tempsData.length === 0 ? <EmptyChart /> : (
              <Line ref={refRetardTemps} data={chartRetardTemps as any} options={optionsLine} />
            )}
          </div>
        </div>
      </div>

      {/* ── Par Produit ── */}
      <div className="rounded-2xl overflow-hidden"
        style={{ background: C.white, border: `1px solid ${C.bord}`, boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
        <div className="px-5 py-3.5 flex items-center justify-between"
          style={{ borderBottom: `1px solid ${C.bord}`, background: '#fafafa' }}>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center text-sm"
              style={{ background: C.rougeClair, border: `1px solid ${C.rougeBord}` }}>📦</div>
            <div>
              <div className="text-sm font-bold" style={{ color: C.slate }}>Taux de Retard de Livraison de L-Mobile par Produit (%)</div>
              <div className="text-xs" style={{ color: C.slateL }}>% commandes en retard — moyenne : {moyenneProduitFiltre.toFixed(1)}%</div>
            </div>
          </div>
          <ChartActions onDetails={() => setModal('retard-produit')} chartRef={refRetardProduit} title="Taux de Retard de Livraison de L-Mobile par Produit (%)" />
        </div>
        <LegendeSeuils />
        <div className="p-5" style={{ height: 380 }}>
          {vm.retardParProduit.length === 0 ? <EmptyChart /> : (
            <Bar
              ref={refRetardProduit}
              data={chartRetardProduit}
              options={optionsBarV}
              plugins={[pluginLigneMoyenneV(moyenneProduitFiltre, labelMoyProduitFiltre)]}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default AchatsRetardView;