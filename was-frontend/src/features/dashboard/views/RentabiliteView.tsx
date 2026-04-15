import { useState, useRef } from 'react';
import {
  Chart as ChartJS, CategoryScale, LinearScale, BarElement,
  LineElement, PointElement, Title, Tooltip, Legend, Filler
} from 'chart.js';
import { Bar, Line } from 'react-chartjs-2';
import jsPDF from 'jspdf';
import { useRentabilite } from '../viewmodels/rentabilite.viewmodel';

ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, Title, Tooltip, Legend, Filler);

const fmt    = (n: number) => n.toLocaleString('fr-TN', { minimumFractionDigits: 0 });
const fmtPct = (n: number) => `${n.toFixed(2)}%`;

const couleurBarre = (rentabilite: number) =>
  rentabilite >= 100 ? 'rgba(16,185,129,0.8)' : 'rgba(239,68,68,0.8)';

// ── Plugin ligne rouge seuil 100% ────────────────────────
const pluginSeuil100 = {
  id: 'seuil100',
  afterDraw: (chart: any) => {
    const ctx   = chart.ctx;
    const yAxis = chart.scales['y'];
    const xAxis = chart.scales['x'];
    if (!yAxis || !xAxis) return;
    const y = yAxis.getPixelForValue(100);
    ctx.save();
    ctx.beginPath();
    ctx.setLineDash([6, 4]);
    ctx.strokeStyle = 'rgba(239,68,68,0.9)';
    ctx.lineWidth = 2;
    ctx.moveTo(xAxis.left, y);
    ctx.lineTo(xAxis.right, y);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.font = 'bold 11px sans-serif';
    ctx.fillStyle = 'rgba(239,68,68,0.9)';
    ctx.fillText('Seuil 100%', xAxis.left + 6, y - 5);
    ctx.restore();
  },
};

const BadgeRentabilite = ({ pct }: { pct: number }) => (
  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold ${
    pct >= 100
      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
      : 'bg-red-50 text-red-700 border border-red-200'
  }`}>
    {pct >= 100 ? '✅' : '❌'} {fmtPct(pct)}
  </span>
);

const ChartActions = ({
  onDetails, chartRef, title,
}: {
  onDetails: () => void;
  chartRef: React.RefObject<any>;
  title: string;
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
        className="flex items-center gap-1 px-2.5 py-1.5 bg-white border border-red-200 rounded-lg text-xs font-semibold text-red-600 hover:bg-red-50 shadow-sm">
        📄 PDF
      </button>
      <button onClick={imprimerGraphique}
        className="flex items-center gap-1 px-2.5 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-semibold text-gray-600 hover:bg-gray-50 shadow-sm">
        🖨️
      </button>
    </div>
  );
};

type ModalType = 'temps' | 'produit' | 'machine' | null;

const Modal = ({
  type, vm, onClose
}: {
  type: ModalType;
  vm: ReturnType<typeof useRentabilite>;
  onClose: () => void;
}) => {
  const [tempsVue, setTempsVue] = useState<'mois'|'trimestre'|'annee'>('mois');
  if (!type) return null;

  const thCls = 'px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-emerald-700';
  const tdCls = 'px-4 py-3 text-sm border-b border-gray-50';

  const tempsData = tempsVue === 'mois' ? vm.parTempsMois
    : tempsVue === 'trimestre' ? vm.parTempsTrimestre
    : vm.parTempsAnnee;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h3 className="font-bold text-gray-800 text-base">
            📊 Détails —{' '}
            {type === 'temps'   && '📅 Rentabilité par Temps'}
            {type === 'produit' && '📦 Rentabilité par Produit'}
            {type === 'machine' && '⚙️ Rentabilité par Machine'}
          </h3>
          {type === 'temps' && (
            <div className="flex gap-1">
              {(['mois','trimestre','annee'] as const).map(v => (
                <button key={v} onClick={() => setTempsVue(v)}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                    tempsVue === v ? 'bg-emerald-500 text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                  }`}>
                  {v.charAt(0).toUpperCase() + v.slice(1)}
                </button>
              ))}
            </div>
          )}
          <button onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-xl font-bold ml-2">✕</button>
        </div>
        <div className="overflow-y-auto flex-1">
          <table className="w-full border-collapse">
            <thead className="bg-emerald-50 sticky top-0">
              <tr>
                {type === 'temps' && <>
                  <th className={thCls}>Période</th>
                  <th className={`${thCls} text-right`}>Rentabilité</th>
                  <th className={`${thCls} text-right`}>Revenu</th>
                  <th className={`${thCls} text-right`}>Coût Machine</th>
                </>}
                {type === 'produit' && <>
                  <th className={thCls}>Produit</th>
                  <th className={thCls}>Catégorie</th>
                  <th className={`${thCls} text-right`}>Rentabilité</th>
                  <th className={`${thCls} text-right`}>Revenu</th>
                  <th className={`${thCls} text-right`}>Coût Machine</th>
                </>}
                {type === 'machine' && <>
                  <th className={thCls}>Machine</th>
                  <th className={thCls}>Groupe</th>
                  <th className={`${thCls} text-right`}>Rentabilité</th>
                  <th className={`${thCls} text-right`}>Revenu</th>
                  <th className={`${thCls} text-right`}>Heures</th>
                </>}
              </tr>
            </thead>
            <tbody>
              {type === 'temps' && tempsData.map((t, i) => (
                <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  <td className={`${tdCls} font-medium`}>{t.label}</td>
                  <td className={`${tdCls} text-right`}><BadgeRentabilite pct={t.rentabiliteMoyenne} /></td>
                  <td className={`${tdCls} text-right font-semibold text-emerald-600`}>{fmt(t.revenuTotal)} DT</td>
                  <td className={`${tdCls} text-right text-red-500`}>{fmt(t.coutMachineTotal)} DT</td>
                </tr>
              ))}
              {type === 'produit' && vm.parProduit.map((p, i) => (
                <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  <td className={`${tdCls} font-medium`}>{p.produit}</td>
                  <td className={tdCls}><span className="bg-emerald-50 text-emerald-700 text-xs px-2 py-0.5 rounded-full">{p.categorie}</span></td>
                  <td className={`${tdCls} text-right`}><BadgeRentabilite pct={p.rentabiliteMoyenne} /></td>
                  <td className={`${tdCls} text-right font-semibold text-emerald-600`}>{fmt(p.revenuTotal)} DT</td>
                  <td className={`${tdCls} text-right text-red-500`}>{fmt(p.coutMachineTotal)} DT</td>
                </tr>
              ))}
              {type === 'machine' && vm.parMachine.map((m, i) => (
                <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  <td className={`${tdCls} font-medium`}>{m.machine}</td>
                  <td className={tdCls}><span className="bg-purple-50 text-purple-700 text-xs px-2 py-0.5 rounded-full">{m.groupe}</span></td>
                  <td className={`${tdCls} text-right`}><BadgeRentabilite pct={m.rentabiliteMoyenne} /></td>
                  <td className={`${tdCls} text-right font-semibold text-emerald-600`}>{fmt(m.revenuTotal)} DT</td>
                  <td className={`${tdCls} text-right text-gray-500`}>{fmt(m.heuresMachine)}h</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const RentabiliteView = () => {
  const vm = useRentabilite();
  const [modal,    setModal]    = useState<ModalType>(null);
  const [tempsVue, setTempsVue] = useState<'mois'|'trimestre'|'annee'>('mois');

  const refTemps   = useRef<any>(null);
  const refProduit = useRef<any>(null);
  const refMachine = useRef<any>(null);

  if (vm.loading) return (
    <div className="flex items-center justify-center py-32">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-gray-500 font-medium">Chargement des données rentabilité…</p>
      </div>
    </div>
  );

  if (vm.error) return (
    <div className="flex items-center justify-center py-32">
      <div className="text-center text-red-500">⚠ {vm.error}</div>
    </div>
  );

  const tempsData = tempsVue === 'mois' ? vm.parTempsMois
    : tempsVue === 'trimestre' ? vm.parTempsTrimestre
    : vm.parTempsAnnee;

  const rentMoy = vm.kpi?.rentabiliteMoyenne ?? 0;
  const machinesNonRentables = vm.parMachine.filter(m => m.rentabiliteMoyenne < 100);

  const exportDashboardPDF = () => {
    const pdf = new jsPDF('portrait', 'mm', 'a4');
    const w = pdf.internal.pageSize.getWidth();
    const pageH = pdf.internal.pageSize.getHeight();
    let y = 10;
    pdf.setFontSize(18);
    pdf.text('Dashboard — Rentabilité Machine', w / 2, y, { align: 'center' });
    y += 12;
    if (vm.kpi) {
      pdf.setFontSize(10);
      pdf.text(`Rentabilité Moyenne : ${fmtPct(rentMoy)}`, 10, y); y += 10;
    }
    const charts = [
      { ref: refTemps,   label: 'Rentabilité Machine par Temps' },
      { ref: refProduit, label: 'Rentabilité par Produit' },
      { ref: refMachine, label: 'Rentabilité par Machine' },
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
    pdf.save('Dashboard_Rentabilite_Machine.pdf');
  };

  const imprimerDashboard = () => {
    const charts = [
      { ref: refTemps,   label: '📅 Rentabilité Machine par Temps' },
      { ref: refProduit, label: '📦 Rentabilité par Produit' },
      { ref: refMachine, label: '⚙️ Rentabilité par Machine' },
    ];
    const images = charts.map(({ ref, label }) => ({
      label, img: ref.current ? ref.current.toBase64Image('image/png', 1) : null,
    }));
    const now = new Date();
    const win = window.open('', '_blank');
    if (!win) { alert('Autorisez les popups pour ce site.'); return; }
    win.document.write(`<!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8"/>
      <title>Dashboard Rentabilité Machine</title>
      <style>*{box-sizing:border-box;margin:0;padding:0}
      body{font-family:Arial,sans-serif;padding:28px;color:#111827}
      .hdr{text-align:center;margin-bottom:20px;padding-bottom:12px;border-bottom:2px solid #e5e7eb}
      h1{font-size:18px;font-weight:700;margin-bottom:4px}p{font-size:11px;color:#6b7280}
      .kpi{border-radius:8px;padding:12px;border:2px solid;margin-bottom:20px;display:inline-block}
      .cw{margin-bottom:18px;page-break-inside:avoid}
      .cw h3{font-size:11px;font-weight:700;margin-bottom:6px;padding-left:8px;border-left:3px solid #10b981}
      .cw img{width:100%;border:1px solid #e5e7eb;border-radius:6px}
      .ftr{margin-top:20px;padding-top:10px;border-top:1px solid #e5e7eb;text-align:center;font-size:10px;color:#9ca3af}
      @media print{@page{margin:10mm;size:A4}}</style></head><body>
      <div class="hdr">
        <h1>⚙️ Dashboard — Rentabilité Machine</h1>
        <p>Imprimé le ${now.toLocaleDateString('fr-TN')} à ${now.toLocaleTimeString('fr-TN')}</p>
      </div>
      <div class="kpi" style="border-color:${rentMoy >= 100 ? '#10b981' : '#ef4444'};background:${rentMoy >= 100 ? '#ecfdf5' : '#fef2f2'}">
        <div style="font-size:9px;color:${rentMoy >= 100 ? '#065f46' : '#991b1b'};font-weight:700;text-transform:uppercase">📊 Rentabilité Moyenne</div>
        <div style="font-size:20px;font-weight:700;color:${rentMoy >= 100 ? '#059669' : '#dc2626'}">${fmtPct(rentMoy)}</div>
        <div style="font-size:10px;color:${rentMoy >= 100 ? '#10b981' : '#ef4444'}">${rentMoy >= 100 ? '✅ Rentable' : '❌ Non rentable'}</div>
      </div>
      ${images.filter(i => i.img).map(i =>
        `<div class="cw"><h3>${i.label}</h3><img src="${i.img}"/></div>`
      ).join('')}
      <div class="ftr">I-mobile WAS v2.4 — ISO 9001 | Dashboard Rentabilité Machine | ${now.toLocaleDateString('fr-TN')}</div>
      <script>window.onload=function(){setTimeout(()=>{window.print();},500);}</script>
      </body></html>`);
    win.document.close();
  };

  const chartTemps = {
    labels: tempsData.map(t => t.label),
    datasets: [{
      label: 'Rentabilité (%)',
      data: tempsData.map(t => t.rentabiliteMoyenne),
      borderColor: 'rgba(16,185,129,1)',
      backgroundColor: 'rgba(16,185,129,0.1)',
      borderWidth: 2, fill: true, tension: 0.4,
      pointBackgroundColor: tempsData.map(t =>
        t.rentabiliteMoyenne >= 100 ? 'rgba(16,185,129,1)' : 'rgba(239,68,68,1)'
      ),
      pointRadius: 5,
    }],
  };

  const chartProduit = {
    labels: vm.parProduit.map(p => p.produit.length > 18 ? p.produit.slice(0, 18) + '…' : p.produit),
    datasets: [{
      label: 'Rentabilité (%)',
      data: vm.parProduit.map(p => p.rentabiliteMoyenne),
      backgroundColor: vm.parProduit.map(p => couleurBarre(p.rentabiliteMoyenne)),
      borderRadius: 5,
    }],
  };

  const chartMachine = {
    labels: vm.parMachine.map(m => m.machine),
    datasets: [{
      label: 'Rentabilité (%)',
      data: vm.parMachine.map(m => m.rentabiliteMoyenne),
      backgroundColor: vm.parMachine.map(m => couleurBarre(m.rentabiliteMoyenne)),
      borderRadius: 5,
    }],
  };

  const optionsLine = {
    responsive: true, maintainAspectRatio: false,
    plugins: { legend: { position: 'top' as const } },
    scales: {
      y: {
        min: 0,
        ticks: { callback: (val: any) => `${val}%` },
        grid: { color: 'rgba(0,0,0,0.05)' },
      },
    },
  };

  const optionsBarPct = {
    responsive: true, maintainAspectRatio: false,
    plugins: { legend: { position: 'top' as const } },
    scales: { x: { ticks: { callback: (val: any) => `${val}%` } } },
  };

  return (
    <div className="space-y-6">
      <Modal type={modal} vm={vm} onClose={() => setModal(null)} />

      {/* ── Filtres ── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
        <div className="flex flex-wrap items-center gap-3">
          <select value={vm.annee} onChange={e => vm.setAnnee(e.target.value)}
            className="border border-gray-200 rounded-xl px-3 py-2 text-sm bg-white shadow-sm">
            <option value="">Toutes les années</option>
            <option value="2024">2024</option>
            <option value="2025">2025</option>
          </select>
          <select value={vm.trimestre} onChange={e => vm.setTrimestre(e.target.value)}
            className="border border-gray-200 rounded-xl px-3 py-2 text-sm bg-white shadow-sm">
            <option value="">Tous les trimestres</option>
            <option value="1">T1</option>
            <option value="2">T2</option>
            <option value="3">T3</option>
            <option value="4">T4</option>
          </select>
          <button onClick={vm.resetFiltres}
            className="flex items-center gap-1.5 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-xl text-sm font-semibold text-gray-600 transition-all">
            🔄 Réinitialiser
          </button>
          <div className="ml-auto flex items-center gap-2">
            <button onClick={exportDashboardPDF}
              className="flex items-center gap-1.5 px-3 py-2 bg-red-500 hover:bg-red-600 text-white rounded-xl text-xs font-semibold transition-all">
              📥 Télécharger PDF
            </button>
            <button onClick={imprimerDashboard}
              className="flex items-center gap-1.5 px-3 py-2 bg-gray-700 hover:bg-gray-800 text-white rounded-xl text-xs font-semibold transition-all">
              🖨️ Imprimer
            </button>
            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold ${
              vm.connexionStatut === 'connected'  ? 'bg-emerald-50 text-emerald-700' :
              vm.connexionStatut === 'connecting' ? 'bg-amber-50 text-amber-700' :
              'bg-red-50 text-red-700'}`}>
              <div className={`w-1.5 h-1.5 rounded-full ${
                vm.connexionStatut === 'connected'  ? 'bg-emerald-500 animate-pulse' :
                vm.connexionStatut === 'connecting' ? 'bg-amber-500' : 'bg-red-500'}`} />
              {vm.connexionStatut === 'connected'  ? 'Temps réel' :
               vm.connexionStatut === 'connecting' ? 'Connexion...' : 'Déconnecté'}
            </div>
            {vm.derniereMAJ && (
              <span className="text-xs text-gray-400">
                MAJ : {vm.derniereMAJ.toLocaleTimeString('fr-FR')}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ── Bannière alerte machines non rentables ── */}
      {machinesNonRentables.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-2xl px-5 py-4 flex items-start gap-3">
          <span className="text-2xl mt-0.5">⚠️</span>
          <div className="flex-1">
            <div className="text-sm font-bold text-red-700 mb-1">
              Alerte — {machinesNonRentables.length} machine{machinesNonRentables.length > 1 ? 's' : ''} non rentable{machinesNonRentables.length > 1 ? 's' : ''} détectée{machinesNonRentables.length > 1 ? 's' : ''}
            </div>
            <div className="flex flex-wrap gap-2 mt-1">
              {machinesNonRentables.map((m, i) => (
                <span key={i} className="inline-flex items-center gap-1 bg-red-100 text-red-700 border border-red-300 rounded-full px-3 py-0.5 text-xs font-semibold">
                  ❌ {m.machine} — {fmtPct(m.rentabiliteMoyenne)}
                </span>
              ))}
            </div>
            <div className="text-xs text-red-500 mt-2">
              Ces machines coûtent plus qu'elles ne rapportent — vérifier leur utilisation ou planifier une maintenance.
            </div>
          </div>
        </div>
      )}

      {/* ── KPI Card — Rentabilité Moyenne uniquement ── */}
      <div className="grid grid-cols-1 gap-4">
        <div className={`rounded-2xl p-5 border ${
          rentMoy >= 100
            ? 'bg-gradient-to-br from-emerald-50 to-emerald-100 border-emerald-200'
            : 'bg-gradient-to-br from-red-50 to-red-100 border-red-200'
        }`}>
          <div className={`text-xs font-bold uppercase tracking-wider mb-2 ${rentMoy >= 100 ? 'text-emerald-600' : 'text-red-600'}`}>
            📊 Rentabilité Moyenne
          </div>
          <div className={`text-3xl font-black ${rentMoy >= 100 ? 'text-emerald-700' : 'text-red-700'}`}>
            {fmtPct(rentMoy)}
          </div>
          <div className={`text-xs mt-1 ${rentMoy >= 100 ? 'text-emerald-500' : 'text-red-500'}`}>
            {rentMoy >= 100 ? '✅ Rentable' : '❌ Non rentable'}
          </div>
        </div>
      </div>

      {/* ── Rentabilité par Temps ── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
        <div className="px-5 py-4 border-b border-gray-50 flex items-center justify-between flex-wrap gap-2">
          <h2 className="font-bold text-gray-800">📅 Rentabilité Machine par Temps</h2>
          <div className="flex items-center gap-2">
            <div className="flex gap-1 bg-gray-100 rounded-lg p-0.5">
              {(['mois','trimestre','annee'] as const).map(v => (
                <button key={v} onClick={() => setTempsVue(v)}
                  className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all ${
                    tempsVue === v ? 'bg-white shadow text-emerald-600' : 'text-gray-500'
                  }`}>
                  {v.charAt(0).toUpperCase() + v.slice(1)}
                </button>
              ))}
            </div>
            <ChartActions
              onDetails={() => setModal('temps')}
              chartRef={refTemps}
              title="Rentabilité Machine par Temps"
            />
          </div>
        </div>
        <div className="p-5" style={{ height: 300 }}>
          {tempsData.length === 0
            ? <div className="flex items-center justify-center h-full text-gray-400 text-sm">📭 Aucune donnée disponible</div>
            : <Line ref={refTemps} data={chartTemps} options={optionsLine} plugins={[pluginSeuil100]} />
          }
        </div>
        <div className="px-5 pb-4 text-xs text-gray-400 flex items-center gap-1">
          <span style={{ display:'inline-block', width:20, borderTop:'2px dashed rgba(239,68,68,0.9)', marginRight:4 }} />
          Ligne rouge = seuil 100% (rentabilité minimale)
        </div>
      </div>

      {/* ── Rentabilité par Produit + Machine ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
          <div className="px-4 py-3 border-b border-gray-50 flex items-center justify-between">
            <span className="text-sm font-semibold text-gray-700">📦 Rentabilité par Produit</span>
            <ChartActions
              onDetails={() => setModal('produit')}
              chartRef={refProduit}
              title="Rentabilité par Produit"
            />
          </div>
          <div className="p-4" style={{ height: 480 }}>
            {vm.parProduit.length === 0
              ? <div className="flex items-center justify-center h-full text-gray-400 text-sm">📭 Aucune donnée disponible</div>
              : <Bar ref={refProduit} data={chartProduit} options={{ ...optionsBarPct, indexAxis: 'y' as const }} />}
          </div>
          <div className="px-4 pb-3 flex items-center gap-3 text-xs">
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-emerald-500 inline-block" /> ≥ 100% rentable</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-red-500 inline-block" /> &lt; 100% non rentable</span>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
          <div className="px-4 py-3 border-b border-gray-50 flex items-center justify-between">
            <span className="text-sm font-semibold text-gray-700">⚙️ Rentabilité par Machine</span>
            <ChartActions
              onDetails={() => setModal('machine')}
              chartRef={refMachine}
              title="Rentabilité par Machine"
            />
          </div>
          <div className="p-4" style={{ height: 480 }}>
            {vm.parMachine.length === 0
              ? <div className="flex items-center justify-center h-full text-gray-400 text-sm">📭 Aucune donnée disponible</div>
              : <Bar ref={refMachine} data={chartMachine} options={{ ...optionsBarPct, indexAxis: 'y' as const }} />}
          </div>
          <div className="px-4 pb-3 flex items-center gap-3 text-xs">
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-emerald-500 inline-block" /> ≥ 100% rentable</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-red-500 inline-block" /> &lt; 100% non rentable</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RentabiliteView;