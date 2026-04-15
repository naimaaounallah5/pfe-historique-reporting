import { useState, useRef } from 'react';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, LineElement, PointElement, Title, Tooltip, Legend, Filler } from 'chart.js';
import { Bar } from 'react-chartjs-2';
import jsPDF from 'jspdf';
import { useProduction } from '../viewmodels/production.viewmodel';

ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, Title, Tooltip, Legend, Filler);

const fmt = (n: number) => n.toLocaleString('fr-TN', { minimumFractionDigits: 0 });

const C = {
  orange:       '#ea580c',
  orangeClair:  '#fff7ed',
  orangeBord:   '#fed7aa',
  bleu:         '#2563eb',
  bleuClair:    '#eff6ff',
  bleuBord:     '#bfdbfe',
  violet:       '#7c3aed',
  violetClair:  '#f5f3ff',
  violetBord:   '#ddd6fe',
  rouge:        '#e11d48',
  rougeClair:   '#fff1f2',
  rougeBord:    '#fecdd3',
  slate:        '#0f172a',
  slateM:       '#475569',
  slateL:       '#94a3b8',
  bord:         '#e2e8f0',
  bg:           '#f8fafc',
  white:        '#ffffff',
};

const COULEURS_PRODUIT = [
  '#FF6B6B','#FF8E53','#FFA94D','#FFD43B',
  '#69DB7C','#38D9A9','#4DABF7','#748FFC',
  '#DA77F2','#F783AC','#A9E34B','#63E6BE',
  '#74C0FC','#E599F7','#FFA8A8','#FFD8A8',
];

const COULEURS_MACHINE = [
  '#845EF7','#5C7CFA','#339AF0','#22B8CF',
  '#20C997','#51CF66','#94D82D','#FCC419',
  '#FF922B','#F03E3E','#E64980','#CC5DE8',
  '#7950F2','#4C6EF5','#1C7ED6','#0CA678',
];

// ── Empty Chart ──────────────────────────────────────────────
const EmptyChart = ({ message = "Aucune donnée disponible" }: { message?: string }) => (
  <div style={{
    display:'flex', flexDirection:'column', alignItems:'center',
    justifyContent:'center', height:'100%', gap:8, padding:'32px 0',
  }}>
    <span style={{ fontSize:32, opacity:0.3 }}>📊</span>
    <p style={{ fontSize:13, color:C.slateL, fontWeight:500, margin:0 }}>{message}</p>
    <p style={{ fontSize:11, color:C.slateL, opacity:0.7, margin:0 }}>Aucune donnée ne correspond aux filtres sélectionnés</p>
  </div>
);

