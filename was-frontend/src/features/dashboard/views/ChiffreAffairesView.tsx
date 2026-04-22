// features/dashboard/views/ChiffreAffairesView.tsx
import { useState, useRef, useEffect } from 'react';
import {
  Chart as ChartJS, CategoryScale, LinearScale, BarElement,
  LineElement, PointElement, Title, Tooltip, Legend, Filler, ArcElement
} from 'chart.js';
import { Bar, Line } from 'react-chartjs-2';
import jsPDF from 'jspdf';
import * as signalR from '@microsoft/signalr';
import { useChiffreAffairesViewModel } from '../viewmodels/chiffre-affaires.viewmodel';

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

const DetailModal = ({ type, data, onClose, vm, meta }: {
  type: string;
  data: any[];
  onClose: () => void;
  vm: any;
  meta?: any;
}) => {
  const [tempsTab, setTempsTab] = useState<'mois' | 'trimestre' | 'annee'>(meta?.vue || 'mois');

  const tempsDisplayData = type === 'temps'
    ? (tempsTab === 'mois' ? meta?.mois : tempsTab === 'trimestre' ? meta?.trimestre : meta?.annee) || data
    : data;

  if (!data.length) return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h3 className="font-bold text-gray-800 text-base">📊 Détails</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl font-bold">✕</button>
        </div>
        <div className="flex flex-col items-center justify-center py-16 gap-3">
          <span className="text-4xl opacity-30">📊</span>
          <p className="text-sm text-slate-400 font-medium">Aucune donnée disponible</p>
        </div>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[80vh] flex flex-col">

        {/* ── HEADER : titre à gauche, onglets + ✕ à droite ── */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h3 className="font-bold text-gray-800 text-base">
            📊 Détails - {type === 'client' ? "Chiffre d'Affaires par Client" :
                         type === 'produit' ? "Chiffre d'Affaires par Produit" :
                         type === 'temps'   ? 'Évolution du CA' :
                         'Comparaison Client/Produit'}
          </h3>
          <div className="flex items-center gap-3">
            {/* ✅ Onglets à droite — visibles uniquement pour 'temps' */}
            {type === 'temps' && (
              <div className="flex gap-1 bg-slate-100 rounded-lg p-1">
                {(['mois', 'trimestre', 'annee'] as const).map(v => (
                  <button key={v} onClick={() => setTempsTab(v)}
                    className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                      tempsTab === v
                        ? 'bg-white shadow text-blue-600'
                        : 'text-slate-400 hover:text-slate-600'}`}>
                    {v === 'mois' ? '📅 Mois' : v === 'trimestre' ? '📆 Trimestre' : '🗓️ Année'}
                  </button>
                ))}
              </div>
            )}
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl font-bold">✕</button>
          </div>
        </div>

        <div className="overflow-y-auto flex-1 p-4">
          <table className="w-full border-collapse">
            <thead className="bg-blue-50 sticky top-0">
              <tr>
                {type === 'client' && (<>
                  <th className="px-4 py-3 text-left text-xs font-bold uppercase">Client</th>
                  <th className="px-4 py-3 text-right text-xs font-bold uppercase">CA</th>
                  <th className="px-4 py-3 text-right text-xs font-bold uppercase">Part</th>
                </>)}
                {type === 'produit' && (<>
                  <th className="px-4 py-3 text-left text-xs font-bold uppercase">Produit</th>
                  <th className="px-4 py-3 text-left text-xs font-bold uppercase">Catégorie</th>
                  <th className="px-4 py-3 text-right text-xs font-bold uppercase">CA</th>
                  <th className="px-4 py-3 text-right text-xs font-bold uppercase">Quantité</th>
                  <th className="px-4 py-3 text-right text-xs font-bold uppercase">Part</th>
                </>)}
                {type === 'temps' && (<>
                  <th className="px-4 py-3 text-left text-xs font-bold uppercase">Période</th>
                  <th className="px-4 py-3 text-right text-xs font-bold uppercase">CA</th>
                  <th className="px-4 py-3 text-right text-xs font-bold uppercase">Nb Ventes</th>
                </>)}
                {type === 'comparaison' && (<>
                  <th className="px-4 py-3 text-left text-xs font-bold uppercase">Comparaison</th>
                  <th className="px-4 py-3 text-right text-xs font-bold uppercase">CA 2024</th>
                  <th className="px-4 py-3 text-right text-xs font-bold uppercase">CA 2025</th>
                  <th className="px-4 py-3 text-right text-xs font-bold uppercase">Variation</th>
                </>)}
              </tr>
            </thead>
            <tbody>
              {type === 'client' && data.map((item: any, idx: number) => (
                <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  <td className="px-4 py-2 text-sm">{item.clientPrenom} {item.clientNom}</td>
                  <td className="px-4 py-2 text-sm text-right font-bold">{vm?.formatMonnaie ? vm.formatMonnaie(item.ca) : item.ca}</td>
                  <td className="px-4 py-2 text-sm text-right">{item.partPourcentage}%</td>
                </tr>
              ))}
              {type === 'produit' && data.map((item: any, idx: number) => (
                <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  <td className="px-4 py-2 text-sm">{item.produitNom}</td>
                  <td className="px-4 py-2 text-sm">{item.categorie}</td>
                  <td className="px-4 py-2 text-sm text-right font-bold">{vm?.formatMonnaie ? vm.formatMonnaie(item.ca) : item.ca}</td>
                  <td className="px-4 py-2 text-sm text-right">{item.quantiteVendue}</td>
                  <td className="px-4 py-2 text-sm text-right">{item.partPourcentage}%</td>
                </tr>
              ))}
              {type === 'temps' && tempsDisplayData.map((item: any, idx: number) => (
                <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  <td className="px-4 py-2 text-sm">{item.periode}</td>
                  <td className="px-4 py-2 text-sm text-right font-bold">{vm?.formatMonnaie ? vm.formatMonnaie(item.ca) : item.ca}</td>
                  <td className="px-4 py-2 text-sm text-right">{item.nbVentes}</td>
                </tr>
              ))}
              {type === 'comparaison' && data.map((item: any, idx: number) => (
                <tr key={idx} className="bg-purple-50">
                  <td className="px-4 py-2 text-sm">
                    {item.client1} 2024 vs 2025<br/>
                    <span className="text-xs text-gray-500">Produit: {item.produit}</span>
                  </td>
                  <td className="px-4 py-2 text-sm text-right font-bold">{vm?.formatMonnaie ? vm.formatMonnaie(item.ca1) : item.ca1}</td>
                  <td className="px-4 py-2 text-sm text-right font-bold">{vm?.formatMonnaie ? vm.formatMonnaie(item.ca2) : item.ca2}</td>
                  <td className={`px-4 py-2 text-sm text-right font-bold ${
                    parseFloat(item.variation) > 0 ? 'text-green-600' :
                    parseFloat(item.variation) < 0 ? 'text-red-600' : 'text-gray-600'}`}>
                    {parseFloat(item.variation) > 0 ? '+' : ''}{item.variation}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const ChartActions = ({ onDetails, chartRef, title, accent = "blue" }: {
  onDetails: () => void;
  chartRef: React.RefObject<any>;
  title: string;
  accent?: "blue" | "green" | "purple";
}) => {
  const colorClass = accent === "green" ? "border-green-200 text-green-600 hover:bg-green-50" :
                     accent === "purple" ? "border-purple-200 text-purple-600 hover:bg-purple-50" :
                     "border-blue-200 text-blue-600 hover:bg-blue-50";

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

const ChiffreAffairesView = () => {
  const vm = useChiffreAffairesViewModel();
  const [tempsVue, setTempsVue] = useState<'mois'|'trimestre'|'annee'>('mois');
  const [connexionStatut, setConnexionStatut] = useState<'connected'|'connecting'|'disconnected'>('connecting');
  const [derniereMAJ, setDerniereMAJ] = useState<Date | null>(null);
  const [detailModal, setDetailModal] = useState<{type: string; data: any[]; meta?: any} | null>(null);
  const [clientCompare1, setClientCompare1] = useState<number | undefined>(undefined);
  const [produitCompare, setProduitCompare] = useState<number | undefined>(undefined);

  const refClients     = useRef<any>(null);
  const refProduits    = useRef<any>(null);
  const refTemps       = useRef<any>(null);
  const refComparaison = useRef<any>(null);
  const dashboardRef   = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (clientCompare1 && produitCompare) {
      vm.fetchComparaison(clientCompare1, produitCompare);
    }
  }, [clientCompare1, produitCompare]);

  useEffect(() => {
    let reconnectTimer: ReturnType<typeof setTimeout>;
    let mounted = true;
    let connection: signalR.HubConnection | null = null;
    const connectSignalR = async () => {
      try {
        globalConnectionCount++;
        if (globalConnection && globalConnection.state === signalR.HubConnectionState.Connected) {
          if (mounted) setConnexionStatut('connected');
          return;
        }
        connection = new signalR.HubConnectionBuilder()
          .withUrl(HUB_URL).withAutomaticReconnect([0, 2000, 5000, 10000])
          .configureLogging(signalR.LogLevel.Information).build();
        connection.on('DashboardMisAJour', () => { if (mounted) { vm.refetch(); setDerniereMAJ(new Date()); } });
        connection.on('dashboardmisajour', () => { if (mounted) { vm.refetch(); setDerniereMAJ(new Date()); } });
        connection.onreconnecting(() => { if (mounted) setConnexionStatut('connecting'); });
        connection.onreconnected(() => { if (mounted) { setConnexionStatut('connected'); vm.refetch(); } });
        connection.onclose(() => { if (mounted) { setConnexionStatut('disconnected'); globalConnection = null; } });
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
      if (globalConnectionCount === 0 && globalConnection) { globalConnection.stop(); globalConnection = null; }
    };
  }, []);

  if (vm.loading) return (
    <div className="flex items-center justify-center py-32">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-gray-500 font-medium">Chargement des données…</p>
      </div>
    </div>
  );

  if (vm.error) return (
    <div className="flex items-center justify-center py-32">
      <div className="text-center text-red-500">⚠ {vm.error}</div>
    </div>
  );

  const globalData     = vm.global || { caTotal: 0, croissanceAnnuelle: 0, nombreClientsActifs: 0, nombreProduitsVendus: 0, caMoyenMensuel: 0 };
  const produits       = vm.produits       || [];
  const clients        = vm.clients        || [];
  const tempsMois      = vm.tempsMois      || [];
  const tempsTrimestre = vm.tempsTrimestre || [];
  const tempsAnnee     = vm.tempsAnnee     || [];
  const annees         = vm.annees         || [];
  const trimestres     = vm.trimestres     || [];

  const tempsData = tempsVue === 'mois' ? tempsMois
    : tempsVue === 'trimestre' ? tempsTrimestre
    : tempsAnnee;

  const tousClients  = [...clients].sort((a: any, b: any) => b.ca - a.ca);
  const tousProduits = [...produits].sort((a: any, b: any) => b.ca - a.ca);

  const chartClients = {
    labels: tousClients.map((c: any) => `${c.clientPrenom || ''} ${c.clientNom || ''}`.length > 25 ?
      `${c.clientPrenom || ''} ${c.clientNom || ''}`.slice(0,25)+'…' :
      `${c.clientPrenom || ''} ${c.clientNom || ''}`),
    datasets: [{
      label: "Chiffre d'Affaires",
      data: tousClients.map((c: any) => c.ca || 0),
      backgroundColor: 'rgba(59,130,246,0.7)',
      borderRadius: 5,
    }],
  };

  const chartProduits = {
    labels: tousProduits.map((p: any) => (p.produitNom || '').length > 25 ? (p.produitNom || '').slice(0,25)+'…' : (p.produitNom || '')),
    datasets: [{
      label: "Chiffre d'Affaires",
      data: tousProduits.map((p: any) => p.ca || 0),
      backgroundColor: 'rgba(16,185,129,0.7)',
      borderRadius: 5,
    }],
  };

  const chartTemps = {
    labels: tempsData.map((t: any) => t.periode || ''),
    datasets: [{
      label: "Chiffre d'Affaires",
      data: tempsData.map((t: any) => t.ca || 0),
      borderColor: '#3B82F6',
      backgroundColor: 'rgba(59,130,246,0.1)',
      borderWidth: 2,
      fill: true,
      tension: 0.4,
      pointBackgroundColor: '#3B82F6',
      pointRadius: 4,
    }],
  };

  const comparData = vm.comparaisonData;

  const clientNom = clients.find((c: any) => c.clientId === clientCompare1);
  const clientLabel = clientNom ? `${clientNom.clientPrenom || ''} ${clientNom.clientNom || ''}` : 'Client';

  const chartComparaison = comparData ? {
    labels: [`${clientLabel} 2024`, `${clientLabel} 2025`],
    datasets: [{
      label: "Chiffre d'Affaires",
      data: [comparData.ca1, comparData.ca2],
      backgroundColor: ['rgba(59,130,246,0.7)', 'rgba(16,185,129,0.7)'],
      borderRadius: 5,
    }],
  } : null;

  const optionsBarH = {
    responsive: true, maintainAspectRatio: false, indexAxis: 'y' as const,
    plugins: { legend: { display: false } },
    scales: { x: { ticks: { callback: (val: any) => vm.formatMonnaie ? vm.formatMonnaie(val) : val } } },
  };

  const optionsLine = {
    responsive: true, maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: { y: { ticks: { callback: (val: any) => vm.formatMonnaie ? vm.formatMonnaie(val) : val } } },
  };

  const optionsBar = {
    responsive: true, maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: { y: { ticks: { callback: (val: any) => vm.formatMonnaie ? vm.formatMonnaie(val) : val } } },
  };

  const exportDashboardPDF = () => {
    const pdf = new jsPDF('portrait', 'mm', 'a4');
    const w = pdf.internal.pageSize.getWidth();
    const pageH = pdf.internal.pageSize.getHeight();
    let y = 10;
    pdf.setFontSize(18);
    pdf.text("Performance Commerciale - Chiffre d'Affaires", w / 2, y, { align: 'center' }); y += 12;
    pdf.setFontSize(10);
    pdf.text(`CA Total : ${vm.formatMonnaie ? vm.formatMonnaie(globalData.caTotal) : globalData.caTotal}  |  Clients actifs : ${globalData.nombreClientsActifs}`, 10, y); y += 7;
    pdf.text(`Produits vendus : ${globalData.nombreProduitsVendus}  |  Croissance : ${globalData.croissanceAnnuelle}%`, 10, y); y += 10;
    [
      { ref: refClients,     label: "Chiffre d'Affaires par Client" },
      { ref: refProduits,    label: "Chiffre d'Affaires par Produit" },
      { ref: refTemps,       label: 'Évolution du CA' },
      { ref: refComparaison, label: 'Comparaison Client/Produit/Année' },
    ].forEach(({ ref, label }) => {
      if (!ref.current) return;
      const imgH = 65;
      if (y + imgH > pageH - 10) { pdf.addPage(); y = 10; }
      pdf.setFontSize(10); pdf.text(label, 10, y); y += 5;
      pdf.addImage(ref.current.toBase64Image('image/png', 1), 'PNG', 10, y, w - 20, imgH);
      y += imgH + 8;
    });
    pdf.save('Performance_Commerciale.pdf');
  };

  const imprimerDashboard = () => {
    const images = [
      { ref: refClients,     label: "👥 Chiffre d'Affaires par Client" },
      { ref: refProduits,    label: "📦 Chiffre d'Affaires par Produit" },
      { ref: refTemps,       label: '📈 Évolution du CA' },
      { ref: refComparaison, label: '📊 Comparaison Client/Produit' },
    ].map(({ ref, label }) => ({ label, img: ref.current ? ref.current.toBase64Image('image/png', 1) : null }));
    const now = new Date();
    const win = window.open('', '_blank');
    if (!win) { alert('Autorisez les popups pour ce site.'); return; }
    win.document.write(`<!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8"/>
      <title>Performance Commerciale</title>
      <style>*{margin:0;padding:0;box-sizing:border-box;}
      body{font-family:Arial,sans-serif;padding:20px;color:#111827;}
      .hdr{text-align:center;margin-bottom:20px;padding-bottom:10px;border-bottom:2px solid #e5e7eb;}
      h1{font-size:18px;font-weight:700;margin-bottom:5px;}.hdr p{font-size:11px;color:#6b7280;}
      .kpi{padding:14px;border-radius:10px;border:2px solid #bfdbfe;background:#eff6ff;margin-bottom:16px;}
      .cw{margin-bottom:20px;page-break-inside:avoid;}
      .cw h3{font-size:12px;font-weight:700;margin-bottom:8px;padding-left:8px;border-left:3px solid #3B82F6;}
      .cw img{width:100%;border:1px solid #e5e7eb;border-radius:5px;}
      .ftr{margin-top:20px;padding-top:10px;border-top:1px solid #e5e7eb;text-align:center;font-size:10px;color:#9ca3af;}
      @media print{@page{margin:1cm;}}</style></head><body>
      <div class="hdr"><h1>📊 Performance Commerciale</h1>
        <p>Imprimé le ${now.toLocaleDateString('fr-TN')} à ${now.toLocaleTimeString('fr-TN')}</p></div>
      <div class="kpi">
        <div style="font-size:9px;color:#1d4ed8;font-weight:700;text-transform:uppercase;">💰 CA Total</div>
        <div style="font-size:28px;font-weight:800;color:#2563eb;">${vm.formatMonnaie ? vm.formatMonnaie(globalData.caTotal) : globalData.caTotal}</div>
        <div style="font-size:10px;color:#3b82f6;">${globalData.nombreClientsActifs} clients actifs</div>
      </div>
      ${images.filter(i => i.img).map(i => `<div class="cw"><h3>${i.label}</h3><img src="${i.img}"/></div>`).join('')}
      <div class="ftr">I-mobile WAS v2.4 — ISO 9001 | Performance Commerciale | ${now.toLocaleDateString('fr-TN')}</div>
      <script>window.onload=function(){setTimeout(function(){window.print();window.close();},500);};<\/script>
      </body></html>`);
    win.document.close();
  };

  return (
    <div className="space-y-6" ref={dashboardRef}>
      {detailModal && (
        <DetailModal
          type={detailModal.type}
          data={detailModal.data}
          meta={detailModal.meta}
          onClose={() => setDetailModal(null)}
          vm={vm}
        />
      )}

      {/* ── Filtres ── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
        <div className="flex flex-wrap items-center gap-3">
          <select value={vm.queryParams?.annee ?? ''} onChange={e => vm.setAnnee(e.target.value ? Number(e.target.value) : undefined)}
            className="border border-gray-200 rounded-xl px-3 py-2 text-sm bg-white shadow-sm">
            <option value="">Toutes les années</option>
            {annees.map((a: number) => <option key={a} value={a}>{a}</option>)}
          </select>
          <select value={vm.queryParams?.trimestre ?? ''} onChange={e => vm.setTrimestre(e.target.value ? Number(e.target.value) : undefined)}
            className="border border-gray-200 rounded-xl px-3 py-2 text-sm bg-white shadow-sm">
            <option value="">Tous les trimestres</option>
            {trimestres.map((t: number) => <option key={t} value={t}>T{t}</option>)}
          </select>
          <select value={vm.queryParams?.clientId ?? ''} onChange={e => vm.setClientId(e.target.value ? Number(e.target.value) : undefined)}
            className="border border-gray-200 rounded-xl px-3 py-2 text-sm bg-white shadow-sm">
            <option value="">Tous les clients</option>
            {clients.map((c: any) => (
              <option key={c.clientId} value={c.clientId}>{c.clientPrenom || ''} {c.clientNom || ''}</option>
            ))}
          </select>
          <select value={vm.queryParams?.produitId ?? ''} onChange={e => vm.setProduitId(e.target.value ? Number(e.target.value) : undefined)}
            className="border border-gray-200 rounded-xl px-3 py-2 text-sm bg-white shadow-sm">
            <option value="">Tous les produits</option>
            {produits.map((p: any) => (
              <option key={p.produitId} value={p.produitId}>{p.produitNom || ''}</option>
            ))}
          </select>
          <button onClick={vm.resetFilters}
            className="flex items-center gap-1.5 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-xl text-sm font-semibold text-gray-600 transition-all">
            🔄 Réinitialiser
          </button>
          <div className="ml-auto flex items-center gap-2">
            <button onClick={exportDashboardPDF}
              className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold transition-all">
              📥 PDF
            </button>
            <button onClick={imprimerDashboard}
              className="flex items-center gap-1.5 px-3 py-2 bg-gray-700 hover:bg-gray-800 text-white rounded-xl text-xs font-semibold transition-all">
              🖨️ Imprimer
            </button>
            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold ${
              connexionStatut === 'connected'  ? 'bg-emerald-50 text-emerald-700' :
              connexionStatut === 'connecting' ? 'bg-amber-50 text-amber-700' : 'bg-red-50 text-red-700'}`}>
              <div className={`w-1.5 h-1.5 rounded-full ${
                connexionStatut === 'connected'  ? 'bg-emerald-500 animate-pulse' :
                connexionStatut === 'connecting' ? 'bg-amber-500' : 'bg-red-500'}`} />
              {connexionStatut === 'connected' ? 'Temps réel' : connexionStatut === 'connecting' ? 'Connexion...' : 'Déconnecté'}
            </div>
            {derniereMAJ && (
              <span className="text-xs text-gray-400">MAJ : {derniereMAJ.toLocaleTimeString('fr-FR')}</span>
            )}
          </div>
        </div>
      </div>

      {/* ── KPI ── */}
      <div className="relative overflow-hidden bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl p-6 shadow-lg shadow-blue-200">
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-8 translate-x-8" />
        <div className="absolute bottom-0 left-0 w-20 h-20 bg-white/5 rounded-full translate-y-6 -translate-x-4" />
        <div className="relative">
          <span className="text-blue-200 text-xs font-bold uppercase tracking-widest">💰 Chiffre d'Affaires Total</span>
          <div className="text-4xl font-black text-white tracking-tight mt-2">
            {vm.formatMonnaie ? vm.formatMonnaie(globalData.caTotal) : fmt(globalData.caTotal)}
            <span className="text-blue-300 text-2xl font-semibold ml-1">DT</span>
          </div>
          <div className="mt-2 text-blue-200 text-xs">
            {globalData.nombreClientsActifs} clients actifs · {globalData.nombreProduitsVendus} produits vendus
          </div>
        </div>
      </div>

      {/* ── Alerte dépendance produit ── */}
      {(() => {
        const totalCA = tousProduits.reduce((s: number, p: any) => s + (p.ca || 0), 0);
        const produitDominant = tousProduits.find((p: any) => totalCA > 0 && ((p.ca || 0) / totalCA) > 0.30);
        if (!produitDominant || totalCA === 0) return null;
        const pct = ((produitDominant.ca || 0) / totalCA * 100).toFixed(1);
        return (
          <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-2xl px-5 py-3">
            <span className="text-xl">⚠️</span>
            <div className="flex-1">
              <p className="text-sm font-bold text-amber-700">Risque de dépendance produit</p>
              <p className="text-xs text-amber-600 mt-0.5">
                <strong>{produitDominant.produitNom}</strong> représente{' '}
                <strong>{pct}%</strong> du chiffre d'affaires total.
              </p>
            </div>
            <span className="text-xs bg-amber-100 text-amber-700 px-3 py-1 rounded-full font-semibold border border-amber-200 whitespace-nowrap">
              {fmt(produitDominant.ca || 0)} DT
            </span>
          </div>
        );
      })()}

      {/* ── Ligne 1 : CA par Client + CA par Produit ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-50 flex items-center justify-between bg-slate-50/50">
            <div>
              <p className="text-sm font-bold text-slate-700">👥 Chiffre d'Affaires par Client</p>
              <p className="text-xs text-slate-400 mt-0.5">Montant total des ventes par client</p>
            </div>
            <ChartActions onDetails={() => setDetailModal({ type: 'client', data: clients })}
              chartRef={refClients} title="CA par Client" accent="blue" />
          </div>
          <div className="p-4" style={{ height: 900 }}>
            {tousClients.length === 0 ? <EmptyChart /> : (
              <Bar ref={refClients} data={chartClients} options={optionsBarH} />
            )}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-50 flex items-center justify-between bg-slate-50/50">
            <div>
              <p className="text-sm font-bold text-slate-700">📦 Chiffre d'Affaires par Produit</p>
              <p className="text-xs text-slate-400 mt-0.5">Distribution des ventes par produit</p>
            </div>
            <ChartActions onDetails={() => setDetailModal({ type: 'produit', data: produits })}
              chartRef={refProduits} title="CA par Produit" accent="green" />
          </div>
          <div className="p-4" style={{ height: 900 }}>
            {tousProduits.length === 0 ? <EmptyChart /> : (
              <Bar ref={refProduits} data={chartProduits} options={optionsBarH} />
            )}
          </div>
        </div>
      </div>

      {/* ── Ligne 2 : Évolution + Comparaison ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-50 flex items-center justify-between bg-slate-50/50 flex-wrap gap-2">
            <div>
              <p className="text-sm font-bold text-slate-700">📈 Évolution du Chiffre d'Affaires</p>
              <p className="text-xs text-slate-400 mt-0.5">Tendance des ventes dans le temps</p>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex gap-1 bg-slate-100 rounded-lg p-0.5">
                {(['mois','trimestre','annee'] as const).map(v => (
                  <button key={v} onClick={() => setTempsVue(v)}
                    className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all ${
                      tempsVue === v ? 'bg-white shadow-sm text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}>
                    {v === 'mois' ? 'Mois' : v === 'trimestre' ? 'Trim.' : 'Année'}
                  </button>
                ))}
              </div>
              <ChartActions
                onDetails={() => setDetailModal({
                  type: 'temps',
                  data: tempsData,
                  meta: {
                    vue: tempsVue,
                    mois: tempsMois,
                    trimestre: tempsTrimestre,
                    annee: tempsAnnee,
                  }
                })}
                chartRef={refTemps} title="Évolution du CA" accent="purple" />
            </div>
          </div>
          <div className="p-4" style={{ height: 500 }}>
            {tempsData.length === 0 ? <EmptyChart /> : (
              <Line ref={refTemps} data={chartTemps} options={optionsLine} />
            )}
          </div>
        </div>

        {/* ── Comparaison ── */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-50 flex items-center justify-between bg-slate-50/50">
            <div>
              <p className="text-sm font-bold text-slate-700">📊 Comparaison Client/Produit/Année</p>
              <p className="text-xs text-slate-400 mt-0.5">Comparer un client sur un produit entre 2024 et 2025</p>
            </div>
            <ChartActions
              onDetails={() => {
                if (comparData && clientCompare1 && produitCompare) {
                  const client1 = clients.find((c: any) => c.clientId === clientCompare1);
                  const produit = produits.find((p: any) => p.produitId === produitCompare);
                  setDetailModal({
                    type: 'comparaison',
                    data: [{
                      client1: `${client1?.clientPrenom || ''} ${client1?.clientNom || ''}`,
                      produit: produit?.produitNom || '',
                      ca1: comparData.ca1,
                      ca2: comparData.ca2,
                      variation: ((comparData.ca2 - comparData.ca1) / (comparData.ca1 || 1) * 100).toFixed(1)
                    }]
                  });
                } else {
                  alert('Veuillez sélectionner un client et un produit');
                }
              }}
              chartRef={refComparaison} title="Comparaison Client/Produit" accent="purple" />
          </div>
          <div className="p-4">
            <div className="flex flex-wrap gap-3 mb-4">
              <select value={produitCompare ?? ''} onChange={e => setProduitCompare(e.target.value ? Number(e.target.value) : undefined)}
                className="border border-gray-200 rounded-xl px-3 py-2 text-sm bg-white shadow-sm">
                <option value="">Sélectionnez un produit</option>
                {produits.map((p: any) => (
                  <option key={p.produitId} value={p.produitId}>{p.produitNom || ''}</option>
                ))}
              </select>
              <select value={clientCompare1 ?? ''} onChange={e => setClientCompare1(e.target.value ? Number(e.target.value) : undefined)}
                className="border border-gray-200 rounded-xl px-3 py-2 text-sm bg-white shadow-sm">
                <option value="">Sélectionnez un client</option>
                {clients.map((c: any) => (
                  <option key={c.clientId} value={c.clientId}>{c.clientPrenom || ''} {c.clientNom || ''}</option>
                ))}
              </select>
            </div>
            {!comparData || !chartComparaison
              ? <EmptyChart message="Sélectionnez un client et un produit pour afficher la comparaison 2024 vs 2025" />
              : (
                <div>
                  <div style={{ height: 500 }}>
                    <Bar ref={refComparaison} data={chartComparaison} options={optionsBar} />
                  </div>
                  <div className="mt-3 text-sm text-center">
                    {comparData.ca2 > comparData.ca1 ? (
                      <p className="text-green-600 font-semibold">
                        ▲ Augmentation de {((comparData.ca2 - comparData.ca1) / (comparData.ca1 || 1) * 100).toFixed(1)}%
                      </p>
                    ) : comparData.ca2 < comparData.ca1 ? (
                      <p className="text-red-600 font-semibold">
                        ▼ Diminution de {((comparData.ca1 - comparData.ca2) / (comparData.ca1 || 1) * 100).toFixed(1)}%
                      </p>
                    ) : (
                      <p className="text-gray-600 font-semibold">➡ Stable (0%)</p>
                    )}
                  </div>
                </div>
              )
            }
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChiffreAffairesView;
