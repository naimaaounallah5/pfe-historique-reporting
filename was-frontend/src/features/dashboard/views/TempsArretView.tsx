// was-frontend/src/features/dashboard/views/TempsArretView.tsx
import { useState, useRef } from 'react';
import {
  Chart as ChartJS, CategoryScale, LinearScale, BarElement,
  LineElement, PointElement, Title, Tooltip, Legend, Filler, ArcElement
} from 'chart.js';
import { Bar, Line } from 'react-chartjs-2';
import jsPDF from 'jspdf';
import { useTempsArretViewModel } from '../viewmodels/temps-arret.viewmodel';

ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, Title, Tooltip, Legend, Filler, ArcElement);

// ── Couleur barre selon valeur ────────────────────────────
const couleurArret = (val: number, max: number) => {
  const ratio = max > 0 ? val / max : 0;
  if (ratio > 0.7) return 'rgba(239,68,68,0.85)';
  if (ratio > 0.4) return 'rgba(249,115,22,0.85)';
  return 'rgba(251,191,36,0.85)';
};

// ── Modal détails ─────────────────────────────────────────
const DetailModal = ({
  type, data, dataTrimestre, dataAnnee, onClose
}: {
  type: string;
  data: any[];
  dataTrimestre?: any[];
  dataAnnee?: any[];
  onClose: () => void;
}) => {
  const [tempsVue, setTempsVue] = useState<'mois' | 'trimestre' | 'annee'>('mois');

  const currentData = type === 'temps'
    ? tempsVue === 'mois' ? data
      : tempsVue === 'trimestre' ? (dataTrimestre ?? [])
      : (dataAnnee ?? [])
    : data;

  if (!currentData.length && type !== 'temps') return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h3 className="font-bold text-gray-800 text-base">
            📊 Détails — {type === 'machine' ? "Temps d'Arrêt par Machine" : type === 'produit' ? "Temps d'Arrêt par Produit" : "Évolution des Arrêts"}
          </h3>
          <div className="flex items-center gap-2">
            {type === 'temps' && (
              <div className="flex gap-1 bg-gray-100 rounded-lg p-0.5">
                {(['mois', 'trimestre', 'annee'] as const).map(v => (
                  <button key={v} onClick={() => setTempsVue(v)}
                    className={`px-3 py-1 rounded-md text-xs font-semibold transition-all ${
                      tempsVue === v ? 'bg-white shadow text-orange-600' : 'text-gray-500 hover:text-gray-700'
                    }`}>
                    {v.charAt(0).toUpperCase() + v.slice(1)}
                  </button>
                ))}
              </div>
            )}
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl font-bold">✕</button>
          </div>
        </div>
        <div className="overflow-y-auto flex-1 p-4">
          <table className="w-full border-collapse">
            <thead className="bg-orange-50 sticky top-0">
              <tr>
                {type === 'machine' && <>
                  <th className="px-4 py-3 text-left text-xs font-bold uppercase text-orange-700">Machine</th>
                  <th className="px-4 py-3 text-left text-xs font-bold uppercase text-orange-700">Groupe</th>
                  <th className="px-4 py-3 text-right text-xs font-bold uppercase text-orange-700">Arrêts (min)</th>
                  <th className="px-4 py-3 text-right text-xs font-bold uppercase text-orange-700">Arrêts (h)</th>
                  <th className="px-4 py-3 text-right text-xs font-bold uppercase text-orange-700">Ordres</th>
                  <th className="px-4 py-3 text-right text-xs font-bold uppercase text-orange-700">%</th>
                </>}
                {type === 'produit' && <>
                  <th className="px-4 py-3 text-left text-xs font-bold uppercase text-orange-700">Produit</th>
                  <th className="px-4 py-3 text-right text-xs font-bold uppercase text-orange-700">Arrêts (min)</th>
                  <th className="px-4 py-3 text-right text-xs font-bold uppercase text-orange-700">Ordres</th>
                  <th className="px-4 py-3 text-right text-xs font-bold uppercase text-orange-700">Moy. arrêt/ordre</th>
                </>}
                {type === 'temps' && <>
                  <th className="px-4 py-3 text-left text-xs font-bold uppercase text-orange-700">Période</th>
                  <th className="px-4 py-3 text-right text-xs font-bold uppercase text-orange-700">Arrêts (min)</th>
                  <th className="px-4 py-3 text-right text-xs font-bold uppercase text-orange-700">Ordres</th>
                </>}
              </tr>
            </thead>
            <tbody>
              {type === 'machine' && currentData.map((item, idx) => (
                <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  <td className="px-4 py-2 text-sm font-medium">{item.machineNom}</td>
                  <td className="px-4 py-2 text-sm">
                    <span className="bg-orange-50 text-orange-700 text-xs px-2 py-0.5 rounded-full">{item.machineGroupe}</span>
                  </td>
                  <td className="px-4 py-2 text-sm text-right font-bold text-orange-600">{item.totalArretMinutes}</td>
                  <td className="px-4 py-2 text-sm text-right text-gray-500">{item.totalArretHeures}h</td>
                  <td className="px-4 py-2 text-sm text-right">{item.nbOrdres}</td>
                  <td className="px-4 py-2 text-sm text-right">
                    <span className="bg-red-50 text-red-600 text-xs px-2 py-0.5 rounded-full font-semibold">{item.pourcentage}%</span>
                  </td>
                </tr>
              ))}
              {type === 'produit' && currentData.map((item, idx) => (
                <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  <td className="px-4 py-2 text-sm font-medium">{item.produitNom}</td>
                  <td className="px-4 py-2 text-sm text-right font-bold text-orange-600">{item.totalArretMinutes}</td>
                  <td className="px-4 py-2 text-sm text-right">{item.nbOrdres}</td>
                  <td className="px-4 py-2 text-sm text-right text-amber-600 font-semibold">{item.moyenneArretParOrdre} min</td>
                </tr>
              ))}
              {type === 'temps' && currentData.map((item, idx) => (
                <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  <td className="px-4 py-2 text-sm font-medium">{item.periode}</td>
                  <td className="px-4 py-2 text-sm text-right font-bold text-orange-600">{item.totalArretMinutes}</td>
                  <td className="px-4 py-2 text-sm text-right">{item.nbOrdres}</td>
                </tr>
              ))}
              {type === 'temps' && currentData.length === 0 && (
                <tr>
                  <td colSpan={3} className="px-4 py-8 text-center text-gray-400 text-sm">📭 Aucune donnée disponible</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// ── ChartActions ──────────────────────────────────────────
const ChartActions = ({ onDetails, chartRef, title, accent = "orange" }: {
  onDetails: () => void; chartRef: React.RefObject<any>;
  title: string; accent?: "orange" | "red" | "amber";
}) => {
  const colorClass = accent === "red"   ? "border-red-200 text-red-600 hover:bg-red-50" :
                     accent === "amber" ? "border-amber-200 text-amber-600 hover:bg-amber-50" :
                     "border-orange-200 text-orange-600 hover:bg-orange-50";

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
    const win = window.open('', '_blank'); if (!win) return;
    win.document.write(`<html><head><title>${title}</title>
      <style>body{margin:20px;font-family:Arial,sans-serif;}
      .hdr{text-align:center;margin-bottom:16px;padding-bottom:12px;border-bottom:2px solid #e5e7eb;}
      h1{font-size:16px;font-weight:700;color:#111827;margin:0 0 4px;}
      p{font-size:11px;color:#6b7280;margin:0;}
      img{max-width:100%;border:1px solid #e5e7eb;border-radius:8px;}
      @media print{@page{size:A4 landscape;margin:12mm;}}</style></head>
      <body><div class="hdr"><h1>${title}</h1>
      <p>Imprimé le ${now.toLocaleDateString('fr-TN')} à ${now.toLocaleTimeString('fr-TN')}</p></div>
      <img src="${imgData}" onload="window.print();window.close()"/></body></html>`);
    win.document.close();
  };

  return (
    <div className="flex items-center gap-1.5">
      <button onClick={onDetails}
        className="flex items-center gap-1 px-2.5 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-semibold text-gray-600 hover:bg-gray-50 shadow-sm">
        🔍 Détails
      </button>
      <button onClick={telechargerPDF}
        className={`flex items-center gap-1 px-2.5 py-1.5 bg-white border rounded-lg text-xs font-semibold shadow-sm ${colorClass}`}>
        📄 PDF
      </button>
      <button onClick={imprimerGraphique}
        className="flex items-center gap-1 px-2.5 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-semibold text-gray-600 hover:bg-gray-50 shadow-sm">
        🖨️
      </button>
    </div>
  );
};

// ════════════════════════════════════════════════════════════
//  COMPOSANT PRINCIPAL
// ════════════════════════════════════════════════════════════
const TempsArretView = () => {
  const vm = useTempsArretViewModel();
  const { connexionStatut, derniereMAJ } = vm;

  const [tempsVue,    setTempsVue]    = useState<'mois'|'trimestre'|'annee'>('mois');
  const [detailModal, setDetailModal] = useState<{type:string; data:any[]; dataTrimestre?:any[]; dataAnnee?:any[]} | null>(null);

  const refMachines = useRef<any>(null);
  const refProduits = useRef<any>(null);
  const refTemps    = useRef<any>(null);

  if (vm.loading) return (
    <div className="flex items-center justify-center py-32">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-gray-500 font-medium">Chargement des données…</p>
      </div>
    </div>
  );

  if (vm.error) return (
    <div className="flex items-center justify-center py-32">
      <div className="text-center text-red-500">⚠ {vm.error}</div>
    </div>
  );

  const globalData = vm.global || {
    totalArretMinutes: 0, totalArretHeures: 0,
    nbOrdres: 0, moyenneArretParOrdre: 0
  };

  const machines       = vm.machines       || [];
  const produits       = vm.produits       || [];
  const tempsMois      = vm.tempsMois      || [];
  const tempsTrimestre = vm.tempsTrimestre || [];
  const tempsAnnee     = vm.tempsAnnee     || [];
  const annees         = vm.annees         || [];

  const tempsData = tempsVue === 'mois' ? tempsMois
    : tempsVue === 'trimestre' ? tempsTrimestre
    : tempsAnnee;

  const toutesMachines = [...machines].sort((a:any,b:any) => b.totalArretMinutes - a.totalArretMinutes);
  const tousProduits   = [...produits].sort((a:any,b:any) => b.totalArretMinutes - a.totalArretMinutes);

  // ── Couleurs dynamiques selon valeur ──
  const maxMachine = Math.max(...toutesMachines.map((m:any) => m.totalArretMinutes || 0), 1);
  const maxProduit = Math.max(...tousProduits.map((p:any)  => p.totalArretMinutes || 0), 1);

  const chartMachines = {
    labels: toutesMachines.map((m:any) => m.machineNom.length>20 ? m.machineNom.slice(0,20)+'…' : m.machineNom),
    datasets: [{
      label: "Temps d'Arrêt (min)",
      data: toutesMachines.map((m:any) => m.totalArretMinutes||0),
      backgroundColor: toutesMachines.map((m:any) => couleurArret(m.totalArretMinutes||0, maxMachine)),
      borderRadius: 5,
    }],
  };

  const chartProduits = {
    labels: tousProduits.map((p:any) => p.produitNom.length>20 ? p.produitNom.slice(0,20)+'…' : p.produitNom),
    datasets: [{
      label: "Temps d'Arrêt (min)",
      data: tousProduits.map((p:any) => p.totalArretMinutes||0),
      backgroundColor: tousProduits.map((p:any) => couleurArret(p.totalArretMinutes||0, maxProduit)),
      borderRadius: 5,
    }],
  };

  const chartTemps = {
    labels: tempsData.map((t:any) => t.periode||''),
    datasets: [{
      label: "Temps d'Arrêt (min)",
      data: tempsData.map((t:any) => t.totalArretMinutes||0),
      borderColor: '#f97316',
      backgroundColor: 'rgba(249,115,22,0.12)',
      borderWidth: 2.5, fill: true, tension: 0.4,
      pointBackgroundColor: tempsData.map((t:any) => {
        const val = t.totalArretMinutes || 0;
        const max = Math.max(...tempsData.map((x:any) => x.totalArretMinutes||0), 1);
        return couleurArret(val, max);
      }),
      pointRadius: 5,
      pointHoverRadius: 7,
    }],
  };

  const baseTooltip = {
    backgroundColor: '#0f172a',
    titleColor: '#f8fafc',
    bodyColor: '#cbd5e1',
    borderColor: '#334155',
    borderWidth: 1,
    padding: 10,
    cornerRadius: 8,
    callbacks: {
      label: (ctx: any) => ` ${ctx.raw} min`,
    },
  };

  const optionsBarH = {
    responsive: true, maintainAspectRatio: false,
    indexAxis: 'y' as const,
    plugins: {
      legend: { display: false },
      tooltip: baseTooltip,
    },
    scales: {
      x: {
        grid: { color: 'rgba(0,0,0,0.04)' },
        border: { display: false },
        ticks: { color: '#94a3b8', font: { size: 11 }, callback: (val:any) => val+' min' },
      },
      y: {
        grid: { display: false },
        border: { display: false },
        ticks: { color: '#475569', font: { size: 11 } },
      },
    },
  };

  const optionsLine = {
    responsive: true, maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: baseTooltip,
    },
    scales: {
      x: {
        grid: { display: false },
        border: { display: false },
        ticks: { color: '#94a3b8', font: { size: 11 } },
      },
      y: {
        min: 0,
        grid: { color: 'rgba(0,0,0,0.04)' },
        border: { display: false },
        ticks: { color: '#94a3b8', font: { size: 11 }, callback: (val:any) => val+' min' },
      },
    },
  };

  const exportDashboardPDF = () => {
    const pdf = new jsPDF('portrait','mm','a4');
    const w = pdf.internal.pageSize.getWidth();
    const pageH = pdf.internal.pageSize.getHeight();
    let y = 10;
    pdf.setFontSize(18);
    pdf.text("Temps d'Arrêt Machine", w/2, y, { align:'center' }); y+=12;
    pdf.setFontSize(10);
    pdf.text(`Total Arrêts : ${globalData.totalArretMinutes} min (${globalData.totalArretHeures} h)  |  Ordres : ${globalData.nbOrdres}`, 10, y); y+=7;
    pdf.text(`Moyenne par ordre : ${globalData.moyenneArretParOrdre} min`, 10, y); y+=10;
    const charts = [
      { ref:refMachines, label:"Temps d'Arrêt par Machine" },
      { ref:refProduits, label:"Temps d'Arrêt par Produit" },
      { ref:refTemps,    label:"Évolution des Temps d'Arrêt" },
    ];
    charts.forEach(({ref,label}) => {
      if (!ref.current) return;
      const imgH = 70;
      if (y+imgH > pageH-20) { pdf.addPage(); y=10; }
      pdf.setFontSize(12); pdf.text(label, 10, y); y+=6;
      pdf.addImage(ref.current.toBase64Image('image/png',1), 'PNG', 10, y, w-20, imgH);
      y += imgH+8;
    });
    pdf.save('Temps_Arret_Dashboard.pdf');
  };

  const imprimerDashboard = () => {
    const charts = [
      { ref:refMachines, label:"Temps d'Arrêt par Machine" },
      { ref:refProduits, label:"Temps d'Arrêt par Produit" },
      { ref:refTemps,    label:"Évolution des Temps d'Arrêt" },
    ];
    const images = charts.map(({ref,label}) => ({
      label, img: ref.current ? ref.current.toBase64Image('image/png',1) : null,
    }));
    const now = new Date();
    const win = window.open('','_blank');
    if (!win) { alert('Autorisez les popups pour ce site.'); return; }
    win.document.write(`<!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8"/>
      <title>Temps d'Arrêt Machine</title>
      <style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:Arial,sans-serif;padding:20px;color:#111827}
      .hdr{text-align:center;margin-bottom:20px;padding-bottom:10px;border-bottom:2px solid #e5e7eb}
      h1{font-size:18px;font-weight:700;margin-bottom:5px}.hdr p{font-size:11px;color:#6b7280}
      .kpis{display:flex;gap:15px;margin-bottom:20px;flex-wrap:wrap}
      .kpi{flex:1;min-width:200px;border-radius:8px;padding:15px;border:2px solid}
      .cw{margin-bottom:20px;page-break-inside:avoid}
      .cw h3{font-size:12px;font-weight:700;margin-bottom:8px;padding-left:8px;border-left:3px solid #f97316}
      .cw img{width:100%;border:1px solid #e5e7eb;border-radius:5px}
      .ftr{margin-top:20px;padding-top:10px;border-top:1px solid #e5e7eb;text-align:center;font-size:10px;color:#9ca3af}
      @media print{@page{margin:1cm}}</style></head><body>
      <div class="hdr"><h1>⏱️ Temps d'Arrêt Machine</h1>
      <p>Imprimé le ${now.toLocaleDateString('fr-TN')} à ${now.toLocaleTimeString('fr-TN')}</p></div>
      <div class="kpis">
        <div class="kpi" style="border-color:#f97316;background:#fff7ed;">
          <div style="font-size:9px;color:#9a3412;font-weight:700;text-transform:uppercase;">⏱️ Total Arrêts</div>
          <div style="font-size:20px;font-weight:700;color:#c2410c;">${globalData.totalArretMinutes} min</div>
          <div style="font-size:10px;color:#f97316;">${globalData.totalArretHeures} heures</div>
        </div>
        <div class="kpi" style="border-color:#ef4444;background:#fef2f2;">
          <div style="font-size:9px;color:#b91c1c;font-weight:700;text-transform:uppercase;">📊 Nombre d'Ordres</div>
          <div style="font-size:20px;font-weight:700;color:#dc2626;">${globalData.nbOrdres}</div>
        </div>
        <div class="kpi" style="border-color:#f59e0b;background:#fffbeb;">
          <div style="font-size:9px;color:#b45309;font-weight:700;text-transform:uppercase;">📈 Moyenne/Ordre</div>
          <div style="font-size:20px;font-weight:700;color:#d97706;">${globalData.moyenneArretParOrdre} min</div>
        </div>
      </div>
      ${images.filter(i=>i.img).map(i=>`<div class="cw"><h3>${i.label}</h3><img src="${i.img}"/></div>`).join('')}
      <div class="ftr">I-mobile WAS v2.4 — ISO 9001 | Temps d'Arrêt Machine | ${now.toLocaleDateString('fr-TN')}</div>
      <script>window.onload=function(){setTimeout(function(){window.print();window.close();},500);};<\/script>
      </body></html>`);
    win.document.close();
  };

  return (
    <div className="space-y-6">
      {detailModal && (
        <DetailModal
          type={detailModal.type}
          data={detailModal.data}
          dataTrimestre={detailModal.dataTrimestre}
          dataAnnee={detailModal.dataAnnee}
          onClose={() => setDetailModal(null)}
        />
      )}

      {/* ── Filtres ── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
        <div className="flex flex-wrap items-center gap-3">
          <select value={vm.queryParams?.annee??''} onChange={e=>vm.setAnnee(e.target.value?Number(e.target.value):undefined)}
            className="border border-gray-200 rounded-xl px-3 py-2 text-sm bg-white shadow-sm">
            <option value="">Toutes les années</option>
            {annees.filter((a:number) => a !== 2026).map((a:number) => <option key={a} value={a}>{a}</option>)}
          </select>
          <select value={vm.queryParams?.trimestre??''} onChange={e=>vm.setTrimestre(e.target.value?Number(e.target.value):undefined)}
            className="border border-gray-200 rounded-xl px-3 py-2 text-sm bg-white shadow-sm">
            <option value="">Tous les trimestres</option>
            <option value="1">T1</option><option value="2">T2</option>
            <option value="3">T3</option><option value="4">T4</option>
          </select>
          <select value={vm.queryParams?.machineId??''} onChange={e=>vm.setMachineId(e.target.value?Number(e.target.value):undefined)}
            className="border border-gray-200 rounded-xl px-3 py-2 text-sm bg-white shadow-sm">
            <option value="">Toutes les machines</option>
            {machines.map((m:any) => <option key={m.machineId} value={m.machineId}>{m.machineNom}</option>)}
          </select>
          <select value={vm.queryParams?.produitId??''} onChange={e=>vm.setProduitId(e.target.value?Number(e.target.value):undefined)}
            className="border border-gray-200 rounded-xl px-3 py-2 text-sm bg-white shadow-sm">
            <option value="">Tous les produits</option>
            {produits.map((p:any) => <option key={p.produitId} value={p.produitId}>{p.produitNom}</option>)}
          </select>
          <button onClick={vm.resetFilters}
            className="flex items-center gap-1.5 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-xl text-sm font-semibold text-gray-600 transition-all">
            🔄 Réinitialiser
          </button>
          <div className="ml-auto flex items-center gap-2">
            <button onClick={exportDashboardPDF}
              className="flex items-center gap-1.5 px-3 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-xs font-semibold transition-all">
              📥 PDF
            </button>
            <button onClick={imprimerDashboard}
              className="flex items-center gap-1.5 px-3 py-2 bg-gray-700 hover:bg-gray-800 text-white rounded-xl text-xs font-semibold transition-all">
              🖨️ Imprimer
            </button>
            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold ${
              connexionStatut==='connected'  ? 'bg-emerald-50 text-emerald-700' :
              connexionStatut==='connecting' ? 'bg-amber-50 text-amber-700' :
              'bg-red-50 text-red-700'}`}>
              <div className={`w-1.5 h-1.5 rounded-full ${
                connexionStatut==='connected'  ? 'bg-emerald-500 animate-pulse' :
                connexionStatut==='connecting' ? 'bg-amber-500' : 'bg-red-500'}`} />
              {connexionStatut==='connected'  ? 'Temps réel' :
               connexionStatut==='connecting' ? 'Connexion...' : 'Déconnecté'}
            </div>
            {derniereMAJ && (
              <span className="text-xs text-gray-400">
                MAJ : {derniereMAJ.toLocaleTimeString('fr-FR')}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ── KPI Cards ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-orange-50 to-orange-100 border border-orange-200 rounded-2xl p-5 overflow-hidden relative">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-orange-400 to-orange-600" />
          <div className="text-xs font-bold text-orange-600 uppercase tracking-wider mb-2">⏱️ Total Arrêts</div>
          <div className="text-3xl font-black text-orange-700">{globalData.totalArretMinutes} <span className="text-lg font-normal">min</span></div>
          <div className="text-xs text-orange-500 mt-1">{globalData.totalArretHeures} heures au total</div>
        </div>
        <div className="bg-gradient-to-br from-red-50 to-red-100 border border-red-200 rounded-2xl p-5 overflow-hidden relative">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-red-400 to-red-600" />
          <div className="text-xs font-bold text-red-600 uppercase tracking-wider mb-2">📊 Ordres Concernés</div>
          <div className="text-3xl font-black text-red-700">{globalData.nbOrdres}</div>
          <div className="text-xs text-red-500 mt-1">ordres de production</div>
        </div>
        <div className="bg-gradient-to-br from-amber-50 to-amber-100 border border-amber-200 rounded-2xl p-5 overflow-hidden relative">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-400 to-amber-600" />
          <div className="text-xs font-bold text-amber-600 uppercase tracking-wider mb-2">📈 Moyenne / Ordre</div>
          <div className="text-3xl font-black text-amber-700">{globalData.moyenneArretParOrdre} <span className="text-lg font-normal">min</span></div>
          <div className="text-xs text-amber-500 mt-1">par production</div>
        </div>
      </div>

      {/* ── Légende couleurs ── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-5 py-3 flex items-center gap-6 text-xs text-gray-500">
        <span className="font-semibold text-gray-600">Niveau d'arrêt :</span>
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm inline-block" style={{background:'rgba(239,68,68,0.85)'}}/> Élevé (&gt; 70% du max)</span>
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm inline-block" style={{background:'rgba(249,115,22,0.85)'}}/> Moyen (40–70%)</span>
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm inline-block" style={{background:'rgba(251,191,36,0.85)'}}/> Faible (&lt; 40%)</span>
      </div>

      {/* ── Graphiques Machine + Produit côte à côte ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Machine */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
          <div className="px-4 py-3 border-b border-gray-50 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-orange-50 border border-orange-200 flex items-center justify-center text-sm">🔧</div>
              <div>
                <div className="text-sm font-bold text-gray-800">Temps d'Arrêt par Machine</div>
                <div className="text-xs text-gray-400">Trié par arrêt décroissant</div>
              </div>
            </div>
            <ChartActions
              onDetails={() => setDetailModal({type:'machine', data:machines})}
              chartRef={refMachines}
              title="Temps d'Arrêt par Machine"
              accent="orange"
            />
          </div>
          <div className="p-4" style={{ height: 520 }}>
            {toutesMachines.length === 0
              ? <div className="flex items-center justify-center h-full text-gray-400 text-sm">📭 Aucune donnée disponible</div>
              : <Bar ref={refMachines} data={chartMachines} options={optionsBarH} />}
          </div>
        </div>

        {/* Produit */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
          <div className="px-4 py-3 border-b border-gray-50 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-red-50 border border-red-200 flex items-center justify-center text-sm">📦</div>
              <div>
                <div className="text-sm font-bold text-gray-800">Temps d'Arrêt par Produit</div>
                <div className="text-xs text-gray-400">Trié par arrêt décroissant</div>
              </div>
            </div>
            <ChartActions
              onDetails={() => setDetailModal({type:'produit', data:produits})}
              chartRef={refProduits}
              title="Temps d'Arrêt par Produit"
              accent="red"
            />
          </div>
          <div className="p-4" style={{ height: 520 }}>
            {tousProduits.length === 0
              ? <div className="flex items-center justify-center h-full text-gray-400 text-sm">📭 Aucune donnée disponible</div>
              : <Bar ref={refProduits} data={chartProduits} options={optionsBarH} />}
          </div>
        </div>
      </div>

      {/* ── Évolution ── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
        <div className="px-4 py-3 border-b border-gray-50 flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-amber-50 border border-amber-200 flex items-center justify-center text-sm">📈</div>
            <div>
              <div className="text-sm font-bold text-gray-800">Évolution des Temps d'Arrêt</div>
              <div className="text-xs text-gray-400">Tendance dans le temps</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex gap-1 bg-gray-100 rounded-lg p-0.5">
              {(['mois','trimestre','annee'] as const).map(v => (
                <button key={v} onClick={() => setTempsVue(v)}
                  className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all ${
                    tempsVue===v ? 'bg-white shadow text-orange-600' : 'text-gray-500'
                  }`}>
                  {v.charAt(0).toUpperCase()+v.slice(1)}
                </button>
              ))}
            </div>
            <ChartActions
              onDetails={() => setDetailModal({
                type: 'temps',
                data: tempsMois,
                dataTrimestre: tempsTrimestre,
                dataAnnee: tempsAnnee,
              })}
              chartRef={refTemps}
              title="Évolution des Arrêts"
              accent="amber"
            />
          </div>
        </div>
        <div className="p-4" style={{ height: 300 }}>
          {tempsData.length === 0
            ? <div className="flex items-center justify-center h-full text-gray-400 text-sm">📭 Aucune donnée disponible</div>
            : <Line ref={refTemps} data={chartTemps} options={optionsLine} />}
        </div>
      </div>
    </div>
  );
};

export default TempsArretView;