// ── ChartActions ──────────────────────────────────────────────
const ChartActions = ({ onDetails, chartRef, title, accent = 'orange' }: {
  onDetails: () => void; chartRef: React.RefObject<any>;
  title: string; accent?: 'orange' | 'blue' | 'violet';
}) => {
  const color = accent==='blue' ? C.bleu : accent==='violet' ? C.violet : C.orange;
  const clair = accent==='blue' ? C.bleuClair : accent==='violet' ? C.violetClair : C.orangeClair;
  const bord  = accent==='blue' ? C.bleuBord  : accent==='violet' ? C.violetBord  : C.orangeBord;

  const telechargerPDF = () => {
    if (!chartRef?.current) return;
    const imgData = chartRef.current.toBase64Image('image/png', 1);
    const pdf = new jsPDF('landscape','mm','a4');
    const w = pdf.internal.pageSize.getWidth();
    const h = pdf.internal.pageSize.getHeight();
    const [r,g,b] = accent==='blue' ? [37,99,235] : accent==='violet' ? [124,58,237] : [234,88,12];
    pdf.setFillColor(r,g,b); pdf.rect(0,0,w,18,'F');
    pdf.setTextColor(255,255,255); pdf.setFontSize(13);
    pdf.text(title, w/2, 12, { align:'center' });
    pdf.setTextColor(0,0,0);
    pdf.addImage(imgData,'PNG',10,24,w-20,h-34);
    pdf.save(`${title}.pdf`);
  };

  const imprimerGraphique = () => {
    if (!chartRef?.current) return;
    const imgData = chartRef.current.toBase64Image('image/png', 1);
    const now = new Date();
    const win = window.open('','_blank'); if (!win) return;
    win.document.write(`<html><head><title>${title}</title>
      <style>body{margin:20px;font-family:Arial,sans-serif;}
      .hdr{text-align:center;margin-bottom:16px;padding-bottom:12px;border-bottom:2px solid ${bord};}
      h1{font-size:16px;font-weight:700;color:${color};margin:0 0 4px;}
      p{font-size:11px;color:#6b7280;margin:0;}
      img{max-width:100%;border:1px solid #e2e8f0;border-radius:8px;}
      @media print{@page{size:A4 landscape;margin:12mm;}}</style></head>
      <body><div class="hdr"><h1>${title}</h1>
      <p>Imprimé le ${now.toLocaleDateString('fr-TN')} à ${now.toLocaleTimeString('fr-TN')}</p></div>
      <img src="${imgData}" onload="window.print();window.close()"/></body></html>`);
    win.document.close();
  };

  return (
    <div style={{ display:'flex', alignItems:'center', gap:5 }}>
      <button onClick={onDetails} style={{
        display:'flex',alignItems:'center',gap:4,padding:'6px 12px',borderRadius:8,
        border:`1px solid ${C.bord}`,background:C.white,color:C.slateM,
        fontSize:11,fontWeight:600,cursor:'pointer',transition:'all 0.15s',
      }}
        onMouseEnter={e=>{const t=e.currentTarget as HTMLButtonElement;t.style.borderColor=color;t.style.color=color;t.style.background=clair;}}
        onMouseLeave={e=>{const t=e.currentTarget as HTMLButtonElement;t.style.borderColor=C.bord;t.style.color=C.slateM;t.style.background=C.white;}}>
        🔍 Détails
      </button>
      <button onClick={telechargerPDF} style={{
        display:'flex',alignItems:'center',gap:4,padding:'6px 12px',borderRadius:8,
        border:`1px solid ${bord}`,background:C.white,color:color,
        fontSize:11,fontWeight:600,cursor:'pointer',transition:'all 0.15s',
      }}
        onMouseEnter={e=>{(e.currentTarget as HTMLButtonElement).style.background=clair;}}
        onMouseLeave={e=>{(e.currentTarget as HTMLButtonElement).style.background=C.white;}}>
        📄 PDF
      </button>
      <button onClick={imprimerGraphique} style={{
        display:'flex',alignItems:'center',gap:4,padding:'6px 12px',borderRadius:8,
        border:`1px solid ${C.bord}`,background:C.white,color:C.slateM,
        fontSize:11,fontWeight:600,cursor:'pointer',transition:'all 0.15s',
      }}
        onMouseEnter={e=>{(e.currentTarget as HTMLButtonElement).style.background=C.bg;}}
        onMouseLeave={e=>{(e.currentTarget as HTMLButtonElement).style.background=C.white;}}>
        🖨️
      </button>
    </div>
  );
};

// ── Modal Détails ────────────────────────────────────────────
type ModalType = 'temps' | 'produit' | 'machine' | null;

