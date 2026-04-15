// features/dashboard/views/StockDisponibleView.tsx
import { useState, useRef, useEffect } from 'react';
import {
  Chart as ChartJS, CategoryScale, LinearScale, BarElement,
  LineElement, PointElement, Title, Tooltip, Legend, Filler, ArcElement
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import jsPDF from 'jspdf';
import * as signalR from '@microsoft/signalr';
import { useStockViewModel } from '../viewmodels/stock.viewmodel';

ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, Title, Tooltip, Legend, Filler, ArcElement);

const HUB_URL = "http://localhost:5088/hubs/dashboard";
const fmt = (n: number) => n.toLocaleString('fr-TN', { minimumFractionDigits: 0 });

let globalConnection: signalR.HubConnection | null = null;
let globalConnectionCount = 0;

const DetailModal = ({ type, data, onClose }: { type: string; data: any[]; onClose: () => void }) => {
  if (!data.length) return null;
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h3 className="font-bold text-gray-800 text-base">
            📊 Détails - {type === 'produit' ? 'Stock par Produit' : type === 'temps' ? 'Évolution du Stock' : 'Produits en Alerte'}
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl font-bold">✕</button>
        </div>
        <div className="overflow-y-auto flex-1 p-4">
          {data.length === 0 ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center text-gray-400">
                <div className="text-4xl mb-2">📭</div>
                <p className="text-sm font-medium">Aucune donnée disponible</p>
              </div>
            </div>
          ) : (
            <table className="w-full border-collapse">
              <thead className="bg-amber-50 sticky top-0">
                <tr>
                  {type === 'produit' && (<>
                    <th className="px-4 py-3 text-left text-xs font-bold uppercase">Produit</th>
                    <th className="px-4 py-3 text-left text-xs font-bold uppercase">Catégorie</th>
                    <th className="px-4 py-3 text-right text-xs font-bold uppercase">Stock</th>
                    <th className="px-4 py-3 text-right text-xs font-bold uppercase">Entrées</th>
                    <th className="px-4 py-3 text-right text-xs font-bold uppercase">Sorties</th>
                  </>)}
                  {type === 'temps' && (<>
                    <th className="px-4 py-3 text-left text-xs font-bold uppercase">Période</th>
                    <th className="px-4 py-3 text-right text-xs font-bold uppercase">Entrées</th>
                    <th className="px-4 py-3 text-right text-xs font-bold uppercase">Sorties</th>
                    <th className="px-4 py-3 text-right text-xs font-bold uppercase">Stock Moyen</th>
                  </>)}
                  {type === 'alerte' && (<>
                    <th className="px-4 py-3 text-left text-xs font-bold uppercase">Produit</th>
                    <th className="px-4 py-3 text-left text-xs font-bold uppercase">Catégorie</th>
                    <th className="px-4 py-3 text-right text-xs font-bold uppercase">Stock</th>
                    <th className="px-4 py-3 text-right text-xs font-bold uppercase">Seuil</th>
                  </>)}
                </tr>
              </thead>
              <tbody>
                {type === 'produit' && data.map((item, idx) => (
                  <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="px-4 py-2 text-sm">{item.produit}</td>
                    <td className="px-4 py-2 text-sm">{item.categorie}</td>
                    <td className="px-4 py-2 text-sm text-right font-bold">{fmt(item.stockDisponible)}</td>
                    <td className="px-4 py-2 text-sm text-right">{fmt(item.entrees)}</td>
                    <td className="px-4 py-2 text-sm text-right">{fmt(item.sorties)}</td>
                  </tr>
                ))}
                {type === 'temps' && data.map((item, idx) => (
                  <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="px-4 py-2 text-sm">{item.label}</td>
                    <td className="px-4 py-2 text-sm text-right">{fmt(item.entrees)}</td>
                    <td className="px-4 py-2 text-sm text-right">{fmt(item.sorties)}</td>
                    <td className="px-4 py-2 text-sm text-right font-bold">{fmt(item.stockMoyen)}</td>
                  </tr>
                ))}
                {type === 'alerte' && data.map((item, idx) => (
                  <tr key={idx} className="bg-red-50">
                    <td className="px-4 py-2 text-sm font-medium text-red-600">{item.produit}</td>
                    <td className="px-4 py-2 text-sm text-red-600">{item.categorie}</td>
                    <td className="px-4 py-2 text-sm text-right font-bold text-red-600">{fmt(item.stockDisponible)}</td>
                    <td className="px-4 py-2 text-sm text-right">100</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

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
    win.document.write(`<html><head><title>${title}</title>
      <style>body{margin:20px;font-family:Arial,sans-serif;}.hdr{text-align:center;margin-bottom:16px;padding-bottom:12px;border-bottom:2px solid #e5e7eb;}
      h1{font-size:16px;font-weight:700;color:#111827;margin:0 0 4px;}p{font-size:11px;color:#6b7280;margin:0;}
      img{max-width:100%;border:1px solid #e5e7eb;border-radius:8px;}@media print{@page{size:A4 landscape;margin:12mm;}}</style></head>
      <body><div class="hdr"><h1>${title}</h1><p>Imprimé le ${now.toLocaleDateString('fr-TN')} à ${now.toLocaleTimeString('fr-TN')}</p></div>
      <img src="${imgData}" onload="window.print();window.close()"/></body></html>`);
    win.document.close();
  };
  return (
    <div className="flex items-center gap-1.5">
      <button onClick={onDetails} className="flex items-center gap-1 px-2.5 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-semibold text-gray-600 hover:bg-gray-50 shadow-sm">🔍 Détails</button>
      <button onClick={telechargerPDF} className="flex items-center gap-1 px-2.5 py-1.5 bg-white border border-amber-200 rounded-lg text-xs font-semibold text-amber-600 hover:bg-amber-50 shadow-sm">📄 PDF</button>
      <button onClick={imprimerGraphique} className="flex items-center gap-1 px-2.5 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-semibold text-gray-600 hover:bg-gray-50 shadow-sm">🖨️</button>
    </div>
  );
};

const AlertActions = ({ onDetails, alertes }: { onDetails: () => void; alertes: any[] }) => {
  const telechargerPDF = () => {
    const pdf = new jsPDF('portrait', 'mm', 'a4');
    const w = pdf.internal.pageSize.getWidth();
    pdf.setFontSize(16); pdf.setTextColor(220, 38, 38);
    pdf.text('Produits en alerte (stock < 100)', w / 2, 15, { align: 'center' });
    pdf.setFontSize(10); pdf.setTextColor(0, 0, 0);
    let y = 25;
    pdf.setFont("helvetica", "bold");
    pdf.text('Produit', 10, y); pdf.text('Catégorie', 70, y); pdf.text('Stock', 150, y); y += 6;
    pdf.setFont("helvetica", "normal");
    alertes.forEach((p) => {
      if (y > 280) { pdf.addPage(); y = 20; }
      pdf.text(p.produit.length > 35 ? p.produit.substring(0, 35) + '…' : p.produit, 10, y);
      pdf.text(p.categorie, 70, y);
      pdf.text(fmt(p.stockDisponible), 150, y, { align: 'right' });
      y += 6;
    });
    const now = new Date();
    pdf.setFontSize(8); pdf.setTextColor(150, 150, 150);
    pdf.text(`Généré le ${now.toLocaleDateString('fr-FR')} à ${now.toLocaleTimeString('fr-FR')}`, w / 2, 285, { align: 'center' });
    pdf.save('Alertes_Stock.pdf');
  };
  const imprimerAlertes = () => {
    const now = new Date();
    const win = window.open('', '_blank');
    if (!win) return;
    win.document.write(`<!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8"/><title>Alertes Stock</title>
    <style>*{margin:0;padding:0;box-sizing:border-box;}body{font-family:Arial,sans-serif;padding:20px;color:#111827;}
    .hdr{text-align:center;margin-bottom:20px;padding-bottom:10px;border-bottom:2px solid #e5e7eb;}
    h1{font-size:18px;font-weight:700;margin-bottom:5px;color:#dc2626;}.hdr p{font-size:11px;color:#6b7280;}
    table{width:100%;border-collapse:collapse;margin-top:20px;}
    th{background-color:#fee2e2;padding:10px;text-align:left;font-size:12px;color:#b91c1c;}
    td{padding:8px 10px;border-bottom:1px solid #e5e7eb;}.stock{font-weight:bold;color:#dc2626;text-align:right;}
    .footer{text-align:center;margin-top:20px;font-size:10px;color:#9ca3af;}
    @media print{@page{margin:1cm;}}</style></head>
    <body><div class="hdr"><h1>⚠️ Produits en alerte (stock &lt; 100)</h1>
    <p>Imprimé le ${now.toLocaleDateString('fr-TN')} à ${now.toLocaleTimeString('fr-TN')}</p></div>
    <table><thead><tr><th>Produit</th><th>Catégorie</th><th style="text-align:right;">Stock</th></tr></thead>
    <tbody>${alertes.map(p => `<tr><td>${p.produit}</td><td>${p.categorie}</td><td class="stock">${fmt(p.stockDisponible)}</td></tr>`).join('')}</tbody></table>
    <div class="footer">I-mobile WAS v2.4 — ISO 9001</div>
    <script>window.onload=function(){setTimeout(function(){window.print();window.close();},500);};</script>
    </body></html>`);
    win.document.close();
  };
  return (
    <div className="flex items-center gap-1.5">
      <button onClick={onDetails} className="flex items-center gap-1 px-2.5 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-semibold text-gray-600 hover:bg-gray-50 shadow-sm">🔍 Détails</button>
      <button onClick={telechargerPDF} className="flex items-center gap-1 px-2.5 py-1.5 bg-white border border-red-200 rounded-lg text-xs font-semibold text-red-600 hover:bg-red-50 shadow-sm">📄 PDF</button>
      <button onClick={imprimerAlertes} className="flex items-center gap-1 px-2.5 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-semibold text-gray-600 hover:bg-gray-50 shadow-sm">🖨️</button>
    </div>
  );
};

const StockDisponibleView = () => {
  const vm = useStockViewModel();
  const [tempsVue, setTempsVue] = useState<'mois'|'trimestre'|'annee'>('mois');
  const [connexionStatut, setConnexionStatut] = useState<'connected'|'connecting'|'disconnected'>('connecting');
  const [derniereMAJ, setDerniereMAJ] = useState<Date | null>(null);
  const [detailModal, setDetailModal] = useState<{type: string; data: any[]} | null>(null);
  const [filtreProduit, setFiltreProduit] = useState<string>('');
  const [filtreType, setFiltreType] = useState<'matiere' | 'fini'>('matiere');

  const refStock = useRef<any>(null);
  const refTemps = useRef<any>(null);
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
        connection.onclose(() => { if (mounted) { setConnexionStatut('disconnected'); globalConnection = null; } });
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
        <div className="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-gray-500 font-medium">Chargement des données stock…</p>
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

  const produits = vm.parProduit || [];

  const tousProduits = [...produits]
    .filter(p => {
      if (filtreType === 'matiere') return p.typeProduit?.toLowerCase().includes('mati');
      if (filtreType === 'fini')   return p.typeProduit?.toLowerCase().includes('fini');
      return true;
    })
    .sort((a, b) => b.stockDisponible - a.stockDisponible);

  const produitsEnAlerte = produits.filter(p => p.stockDisponible < 100);

  const globalData = vm.global || {
    stockTotal: 0, nombreProduits: 0, entreesTotales: 0, sortiesTotales: 0
  };

  const hasStockData = tousProduits.length > 0 && tousProduits.some(p => p.stockDisponible > 0);
  const hasTempsData = tempsData.length > 0 && tempsData.some(t => t.entrees > 0 || t.sorties > 0);

  const chartStock = {
    labels: tousProduits.map(p => p.produit.length > 18 ? p.produit.slice(0,18)+'…' : p.produit),
    datasets: [{
      label: 'Stock Disponible',
      data: tousProduits.map(p => p.stockDisponible),
      backgroundColor: 'rgba(245,158,11,0.7)',
      borderRadius: 5,
    }],
  };

  const chartTemps = {
    labels: tempsData.map(t => t.label),
    datasets: [
      { label: 'Entrées', data: tempsData.map(t => t.entrees), backgroundColor: 'rgba(16,185,129,0.7)', borderRadius: 5 },
      { label: 'Sorties', data: tempsData.map(t => t.sorties), backgroundColor: 'rgba(239,68,68,0.7)', borderRadius: 5 }
    ],
  };

  const optionsBarH = {
    responsive: true, maintainAspectRatio: false, indexAxis: 'y' as const,
    plugins: { legend: { display: false } },
    scales: { x: { ticks: { callback: (val: any) => fmt(val) } } },
  };

  const optionsBar = {
    responsive: true, maintainAspectRatio: false,
    plugins: { legend: { position: 'top' as const } },
  };

  const exportDashboardPDF = () => {
    const pdf = new jsPDF('portrait', 'mm', 'a4');
    const w = pdf.internal.pageSize.getWidth();
    const pageH = pdf.internal.pageSize.getHeight();
    let y = 10;
    pdf.setFontSize(18); pdf.text('Dashboard — Stock Disponible', w / 2, y, { align: 'center' }); y += 12;
    pdf.setFontSize(10);
    pdf.text(`Stock Total : ${fmt(globalData.stockTotal)}  |  Produits : ${globalData.nombreProduits}`, 10, y); y += 7;
    pdf.text(`Entrées : ${fmt(globalData.entreesTotales)}  |  Sorties : ${fmt(globalData.sortiesTotales)}`, 10, y); y += 7;
    pdf.text(`Alertes : ${produitsEnAlerte.length} produits sous seuil`, 10, y); y += 10;
    if (refStock.current && hasStockData) {
      pdf.setFontSize(12); pdf.text('Stock Disponible par Produit', 10, y); y += 6;
      pdf.addImage(refStock.current.toBase64Image('image/png', 1), 'PNG', 10, y, w - 20, 65); y += 70;
    } else {
      pdf.setFontSize(12); pdf.setTextColor(150, 150, 150);
      pdf.text('Stock Disponible par Produit - Aucune donnée disponible', 10, y); y += 70;
    }
    if (refTemps.current && hasTempsData) {
      if (y + 70 > pageH - 20) { pdf.addPage(); y = 10; }
      pdf.setFontSize(12); pdf.setTextColor(0, 0, 0); pdf.text('Evolution Entrees/Sorties', 10, y); y += 6;
      pdf.addImage(refTemps.current.toBase64Image('image/png', 1), 'PNG', 10, y, w - 20, 65); y += 70;
    } else {
      if (y + 50 > pageH - 20) { pdf.addPage(); y = 10; }
      pdf.setFontSize(12); pdf.setTextColor(150, 150, 150);
      pdf.text('Evolution Entrees/Sorties - Aucune donnée disponible', 10, y); y += 70;
    }
    if (produitsEnAlerte.length > 0) {
      if (y + 50 > pageH - 20) { pdf.addPage(); y = 10; }
      pdf.setFontSize(12); pdf.setTextColor(220, 38, 38);
      pdf.text('Produits en alerte (stock < 100)', 10, y); y += 8;
      pdf.setFontSize(10); pdf.setTextColor(0, 0, 0);
      pdf.setFont("helvetica", "bold");
      pdf.text('Produit', 10, y); pdf.text('Catégorie', 80, y); pdf.text('Stock', 150, y); y += 6;
      pdf.setFont("helvetica", "normal");
      produitsEnAlerte.forEach((p) => {
        if (y > pageH - 20) { pdf.addPage(); y = 20; }
        pdf.text(p.produit.length > 30 ? p.produit.substring(0, 30) + '…' : p.produit, 10, y);
        pdf.text(p.categorie, 80, y);
        pdf.text(fmt(p.stockDisponible), 150, y, { align: 'right' });
        y += 6;
      });
    }
    pdf.save('Dashboard_Stock_Disponible.pdf');
  };

  const imprimerDashboard = () => {
    const charts = [
      { ref: refStock, label: 'Stock Disponible par Produit', hasData: hasStockData },
      { ref: refTemps, label: 'Evolution Entrees/Sorties', hasData: hasTempsData },
    ];
    const images = charts.map(({ ref, label, hasData }) => ({
      label, img: ref.current && hasData ? ref.current.toBase64Image('image/png', 1) : null, hasData
    }));
    const now = new Date();
    const win = window.open('', '_blank');
    if (!win) { alert('Autorisez les popups pour ce site.'); return; }
    const alertesHTML = produitsEnAlerte.length > 0 ? `
      <div style="margin-bottom:20px;page-break-inside:avoid;">
        <h3 style="font-size:12px;font-weight:700;margin-bottom:8px;padding-left:8px;border-left:3px solid #ef4444;color:#ef4444;">⚠️ Produits en alerte (stock &lt; 100)</h3>
        <table style="width:100%;border-collapse:collapse;border:1px solid #e5e7eb;">
          <thead><tr style="background-color:#fee2e2;">
            <th style="padding:8px;text-align:left;font-size:11px;font-weight:700;color:#b91c1c;">Produit</th>
            <th style="padding:8px;text-align:left;font-size:11px;font-weight:700;color:#b91c1c;">Catégorie</th>
            <th style="padding:8px;text-align:right;font-size:11px;font-weight:700;color:#b91c1c;">Stock</th>
          </tr></thead>
          <tbody>${produitsEnAlerte.map(p => `
            <tr style="border-bottom:1px solid #e5e7eb;">
              <td style="padding:6px 8px;font-size:11px;">${p.produit}</td>
              <td style="padding:6px 8px;font-size:11px;">${p.categorie}</td>
              <td style="padding:6px 8px;font-size:11px;text-align:right;font-weight:bold;color:#dc2626;">${fmt(p.stockDisponible)}</td>
            </tr>`).join('')}
          </tbody>
        </table>
      </div>` : '';
    win.document.write(`<!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8"/><title>Dashboard Stock Disponible</title>
    <style>*{margin:0;padding:0;box-sizing:border-box;}body{font-family:Arial,sans-serif;padding:20px;color:#111827;}
    .hdr{text-align:center;margin-bottom:20px;padding-bottom:10px;border-bottom:2px solid #e5e7eb;}
    h1{font-size:18px;font-weight:700;margin-bottom:5px;}.hdr p{font-size:11px;color:#6b7280;}
    .kpis{display:flex;gap:15px;margin-bottom:20px;flex-wrap:wrap;}.kpi{flex:1;min-width:200px;border-radius:8px;padding:15px;border:2px solid;}
    .cw{margin-bottom:20px;page-break-inside:avoid;}.cw h3{font-size:12px;font-weight:700;margin-bottom:8px;padding-left:8px;border-left:3px solid #F59E0B;}
    .cw img{width:100%;border:1px solid #e5e7eb;border-radius:5px;}
    .cw .no-data{padding:20px;text-align:center;background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;color:#9ca3af;font-size:12px;}
    .ftr{margin-top:20px;padding-top:10px;border-top:1px solid #e5e7eb;text-align:center;font-size:10px;color:#9ca3af;}
    @media print{@page{margin:1cm;}}</style></head>
    <body>
    <div class="hdr"><h1>📦 Dashboard — Stock Disponible</h1>
    <p>Imprimé le ${now.toLocaleDateString('fr-TN')} à ${now.toLocaleTimeString('fr-TN')}</p></div>
    <div class="kpis">
      <div class="kpi" style="border-color:#F59E0B;background:#fffbeb;">
        <div style="font-size:9px;color:#b45309;font-weight:700;text-transform:uppercase;">📊 Stock Total</div>
        <div style="font-size:20px;font-weight:700;color:#d97706;">${fmt(globalData.stockTotal)}</div>
        <div style="font-size:10px;color:#F59E0B;">${globalData.nombreProduits} produits</div>
      </div>
      <div class="kpi" style="border-color:#10b981;background:#ecfdf5;">
        <div style="font-size:9px;color:#065f46;font-weight:700;text-transform:uppercase;">📥 Entrées</div>
        <div style="font-size:20px;font-weight:700;color:#059669;">${fmt(globalData.entreesTotales)}</div>
      </div>
      <div class="kpi" style="border-color:#ef4444;background:#fef2f2;">
        <div style="font-size:9px;color:#b91c1c;font-weight:700;text-transform:uppercase;">📤 Sorties</div>
        <div style="font-size:20px;font-weight:700;color:#dc2626;">${fmt(globalData.sortiesTotales)}</div>
      </div>
      <div class="kpi" style="border-color:#ef4444;background:#fee2e2;">
        <div style="font-size:9px;color:#b91c1c;font-weight:700;text-transform:uppercase;">⚠️ Alertes</div>
        <div style="font-size:20px;font-weight:700;color:#dc2626;">${produitsEnAlerte.length}</div>
        <div style="font-size:10px;color:#ef4444;">produits sous seuil</div>
      </div>
    </div>
    ${images.map(i => i.hasData && i.img
      ? `<div class="cw"><h3>${i.label}</h3><img src="${i.img}"/></div>`
      : `<div class="cw"><h3>${i.label}</h3><div class="no-data">📭 Aucune donnée disponible</div></div>`
    ).join('')}
    ${alertesHTML}
    <div class="ftr">I-mobile WAS v2.4 — ISO 9001 | Dashboard Stock | ${now.toLocaleDateString('fr-TN')}</div>
    <script>window.onload=function(){setTimeout(function(){window.print();window.close();},500);};</script>
    </body></html>`);
    win.document.close();
  };

  const titreFiltreType =
    filtreType === 'matiere' ? '📦 Stock Disponible — Matières Premières' :
                               '📦 Stock Disponible — Produits Finis';

  return (
    <div className="space-y-6" ref={dashboardRef}>
      {detailModal && (
        <DetailModal type={detailModal.type} data={detailModal.data} onClose={() => setDetailModal(null)} />
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
          <select value={filtreProduit} onChange={e => { setFiltreProduit(e.target.value); vm.setProduit(e.target.value || undefined); }}
            className="border border-gray-200 rounded-xl px-3 py-2 text-sm bg-white shadow-sm">
            <option value="">Tous les produits</option>
            {produits.map(p => (<option key={p.produit} value={p.produit}>{p.produit}</option>))}
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
              {connexionStatut === 'connected' ? 'Temps réel' : connexionStatut === 'connecting' ? 'Connexion...' : 'Déconnecté'}
            </div>
            {derniereMAJ && (<span className="text-xs text-gray-400">MAJ : {derniereMAJ.toLocaleTimeString('fr-FR')}</span>)}
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-amber-50 to-amber-100 border border-amber-200 rounded-2xl p-5">
          <div className="text-xs font-bold text-amber-600 uppercase tracking-wider mb-2">📊 Stock Total</div>
          <div className="text-3xl font-black text-amber-700">{fmt(globalData.stockTotal)}</div>
          <div className="text-xs text-amber-500 mt-1">{globalData.nombreProduits} produits</div>
        </div>
        <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 border border-emerald-200 rounded-2xl p-5">
          <div className="text-xs font-bold text-emerald-600 uppercase tracking-wider mb-2">📥 Entrées</div>
          <div className="text-3xl font-black text-emerald-700">{fmt(globalData.entreesTotales)}</div>
          <div className="text-xs text-emerald-500 mt-1">Total</div>
        </div>
        <div className="bg-gradient-to-br from-red-50 to-red-100 border border-red-200 rounded-2xl p-5">
          <div className="text-xs font-bold text-red-600 uppercase tracking-wider mb-2">📤 Sorties</div>
          <div className="text-3xl font-black text-red-700">{fmt(globalData.sortiesTotales)}</div>
          <div className="text-xs text-red-500 mt-1">Total</div>
        </div>
        <div className="bg-gradient-to-br from-red-50 to-red-100 border border-red-200 rounded-2xl p-5">
          <div className="text-xs font-bold text-red-600 uppercase tracking-wider mb-2">⚠️ Alertes</div>
          <div className="text-3xl font-black text-red-700">{produitsEnAlerte.length}</div>
          <div className="text-xs text-red-500 mt-1">produits sous seuil</div>
        </div>
      </div>

      {/* Graphiques */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
          <div className="px-4 py-3 border-b border-gray-50 flex items-center justify-between gap-2 flex-wrap">
            <span className="text-sm font-semibold text-gray-700">{titreFiltreType}</span>
            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex gap-1 bg-gray-100 rounded-lg p-0.5">
                {([
                  { key: 'matiere', label: 'Matière Première' },
                  { key: 'fini',    label: 'Produits Finis' },
                ] as const).map(({ key, label }) => (
                  <button key={key} onClick={() => setFiltreType(key)}
                    className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all ${
                      filtreType === key ? 'bg-white shadow text-amber-600' : 'text-gray-500 hover:text-gray-700'}`}>
                    {label}
                  </button>
                ))}
              </div>
              <ChartActions onDetails={() => setDetailModal({ type: 'produit', data: tousProduits })} chartRef={refStock} title={titreFiltreType} />
            </div>
          </div>
          <div className="p-4" style={{ height: 900 }}>
            {hasStockData ? (
              <Bar ref={refStock} data={chartStock} options={optionsBarH} />
            ) : (
              <div className="h-full flex items-center justify-center">
                <div className="text-center text-gray-400">
                  <div className="text-4xl mb-2">📭</div>
                  <p className="text-sm font-medium">Aucune donnée disponible</p>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
          <div className="px-4 py-3 border-b border-gray-50 flex items-center justify-between">
            <span className="text-sm font-semibold text-gray-700">📈 Evolution Entrées/Sorties</span>
            <div className="flex items-center gap-2">
              <div className="flex gap-1 bg-gray-100 rounded-lg p-0.5">
                {(['mois','trimestre','annee'] as const).map(v => (
                  <button key={v} onClick={() => setTempsVue(v)}
                    className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all ${
                      tempsVue === v ? 'bg-white shadow text-amber-600' : 'text-gray-500'}`}>
                    {v.charAt(0).toUpperCase() + v.slice(1)}
                  </button>
                ))}
              </div>
              <ChartActions onDetails={() => setDetailModal({ type: 'temps', data: tempsData })} chartRef={refTemps} title="Evolution Entrees/Sorties" />
            </div>
          </div>
          <div className="p-4" style={{ height: 900 }}>
            {hasTempsData ? (
              <Bar ref={refTemps} data={chartTemps} options={optionsBar} />
            ) : (
              <div className="h-full flex items-center justify-center">
                <div className="text-center text-gray-400">
                  <div className="text-4xl mb-2">📭</div>
                  <p className="text-sm font-medium">Aucune donnée disponible</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ✅ id="alertes-stock" ajouté ici pour le scroll depuis le sidebar */}
      {produitsEnAlerte.length > 0 && (
        <div id="alertes-stock" className="bg-red-50 rounded-2xl border border-red-200 shadow-sm p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-semibold text-red-700">⚠️ Produits en alerte (stock &lt; 100)</span>
            <AlertActions onDetails={() => setDetailModal({ type: 'alerte', data: produitsEnAlerte })} alertes={produitsEnAlerte} />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {produitsEnAlerte.slice(0, 6).map((p, idx) => (
              <div key={idx} className="bg-white rounded-lg p-3 border border-red-100 flex justify-between items-center">
                <span className="text-sm font-medium">{p.produit}</span>
                <span className="text-sm font-bold text-red-600">{fmt(p.stockDisponible)}</span>
              </div>
            ))}
            {produitsEnAlerte.length > 6 && (
              <button onClick={() => setDetailModal({ type: 'alerte', data: produitsEnAlerte })}
                className="bg-white rounded-lg p-3 border border-red-100 flex justify-center items-center text-sm text-red-600 hover:bg-red-50">
                + {produitsEnAlerte.length - 6} autres produits
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default StockDisponibleView;