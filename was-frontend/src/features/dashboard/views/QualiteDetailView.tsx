// features/dashboard/views/QualiteDetailView.tsx
import { useState, useRef } from 'react';
import {
  Chart as ChartJS, CategoryScale, LinearScale, BarElement,
  Title, Tooltip, Legend
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import jsPDF from 'jspdf';
import { useQualiteViewModel } from '../viewmodels/qualite.viewmodel';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const fmt = (n: number) => n.toLocaleString('fr-TN', { minimumFractionDigits: 0 });
const fmtPct = (n: number) => `${n.toFixed(1)}%`;

type TabType = 'produit' | 'machine';

const QualiteDetailView = () => {
  const vm = useQualiteViewModel();
  const [activeTab, setActiveTab] = useState<TabType>('produit');
  const [sortBy, setSortBy] = useState<'taux' | 'defauts'>('taux');

  const refChart = useRef<any>(null);

  if (vm.loading) return (
    <div className="flex items-center justify-center py-32">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-gray-500 font-medium">Chargement des détails qualité…</p>
      </div>
    </div>
  );

  if (vm.error) return (
    <div className="flex items-center justify-center py-32">
      <div className="text-center text-red-500">⚠ {vm.error}</div>
    </div>
  );

  if (!vm.global) return null;

  // Données triées
  const produitsTries = [...vm.parProduit].sort((a, b) => 
    sortBy === 'taux' ? b.tauxDefaut - a.tauxDefaut : b.nombreDefauts - a.nombreDefauts
  );

  const machinesTriees = [...vm.parMachine].sort((a, b) => 
    sortBy === 'taux' ? b.tauxDefaut - a.tauxDefaut : b.nombreDefauts - a.nombreDefauts
  );

  const dataProduit = {
    labels: produitsTries.slice(0, 15).map(p => p.produit.length > 20 ? p.produit.slice(0,20)+'…' : p.produit),
    datasets: [{
      label: sortBy === 'taux' ? 'Taux de Défaut (%)' : 'Nombre de Défauts',
      data: produitsTries.slice(0, 15).map(p => sortBy === 'taux' ? p.tauxDefaut : p.nombreDefauts),
      backgroundColor: produitsTries.slice(0, 15).map(p => 
        p.tauxDefaut > 10 ? 'rgba(239,68,68,0.8)' : 
        p.tauxDefaut > 5 ? 'rgba(245,158,11,0.8)' : 
        'rgba(16,185,129,0.8)'
      ),
      borderRadius: 5,
    }],
  };

  const dataMachine = {
    labels: machinesTriees.slice(0, 15).map(m => m.machine),
    datasets: [{
      label: sortBy === 'taux' ? 'Taux de Défaut (%)' : 'Nombre de Défauts',
      data: machinesTriees.slice(0, 15).map(m => sortBy === 'taux' ? m.tauxDefaut : m.nombreDefauts),
      backgroundColor: machinesTriees.slice(0, 15).map(m => 
        m.tauxDefaut > 10 ? 'rgba(239,68,68,0.8)' : 
        m.tauxDefaut > 5 ? 'rgba(245,158,11,0.8)' : 
        'rgba(16,185,129,0.8)'
      ),
      borderRadius: 5,
    }],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    indexAxis: 'y' as const,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (ctx: any) => {
            const value = ctx.raw;
            return sortBy === 'taux' ? `${value}%` : `${value} défauts`;
          }
        }
      }
    },
    scales: {
      x: {
        beginAtZero: true,
        ticks: {
          callback: (val: any) => sortBy === 'taux' ? `${val}%` : val
        }
      }
    }
  };

  const telechargerPDF = () => {
    if (!refChart.current) return;
    const imgData = refChart.current.toBase64Image('image/png', 1);
    const pdf = new jsPDF('landscape', 'mm', 'a4');
    const w = pdf.internal.pageSize.getWidth();
    const h = pdf.internal.pageSize.getHeight();
    
    pdf.setFontSize(16);
    pdf.text(`Détail - ${activeTab === 'produit' ? 'Produits' : 'Machines'}`, w / 2, 15, { align: 'center' });
    pdf.setFontSize(10);
    pdf.text(`Trié par ${sortBy === 'taux' ? 'taux de défaut' : 'nombre de défauts'}`, w / 2, 25, { align: 'center' });
    pdf.addImage(imgData, 'PNG', 10, 35, w - 20, h - 45);
    pdf.save(`Detail_${activeTab}_${sortBy}.pdf`);
  };

  return (
    <div className="space-y-6">
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
     
<select value={vm.queryParams.produit ?? ''} onChange={e => vm.setProduit(e.target.value || undefined)}
  className="border border-gray-200 rounded-xl px-3 py-2 text-sm bg-white shadow-sm">
  <option value="">Tous les produits</option>
  {vm.availableFilters.produits.map(p => <option key={p} value={p}>{p}</option>)}
</select>
          <button onClick={vm.resetFilters}
            className="flex items-center gap-1.5 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-xl text-sm font-semibold text-gray-600 transition-all">
            🔄 Réinitialiser
          </button>
          <div className="ml-auto flex items-center gap-2">
            <button onClick={telechargerPDF}
              className="flex items-center gap-1.5 px-3 py-2 bg-red-500 hover:bg-red-600 text-white rounded-xl text-xs font-semibold transition-all">
              📥 Télécharger PDF
            </button>
          </div>
        </div>
      </div>

      {/* Onglets secondaires */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex gap-2 bg-white rounded-2xl border border-gray-100 shadow-sm p-2">
          <button
            onClick={() => setActiveTab('produit')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
              activeTab === 'produit'
                ? 'bg-indigo-500 text-white shadow'
                : 'text-gray-500 hover:bg-gray-100'
            }`}>
            📦 Par Produit
          </button>
          <button
            onClick={() => setActiveTab('machine')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
              activeTab === 'machine'
                ? 'bg-indigo-500 text-white shadow'
                : 'text-gray-500 hover:bg-gray-100'
            }`}>
            ⚙️ Par Machine
          </button>
        </div>

        <div className="flex gap-2 bg-white rounded-2xl border border-gray-100 shadow-sm p-2">
          <button
            onClick={() => setSortBy('taux')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
              sortBy === 'taux'
                ? 'bg-purple-500 text-white shadow'
                : 'text-gray-500 hover:bg-gray-100'
            }`}>
            Taux de défaut
          </button>
          <button
            onClick={() => setSortBy('defauts')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
              sortBy === 'defauts'
                ? 'bg-purple-500 text-white shadow'
                : 'text-gray-500 hover:bg-gray-100'
            }`}>
            Nombre de défauts
          </button>
        </div>
      </div>

      {/* Tableau de données */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
          <h3 className="font-semibold text-gray-700">
            {activeTab === 'produit' ? '📦 Détail par Produit' : '⚙️ Détail par Machine'} 
            <span className="ml-2 text-sm font-normal text-gray-400">
              ({activeTab === 'produit' ? produitsTries.length : machinesTriees.length} éléments)
            </span>
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  {activeTab === 'produit' ? 'Produit' : 'Machine'}
                </th>
                {activeTab === 'produit' && (
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Catégorie
                  </th>
                )}
                {activeTab === 'machine' && (
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Groupe / Site
                  </th>
                )}
                <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Contrôles
                </th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Défauts
                </th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Taux
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {(activeTab === 'produit' ? produitsTries : machinesTriees).map((item, index) => (
                <tr key={index} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-3 text-sm font-medium text-gray-900">
                    {activeTab === 'produit' 
                      ? (item as any).produit 
                      : (item as any).machine}
                  </td>
                  {activeTab === 'produit' && (
                    <td className="px-6 py-3 text-sm text-gray-500">
                      <span className="bg-indigo-50 text-indigo-700 text-xs px-2 py-1 rounded-full">
                        {(item as any).categorie}
                      </span>
                    </td>
                  )}
                  {activeTab === 'machine' && (
                    <td className="px-6 py-3 text-sm text-gray-500">
                      {(item as any).groupe} / {(item as any).site}
                    </td>
                  )}
                  <td className="px-6 py-3 text-sm text-right text-gray-600">
                    {fmt((item as any).nombreControles)}
                  </td>
                  <td className="px-6 py-3 text-sm text-right font-semibold text-red-600">
                    {fmt((item as any).nombreDefauts)}
                  </td>
                  <td className="px-6 py-3 text-sm text-right">
                    <span className={`font-bold ${
                      (item as any).tauxDefaut > 10 ? 'text-red-600' :
                      (item as any).tauxDefaut > 5 ? 'text-amber-600' :
                      'text-emerald-600'
                    }`}>
                      {(item as any).tauxDefaut}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Graphique */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
        <div className="px-4 py-3 border-b border-gray-50 flex items-center justify-between">
          <span className="text-sm font-semibold text-gray-700">
            Graphique - {activeTab === 'produit' ? 'Produits' : 'Machines'} 
            (Top 15 par {sortBy === 'taux' ? 'taux de défaut' : 'nombre de défauts'})
          </span>
        </div>
        <div className="p-4" style={{ height: 500 }}>
          <Bar 
            ref={refChart} 
            data={activeTab === 'produit' ? dataProduit : dataMachine} 
            options={options} 
          />
        </div>
      </div>
    </div>
  );
};

export default QualiteDetailView;