const Modal = ({ type, vm, onClose }: { type: ModalType; vm: ReturnType<typeof useProduction>; onClose: () => void }) => {
  const [tempsVue, setTempsVue] = useState<'mois'|'trimestre'|'annee'>('mois');
  if (!type) return null;

  const getTitle = () => {
    if (type==='temps')   return '📅 Coût de Production par Temps';
    if (type==='produit') return '📦 Coût de Production par Produit';
    return '⚙️ Coût de Production par Machine';
  };
  const getColor = () => type==='produit' ? C.orange : type==='machine' ? C.violet : C.orange;
  const getBg    = () => type==='produit' ? C.orangeClair : type==='machine' ? C.violetClair : C.orangeClair;

  const tempsData = tempsVue==='mois' ? vm.parTempsMois
    : tempsVue==='trimestre' ? vm.parTempsTrimestre
    : vm.parTempsAnnee;
  const tempsColLabel = tempsVue==='mois' ? 'Mois' : tempsVue==='trimestre' ? 'Trimestre' : 'Année';

  const isEmpty =
    (type === 'temps'   && tempsData.length === 0) ||
    (type === 'produit' && vm.parProduit.length === 0) ||
    (type === 'machine' && vm.parMachine.length === 0);

  return (
    <div style={{
      position:'fixed',inset:0,background:'rgba(15,23,42,0.55)',backdropFilter:'blur(4px)',
      zIndex:50,display:'flex',alignItems:'center',justifyContent:'center',padding:16,
    }} onClick={e => { if (e.target===e.currentTarget) onClose(); }}>
      <div style={{
        background:C.white,borderRadius:20,boxShadow:'0 24px 64px rgba(0,0,0,0.18)',
        width:'100%',maxWidth:680,maxHeight:'82vh',display:'flex',flexDirection:'column',
        border:`1px solid ${C.bord}`,overflow:'hidden',
      }}>
        <div style={{
          padding:'18px 24px',borderBottom:`1px solid ${C.bord}`,
          background:`linear-gradient(135deg,${getBg()} 0%,${C.white} 60%)`,
          display:'flex',alignItems:'center',justifyContent:'space-between',
        }}>
          <div style={{ display:'flex',alignItems:'center',gap:10 }}>
            <div style={{
              width:36,height:36,borderRadius:10,background:getBg(),
              border:`1px solid ${getColor()}30`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:16,
            }}>📊</div>
            <div>
              <div style={{fontSize:10,color:getColor(),fontWeight:700,textTransform:'uppercase',letterSpacing:'0.06em'}}>Analyse détaillée</div>
              <div style={{fontSize:14,fontWeight:800,color:C.slate}}>{getTitle()}</div>
            </div>
          </div>
          <div style={{ display:'flex',alignItems:'center',gap:8 }}>
            {type==='temps' && (
              <div style={{ display:'flex',gap:3,padding:3,background:'#f1f5f9',borderRadius:8 }}>
                {(['mois','trimestre','annee'] as const).map(v => (
                  <button key={v} onClick={() => setTempsVue(v)} style={{
                    padding:'5px 11px',borderRadius:6,border:'none',fontSize:11,fontWeight:600,cursor:'pointer',
                    background:tempsVue===v ? C.white : 'transparent',
                    color:tempsVue===v ? C.orange : C.slateL,
                    boxShadow:tempsVue===v ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                  }}>{v.charAt(0).toUpperCase()+v.slice(1)}</button>
                ))}
              </div>
            )}
            <button onClick={onClose} style={{
              width:32,height:32,borderRadius:8,border:'none',
              background:'#f1f5f9',color:C.slateM,cursor:'pointer',fontSize:13,fontWeight:700,
            }}>✕</button>
          </div>
        </div>
        <div style={{ overflowY:'auto',flex:1 }}>
          {isEmpty ? (
            <div style={{
              display:'flex',flexDirection:'column',alignItems:'center',
              justifyContent:'center',padding:'64px 24px',gap:10,
            }}>
              <span style={{ fontSize:40,opacity:0.3 }}>📊</span>
              <p style={{ fontSize:14,color:C.slateL,fontWeight:500,margin:0 }}>Aucune donnée disponible</p>
            </div>
          ) : (
            <table style={{ width:'100%',borderCollapse:'collapse' }}>
              <thead style={{ background:'#fafafa',position:'sticky',top:0 }}>
                <tr>
                  {type==='temps' && <>
                    <th style={{padding:'10px 16px',textAlign:'left',fontSize:10,fontWeight:700,color:C.orange,textTransform:'uppercase',letterSpacing:'0.06em'}}>{tempsColLabel}</th>
                    <th style={{padding:'10px 16px',textAlign:'right',fontSize:10,fontWeight:700,color:C.orange,textTransform:'uppercase',letterSpacing:'0.06em'}}>Coût Total</th>
                    <th style={{padding:'10px 16px',textAlign:'right',fontSize:10,fontWeight:700,color:C.bleu,textTransform:'uppercase',letterSpacing:'0.06em'}}>Coût Matière</th>
                    <th style={{padding:'10px 16px',textAlign:'right',fontSize:10,fontWeight:700,color:C.violet,textTransform:'uppercase',letterSpacing:'0.06em'}}>Coût Machine</th>
                  </>}
                  {type==='produit' && <>
                    <th style={{padding:'10px 16px',textAlign:'left',fontSize:10,fontWeight:700,color:C.orange,textTransform:'uppercase',letterSpacing:'0.06em'}}>Produit</th>
                    <th style={{padding:'10px 16px',textAlign:'left',fontSize:10,fontWeight:700,color:C.orange,textTransform:'uppercase',letterSpacing:'0.06em'}}>Catégorie</th>
                    <th style={{padding:'10px 16px',textAlign:'right',fontSize:10,fontWeight:700,color:C.orange,textTransform:'uppercase',letterSpacing:'0.06em'}}>Coût Total</th>
                    <th style={{padding:'10px 16px',textAlign:'right',fontSize:10,fontWeight:700,color:C.orange,textTransform:'uppercase',letterSpacing:'0.06em'}}>Qté Produite</th>
                  </>}
                  {type==='machine' && <>
                    <th style={{padding:'10px 16px',textAlign:'left',fontSize:10,fontWeight:700,color:C.violet,textTransform:'uppercase',letterSpacing:'0.06em'}}>Machine</th>
                    <th style={{padding:'10px 16px',textAlign:'left',fontSize:10,fontWeight:700,color:C.violet,textTransform:'uppercase',letterSpacing:'0.06em'}}>Groupe</th>
                    <th style={{padding:'10px 16px',textAlign:'right',fontSize:10,fontWeight:700,color:C.violet,textTransform:'uppercase',letterSpacing:'0.06em'}}>Coût Total</th>
                    <th style={{padding:'10px 16px',textAlign:'right',fontSize:10,fontWeight:700,color:C.violet,textTransform:'uppercase',letterSpacing:'0.06em'}}>Heures</th>
                  </>}
                </tr>
              </thead>
              <tbody>
                {type==='temps' && tempsData.map((t,i) => (
                  <tr key={i} style={{ background:i%2===0?C.white:'#f8fafc',borderBottom:`1px solid ${C.bord}` }}>
                    <td style={{padding:'10px 16px',fontSize:13,fontWeight:600,color:C.slate}}>{t.label}</td>
                    <td style={{padding:'10px 16px',fontSize:13,textAlign:'right',fontWeight:700,color:C.orange}}>{fmt(t.coutTotal)} DT</td>
                    <td style={{padding:'10px 16px',fontSize:13,textAlign:'right',fontWeight:600,color:C.bleu}}>{fmt(t.coutMatiere)} DT</td>
                    <td style={{padding:'10px 16px',fontSize:13,textAlign:'right',fontWeight:600,color:C.violet}}>{fmt(t.coutMachine)} DT</td>
                  </tr>
                ))}
                {type==='produit' && vm.parProduit.map((p,i) => (
                  <tr key={i} style={{ background:i%2===0?C.white:'#f8fafc',borderBottom:`1px solid ${C.bord}` }}>
                    <td style={{padding:'10px 16px',fontSize:13,fontWeight:600,color:C.slate}}>{p.produit}</td>
                    <td style={{padding:'10px 16px'}}>
                      <span style={{background:C.orangeClair,color:C.orange,border:`1px solid ${C.orangeBord}`,borderRadius:20,padding:'3px 10px',fontSize:11,fontWeight:600}}>{p.categorie}</span>
                    </td>
                    <td style={{padding:'10px 16px',fontSize:13,textAlign:'right',fontWeight:700,color:C.orange}}>{fmt(p.coutTotal)} DT</td>
                    <td style={{padding:'10px 16px',fontSize:13,textAlign:'right',color:C.slateM}}>{fmt(p.quantiteProduite)}</td>
                  </tr>
                ))}
                {type==='machine' && vm.parMachine.map((m,i) => (
                  <tr key={i} style={{ background:i%2===0?C.white:'#f8fafc',borderBottom:`1px solid ${C.bord}` }}>
                    <td style={{padding:'10px 16px',fontSize:13,fontWeight:600,color:C.slate}}>{m.machine}</td>
                    <td style={{padding:'10px 16px'}}>
                      <span style={{background:C.violetClair,color:C.violet,border:`1px solid ${C.violetBord}`,borderRadius:20,padding:'3px 10px',fontSize:11,fontWeight:600}}>{m.groupe}</span>
                    </td>
                    <td style={{padding:'10px 16px',fontSize:13,textAlign:'right',fontWeight:700,color:C.violet}}>{fmt(m.coutTotal)} DT</td>
                    <td style={{padding:'10px 16px',fontSize:13,textAlign:'right',color:C.slateM}}>{fmt(m.heuresMachine)}h</td>
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

// ── Page principale ──────────────────────────────────────────
const ProductionView = () => {
  const vm = useProduction();
  const [modal,    setModal]    = useState<ModalType>(null);
  const [tempsVue, setTempsVue] = useState<'mois'|'trimestre'|'annee'>('mois');

  const refTemps   = useRef<any>(null);
  const refProduit = useRef<any>(null);
  const refMachine = useRef<any>(null);

  if (vm.loading) return (
    <div style={{ display:'flex',alignItems:'center',justifyContent:'center',padding:'128px 24px' }}>
      <div style={{ textAlign:'center' }}>
        <div style={{
          width:48,height:48,borderRadius:'50%',border:`4px solid ${C.orange}`,
          borderTopColor:'transparent',animation:'spin 1s linear infinite',margin:'0 auto 16px',
        }} />
        <p style={{ color:C.slateM,fontWeight:500 }}>Chargement des données production…</p>
      </div>
    </div>
  );

  if (vm.error) return (
    <div style={{ display:'flex',alignItems:'center',justifyContent:'center',padding:'128px 24px' }}>
      <div style={{ background:'#fff1f2',border:'1px solid #fecdd3',borderRadius:16,padding:'32px 48px',textAlign:'center' }}>
        <div style={{ fontSize:28,marginBottom:8 }}>⚠️</div>
        <div style={{ color:'#dc2626',fontWeight:600 }}>{vm.error}</div>
      </div>
    </div>
  );

  const tempsData  = tempsVue==='mois' ? vm.parTempsMois : tempsVue==='trimestre' ? vm.parTempsTrimestre : vm.parTempsAnnee;
  const coutTotal  = vm.kpi?.coutTotalProduction ?? 0;
  const coutMatiere = vm.kpi?.coutTotalMatiere ?? 0;
  const coutMachine = vm.kpi?.coutTotalMachine ?? 0;
  const pctMatiere = coutTotal > 0 ? Math.round(coutMatiere / coutTotal * 100) : 0;
  const pctMachine = coutTotal > 0 ? Math.round(coutMachine / coutTotal * 100) : 0;

  const exportDashboardPDF = () => {
    const pdf = new jsPDF('portrait','mm','a4');
    const w = pdf.internal.pageSize.getWidth();
    const pageH = pdf.internal.pageSize.getHeight();
    pdf.setFillColor(234,88,12); pdf.rect(0,0,w,22,'F');
    pdf.setTextColor(255,255,255); pdf.setFontSize(15);
    pdf.text("Dashboard — Coût de Production", w/2, 14, { align:'center' });
    pdf.setTextColor(30,41,59);
    let y = 30;
    pdf.setFontSize(10);
    pdf.text(`Coût Total : ${fmt(coutTotal)} DT  |  Ordres : ${vm.kpi?.nombreOrdres ?? 0}`, 10, y); y+=7;
    pdf.text(`Coût Matière : ${fmt(coutMatiere)} DT (${pctMatiere}%)  |  Coût Machine : ${fmt(coutMachine)} DT (${pctMachine}%)`, 10, y); y+=10;
    const charts = [
      { ref:refTemps,   label:"Coût de Production par Temps" },
      { ref:refProduit, label:"Coût de Production par Produit" },
      { ref:refMachine, label:"Coût de Production par Machine" },
    ];
    charts.forEach(({ref,label}) => {
      if (!ref.current) return;
      const imgH=65;
      if (y+imgH > pageH-10) { pdf.addPage(); y=10; }
      pdf.setFontSize(10); pdf.setTextColor(234,88,12);
      pdf.text(label,10,y); pdf.setTextColor(30,41,59);
      y+=5;
      pdf.addImage(ref.current.toBase64Image('image/png',1),'PNG',10,y,w-20,imgH);
      y+=imgH+8;
    });
    pdf.save('Dashboard_Cout_Production.pdf');
  };

  const imprimerDashboard = () => {
    const charts = [
      { ref:refTemps,   label:"📅 Coût de Production par Temps" },
      { ref:refProduit, label:"📦 Coût de Production par Produit" },
      { ref:refMachine, label:"⚙️ Coût de Production par Machine" },
    ];
    const images = charts.map(({ref,label}) => ({ label, img:ref.current ? ref.current.toBase64Image('image/png',1) : null }));
    const now = new Date();
    const win = window.open('','_blank');
    if (!win) { alert('Autorisez les popups pour ce site.'); return; }
    win.document.write(`<!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8"/>
      <title>Dashboard Coût Production</title>
      <style>*{box-sizing:border-box;margin:0;padding:0}body{font-family:Arial,sans-serif;padding:28px;color:#111827}
      .hdr{background:#ea580c;color:white;padding:16px 20px;border-radius:10px;margin-bottom:16px;text-align:center}
      .hdr h1{font-size:18px;font-weight:700;margin-bottom:3px}.hdr p{font-size:11px;opacity:.85}
      .kpis{display:flex;gap:12px;margin-bottom:16px}
      .kpi{flex:1;border-radius:10px;padding:14px;border:2px solid}
      .cw{margin-bottom:16px;page-break-inside:avoid}
      .cw h3{font-size:12px;font-weight:700;color:#ea580c;margin-bottom:8px;padding-left:8px;border-left:3px solid #ea580c}
      .cw img{width:100%;border:1px solid #e2e8f0;border-radius:8px}
      .ftr{margin-top:16px;padding-top:10px;border-top:1px solid #e2e8f0;text-align:center;font-size:10px;color:#94a3b8}
      @media print{@page{margin:1cm}}</style></head><body>
      <div class="hdr"><h1>🏭 Dashboard — Coût de Production</h1>
      <p>Imprimé le ${now.toLocaleDateString('fr-TN')} à ${now.toLocaleTimeString('fr-TN')}</p></div>
      <div class="kpis">
        <div class="kpi" style="border-color:#fed7aa;background:#fff7ed">
          <div style="font-size:9px;color:#9a3412;font-weight:700;text-transform:uppercase">💰 Coût Total Production</div>
          <div style="font-size:20px;font-weight:800;color:#ea580c">${fmt(coutTotal)} DT</div>
          <div style="font-size:10px;color:#f97316">${vm.kpi?.nombreOrdres??0} ordres</div>
        </div>
        <div class="kpi" style="border-color:#bfdbfe;background:#eff6ff">
          <div style="font-size:9px;color:#1d4ed8;font-weight:700;text-transform:uppercase">🧱 Coût Matière</div>
          <div style="font-size:20px;font-weight:800;color:#2563eb">${fmt(coutMatiere)} DT</div>
          <div style="font-size:10px;color:#3b82f6">${pctMatiere}% du coût total</div>
        </div>
        <div class="kpi" style="border-color:#ddd6fe;background:#f5f3ff">
          <div style="font-size:9px;color:#5b21b6;font-weight:700;text-transform:uppercase">⚙️ Coût Machine</div>
          <div style="font-size:20px;font-weight:800;color:#7c3aed">${fmt(coutMachine)} DT</div>
          <div style="font-size:10px;color:#8b5cf6">${pctMachine}% du coût total</div>
        </div>
      </div>
      ${images.filter(i=>i.img).map(i=>`<div class="cw"><h3>${i.label}</h3><img src="${i.img}"/></div>`).join('')}
      <div class="ftr">I-mobile WAS v2.4 — ISO 9001 | Dashboard Production | ${now.toLocaleDateString('fr-TN')}</div>
      <script>window.onload=function(){setTimeout(function(){window.print();window.close();},500);};<\/script>
      </body></html>`);
    win.document.close();
  };

  const baseTooltip = {
    backgroundColor: C.slate, titleColor:'#f8fafc',
    bodyColor:'#cbd5e1', borderColor:'#334155',
    borderWidth:1, padding:10, cornerRadius:8,
    callbacks: {
      label: (ctx: any) => `${ctx.dataset.label} : ${fmt(ctx.raw)} DT`,
    },
  };

  const chartTemps = {
    labels: tempsData.map(t => t.label),
    datasets: [
      { label:'Coût Matière', data:tempsData.map(t=>t.coutMatiere), backgroundColor:'rgba(37,99,235,0.75)', borderRadius:5, stack:'stack' },
      { label:'Coût Machine', data:tempsData.map(t=>t.coutMachine), backgroundColor:'rgba(234,88,12,0.75)', borderRadius:5, stack:'stack' },
    ],
  };

  const chartProduit = {
    labels: vm.parProduit.map(p => p.produit.length>18 ? p.produit.slice(0,18)+'…' : p.produit),
    datasets: [{
      label:'Coût de Production (DT)',
      data: vm.parProduit.map(p => p.coutTotal),
      backgroundColor: vm.parProduit.map((_,i) => COULEURS_PRODUIT[i % COULEURS_PRODUIT.length]),
      borderRadius:6, borderSkipped:false,
    }],
  };

  const chartMachine = {
    labels: vm.parMachine.map(m => m.machine),
    datasets: [{
      label:'Coût de Production (DT)',
      data: vm.parMachine.map(m => m.coutTotal),
      backgroundColor: vm.parMachine.map((_,i) => COULEURS_MACHINE[i % COULEURS_MACHINE.length]),
      borderRadius:6, borderSkipped:false,
    }],
  };

  const baseOptions = {
    responsive:true, maintainAspectRatio:false,
    plugins:{ tooltip:baseTooltip },
    scales:{
      x:{ grid:{display:false}, border:{display:false}, ticks:{color:C.slateL,font:{size:11}} },
      y:{ grid:{color:'rgba(0,0,0,0.04)'}, border:{display:false}, ticks:{color:C.slateL,font:{size:11}} },
    },
  };

  const optionsStacked = {
    ...baseOptions,
    plugins:{ ...baseOptions.plugins, legend:{ position:'top' as const, labels:{color:C.slateM,font:{size:11}} } },
    scales:{
      x:{ ...baseOptions.scales.x, stacked:true },
      y:{ ...baseOptions.scales.y, stacked:true },
    },
  };

  const optionsBarH = {
    ...baseOptions,
    indexAxis:'y' as const,
    plugins:{ ...baseOptions.plugins, legend:{display:false} },
    scales:{
      x:{ ...baseOptions.scales.x },
      y:{ ...baseOptions.scales.y, grid:{display:false} },
    },
  };

  const CardHeader = ({ icon, title, subtitle, accent='orange', children }: {
    icon:string; title:string; subtitle:string;
    accent?:'orange'|'blue'|'violet'; children?:React.ReactNode;
  }) => {
    const color = accent==='blue' ? C.bleu : accent==='violet' ? C.violet : C.orange;
    const clair = accent==='blue' ? C.bleuClair : accent==='violet' ? C.violetClair : C.orangeClair;
    const bord  = accent==='blue' ? C.bleuBord : accent==='violet' ? C.violetBord : C.orangeBord;
    return (
      <div style={{
        padding:'12px 18px',borderBottom:`1px solid ${C.bord}`,
        background:'#fafafa',display:'flex',alignItems:'center',
        justifyContent:'space-between',flexWrap:'wrap',gap:8,
      }}>
        <div style={{ display:'flex',alignItems:'center',gap:10 }}>
          <div style={{ width:32,height:32,borderRadius:9,background:clair,border:`1px solid ${bord}`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:15 }}>{icon}</div>
          <div>
            <div style={{ fontSize:13,fontWeight:800,color:C.slate }}>{title}</div>
            <div style={{ fontSize:11,color:C.slateL }}>{subtitle}</div>
          </div>
        </div>
        {children}
      </div>
    );
  };

  return (
    <div style={{ display:'flex',flexDirection:'column',gap:20 }}>
      <Modal type={modal} vm={vm} onClose={() => setModal(null)} />

      {/* ── Barre filtres ── */}
      <div style={{
        background:C.white,borderRadius:16,border:`1px solid ${C.bord}`,
        padding:'14px 20px',boxShadow:'0 1px 4px rgba(0,0,0,0.05)',
        display:'flex',flexWrap:'wrap',alignItems:'center',gap:10,
      }}>
        {[
          { val:vm.annee,     cb:(v:string)=>vm.setAnnee(v),     opts:[{v:'2024',l:'2024'},{v:'2025',l:'2025'}], ph:'Toutes les années' },
          { val:vm.trimestre, cb:(v:string)=>vm.setTrimestre(v), opts:[{v:'1',l:'T1'},{v:'2',l:'T2'},{v:'3',l:'T3'},{v:'4',l:'T4'}], ph:'Tous les trimestres' },
        ].map((s,i) => (
          <select key={i} value={s.val} onChange={e=>s.cb(e.target.value)} style={{
            border:`1px solid ${C.bord}`,borderRadius:10,padding:'8px 14px',
            fontSize:13,background:'#f8fafc',outline:'none',color:C.slate,fontFamily:'inherit',
          }}>
            <option value="">{s.ph}</option>
            {s.opts.map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
          </select>
        ))}
        <button onClick={vm.resetFiltres} style={{
          display:'flex',alignItems:'center',gap:5,padding:'8px 16px',borderRadius:10,
          border:`1px solid ${C.bord}`,background:'#f1f5f9',color:C.slateM,
          fontSize:13,fontWeight:600,cursor:'pointer',
        }}>🔄 Réinitialiser</button>
        <div style={{ marginLeft:'auto',display:'flex',alignItems:'center',gap:8 }}>
          <button onClick={exportDashboardPDF} style={{
            display:'flex',alignItems:'center',gap:6,padding:'9px 18px',borderRadius:10,
            border:'none',background:'#e11d48',color:'#fff',
            fontSize:13,fontWeight:700,cursor:'pointer',
            boxShadow:'0 2px 8px rgba(225,29,72,0.25)',
          }}>📥 PDF</button>
          <button onClick={imprimerDashboard} style={{
            display:'flex',alignItems:'center',gap:6,padding:'9px 18px',borderRadius:10,
            border:'none',background:C.slate,color:'#fff',
            fontSize:13,fontWeight:700,cursor:'pointer',
          }}>🖨️ Imprimer</button>
          <div style={{
            display:'flex',alignItems:'center',gap:5,padding:'6px 12px',borderRadius:20,
            fontSize:11,fontWeight:600,
            ...(vm.connexionStatut==='connected'
              ? {background:'#f0fdf4',color:'#15803d',border:'1px solid #bbf7d0'}
              : vm.connexionStatut==='connecting'
              ? {background:'#fffbeb',color:'#b45309',border:'1px solid #fde68a'}
              : {background:'#fff1f2',color:'#dc2626',border:'1px solid #fecdd3'}),
          }}>
            <div style={{
              width:6,height:6,borderRadius:'50%',
              background:vm.connexionStatut==='connected' ? '#16a34a' : vm.connexionStatut==='connecting' ? '#d97706' : '#dc2626',
            }} />
            {vm.connexionStatut==='connected' ? 'Temps réel' : vm.connexionStatut==='connecting' ? 'Connexion...' : 'Déconnecté'}
          </div>
          {vm.derniereMAJ && (
            <span style={{ fontSize:11,color:C.slateL,fontFamily:'monospace' }}>
              MAJ {vm.derniereMAJ.toLocaleTimeString('fr-FR')}
            </span>
          )}
        </div>
      </div>

      {/* ── Bannière alerte Coût Machine > Coût Matière ── */}
      {coutMachine > coutMatiere && (
        <div style={{
          background:C.rougeClair,border:`1px solid ${C.rougeBord}`,borderRadius:12,
          padding:'12px 18px',display:'flex',alignItems:'center',gap:12,
        }}>
          <span style={{ fontSize:22 }}>⚠️</span>
          <div>
            <div style={{ fontSize:13,fontWeight:700,color:C.rouge }}>
              Alerte — Coût Machine dépasse Coût Matière
            </div>
            <div style={{ fontSize:11,color:'#f43f5e',marginTop:2 }}>
              Le coût machine ({pctMachine}%) dépasse le coût matière ({pctMatiere}%) — vérifier l'efficacité des machines
            </div>
          </div>
        </div>
      )}

      {/* ── KPI Cards ── */}
      <div style={{ display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:16 }}>
        {[
          { label:'💰 Coût Total Production', val:`${fmt(coutTotal)} DT`, sub:`${vm.kpi?.nombreOrdres??0} ordres de production`, c:C.orange, bg:C.orangeClair, bd:C.orangeBord, g:'#f97316' },
          { label:'🧱 Coût Matière Première',  val:`${fmt(coutMatiere)} DT`, sub:`${pctMatiere}% du coût total`, c:C.bleu, bg:C.bleuClair, bd:C.bleuBord, g:'#3b82f6' },
          { label:'⚙️ Coût Machine',           val:`${fmt(coutMachine)} DT`, sub:`${pctMachine}% du coût total`, c:C.violet, bg:C.violetClair, bd:C.violetBord, g:'#8b5cf6' },
        ].map((k,i) => (
          <div key={i} style={{
            background:C.white,borderRadius:18,border:`1px solid ${C.bord}`,
            overflow:'hidden',boxShadow:'0 1px 4px rgba(0,0,0,0.05)',
          }}>
            <div style={{ height:3,background:`linear-gradient(90deg,${k.c},${k.g})` }} />
            <div style={{ padding:'18px 22px' }}>
              <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:12 }}>
                <div style={{ fontSize:10,fontWeight:700,textTransform:'uppercase',letterSpacing:'0.07em',color:k.c }}>{k.label}</div>
                <div style={{ width:36,height:36,borderRadius:10,background:k.bg,border:`1px solid ${k.bd}`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:16 }}>
                  {i===0?'🏭':i===1?'🧱':'⚙️'}
                </div>
              </div>
              <div style={{ fontSize:28,fontWeight:900,color:k.c,letterSpacing:'-0.5px',marginBottom:4 }}>{k.val}</div>
              <div style={{ fontSize:11,color:C.slateL,fontWeight:500 }}>{k.sub}</div>
              {i > 0 && (
                <div style={{ marginTop:10,background:'#f1f5f9',borderRadius:4,height:4 }}>
                  <div style={{ height:4,borderRadius:4,background:`linear-gradient(90deg,${k.c},${k.g})`,width:`${i===1?pctMatiere:pctMachine}%`,transition:'width 0.5s' }} />
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* ── Graphique Temps ── */}
      <div style={{ background:C.white,borderRadius:16,border:`1px solid ${C.bord}`,overflow:'hidden',boxShadow:'0 1px 4px rgba(0,0,0,0.05)' }}>
        <CardHeader icon="📅" title="Coût de Production par Temps" subtitle="Évolution Matière + Machine combinés" accent="orange">
          <div style={{ display:'flex',alignItems:'center',gap:8 }}>
            <div style={{ display:'flex',gap:3,padding:3,background:'#f1f5f9',borderRadius:8 }}>
              {(['mois','trimestre','annee'] as const).map(v => (
                <button key={v} onClick={() => setTempsVue(v)} style={{
                  padding:'5px 11px',borderRadius:6,border:'none',fontSize:11,fontWeight:600,cursor:'pointer',
                  background:tempsVue===v ? C.white : 'transparent',
                  color:tempsVue===v ? C.orange : C.slateL,
                  boxShadow:tempsVue===v ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                }}>{v.charAt(0).toUpperCase()+v.slice(1)}</button>
              ))}
            </div>
            <ChartActions onDetails={() => setModal('temps')} chartRef={refTemps} title="Coût de Production par Temps" accent="orange" />
          </div>
        </CardHeader>
        <div style={{ padding:20,height:500 }}>
          {tempsData.length === 0
            ? <EmptyChart />
            : <Bar ref={refTemps} data={chartTemps} options={optionsStacked} />
          }
        </div>
      </div>

      {/* ── Graphiques Produit + Machine ── */}
      <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:16 }}>
        <div style={{ background:C.white,borderRadius:16,border:`1px solid ${C.bord}`,overflow:'hidden',boxShadow:'0 1px 4px rgba(0,0,0,0.05)' }}>
          <CardHeader icon="📦" title="Coût de Production par Produit" subtitle="Trié par coût décroissant" accent="orange">
            <ChartActions onDetails={() => setModal('produit')} chartRef={refProduit} title="Coût de Production par Produit" accent="orange" />
          </CardHeader>
          <div style={{ padding:20,height:500 }}>
            {vm.parProduit.length === 0
              ? <EmptyChart />
              : <Bar ref={refProduit} data={chartProduit} options={optionsBarH} />
            }
          </div>
        </div>

        <div style={{ background:C.white,borderRadius:16,border:`1px solid ${C.bord}`,overflow:'hidden',boxShadow:'0 1px 4px rgba(0,0,0,0.05)' }}>
          <CardHeader icon="⚙️" title="Coût de Production par Machine" subtitle="Trié par coût décroissant" accent="violet">
            <ChartActions onDetails={() => setModal('machine')} chartRef={refMachine} title="Coût de Production par Machine" accent="violet" />
          </CardHeader>
          <div style={{ padding:20,height:500 }}>
            {vm.parMachine.length === 0
              ? <EmptyChart />
              : <Bar ref={refMachine} data={chartMachine} options={optionsBarH} />
            }
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductionView;