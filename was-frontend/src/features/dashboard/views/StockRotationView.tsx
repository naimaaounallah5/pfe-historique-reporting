// features/dashboard/views/StockRotationView.tsx
import { useState, useRef, useEffect } from 'react';
import {
  Chart as ChartJS, CategoryScale, LinearScale, BarElement,
  LineElement, PointElement, Title, Tooltip, Legend, Filler, ArcElement
} from 'chart.js';
import { Bar, Line, Doughnut } from 'react-chartjs-2';
import jsPDF from 'jspdf';
import * as signalR from '@microsoft/signalr';
import { useStockViewModel } from '../viewmodels/stock.viewmodel';

ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, Title, Tooltip, Legend, Filler, ArcElement);

const HUB_URL = "http://localhost:5088/hubs/dashboard";
const fmt = (n: number) => n.toLocaleString('fr-TN', { minimumFractionDigits: 0 });
const fmtPct = (n: number) => `${n.toFixed(1)}%`;

let globalConnection: signalR.HubConnection | null = null;
let globalConnectionCount = 0;

// Modal de détails
const DetailModal = ({ type, data, onClose }: { type: string; data: any[]; onClose: () => void }) => {
  if (!data.length) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h3 className="font-bold text-gray-800 text-base">
            📊 Détails - {type === 'rotation' ? 'Taux de Rotation par Produit' : 'Évolution de la Rotation'}
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl font-bold">✕</button>
        </div>
        <div className="overflow-y-auto flex-1 p-4">
          <table className="w-full border-collapse">
            <thead className="bg-purple-50 sticky top-0">
              <tr>
                {type === 'rotation' && (
                  <>
                    <th className="px-4 py-3 text-left text-xs font-bold uppercase">Produit</th>
                    <th className="px-4 py-3 text-left text-xs font-bold uppercase">Catégorie</th>
                    <th className="px-4 py-3 text-right text-xs font-bold uppercase">Taux Rotation</th>
                    <th className="px-4 py-3 text-right text-xs font-bold uppercase">Stock</th>
                    <th className="px-4 py-3 text-right text-xs font-bold uppercase">Vitesse</th>
                  </>
                )}
                {type === 'temps' && (
                  <>
                    <th className="px-4 py-3 text-left text-xs font-bold uppercase">Période</th>
                    <th className="px-4 py-3 text-right text-xs font-bold uppercase">Taux Moyen</th>
                  </>
                )}
              </tr>
            </thead>
            <tbody>
              {type === 'rotation' && data.map((item, idx) => {
                const vitesse = item.rotation >= 70 ? 'Rapide' : item.rotation >= 30 ? 'Moyen' : 'Lent';
                const couleur = item.rotation >= 70 ? 'text-emerald-600' : item.rotation >= 30 ? 'text-amber-600' : 'text-red-600';
                return (
                  <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="px-4 py-2 text-sm">{item.produit}</td>
                    <td className="px-4 py-2 text-sm">{item.categorie}</td>
                    <td className={`px-4 py-2 text-sm text-right font-bold ${couleur}`}>{item.rotation.toFixed(1)}%</td>
                    <td className="px-4 py-2 text-sm text-right">{fmt(item.stockDisponible)}</td>
                    <td className={`px-4 py-2 text-sm text-right font-semibold ${couleur}`}>{vitesse}</td>
                  </tr>
                );
              })}
              {type === 'temps' && data.map((item, idx) => (
                <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  <td className="px-4 py-2 text-sm">{item.label}</td>
                  <td className="px-4 py-2 text-sm text-right font-bold">{item.rotation?.toFixed(1)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// Composant ChartActions
const ChartActions = ({ onDetails, chartRef, title, accent = "purple" }: { 
  onDetails: () => void; 
  chartRef: React.RefObject<any>; 
  title: string;
  accent?: "purple" | "amber";
}) => {
  const colorClass = accent === "purple" ? "border-purple-200 text-purple-600 hover:bg-purple-50" : "border-amber-200 text-amber-600 hover:bg-amber-50";
  
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

const StockRotationView = () => {
  const vm = useStockViewModel();
  const [tempsVue, setTempsVue] = useState<'mois'|'trimestre'|'annee'>('mois');
  const [connexionStatut, setConnexionStatut] = useState<'connected'|'connecting'|'disconnected'>('connecting');
  const [derniereMAJ, setDerniereMAJ] = useState<Date | null>(null);
  const [detailModal, setDetailModal] = useState<{type: string; data: any[]} | null>(null);
  const [filtreProduit, setFiltreProduit] = useState<string>('');

  const refRotation = useRef<any>(null);
  const refTemps = useRef<any>(null);
  const refRepartition = useRef<any>(null);
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

        console.log('📡 Stock Rotation - Tentative de connexion SignalR...');

        const connection = new signalR.HubConnectionBuilder()
          .withUrl(HUB_URL)
          .withAutomaticReconnect([0, 2000, 5000, 10000])
          .configureLogging(signalR.LogLevel.Error)
          .build();

        connection.on('DashboardMisAJour', () => {
          if (mounted) {
            vm.refetch();
            setDerniereMAJ(new Date());
          }
        });

        connection.on('dashboardmisajour', () => {
          if (mounted) {
            vm.refetch();
            setDerniereMAJ(new Date());
          }
        });
        
        connection.onreconnecting(() => {
          if (mounted) setConnexionStatut('connecting');
        });

        connection.onreconnected(() => {
          if (mounted) {
            setConnexionStatut('connected');
            vm.refetch();
          }
        });

        connection.onclose(() => {
          if (mounted) setConnexionStatut('disconnected');
          globalConnection = null;
        });

        await connection.start();
        
        if (mounted) {
          setConnexionStatut('connected');
          globalConnection = connection;
        }
      } catch (err) {
        if (mounted) {
          setConnexionStatut('disconnected');
          reconnectTimer = setTimeout(connectSignalR, 5000);
        }
      }
    };

    connectSignalR();

    return () => {
      mounted = false;
      if (reconnectTimer) clearTimeout(reconnectTimer);
      globalConnectionCount--;
      if (globalConnectionCount === 0 && globalConnection) {
        globalConnection.stop();
        globalConnection = null;
      }
    };
  }, []);

  if (vm.loading) return (
    <div className="flex items-center justify-center py-32">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-gray-500 font-medium">Chargement des données rotation…</p>
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

  // ✅ Sécurité : utiliser des tableaux vides si vm.parProduit est undefined
  const produits = vm.parProduit || [];
  
  // Tous les produits triés par taux de rotation
  const produitsTries = [...produits].sort((a, b) => b.rotation - a.rotation);

  // Statistiques de rotation
  const rotationMoyenne = produits.length > 0 
    ? produits.reduce((sum, p) => sum + p.rotation, 0) / produits.length 
    : 0;
  
  const produitRapide = produitsTries.length > 0 ? produitsTries[0] : null;
  const produitLent = produitsTries.length > 0 ? produitsTries[produitsTries.length - 1] : null;

  // Répartition des vitesses
  const rapide = produits.filter(p => p.rotation >= 70).length;
  const moyen = produits.filter(p => p.rotation >= 30 && p.rotation < 70).length;
  const lent = produits.filter(p => p.rotation < 30).length;

  // Graphique Taux de Rotation par Produit (TOUS)
  const chartRotation = {
    labels: produitsTries.map(p => p.produit.length > 18 ? p.produit.slice(0,18)+'…' : p.produit),
    datasets: [{
      label: 'Taux de Rotation (%)',
      data: produitsTries.map(p => p.rotation),
      backgroundColor: produitsTries.map(p => 
        p.rotation >= 70 ? 'rgba(16,185,129,0.7)' : 
        p.rotation >= 30 ? 'rgba(245,158,11,0.7)' : 
        'rgba(239,68,68,0.7)'
      ),
      borderRadius: 5,
    }],
  };

  // Graphique Évolution du Taux de Rotation
  // Note: On utilise les données de temps mais avec les rotations
  // Si vous avez des données de rotation par temps dans votre API, utilisez-les
  const chartTemps = {
    labels: tempsData.map(t => t.label),
    datasets: [{
      label: 'Taux de Rotation Moyen (%)',
      data: tempsData.map(t => rotationMoyenne), // À remplacer par les vraies données si disponibles
      borderColor: '#8B5CF6',
      backgroundColor: 'rgba(139,92,246,0.1)',
      borderWidth: 2,
      fill: true,
      tension: 0.4,
      pointBackgroundColor: '#8B5CF6',
      pointRadius: 4,
    }],
  };

  // Graphique Répartition des vitesses (camembert)
  const chartRepartition = {
    labels: ['Rapide (>70%)', 'Moyen (30-70%)', 'Lent (<30%)'],
    datasets: [{
      data: [rapide, moyen, lent],
      backgroundColor: ['#10B981', '#F59E0B', '#EF4444'],
      borderWidth: 0,
    }],
  };

  const optionsBarV = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      y: {
        beginAtZero: true,
        max: 100,
        ticks: { callback: (val: any) => `${val}%` },
      },
    },
  };

  const optionsLine = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      y: {
        beginAtZero: true,
        max: 100,
        ticks: { callback: (val: any) => `${val}%` },
      },
    },
  };

  const optionsDoughnut = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { 
      legend: { position: 'bottom' as const },
      tooltip: { 
        callbacks: { 
          label: (ctx: any) => `${ctx.raw} produits (${((ctx.raw / produits.length) * 100).toFixed(1)}%)` 
        } 
      }
    },
  };

  // Export PDF du dashboard
  const exportDashboardPDF = () => {
    const pdf = new jsPDF('portrait', 'mm', 'a4');
    const w = pdf.internal.pageSize.getWidth();
    const pageH = pdf.internal.pageSize.getHeight();
    let y = 10;

    pdf.setFontSize(18);
    pdf.text('Dashboard — Taux de Rotation', w / 2, y, { align: 'center' });
    y += 12;

    pdf.setFontSize(10);
    
    pdf.text(`Rotation moyenne : ${rotationMoyenne.toFixed(1)}%  |  Produits : ${produits.length}`, 10, y); 
    y += 7;
    pdf.text(`Rapides : ${rapide}  |  Moyens : ${moyen}  |  Lents : ${lent}`, 10, y); 
    y += 10;

    const charts = [
      { ref: refRotation, label: 'Taux de Rotation par Produit' },
      { ref: refTemps, label: 'Évolution du Taux de Rotation' },
      { ref: refRepartition, label: 'Répartition des Vitesses' },
    ];

    charts.forEach(({ ref, label }) => {
      if (!ref.current) return;
      const imgData = ref.current.toBase64Image('image/png', 1);
      const imgH = 65;
      if (y + imgH > pageH - 10) { pdf.addPage(); y = 10; }
      pdf.setFontSize(10);
      pdf.text(label, 10, y); y += 5;
      pdf.addImage(imgData, 'PNG', 10, y, w - 20, imgH);
      y += imgH + 8;
    });

    pdf.save('Dashboard_Rotation_Stock.pdf');
  };

  // Impression du dashboard
  const imprimerDashboard = () => {
    const charts = [
      { ref: refRotation, label: '🔄 Taux de Rotation par Produit' },
      { ref: refTemps, label: '📈 Évolution du Taux de Rotation' },
      { ref: refRepartition, label: '🥧 Répartition des Vitesses' },
    ];
    
    const images = charts.map(({ ref, label }) => ({
      label, img: ref.current ? ref.current.toBase64Image('image/png', 1) : null,
    }));
    
    const now = new Date();
    const win = window.open('', '_blank');
    if (!win) { alert('Autorisez les popups pour ce site.'); return; }
    
    win.document.write(`<!DOCTYPE html>
    <html lang="fr">
    <head>
      <meta charset="UTF-8"/>
      <title>Dashboard Rotation Stock</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: Arial, sans-serif; padding: 20px; color: #111827; }
        .hdr { text-align: center; margin-bottom: 20px; padding-bottom: 10px; border-bottom: 2px solid #e5e7eb; }
        h1 { font-size: 18px; font-weight: 700; margin-bottom: 5px; }
        .hdr p { font-size: 11px; color: #6b7280; }
        .kpis { display: flex; gap: 15px; margin-bottom: 20px; flex-wrap: wrap; }
        .kpi { flex: 1; min-width: 200px; border-radius: 8px; padding: 15px; border: 2px solid; }
        .cw { margin-bottom: 20px; page-break-inside: avoid; }
        .cw h3 { font-size: 12px; font-weight: 700; margin-bottom: 8px; padding-left: 8px; border-left: 3px solid #8B5CF6; }
        .cw img { width: 100%; border: 1px solid #e5e7eb; border-radius: 5px; }
        .ftr { margin-top: 20px; padding-top: 10px; border-top: 1px solid #e5e7eb; text-align: center; font-size: 10px; color: #9ca3af; }
        @media print { @page { margin: 1cm; } }
      </style>
    </head>
    <body>
      <div class="hdr">
        <h1>🔄 Dashboard — Taux de Rotation</h1>
        <p>Imprimé le ${now.toLocaleDateString('fr-TN')} à ${now.toLocaleTimeString('fr-TN')}</p>
      </div>
      
      <div class="kpis">
        <div class="kpi" style="border-color: #8B5CF6; background: #f5f3ff;">
          <div style="font-size: 9px; color: #6d28d9; font-weight: 700; text-transform: uppercase;">🔄 Rotation Moyenne</div>
          <div style="font-size: 20px; font-weight: 700; color: #7c3aed;">${rotationMoyenne.toFixed(1)}%</div>
          <div style="font-size: 10px; color: #8b5cf6;">${produits.length} produits</div>
        </div>
        <div class="kpi" style="border-color: #10b981; background: #ecfdf5;">
          <div style="font-size: 9px; color: #065f46; font-weight: 700; text-transform: uppercase;">⏱️ Plus Rapide</div>
          <div style="font-size: 20px; font-weight: 700; color: #059669;">${produitRapide?.rotation.toFixed(1) || 0}%</div>
          <div style="font-size: 10px; color: #10b981;">${produitRapide?.produit || '-'}</div>
        </div>
        <div class="kpi" style="border-color: #ef4444; background: #fee2e2;">
          <div style="font-size: 9px; color: #b91c1c; font-weight: 700; text-transform: uppercase;">🐢 Plus Lent</div>
          <div style="font-size: 20px; font-weight: 700; color: #dc2626;">${produitLent?.rotation.toFixed(1) || 0}%</div>
          <div style="font-size: 10px; color: #ef4444;">${produitLent?.produit || '-'}</div>
        </div>
      </div>
      
      ${images.filter(i => i.img).map(i => 
        `<div class="cw">
          <h3>${i.label}</h3>
          <img src="${i.img}" />
        </div>`
      ).join('')}
      
      <div class="ftr">
        I-mobile WAS v2.4 — ISO 9001 | Dashboard Stock | ${now.toLocaleDateString('fr-TN')}
      </div>
      <script>window.onload=function(){setTimeout(()=>{window.print();},500);}</script>
    </body>
    </html>`);
    
    win.document.close();
  };

  return (
    <div className="space-y-6" ref={dashboardRef}>
      {detailModal && (
        <DetailModal 
          type={detailModal.type} 
          data={detailModal.data} 
          onClose={() => setDetailModal(null)} 
        />
      )}

      {/* Filtres */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
        <div className="flex flex-wrap items-center gap-3">
          <select value={vm.queryParams.annee ?? ''} onChange={e => vm.setAnnee(e.target.value ? Number(e.target.value) : undefined)}
            className="border border-gray-200 rounded-xl px-3 py-2 text-sm bg-white shadow-sm">
            <option value="">Toutes les années</option>
            <option value="2024">2024</option>
            <option value="2025">2025</option>
          </select>
          <select value={vm.queryParams.trimestre ?? ''} onChange={e => vm.setTrimestre(e.target.value ? Number(e.target.value) : undefined)}
            className="border border-gray-200 rounded-xl px-3 py-2 text-sm bg-white shadow-sm">
            <option value="">Tous les trimestres</option>
            <option value="1">T1</option>
            <option value="2">T2</option>
            <option value="3">T3</option>
            <option value="4">T4</option>
          </select>
          <select value={filtreProduit} onChange={e => {
            setFiltreProduit(e.target.value);
            vm.setProduit(e.target.value || undefined);
          }}
            className="border border-gray-200 rounded-xl px-3 py-2 text-sm bg-white shadow-sm">
            <option value="">Tous les produits</option>
            {produits.map(p => (
              <option key={p.produit} value={p.produit}>{p.produit}</option>
            ))}
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
            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold ${
              connexionStatut === 'connected'  ? 'bg-emerald-50 text-emerald-700' :
              connexionStatut === 'connecting' ? 'bg-amber-50 text-amber-700' :
              'bg-red-50 text-red-700'}`}>
              <div className={`w-1.5 h-1.5 rounded-full ${
                connexionStatut === 'connected'  ? 'bg-emerald-500 animate-pulse' :
                connexionStatut === 'connecting' ? 'bg-amber-500' : 'bg-red-500'}`} />
              {connexionStatut === 'connected'  ? 'Temps réel' :
               connexionStatut === 'connecting' ? 'Connexion...' : 'Déconnecté'}
            </div>
            {derniereMAJ && (
              <span className="text-xs text-gray-400">
                MAJ : {derniereMAJ.toLocaleTimeString('fr-FR')}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200 rounded-2xl p-5">
          <div className="text-xs font-bold text-purple-600 uppercase tracking-wider mb-2">🔄 Rotation Moyenne</div>
          <div className="text-3xl font-black text-purple-700">{rotationMoyenne.toFixed(1)}%</div>
          <div className="text-xs text-purple-500 mt-1">sur {produits.length} produits</div>
        </div>
        <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 border border-emerald-200 rounded-2xl p-5">
          <div className="text-xs font-bold text-emerald-600 uppercase tracking-wider mb-2">⏱️ Plus Rapide</div>
          <div className="text-2xl font-black text-emerald-700">{produitRapide?.rotation.toFixed(1) || 0}%</div>
          <div className="text-xs text-emerald-500 mt-1">{produitRapide?.produit || '-'}</div>
        </div>
        <div className="bg-gradient-to-br from-red-50 to-red-100 border border-red-200 rounded-2xl p-5">
          <div className="text-xs font-bold text-red-600 uppercase tracking-wider mb-2">🐢 Plus Lent</div>
          <div className="text-2xl font-black text-red-700">{produitLent?.rotation.toFixed(1) || 0}%</div>
          <div className="text-xs text-red-500 mt-1">{produitLent?.produit || '-'}</div>
        </div>
      </div>

      {/* Graphique Taux de Rotation par Produit (TOUS) */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
        <div className="px-4 py-3 border-b border-gray-50 flex items-center justify-between">
          <span className="text-sm font-semibold text-gray-700">🔄 Taux de Rotation par Produit (tous)</span>
          <ChartActions
            onDetails={() => setDetailModal({ type: 'rotation', data: produitsTries })}
            chartRef={refRotation}
            title="Taux de Rotation par Produit"
            accent="purple"
          />
        </div>
        <div className="p-4" style={{ height: 500 }}>
          <Bar ref={refRotation} data={chartRotation} options={optionsBarV} />
        </div>
        <div className="px-4 pb-3 flex items-center gap-4 text-xs">
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-emerald-500 inline-block" /> Rapide (&gt;70%)</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-amber-500 inline-block" /> Moyen (30-70%)</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-red-500 inline-block" /> Lent (&lt;30%)</span>
        </div>
      </div>

      {/* Deuxième ligne : Évolution + Répartition */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Graphique Évolution */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
          <div className="px-4 py-3 border-b border-gray-50 flex items-center justify-between flex-wrap gap-2">
            <span className="text-sm font-semibold text-gray-700">📈 Évolution du Taux de Rotation</span>
            <div className="flex items-center gap-2">
              <div className="flex gap-1 bg-gray-100 rounded-lg p-0.5">
                {(['mois','trimestre','annee'] as const).map(v => (
                  <button key={v} onClick={() => setTempsVue(v)}
                    className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all ${
                      tempsVue === v ? 'bg-white shadow text-purple-600' : 'text-gray-500'
                    }`}>
                    {v.charAt(0).toUpperCase() + v.slice(1)}
                  </button>
                ))}
              </div>
              <ChartActions
                onDetails={() => setDetailModal({ type: 'temps', data: tempsData })}
                chartRef={refTemps}
                title="Évolution du Taux de Rotation"
                accent="purple"
              />
            </div>
          </div>
          <div className="p-4" style={{ height: 300 }}>
            <Line ref={refTemps} data={chartTemps} options={optionsLine} />
          </div>
        </div>

        {/* Graphique Répartition */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
          <div className="px-4 py-3 border-b border-gray-50 flex items-center justify-between">
            <span className="text-sm font-semibold text-gray-700">🥧 Répartition des Vitesses</span>
            <ChartActions
              onDetails={() => setDetailModal({ type: 'repartition', data: [] })}
              chartRef={refRepartition}
              title="Répartition des Vitesses"
              accent="purple"
            />
          </div>
          <div className="p-4" style={{ height: 300 }}>
            <Doughnut ref={refRepartition} data={chartRepartition} options={optionsDoughnut} />
          </div>
        </div>
      </div>

      {/* Statistiques de répartition */}
      <div className="bg-purple-50 rounded-2xl border border-purple-200 shadow-sm p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-lg p-3 border border-purple-100">
            <div className="text-xs font-semibold text-purple-600 uppercase mb-1">Rapide (&gt;70%)</div>
            <div className="text-2xl font-bold text-emerald-600">{rapide}</div>
            <div className="text-xs text-gray-500">produits</div>
          </div>
          <div className="bg-white rounded-lg p-3 border border-purple-100">
            <div className="text-xs font-semibold text-purple-600 uppercase mb-1">Moyen (30-70%)</div>
            <div className="text-2xl font-bold text-amber-600">{moyen}</div>
            <div className="text-xs text-gray-500">produits</div>
          </div>
          <div className="bg-white rounded-lg p-3 border border-purple-100">
            <div className="text-xs font-semibold text-purple-600 uppercase mb-1">Lent (&lt;30%)</div>
            <div className="text-2xl font-bold text-red-600">{lent}</div>
            <div className="text-xs text-gray-500">produits</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StockRotationView;