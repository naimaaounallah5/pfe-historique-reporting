// features/dashboard/views/AchatsMontantView.tsx
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
const fmt = (n: number) => n.toLocaleString('fr-TN', { minimumFractionDigits: 0 });

let globalConnection: signalR.HubConnection | null = null;
let globalConnectionCount = 0;

const EmptyChart = ({ message = "Aucune donnée disponible" }: { message?: string }) => (
  <div className="flex flex-col items-center justify-center h-full gap-2 py-8">
    <span className="text-3xl opacity-30">📊</span>
    <p className="text-sm text-slate-400 font-medium">{message}</p>
    <p className="text-xs text-slate-300">Aucune donnée ne correspond aux filtres sélectionnés</p>
  </div>
);

const ChartActions = ({ onDetails, chartRef, title }: { onDetails: () => void; chartRef: React.RefObject<any>; title: string }) => {
  const telechargerPDF = () => {
    if (!chartRef?.current) return;
    const imgData = chartRef.current.toBase64Image('image/png', 1);
    const pdf = new jsPDF('landscape', 'mm', 'a4');
    const w = pdf.internal.pageSize.getWidth();
    const h = pdf.internal.pageSize.getHeight();
    pdf.setFontSize(14);
    pdf.text(title, w / 2, 15, { align: 'center' });
    pdf.addImage(imgData, 'PNG', 10, 25, w - 20, h - 35);
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
      .hdr{text-align:center;margin-bottom:16px;padding-bottom:12px;border-bottom:2px solid #e5e7eb;}
      h1{font-size:16px;font-weight:700;color:#111827;margin:0 0 4px;}
      p{font-size:11px;color:#6b7280;margin:0;}
      img{max-width:100%;border:1px solid #e5e7eb;border-radius:8px;}
      @media print{@page{size:A4 landscape;margin:12mm;}}</style></head>
      <body><div class="hdr"><h1>${title}</h1>
      <p>Imprimé le ${now.toLocaleDateString('fr-TN')} à ${now.toLocaleTimeString('fr-TN')}</p></div>
      <img src="${imgData}" onload="window.print();window.close()"/></body></html>
    `);
    win.document.close();
  };

  return (
    <div className="flex items-center gap-1">
      <button onClick={onDetails} className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition-all border border-transparent hover:border-blue-100">🔍 Détails</button>
      <button onClick={telechargerPDF} className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-all border border-transparent hover:border-rose-100">📄 PDF</button>
      <button onClick={imprimerGraphique} className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition-all border border-transparent hover:border-slate-200">🖨️</button>
    </div>
  );
};

const ModalMontant = ({ type, vm, onClose }: { type: 'fournisseur' | 'temps' | 'produit' | null; vm: ReturnType<typeof useAchatsViewModel>; onClose: () => void }) => {
  const [tempsVue, setTempsVue] = useState<'mois'|'trimestre'|'annee'>('mois');
  if (!type) return null;

  const thCls = 'px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-blue-700';
  const tdCls = 'px-4 py-3 text-sm border-b border-gray-50';

  const totalFournisseurs = vm.parFournisseur.reduce((s, f) => s + f.montantTotal, 0);
  const totalProduits     = vm.parProduit.reduce((s, p) => s + p.montantTotal, 0);

  const tempsData = tempsVue === 'mois' ? vm.parTempsMois
    : tempsVue === 'trimestre' ? vm.parTempsTrimestre
    : vm.parTempsAnnee;
  const moyenneTemps = tempsData.length > 0 ? tempsData.reduce((s,t) => s + t.montantTotal, 0) / tempsData.length : 0;

  const getTitle = () => type === 'fournisseur' ? '🚚 Montant Total par Fournisseur'
    : type === 'temps' ? '📈 Évolution des Achats par Temps'
    : '📦 Montant Total par Matière Première';

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[85vh] flex flex-col border border-slate-100">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50 rounded-t-2xl">
          <h3 className="font-bold text-slate-800 text-sm">{getTitle()}</h3>
          <div className="flex items-center gap-2">
            {type === 'temps' && (
              <div className="flex gap-1 bg-white rounded-lg border border-slate-200 p-0.5">
                {(['mois','trimestre','annee'] as const).map(v => (
                  <button key={v} onClick={() => setTempsVue(v)}
                    className={`px-3 py-1 rounded-md text-xs font-semibold transition-all ${tempsVue === v ? 'bg-blue-500 text-white shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
                    {v.charAt(0).toUpperCase() + v.slice(1)}
                  </button>
                ))}
              </div>
            )}
            <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition-all text-sm font-bold">✕</button>
          </div>
        </div>
        <div className="overflow-y-auto flex-1">
          <table className="w-full border-collapse">
            <thead className="bg-blue-50 sticky top-0">
              <tr>
                {type === 'fournisseur' && <>
                  <th className={thCls}>Fournisseur</th>
                  <th className={`${thCls} text-right`}>Montant Total</th>
                  <th className={`${thCls} text-right`}>% du total</th>
                  <th className={`${thCls} text-center`}>Statut</th>
                </>}
                {type === 'temps' && <>
                  <th className={thCls}>Période</th>
                  <th className={`${thCls} text-right`}>Montant Total</th>
                  <th className={`${thCls} text-center`}>vs Moyenne</th>
                </>}
                {type === 'produit' && <>
                  <th className={thCls}>Matière Première</th>
                  <th className={thCls}>Catégorie</th>
                  <th className={`${thCls} text-right`}>Montant Total</th>
                  <th className={`${thCls} text-right`}>% du total</th>
                </>}
              </tr>
            </thead>
            <tbody>
              {type === 'fournisseur' && (
                vm.parFournisseur.length === 0
                  ? <tr><td colSpan={4} className="text-center py-8 text-slate-400 text-sm">Aucune donnée disponible</td></tr>
                  : vm.parFournisseur.map((f, i) => {
                      const pct = totalFournisseurs > 0 ? (f.montantTotal / totalFournisseurs * 100) : 0;
                      const isDominant = pct > 40;
                      return (
                        <tr key={i} className={`hover:bg-blue-50/50 transition-colors ${i % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}`}>
                          <td className={`${tdCls} font-medium text-slate-700`}>{f.nomFournisseur}</td>
                          <td className={`${tdCls} text-right text-blue-600 font-bold`}>{fmt(f.montantTotal)} DT</td>
                          <td className={`${tdCls} text-right font-semibold ${isDominant ? 'text-red-600' : 'text-slate-500'}`}>{pct.toFixed(1)}%</td>
                          <td className="px-4 py-3 text-center">
                            {isDominant
                              ? <span className="bg-red-100 text-red-700 text-xs px-2 py-0.5 rounded-full font-semibold">⚠️ Dominant</span>
                              : <span className="bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded-full font-semibold">✅ Normal</span>}
                          </td>
                        </tr>
                      );
                    })
              )}
              {type === 'temps' && (
                tempsData.length === 0
                  ? <tr><td colSpan={3} className="text-center py-8 text-slate-400 text-sm">Aucune donnée disponible</td></tr>
                  : tempsData.map((t, i) => {
                      const diff = moyenneTemps > 0 ? ((t.montantTotal - moyenneTemps) / moyenneTemps * 100) : 0;
                      return (
                        <tr key={i} className={`hover:bg-blue-50/50 transition-colors ${i % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}`}>
                          <td className={`${tdCls} font-medium text-slate-700`}>{t.label}</td>
                          <td className={`${tdCls} text-right text-blue-600 font-bold`}>{fmt(t.montantTotal)} DT</td>
                          <td className="px-4 py-3 text-center">
                            <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${diff > 20 ? 'bg-red-100 text-red-700' : diff < -20 ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                              {diff >= 0 ? '↑' : '↓'} {Math.abs(diff).toFixed(1)}%
                            </span>
                          </td>
                        </tr>
                      );
                    })
              )}
              {type === 'produit' && (
                vm.parProduit.length === 0
                  ? <tr><td colSpan={4} className="text-center py-8 text-slate-400 text-sm">Aucune donnée disponible</td></tr>
                  : vm.parProduit.map((p, i) => {
                      const pct = totalProduits > 0 ? (p.montantTotal / totalProduits * 100) : 0;
                      return (
                        <tr key={i} className={`hover:bg-blue-50/50 transition-colors ${i % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}`}>
                          <td className={`${tdCls} font-medium text-slate-700`}>{p.description}</td>
                          <td className={tdCls}><span className="bg-blue-50 text-blue-600 text-xs px-2.5 py-0.5 rounded-full font-medium border border-blue-100">{p.categorie}</span></td>
                          <td className={`${tdCls} text-right text-blue-600 font-bold`}>{fmt(p.montantTotal)} DT</td>
                          <td className={`${tdCls} text-right font-semibold text-slate-500`}>{pct.toFixed(1)}%</td>
                        </tr>
                      );
                    })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const AchatsMontantView = () => {
  const vm = useAchatsViewModel();
  const [modal, setModal]       = useState<'fournisseur' | 'temps' | 'produit' | null>(null);
  const [tempsVue, setTempsVue] = useState<'mois'|'trimestre'|'annee'>('mois');
  const [connexionStatut, setConnexionStatut] = useState<'connected'|'connecting'|'disconnected'>('connecting');
  const [derniereMAJ, setDerniereMAJ] = useState<Date | null>(null);

  const refFournisseur = useRef<any>(null);
  const refTemps       = useRef<any>(null);
  const refProduit     = useRef<any>(null);

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
      if (globalConnectionCount === 0 && globalConnection) { globalConnection.stop().catch(() => {}); globalConnection = null; }
    };
  }, []);

  if (vm.loading) return (
    <div className="flex items-center justify-center py-32">
      <div className="text-center">
        <div className="w-10 h-10 border-[3px] border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-slate-400 text-sm font-medium">Chargement des données…</p>
      </div>
    </div>
  );

  if (vm.error) return (
    <div className="flex items-center justify-center py-32">
      <div className="bg-red-50 border border-red-200 rounded-2xl px-6 py-4 text-red-600 text-sm">⚠ {vm.error}</div>
    </div>
  );

  if (!vm.global) return null;

  const { montantTotalAchats, nombreCommandes, delaiMoyenReel, delaiMoyenConvenu } = vm.global;

  const tempsData = tempsVue === 'mois' ? vm.parTempsMois
    : tempsVue === 'trimestre' ? vm.parTempsTrimestre
    : vm.parTempsAnnee;

  const totalFournisseurs  = vm.parFournisseur.reduce((s, f) => s + f.montantTotal, 0);
  const fournisseurDominant = vm.parFournisseur.find(f => totalFournisseurs > 0 && (f.montantTotal / totalFournisseurs) > 0.40);
  const moyenneTemps       = tempsData.length > 0 ? tempsData.reduce((s, t) => s + t.montantTotal, 0) / tempsData.length : 0;
  const moyenneProduit     = vm.parProduit.length > 0 ? vm.parProduit.reduce((s, p) => s + p.montantTotal, 0) / vm.parProduit.length : 0;

  // ── Hauteur dynamique du graphique produit (30px par produit, min 300px) ──
  const produitChartHeight = Math.max(380, vm.parProduit.length * 35);

  const chartFournisseur = {
    labels: vm.parFournisseur.map(f => f.nomFournisseur.length > 15 ? f.nomFournisseur.slice(0,15)+'…' : f.nomFournisseur),
    datasets: [
      {
        label: 'Montant (DT)',
        data: vm.parFournisseur.map(f => f.montantTotal),
        backgroundColor: vm.parFournisseur.map(f =>
          totalFournisseurs > 0 && (f.montantTotal / totalFournisseurs) > 0.4
            ? 'rgba(239,68,68,0.75)' : 'rgba(59,130,246,0.75)'
        ),
        borderRadius: 6, borderSkipped: false, type: 'bar' as const,
      },
    ],
  };

  const chartTemps = {
    labels: tempsData.map(t => t.label),
    datasets: [
      {
        label: 'Montant Total (DT)',
        data: tempsData.map(t => t.montantTotal),
        borderColor: '#3B82F6', backgroundColor: 'rgba(59,130,246,0.08)',
        borderWidth: 2.5, fill: true, tension: 0.4,
        pointBackgroundColor: tempsData.map(t => t.montantTotal > moyenneTemps * 1.2 ? '#ef4444' : '#fff'),
        pointBorderColor: tempsData.map(t => t.montantTotal > moyenneTemps * 1.2 ? '#ef4444' : '#3B82F6'),
        pointBorderWidth: 2, pointRadius: 4, pointHoverRadius: 6, type: 'line' as const,
      },
      {
        label: `— Moyenne (${fmt(Math.round(moyenneTemps))} DT)`,
        data: tempsData.map(() => moyenneTemps),
        borderColor: 'rgba(239,68,68,0.8)', borderWidth: 2,
        borderDash: [6, 3], pointRadius: 0, fill: false, tension: 0, type: 'line' as const,
      },
    ],
  };

  // ── Graphique Produit : HORIZONTAL avec noms complets ──
  const chartProduit = {
    labels: vm.parProduit.map(p => p.description),
    datasets: [
      {
        label: 'Montant (DT)',
        data: vm.parProduit.map(p => p.montantTotal),
        backgroundColor: vm.parProduit.map((p, i) =>
          p.montantTotal > moyenneProduit * 2
            ? 'rgba(239,68,68,0.8)'
            : `hsla(${210 + i * 22}, 75%, ${52 + (i%3)*6}%, 0.82)`
        ),
        borderRadius: 6, borderSkipped: false, type: 'bar' as const,
      },
      {
        label: `— Moyenne (${fmt(Math.round(moyenneProduit))} DT)`,
        data: vm.parProduit.map(() => moyenneProduit),
        borderColor: 'rgba(239,68,68,0.9)', borderWidth: 2,
        borderDash: [6, 3], pointRadius: 0, fill: false, type: 'line' as const,
      },
    ],
  };

  const baseOpts = {
    responsive: true, maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true, position: 'top' as const,
        labels: { font: { size: 10 }, color: '#94a3b8', boxWidth: 20 },
      },
      tooltip: {
        backgroundColor: '#1e293b', titleColor: '#94a3b8', bodyColor: '#f1f5f9',
        padding: 10, cornerRadius: 8,
        callbacks: {
          label: (ctx: any) => {
            if (ctx.dataset.label?.startsWith('—')) return ctx.dataset.label;
            return `${ctx.dataset.label} : ${fmt(ctx.raw)} DT`;
          },
        },
      },
    },
    scales: {
      x: { grid: { display: false }, ticks: { font: { size: 11 }, color: '#94a3b8' } },
      y: { grid: { color: 'rgba(0,0,0,0.04)' }, ticks: { font: { size: 11 }, color: '#94a3b8' } },
    },
  };

  const optionsBarH = { ...baseOpts, indexAxis: 'y' as const };
  const optionsLine = { ...baseOpts };

  // ── Options Bar Horizontal pour Produit (noms complets visibles) ──
  const optionsProduitH = {
    responsive: true, maintainAspectRatio: false,
    indexAxis: 'y' as const,
    plugins: {
      legend: {
        display: true, position: 'top' as const,
        labels: { font: { size: 10 }, color: '#94a3b8', boxWidth: 20 },
      },
      tooltip: {
        backgroundColor: '#1e293b', titleColor: '#94a3b8', bodyColor: '#f1f5f9',
        padding: 10, cornerRadius: 8,
        callbacks: {
          label: (ctx: any) => {
            if (ctx.dataset.label?.startsWith('—')) return ctx.dataset.label;
            return `${ctx.dataset.label} : ${fmt(ctx.raw)} DT`;
          },
        },
      },
    },
    scales: {
      x: {
        grid: { color: 'rgba(0,0,0,0.04)' },
        ticks: { font: { size: 11 }, color: '#94a3b8' },
      },
      y: {
        grid: { display: false },
        ticks: {
          font: { size: 11 },
          color: '#475569',
          autoSkip: false,
        },
      },
    },
  };

  const exportDashboardPDF = () => {
    const pdf = new jsPDF('portrait', 'mm', 'a4');
    const w = pdf.internal.pageSize.getWidth();
    const pageH = pdf.internal.pageSize.getHeight();
    let y = 10;
    pdf.setFontSize(18);
    pdf.text('Dashboard — Montant Total Achats', w / 2, y, { align: 'center' }); y += 12;
    if (vm.global) {
      pdf.setFontSize(10);
      pdf.text(`Montant Total : ${fmt(montantTotalAchats)} DT  |  Commandes : ${nombreCommandes}`, 10, y); y += 7;
      pdf.text(`Délai moyen réel : ${delaiMoyenReel}j  |  Convenu : ${delaiMoyenConvenu}j`, 10, y); y += 10;
    }
    [{ ref: refFournisseur, label: 'Montant Total par Fournisseur' },
     { ref: refTemps,       label: 'Évolution des Achats par Temps' },
     { ref: refProduit,     label: 'Montant Total par Matière Première' }
    ].forEach(({ ref, label }) => {
      if (!ref.current) return;
      const imgH = 65;
      if (y + imgH > pageH - 10) { pdf.addPage(); y = 10; }
      pdf.setFontSize(10); pdf.text(label, 10, y); y += 5;
      pdf.addImage(ref.current.toBase64Image('image/png', 1), 'PNG', 10, y, w - 20, imgH);
      y += imgH + 8;
    });
    pdf.save('Dashboard_Achats_Montant.pdf');
  };

  const imprimerDashboard = () => {
    const images = [
      { ref: refFournisseur, label: '🚚 Montant Total par Fournisseur' },
      { ref: refTemps,       label: '📈 Évolution des Achats par Temps' },
      { ref: refProduit,     label: '🧱 Montant Total par Matière Première' },
    ].map(({ ref, label }) => ({ label, img: ref.current ? ref.current.toBase64Image('image/png', 1) : null }));
    const now = new Date();
    const win = window.open('', '_blank');
    if (!win) { alert('Autorisez les popups pour ce site.'); return; }
    win.document.write(`<!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8"/>
      <title>Dashboard Achats</title>
      <style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:Arial,sans-serif;padding:28px;color:#111827}
      .hdr{text-align:center;margin-bottom:20px;padding-bottom:12px;border-bottom:2px solid #e5e7eb}
      h1{font-size:18px;font-weight:700;margin-bottom:4px}p{font-size:11px;color:#6b7280}
      .kpis{display:flex;gap:12px;margin-bottom:20px}.kpi{flex:1;border-radius:8px;padding:12px;border:2px solid}
      .cw{margin-bottom:18px;page-break-inside:avoid}
      .cw h3{font-size:11px;font-weight:700;margin-bottom:6px;padding-left:8px;border-left:3px solid #3b82f6}
      .cw img{width:100%;border:1px solid #e5e7eb;border-radius:6px}
      .ftr{margin-top:20px;padding-top:10px;border-top:1px solid #e5e7eb;text-align:center;font-size:10px;color:#9ca3af}
      @media print{@page{margin:10mm;size:A4}}</style></head><body>
      <div class="hdr"><h1>📦 Dashboard — Montant Total Achats</h1>
      <p>Imprimé le ${now.toLocaleDateString('fr-TN')} à ${now.toLocaleTimeString('fr-TN')}</p></div>
      <div class="kpis">
        <div class="kpi" style="border-color:#3b82f6;background:#eff6ff">
          <div style="font-size:9px;color:#1d4ed8;font-weight:700;text-transform:uppercase">💰 Montant Total</div>
          <div style="font-size:20px;font-weight:700;color:#1e40af">${fmt(montantTotalAchats)} DT</div>
          <div style="font-size:10px;color:#3b82f6">${nombreCommandes} commandes</div>
        </div>
        ${fournisseurDominant ? `
        <div class="kpi" style="border-color:#ef4444;background:#fef2f2">
          <div style="font-size:9px;color:#b91c1c;font-weight:700;text-transform:uppercase">⚠️ Fournisseur Dominant</div>
          <div style="font-size:14px;font-weight:700;color:#dc2626">${fournisseurDominant.nomFournisseur}</div>
          <div style="font-size:10px;color:#ef4444">${(fournisseurDominant.montantTotal / totalFournisseurs * 100).toFixed(1)}% — Risque dépendance</div>
        </div>` : ''}
      </div>
      ${images.filter(i => i.img).map(i => `<div class="cw"><h3>${i.label}</h3><img src="${i.img}"/></div>`).join('')}
      <div class="ftr">I-mobile WAS v2.4 — ISO 9001 | Dashboard Achats | ${now.toLocaleDateString('fr-TN')}</div>
      <script>window.onload=function(){setTimeout(()=>{window.print();},500);}</script>
      </body></html>`);
    win.document.close();
  };

  const badgeStyle = connexionStatut === 'connected' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
    : connexionStatut === 'connecting' ? 'bg-amber-50 text-amber-700 border border-amber-200'
    : 'bg-red-50 text-red-700 border border-red-200';

  return (
    <div className="space-y-5">
      <ModalMontant type={modal} vm={vm} onClose={() => setModal(null)} />

      {/* ── Filtres ── */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm px-4 py-3">
        <div className="flex flex-wrap items-center gap-2">
          {[
            { value: vm.queryParams.annee ?? '',      onChange: (v: string) => vm.setAnnee(v ? Number(v) : undefined),    options: vm.availableFilters.annees.map(a => ({ value: a, label: String(a) })),    placeholder: '📅 Toutes les années' },
            { value: vm.queryParams.trimestre ?? '',  onChange: (v: string) => vm.setTrimestre(v ? Number(v) : undefined), options: vm.availableFilters.trimestres.map(t => ({ value: t, label: `T${t}` })),  placeholder: '📆 Tous les trimestres' },
            { value: vm.queryParams.fournisseur ?? '',onChange: (v: string) => vm.setFournisseur(v || undefined),          options: vm.availableFilters.fournisseurs.map(f => ({ value: f, label: f })),       placeholder: '🏭 Tous les fournisseurs' },
            { value: vm.queryParams.produit ?? '',    onChange: (v: string) => vm.setProduit(v || undefined),              options: vm.availableFilters.produits.map(p => ({ value: p, label: p })),           placeholder: '🧱 Toutes les matières premières' },
          ].map((sel, i) => (
            <select key={i} value={sel.value} onChange={e => sel.onChange(e.target.value)}
              className="border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium bg-slate-50 text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-300 transition-all cursor-pointer">
              <option value="">{sel.placeholder}</option>
              {sel.options.map((o: any) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          ))}
          <button onClick={vm.resetFilters} className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 rounded-xl text-xs font-semibold text-slate-600 transition-all">🔄 Réinitialiser</button>
          <div className="ml-auto flex items-center gap-2">
            <button onClick={exportDashboardPDF} className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold transition-all shadow-sm shadow-blue-200">📥 PDF</button>
            <button onClick={imprimerDashboard} className="flex items-center gap-1.5 px-3 py-2 bg-slate-700 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold transition-all">🖨️ Imprimer</button>
            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold ${badgeStyle}`}>
              <div className={`w-1.5 h-1.5 rounded-full ${connexionStatut === 'connected' ? 'bg-emerald-500 animate-pulse' : connexionStatut === 'connecting' ? 'bg-amber-500 animate-pulse' : 'bg-red-500'}`} />
              {connexionStatut === 'connected' ? 'Temps réel' : connexionStatut === 'connecting' ? 'Connexion…' : 'Déconnecté'}
            </div>
            {derniereMAJ && <span className="text-xs text-slate-400 bg-slate-50 px-2 py-1 rounded-lg border border-slate-100">MAJ {derniereMAJ.toLocaleTimeString('fr-FR')}</span>}
          </div>
        </div>
      </div>

      {/* ── Alerte fournisseur dominant ── */}
      {fournisseurDominant && (
        <div className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-2xl px-5 py-3">
          <span className="text-xl">⚠️</span>
          <div className="flex-1">
            <p className="text-sm font-bold text-red-700">Risque de dépendance fournisseur</p>
            <p className="text-xs text-red-500 mt-0.5">
              <strong>{fournisseurDominant.nomFournisseur}</strong> représente{' '}
              <strong>{(fournisseurDominant.montantTotal / totalFournisseurs * 100).toFixed(1)}%</strong>{' '}
              du total des achats. Il est conseillé de diversifier les fournisseurs.
            </p>
          </div>
          <span className="text-xs bg-red-100 text-red-700 px-3 py-1 rounded-full font-semibold border border-red-200 whitespace-nowrap">
            {fmt(fournisseurDominant.montantTotal)} DT
          </span>
        </div>
      )}

      {/* ── KPI Card ── */}
      <div className="relative overflow-hidden bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl p-6 shadow-lg shadow-blue-200">
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-8 translate-x-8" />
        <div className="absolute bottom-0 left-0 w-20 h-20 bg-white/5 rounded-full translate-y-6 -translate-x-4" />
        <div className="relative">
          <span className="text-blue-200 text-xs font-bold uppercase tracking-widest">💰 Montant Total Achats</span>
          <div className="text-4xl font-black text-white tracking-tight mt-2">
            {fmt(montantTotalAchats)}<span className="text-blue-300 text-2xl font-semibold ml-1">DT</span>
          </div>
          <div className="mt-2 text-blue-200 text-xs">
          </div>
        </div>
      </div>

      {/* ── Graphiques ligne 1 ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* Par Fournisseur */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="px-5 py-3.5 border-b border-slate-50 flex items-center justify-between bg-slate-50/50">
            <div>
              <p className="text-sm font-bold text-slate-700">🚚 Montant total des achats Par Fournisseur</p>
             
            </div>
            <ChartActions onDetails={() => setModal('fournisseur')} chartRef={refFournisseur} title="Montant Total Achats par Fournisseur" />
          </div>
          <div className="px-5 pt-2 flex items-center gap-4 text-xs text-slate-400">
            <span className="flex items-center gap-1.5">
              <span className="inline-block w-5 bg-blue-500 h-3 rounded" />
              Barres rouges = fournisseur dominant (&gt;40%)
            </span>
          </div>
          <div className="p-4" style={{ height: 380 }}>
            {vm.parFournisseur.length === 0 ? <EmptyChart /> : <Bar ref={refFournisseur} data={chartFournisseur as any} options={optionsBarH} />}
          </div>
        </div>

        {/* Par Temps */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="px-5 py-3.5 border-b border-slate-50 flex items-center justify-between bg-slate-50/50 flex-wrap gap-2">
            <div>
              <p className="text-sm font-bold text-slate-700">📈 Évolution par Temps</p>
              <p className="text-xs text-slate-400 mt-0.5">Tendance des achats</p>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex bg-slate-100 rounded-lg p-0.5">
                {(['mois','trimestre','annee'] as const).map(v => (
                  <button key={v} onClick={() => setTempsVue(v)}
                    className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all ${tempsVue === v ? 'bg-white shadow-sm text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}>
                    {v === 'mois' ? 'Mois' : v === 'trimestre' ? 'Trim.' : 'Année'}
                  </button>
                ))}
              </div>
              <ChartActions onDetails={() => setModal('temps')} chartRef={refTemps} title="Évolution des Achats par Temps" />
            </div>
          </div>
          <div className="px-5 pt-2 flex items-center gap-4 text-xs text-slate-400">
            <span className="flex items-center gap-1.5">
              <span className="inline-block w-5 border-t-2 border-dashed border-red-400" />
              Moyenne — points rouges = mois anormalement élevés
            </span>
          </div>
          <div className="p-4" style={{ height: 380 }}>
            {tempsData.length === 0 ? <EmptyChart /> : <Line ref={refTemps} data={chartTemps as any} options={optionsLine} />}
          </div>
        </div>
      </div>

      {/* ── Par Matière Première (HORIZONTAL) ── */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="px-5 py-3.5 border-b border-slate-50 flex items-center justify-between bg-slate-50/50">
          <div>
            <p className="text-sm font-bold text-slate-700">🧱 Montant total des achats  Par Matière Première</p>
            <p className="text-xs text-slate-400 mt-0.5">Distribution des achats par matière première</p>
          </div>
          <ChartActions onDetails={() => setModal('produit')} chartRef={refProduit} title="Montant Total Achats par Matière Première" />
        </div>
        <div className="px-5 pt-2 flex items-center gap-4 text-xs text-slate-400">
          <span className="flex items-center gap-1.5">
            <span className="inline-block w-5 border-t-2 border-dashed border-red-400" />
            Moyenne — barres rouges = matières sur-commandées (&gt;2× la moyenne)
          </span>
        </div>
        <div className="p-4" style={{ height: produitChartHeight }}>
          {vm.parProduit.length === 0 ? <EmptyChart /> : <Bar ref={refProduit} data={chartProduit as any} options={optionsProduitH} />}
        </div>
      </div>
    </div>
  );
};

export default AchatsMontantView;