// features/dashboard/views/QualiteGlobalView.tsx
import { useState, useRef, useEffect } from 'react';
import {
  Chart as ChartJS, CategoryScale, LinearScale, BarElement,
  LineElement, PointElement, Title, Tooltip, Legend, Filler, ArcElement
} from 'chart.js';
import { Bar, Line, Doughnut } from 'react-chartjs-2';
import jsPDF from 'jspdf';
import * as signalR from '@microsoft/signalr';
import { useQualiteViewModel } from '../viewmodels/qualite.viewmodel';

ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, Title, Tooltip, Legend, Filler, ArcElement);

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

const doughnutLabelPlugin = {
  id: 'doughnutLabel',
  afterDatasetsDraw: (chart: any) => {
    const { ctx, data } = chart;
    const total = data.datasets[0].data.reduce((a: number, b: number) => a + b, 0);
    if (total === 0) return;
    const meta = chart.getDatasetMeta(0);
    meta.data.forEach((element: any, index: number) => {
      const value = data.datasets[0].data[index];
      const percentage = ((value / total) * 100).toFixed(1);
      const isSmall = parseFloat(percentage) < 5;
      const position = element.tooltipPosition();
      ctx.save();
      ctx.font = isSmall ? 'bold 11px sans-serif' : 'bold 14px sans-serif';
      ctx.fillStyle = '#ffffff';
      ctx.shadowBlur = 0;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(`${percentage}%`, position.x, position.y);
      ctx.restore();
    });
  }
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

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h3 className="font-bold text-gray-800 text-base">
            📊 Détails - {type === 'produit' ? 'Taux de Défaut par Produit' :
                         type === 'machine' ? 'Taux de Défaut par Machine' :
                         type === 'temps' ? 'Évolution du Taux de Défaut' :
                         'Répartition Conformes / Défauts'}
          </h3>
          <div className="flex items-center gap-3">
            {type === 'temps' && (
              <div className="flex gap-1 bg-gray-100 rounded-lg p-0.5">
                {(['mois', 'trimestre', 'annee'] as const).map(v => (
                  <button key={v} onClick={() => setTempsVue(v)}
                    className={`px-3 py-1 rounded-md text-xs font-semibold transition-all ${
                      tempsVue === v ? 'bg-white shadow text-purple-600' : 'text-gray-500 hover:text-gray-700'
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
          {currentData.length === 0 ? (
            <EmptyChart />
          ) : (
            <table className="w-full border-collapse">
              <thead className="bg-purple-50 sticky top-0">
                <tr>
                  {type === 'produit' && (<>
                    <th className="px-4 py-3 text-left text-xs font-bold uppercase">Produit</th>
                    <th className="px-4 py-3 text-left text-xs font-bold uppercase">Catégorie</th>
                    <th className="px-4 py-3 text-right text-xs font-bold uppercase">Contrôles</th>
                    <th className="px-4 py-3 text-right text-xs font-bold uppercase">Défauts</th>
                    <th className="px-4 py-3 text-right text-xs font-bold uppercase">Taux</th>
                  </>)}
                  {type === 'machine' && (<>
                    <th className="px-4 py-3 text-left text-xs font-bold uppercase">Machine</th>
                    <th className="px-4 py-3 text-left text-xs font-bold uppercase">Groupe</th>
                    <th className="px-4 py-3 text-left text-xs font-bold uppercase">Site</th>
                    <th className="px-4 py-3 text-right text-xs font-bold uppercase">Contrôles</th>
                    <th className="px-4 py-3 text-right text-xs font-bold uppercase">Défauts</th>
                    <th className="px-4 py-3 text-right text-xs font-bold uppercase">Taux</th>
                  </>)}
                  {type === 'temps' && (<>
                    <th className="px-4 py-3 text-left text-xs font-bold uppercase">Période</th>
                    <th className="px-4 py-3 text-right text-xs font-bold uppercase">Contrôles</th>
                    <th className="px-4 py-3 text-right text-xs font-bold uppercase">Défauts</th>
                    <th className="px-4 py-3 text-right text-xs font-bold uppercase">Taux</th>
                  </>)}
                  {type === 'repartition' && (<>
                    <th className="px-4 py-3 text-left text-xs font-bold uppercase">Catégorie</th>
                    <th className="px-4 py-3 text-right text-xs font-bold uppercase">Nombre</th>
                    <th className="px-4 py-3 text-right text-xs font-bold uppercase">Pourcentage</th>
                  </>)}
                </tr>
              </thead>
              <tbody>
                {type === 'produit' && currentData.map((item, idx) => (
                  <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="px-4 py-2 text-sm">{item.produit}</td>
                    <td className="px-4 py-2 text-sm">{item.categorie}</td>
                    <td className="px-4 py-2 text-sm text-right">{fmt(item.nombreControles)}</td>
                    <td className="px-4 py-2 text-sm text-right text-red-600 font-semibold">{fmt(item.nombreDefauts)}</td>
                    <td className="px-4 py-2 text-sm text-right font-bold">{item.tauxDefaut}%</td>
                  </tr>
                ))}
                {type === 'machine' && currentData.map((item, idx) => (
                  <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="px-4 py-2 text-sm">{item.machine}</td>
                    <td className="px-4 py-2 text-sm">{item.groupe}</td>
                    <td className="px-4 py-2 text-sm">{item.site}</td>
                    <td className="px-4 py-2 text-sm text-right">{fmt(item.nombreControles)}</td>
                    <td className="px-4 py-2 text-sm text-right text-red-600 font-semibold">{fmt(item.nombreDefauts)}</td>
                    <td className="px-4 py-2 text-sm text-right font-bold">{item.tauxDefaut}%</td>
                  </tr>
                ))}
                {type === 'temps' && currentData.map((item, idx) => (
                  <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="px-4 py-2 text-sm">{item.label}</td>
                    <td className="px-4 py-2 text-sm text-right">{fmt(item.nombreControles)}</td>
                    <td className="px-4 py-2 text-sm text-right text-red-600 font-semibold">{fmt(item.nombreDefauts)}</td>
                    <td className="px-4 py-2 text-sm text-right font-bold">{item.tauxDefaut}%</td>
                  </tr>
                ))}
                {type === 'repartition' && currentData.map((item, idx) => {
                  const total = (currentData[0]?.valeur + currentData[1]?.valeur) || 1;
                  const pourcentage = ((item.valeur / total) * 100).toFixed(1);
                  return (
                    <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <td className="px-4 py-2 text-sm font-medium">{item.label}</td>
                      <td className="px-4 py-2 text-sm text-right font-semibold">{fmt(item.valeur)}</td>
                      <td className="px-4 py-2 text-sm text-right font-bold">{pourcentage}%</td>
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

const ChartActions = ({ onDetails, chartRef, title }: {
  onDetails: () => void;
  chartRef: React.RefObject<any>;
  title: string
}) => {
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
      <style>
        body{margin:20px;font-family:Arial,sans-serif;}
        .hdr{text-align:center;margin-bottom:16px;padding-bottom:12px;border-bottom:2px solid #e5e7eb;}
        h1{font-size:16px;font-weight:700;color:#111827;margin:0 0 4px;}
        p{font-size:11px;color:#6b7280;margin:0;}
        img{max-width:100%;border:1px solid #e5e7eb;border-radius:8px;}
        @media print{@page{size:A4 landscape;margin:12mm;}}
      </style></head>
      <body>
        <div class="hdr">
          <h1>${title}</h1>
          <p>Imprimé le ${now.toLocaleDateString('fr-TN')} à ${now.toLocaleTimeString('fr-TN')}</p>
        </div>
        <img src="${imgData}" onload="window.print();window.close()"/>
      </body></html>
    `);
    win.document.close();
  };

  return (
    <div className="flex items-center gap-1.5">
      <button onClick={onDetails}
        className="flex items-center gap-1 px-2.5 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-semibold text-gray-600 hover:bg-gray-50 shadow-sm">
        🔍 Détails
      </button>
      <button onClick={telechargerPDF}
        className="flex items-center gap-1 px-2.5 py-1.5 bg-white border border-purple-200 rounded-lg text-xs font-semibold text-purple-600 hover:bg-purple-50 shadow-sm">
        📄 PDF
      </button>
      <button onClick={imprimerGraphique}
        className="flex items-center gap-1 px-2.5 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-semibold text-gray-600 hover:bg-gray-50 shadow-sm">
        🖨️
      </button>
    </div>
  );
};

const QualiteGlobalView = () => {
  const vm = useQualiteViewModel();
  const [tempsVue, setTempsVue] = useState<'mois'|'trimestre'|'annee'>('mois');
  const [connexionStatut, setConnexionStatut] = useState<'connected'|'connecting'|'disconnected'>('connecting');
  const [derniereMAJ, setDerniereMAJ] = useState<Date | null>(null);
  const [detailModal, setDetailModal] = useState<{
    type: string; data: any[]; dataTrimestre?: any[]; dataAnnee?: any[];
  } | null>(null);

  const refTemps    = useRef<any>(null);
  const refProduit  = useRef<any>(null);
  const refMachine  = useRef<any>(null);
  const refDoughnut = useRef<any>(null);
  const dashboardRef = useRef<HTMLDivElement>(null);

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
          .withUrl(HUB_URL)
          .withAutomaticReconnect([0, 2000, 5000, 10000])
          .configureLogging(signalR.LogLevel.Error)
          .build();

        connection.on('DashboardMisAJour', () => { if (mounted) { vm.refetch(); setDerniereMAJ(new Date()); } });
        connection.on('dashboardmisajour', () => { if (mounted) { vm.refetch(); setDerniereMAJ(new Date()); } });
        connection.onreconnecting(() => { if (mounted) setConnexionStatut('connecting'); });
        connection.onreconnected(() => { if (mounted) { setConnexionStatut('connected'); vm.refetch(); } });
        connection.onclose(() => { if (mounted) setConnexionStatut('disconnected'); globalConnection = null; });

        await connection.start();
        if (mounted) { setConnexionStatut('connected'); globalConnection = connection; }
      } catch (err) {
        if (mounted) { setConnexionStatut('disconnected'); reconnectTimer = setTimeout(connectSignalR, 5000); }
      }
    };

    connectSignalR();
    return () => {
      mounted = false;
      if (reconnectTimer) clearTimeout(reconnectTimer);
      globalConnectionCount--;
      if (globalConnectionCount === 0 && globalConnection) { globalConnection.stop(); globalConnection = null; }
    };
  }, []);

  if (vm.loading) return (
    <div className="flex items-center justify-center py-32">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-gray-500 font-medium">Chargement des données qualité…</p>
      </div>
    </div>
  );

  if (vm.error) return (
    <div className="flex items-center justify-center py-32">
      <div className="text-center text-red-500">⚠ {vm.error}</div>
    </div>
  );

  if (!vm.global) return null;

  const tempsData = tempsVue === 'mois' ? vm.parTempsMois
    : tempsVue === 'trimestre' ? vm.parTempsTrimestre
    : vm.parTempsAnnee;

  const chartTemps = {
    labels: tempsData.map(t => t.label),
    datasets: [{
      label: 'Taux de Défaut (%)',
      data: tempsData.map(t => t.tauxDefaut),
      borderColor: '#8B5CF6', backgroundColor: 'rgba(139,92,246,0.1)',
      borderWidth: 2, fill: true, tension: 0.4,
      pointBackgroundColor: tempsData.map(t => t.tauxDefaut > 5 ? '#EF4444' : '#8B5CF6'),
      pointRadius: 4,
    }],
  };

  const chartProduit = {
    labels: vm.parProduit.map(p => p.produit.length > 18 ? p.produit.slice(0,18)+'…' : p.produit),
    datasets: [{
      label: 'Taux de Défaut (%)',
      data: vm.parProduit.map(p => p.tauxDefaut),
      backgroundColor: vm.parProduit.map(p => p.tauxDefaut > 10 ? 'rgba(239,68,68,0.8)' : p.tauxDefaut > 5 ? 'rgba(245,158,11,0.8)' : 'rgba(16,185,129,0.8)'),
      borderRadius: 5,
    }],
  };

  const chartMachine = {
    labels: vm.parMachine.map(m => m.machine.length > 15 ? m.machine.slice(0,15)+'…' : m.machine),
    datasets: [{
      label: 'Taux de Défaut (%)',
      data: vm.parMachine.map(m => m.tauxDefaut),
      backgroundColor: vm.parMachine.map(m => m.tauxDefaut > 10 ? 'rgba(239,68,68,0.8)' : m.tauxDefaut > 5 ? 'rgba(245,158,11,0.8)' : 'rgba(16,185,129,0.8)'),
      borderRadius: 5,
    }],
  };

  const conformes = vm.global?.nombreProduitsConformes ?? 0;
  const defauts = vm.global?.nombreDefauts ?? 0;
  const total = conformes + defauts;

  const chartDoughnut = {
    labels: ['Conformes', 'Défectueux'],
    datasets: [{
      data: [conformes, defauts],
      backgroundColor: ['#10B981', '#EF4444'],
      borderWidth: 0,
    }],
  };

  const optionsLine = {
    responsive: true, maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      y: {
        beginAtZero: true,
        max: tempsData.length > 0 ? Math.max(...tempsData.map(t => t.tauxDefaut), 10) + 2 : 12,
        ticks: { callback: (val: any) => val.toFixed(1) + '%', stepSize: 2 },
      },
    },
  };

  const optionsBar = {
    responsive: true, maintainAspectRatio: false,
    indexAxis: 'y' as const,
    plugins: { legend: { display: false } },
    scales: {
      x: {
        beginAtZero: true,
        max: vm.parProduit.length > 0 ? Math.max(...vm.parProduit.map(p => p.tauxDefaut), 10) + 2 : 12,
        ticks: { callback: (val: any) => val.toFixed(1) + '%', stepSize: 2 },
      },
    },
  };

  const optionsBarV = {
    responsive: true, maintainAspectRatio: false,
    indexAxis: 'y' as const,
    plugins: { legend: { display: false }, title: { display: false } },
    scales: {
      x: {
        beginAtZero: true,
        max: vm.parMachine.length > 0 ? Math.max(...vm.parMachine.map(m => m.tauxDefaut), 10) + 2 : 12,
        ticks: { callback: (val: any) => val.toFixed(1) + '%', stepSize: 2 },
      },
    },
  };

  const optionsDoughnut = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: { font: { size: 12 }, usePointStyle: true }
      },
      tooltip: {
        callbacks: {
          label: (ctx: any) => {
            const value = ctx.raw;
            const percentage = ((value / total) * 100).toFixed(1);
            return `${ctx.label}: ${value.toLocaleString()} pièces (${percentage}%)`;
          }
        }
      },
    },
  };

  const exportDashboardPDF = () => {
    const pdf = new jsPDF('portrait', 'mm', 'a4');
    const w = pdf.internal.pageSize.getWidth();
    const pageH = pdf.internal.pageSize.getHeight();
    let y = 10;
    pdf.setFontSize(18);
    pdf.text('Dashboard — Taux de Défaut', w / 2, y, { align: 'center' }); y += 12;
    pdf.setFontSize(10);
    pdf.text(`Taux de défaut moyen : ${vm.global?.tauxDefautMoyen ?? 0}%  |  Produits contrôlés : ${vm.global?.nombreProduitsControles ?? 0}`, 10, y); y += 7;
    pdf.text(`Défauts : ${vm.global?.nombreDefauts ?? 0}  |  Conformes : ${vm.global?.nombreProduitsConformes ?? 0} (${vm.global?.tauxConformite ?? 0}%)`, 10, y); y += 10;
    const charts = [
      { ref: refTemps,    label: 'Évolution du Taux de Défaut' },
      { ref: refProduit,  label: 'Taux de Défaut par Produit' },
      { ref: refMachine,  label: 'Taux de Défaut par Machine' },
      { ref: refDoughnut, label: 'Répartition Conformes / Défauts' },
    ];
    charts.forEach(({ ref, label }) => {
      if (!ref.current) return;
      const imgH = 55;
      if (y + imgH > pageH - 10) { pdf.addPage(); y = 10; }
      pdf.setFontSize(10); pdf.text(label, 10, y); y += 5;
      pdf.addImage(ref.current.toBase64Image('image/png', 1), 'PNG', 10, y, w - 20, imgH);
      y += imgH + 8;
    });
    pdf.save('Dashboard_Qualite.pdf');
  };

  const imprimerDashboard = () => {
    const charts = [
      { ref: refTemps,    label: '📈 Évolution du Taux de Défaut' },
      { ref: refProduit,  label: '📦 Taux de Défaut par Produit' },
      { ref: refMachine,  label: '⚙️ Taux de Défaut par Machine' },
      { ref: refDoughnut, label: '🥧 Répartition Conformes / Défauts' },
    ];
    const images = charts.map(({ ref, label }) => ({ label, img: ref.current ? ref.current.toBase64Image('image/png', 1) : null }));
    const now = new Date();
    const win = window.open('', '_blank');
    if (!win) { alert('Autorisez les popups pour ce site.'); return; }

    const conformite = vm.global?.tauxConformite ?? 0;
    const defautsPct = vm.global?.tauxDefautMoyen ?? 0;

    win.document.write(`<!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8"/>
      <title>Dashboard Qualité</title>
      <style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:Arial,sans-serif;padding:20px;color:#111827}
      .hdr{text-align:center;margin-bottom:20px;padding-bottom:10px;border-bottom:2px solid #e5e7eb}
      h1{font-size:18px;font-weight:700;margin-bottom:5px}.hdr p{font-size:11px;color:#6b7280}
      .kpis{display:flex;gap:15px;margin-bottom:20px;flex-wrap:wrap}
      .kpi{flex:1;min-width:200px;border-radius:8px;padding:15px;border:2px solid}
      .cw{margin-bottom:20px;page-break-inside:avoid}
      .cw h3{font-size:12px;font-weight:700;margin-bottom:8px;padding-left:8px;border-left:3px solid #8B5CF6}
      .cw img{width:100%;border:1px solid #e5e7eb;border-radius:5px}
      .ftr{margin-top:20px;padding-top:10px;border-top:1px solid #e5e7eb;text-align:center;font-size:10px;color:#9ca3af}
      @media print{@page{margin:1cm}}</style></head><body>
      <div class="hdr"><h1>✅ Dashboard — Taux de Défaut</h1>
      <p>Imprimé le ${now.toLocaleDateString('fr-TN')} à ${now.toLocaleTimeString('fr-TN')}</p></div>
      <div class="kpis">
        <div class="kpi" style="border-color:#8B5CF6;background:#f5f3ff;">
          <div style="font-size:9px;color:#6d28d9;font-weight:700;text-transform:uppercase;">📊 Taux de Défaut Moyen</div>
          <div style="font-size:20px;font-weight:700;color:#7c3aed;">${vm.global?.tauxDefautMoyen ?? 0}%</div>
        </div>
        <div class="kpi" style="border-color:#3b82f6;background:#eff6ff;">
          <div style="font-size:9px;color:#1d4ed8;font-weight:700;text-transform:uppercase;">📦 Produits Contrôlés</div>
          <div style="font-size:20px;font-weight:700;color:#1e40af;">${fmt(vm.global?.nombreProduitsControles ?? 0)}</div>
        </div>
        <div class="kpi" style="border-color:#10b981;background:#ecfdf5;">
          <div style="font-size:9px;color:#065f46;font-weight:700;text-transform:uppercase;">✅ Produits Conformes</div>
          <div style="font-size:20px;font-weight:700;color:#059669;">${fmt(vm.global?.nombreProduitsConformes ?? 0)}</div>
          <div style="font-size:10px;color:#10b981;">${conformite}%</div>
        </div>
        <div class="kpi" style="border-color:#ef4444;background:#fef2f2;">
          <div style="font-size:9px;color:#b91c1c;font-weight:700;text-transform:uppercase;">❌ Produits Défectueux</div>
          <div style="font-size:20px;font-weight:700;color:#dc2626;">${fmt(vm.global?.nombreDefauts ?? 0)}</div>
          <div style="font-size:10px;color:#ef4444;">${defautsPct}%</div>
        </div>
      </div>
      ${images.filter(i => i.img).map(i => `<div class="cw"><h3>${i.label}</h3><img src="${i.img}"/></div>`).join('')}
      <div class="ftr">I-mobile WAS v2.4 — ISO 9001 | Dashboard Qualité | ${now.toLocaleDateString('fr-TN')}</div>
      <script>window.onload=function(){setTimeout(function(){window.print();window.close();},500);};<\/script>
      </body></html>`);
    win.document.close();
  };

  const badgeStyle = connexionStatut === 'connected' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
    : connexionStatut === 'connecting' ? 'bg-amber-50 text-amber-700 border border-amber-200'
    : 'bg-red-50 text-red-700 border border-red-200';

  const badgeText = connexionStatut === 'connected' ? '🟢 Temps réel'
    : connexionStatut === 'connecting' ? '🟡 Connexion...' : '🔴 Déconnecté';

  const videMsg = <EmptyChart />;

  return (
    <div className="space-y-6" ref={dashboardRef}>
      {detailModal && (
        <DetailModal
          type={detailModal.type}
          data={detailModal.data}
          dataTrimestre={detailModal.dataTrimestre}
          dataAnnee={detailModal.dataAnnee}
          onClose={() => setDetailModal(null)}
        />
      )}

      {/* Filtres */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
        <div className="flex flex-wrap items-center gap-3">
          <select value={vm.queryParams.annee ?? ''} onChange={e => vm.setAnnee(e.target.value ? Number(e.target.value) : undefined)}
            className="border border-gray-200 rounded-xl px-3 py-2 text-sm bg-white shadow-sm">
            <option value="">Toutes les années</option>
            {vm.availableFilters.annees.map(a => <option key={a} value={a}>{a}</option>)}
          </select>
          <select value={vm.queryParams.trimestre ?? ''} onChange={e => vm.setTrimestre(e.target.value ? Number(e.target.value) : undefined)}
            className="border border-gray-200 rounded-xl px-3 py-2 text-sm bg-white shadow-sm">
            <option value="">Tous les trimestres</option>
            {vm.availableFilters.trimestres.map(t => <option key={t} value={t}>T{t}</option>)}
          </select>
          <button onClick={vm.resetFilters}
            className="flex items-center gap-1.5 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-xl text-sm font-semibold text-gray-600 transition-all">
            🔄 Réinitialiser
          </button>
          <div className="ml-auto flex items-center gap-2">
            <button onClick={exportDashboardPDF}
              className="flex items-center gap-1.5 px-3 py-2 bg-red-500 hover:bg-red-600 text-white rounded-xl text-xs font-semibold transition-all">
              📥 PDF
            </button>
            <button onClick={imprimerDashboard}
              className="flex items-center gap-1.5 px-3 py-2 bg-gray-700 hover:bg-gray-800 text-white rounded-xl text-xs font-semibold transition-all">
              🖨️ Imprimer
            </button>
            <span className={`text-xs px-3 py-1.5 rounded-full font-semibold ${badgeStyle}`}>{badgeText}</span>
            {derniereMAJ && <span className="text-xs text-gray-400">MAJ : {derniereMAJ.toLocaleTimeString('fr-FR')}</span>}
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200 rounded-2xl p-5">
          <div className="text-xs font-bold text-purple-600 uppercase tracking-wider mb-2">📊 Taux de Défaut Moyen</div>
          <div className="text-3xl font-black text-purple-700">{vm.global?.tauxDefautMoyen ?? 0}%</div>
          <div className="text-xs text-purple-500 mt-1">Moyenne globale</div>
        </div>
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-2xl p-5">
          <div className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-2">📦 Produits Contrôlés</div>
          <div className="text-3xl font-black text-blue-700">{fmt(vm.global?.nombreProduitsControles ?? 0)}</div>
          <div className="text-xs text-blue-500 mt-1">Pièces inspectées</div>
        </div>
        <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 border border-emerald-200 rounded-2xl p-5">
          <div className="text-xs font-bold text-emerald-600 uppercase tracking-wider mb-2">✅ Produits Conformes</div>
          <div className="text-3xl font-black text-emerald-700">{fmt(vm.global?.nombreProduitsConformes ?? 0)}</div>
          <div className="text-xs text-emerald-500 mt-1">{vm.global?.tauxConformite ?? 0}% de conformité</div>
        </div>
        <div className="bg-gradient-to-br from-red-50 to-red-100 border border-red-200 rounded-2xl p-5">
          <div className="text-xs font-bold text-red-600 uppercase tracking-wider mb-2">❌ Produits Défectueux</div>
          <div className="text-3xl font-black text-red-700">{fmt(vm.global?.nombreDefauts ?? 0)}</div>
          <div className="text-xs text-red-500 mt-1">{vm.global?.tauxDefautMoyen ?? 0}% de défauts</div>
        </div>
      </div>

      {/* Ligne 1 : Évolution + Répartition */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
          <div className="px-4 py-3 border-b border-gray-50 flex items-center justify-between flex-wrap gap-2">
            <span className="text-sm font-semibold text-gray-700">📈 Évolution du Taux de Défaut</span>
            <div className="flex items-center gap-2">
              <ChartActions
                onDetails={() => setDetailModal({
                  type: 'temps',
                  data: vm.parTempsMois,
                  dataTrimestre: vm.parTempsTrimestre,
                  dataAnnee: vm.parTempsAnnee,
                })}
                chartRef={refTemps}
                title="Évolution du Taux de Défaut"
              />
              <div className="flex gap-1 bg-gray-100 rounded-lg p-0.5">
                {(['mois','trimestre','annee'] as const).map(v => (
                  <button key={v} onClick={() => setTempsVue(v)}
                    className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all ${tempsVue === v ? 'bg-white shadow text-purple-600' : 'text-gray-500'}`}>
                    {v.charAt(0).toUpperCase() + v.slice(1)}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div className="p-4" style={{ height: 400 }}>
            {tempsData.length === 0 ? videMsg : <Line ref={refTemps} data={chartTemps} options={optionsLine} />}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
          <div className="px-4 py-3 border-b border-gray-50 flex items-center justify-between">
            <span className="text-sm font-semibold text-gray-700">🥧 Répartition Conformes / Défauts</span>
            <ChartActions
              onDetails={() => setDetailModal({ type: 'repartition', data: [
                { label: 'Conformes', valeur: conformes },
                { label: 'Défectueux', valeur: defauts }
              ]})}
              chartRef={refDoughnut}
              title="Répartition Conformes/Défauts"
            />
          </div>
          <div className="p-4" style={{ height: 400 }}>
            {total === 0 ? videMsg : <Doughnut ref={refDoughnut} data={chartDoughnut} options={optionsDoughnut} plugins={[doughnutLabelPlugin]} />}
          </div>
        </div>
      </div>

      {/* Ligne 2 : Produit + Machine */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
          <div className="px-4 py-3 border-b border-gray-50 flex items-center justify-between">
            <span className="text-sm font-semibold text-gray-700">📦 Taux de Défaut par Produit</span>
            <ChartActions onDetails={() => setDetailModal({ type: 'produit', data: vm.parProduit })} chartRef={refProduit} title="Taux de Défaut par Produit" />
          </div>
          <div className="p-4" style={{ height: 900 }}>
            {vm.parProduit.length === 0 ? videMsg : <Bar ref={refProduit} data={chartProduit} options={optionsBar} />}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
          <div className="px-4 py-3 border-b border-gray-50 flex items-center justify-between">
            <span className="text-sm font-semibold text-gray-700">⚙️ Taux de Défaut par Machine</span>
            <ChartActions onDetails={() => setDetailModal({ type: 'machine', data: vm.parMachine })} chartRef={refMachine} title="Taux de Défaut par Machine" />
          </div>
          <div className="p-4" style={{ height: 900 }}>
            {vm.parMachine.length === 0 ? videMsg : <Bar ref={refMachine} data={chartMachine} options={optionsBarV} />}
          </div>
        </div>
      </div>
    </div>
  );
};

export default QualiteGlobalView;
