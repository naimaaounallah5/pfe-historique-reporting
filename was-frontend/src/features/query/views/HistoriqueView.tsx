// ============================================================
//  HistoriqueView.tsx — Page principale Historique des données
//  EXPORT EXCEL STYLÉ avec ExcelJS (couleurs, design professionnel)
// ============================================================

// ⚠️  INSTALLATION REQUISE (une seule fois dans votre projet) :
//     npm install exceljs file-saver
//     npm install --save-dev @types/file-saver

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import { useHistoriqueViewModel } from "../viewmodels/historique.viewmodel";
import type {
  SourceType, HistoriqueSCADA, HistoriqueWMS,
  HistoriqueQDC, HistoriqueAGV, HistoriqueItem
} from "../models/historique.model";
import HistoriqueDetailModal from "./HistoriqueDetailModal";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5088/api";

const C = {
  slate:'#0f172a', slateM:'#475569', slateL:'#94a3b8',
  bord:'#e2e8f0', bg:'#f8fafc', white:'#ffffff',
};

const SOURCE_CONFIG: Record<SourceType, {
  label:string; icone:string; couleur:string; clair:string; bord:string;
  gradient:string; rgb:[number,number,number];
  excelHeader:string; excelAlt:string; excelText:string;
}> = {
  scada:{ label:'SCADA',           icone:'🏭', couleur:'#2563eb', clair:'#eff6ff', bord:'#bfdbfe', gradient:'linear-gradient(135deg,#1d4ed8,#3b82f6)', rgb:[37,99,235],   excelHeader:'1D4ED8', excelAlt:'EFF6FF', excelText:'FFFFFF' },
  wms:  { label:'WMS',             icone:'📦', couleur:'#059669', clair:'#ecfdf5', bord:'#a7f3d0', gradient:'linear-gradient(135deg,#047857,#10b981)', rgb:[5,150,105],   excelHeader:'047857', excelAlt:'ECFDF5', excelText:'FFFFFF' },
  qdc:  { label:'QDC Inspections', icone:'🔍', couleur:'#d97706', clair:'#fffbeb', bord:'#fde68a', gradient:'linear-gradient(135deg,#b45309,#f59e0b)', rgb:[217,119,6],  excelHeader:'B45309', excelAlt:'FFFBEB', excelText:'FFFFFF' },
  agv:  { label:'AGV / Forklift', icone:'🤖', couleur:'#dc2626', clair:'#fff1f2', bord:'#fecdd3', gradient:'linear-gradient(135deg,#b91c1c,#f87171)', rgb:[220,38,38],  excelHeader:'B91C1C', excelAlt:'FFF1F2', excelText:'FFFFFF' },
};

// ✅ MODIFIÉ : Statuts WMS mis à jour (valeurs logiques)
const STATUTS: Record<SourceType, string[]> = {
  scada:['En marche','En panne','En réglage','Arrêt allumé','Éteint'],
  wms:  ['En cours','Terminé','En attente','Rejeté','Annulé'],
  qdc:  ['Conforme','Non conforme','Critique','En attente','Annulé'], 
  agv:  ['En marche','En panne','En réglage','Arrêt allumé','Éteint'],
};

// Couleurs statut pour cellules Excel
const STATUT_EXCEL: Record<string,{bg:string;fg:string}> = {
  'Actif'      :{bg:'DBEAFE',fg:'1D4ED8'},
  'Terminé'    :{bg:'F1F5F9',fg:'475569'},
  'Arrêt'      :{bg:'FEE2E2',fg:'DC2626'},
  'En cours'   :{bg:'D1FAE5',fg:'065F46'},
  'Bloqué'     :{bg:'FEE2E2',fg:'DC2626'},
  'En attente' :{bg:'FEF3C7',fg:'92400E'},
  'Validé'     :{bg:'D1FAE5',fg:'065F46'},
  'Rejeté'     :{bg:'FEE2E2',fg:'B91C1C'},
  'Annulé'     :{bg:'F1F5F9',fg:'374151'},
   'Conforme'     :{bg:'D1FAE5',fg:'065F46'},
  'Non conforme' :{bg:'FEE2E2',fg:'B91C1C'},
  'Critique'     :{bg:'FEF3C7', fg:'7C2D12'},  // rouge sombre
};

function BadgeStatut({ statut }: { statut: string }) {
  const map: Record<string,{bg:string;color:string;border:string}> = {
    // Statuts SCADA / AGV / QDC
    'En panne'      :{bg:'#b91c1c',color:'#ffffff',border:'#991b1b'},
    'En marche'     :{bg:'#15803d',color:'#ffffff',border:'#166534'},
    'En réglage'    :{bg:'#b45309',color:'#ffffff',border:'#92400e'},
    'Arrêt allumé'  :{bg:'#1d4ed8',color:'#ffffff',border:'#1e40af'},
    'Éteint'        :{bg:'#374151',color:'#ffffff',border:'#1f2937'},

    // ✅ AJOUTÉ : Statuts WMS mis à jour
    'En cours'      :{bg:'#15803d',color:'#ffffff',border:'#166534'},
    'Terminé'       :{bg:'#475569',color:'#ffffff',border:'#334155'},
    'En attente'    :{bg:'#b45309',color:'#ffffff',border:'#92400e'},
    'Rejeté'        :{bg:'#b91c1c',color:'#ffffff',border:'#991b1b'},
    'Annulé'        :{bg:'#374151',color:'#ffffff',border:'#1f2937'},
    'Conforme'      :{bg:'#15803d',color:'#ffffff',border:'#166534'},
    'Non conforme'  :{bg:'#b91c1c',color:'#ffffff',border:'#991b1b'},
    'Critique'      :{bg:'#7c2d12',color:'#ffffff',border:'#6b1f0a'},
  };
  const s = map[statut] ?? {bg:'#374151',color:'#ffffff',border:'#1f2937'};
  return (
    <span style={{
      background:s.bg,
      color:s.color,
      border:`1px solid ${s.border}`,
      borderRadius:20,
      padding:'3px 10px',
      fontSize:11,
      fontWeight:700,
      whiteSpace:'nowrap'
    }}>
      {statut}
    </span>
  );
}

function exportPDFCarte(lignes:{label:string;valeur:string}[], titre:string, couleur:[number,number,number]) {
  const doc = new jsPDF();
  doc.setFillColor(...couleur); doc.rect(0,0,210,28,'F');
  doc.setTextColor(255,255,255); doc.setFontSize(14); doc.setFont('helvetica','bold');
  doc.text(titre,14,12); doc.setFontSize(9); doc.setFont('helvetica','normal');
  doc.text(`Exporté le ${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR')}`,14,22);
  autoTable(doc,{head:[['Champ','Valeur']],body:lignes.map(l=>[l.label,l.valeur]),startY:34,styles:{fontSize:9,cellPadding:4},headStyles:{fillColor:couleur,textColor:255,fontStyle:'bold'},alternateRowStyles:{fillColor:[248,250,255]},columnStyles:{0:{fontStyle:'bold',textColor:[100,100,100]}}});
  doc.save(`${titre.replace(/[^a-zA-Z0-9]/g,'_')}.pdf`);
}
function imprimerCarte(lignes:{label:string;valeur:string}[], titre:string, coulHex:string) {
  const html=lignes.map((l,i)=>`<tr style="background:${i%2===0?'#f8faff':'#fff'}"><td style="padding:8px 12px;font-weight:600;color:#6b7280;font-size:11px;width:45%">${l.label}</td><td style="padding:8px 12px;font-size:12px;color:#1a2035">${l.valeur}</td></tr>`).join('');
  const w=window.open('','_blank'); if(!w) return;
  w.document.write(`<!DOCTYPE html><html><head><meta charset="UTF-8"><title>${titre}</title><style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:Arial,sans-serif}.hdr{background:${coulHex};color:white;padding:20px 24px}.hdr h1{font-size:16px;margin-bottom:4px}.meta{font-size:10px;opacity:.8}.body{padding:20px 24px}table{width:100%;border-collapse:collapse}td{border-bottom:1px solid #f0f0f0}@media print{body{-webkit-print-color-adjust:exact}}</style></head><body><div class="hdr"><h1>${titre}</h1><div class="meta">Exporté le ${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR')}</div></div><div class="body"><table><tbody>${html}</tbody></table></div><script>window.onload=()=>{window.print();window.close()}<\/script></body></html>`);
  w.document.close();
}

function getLignesSCADA(d:HistoriqueSCADA,ft:(m:number)=>string,fd:(d:string)=>string){return[{label:'N° Entrée',valeur:d.numeroEntree},{label:'N° Ordre',valeur:d.numeroOrdre},{label:'Machine',valeur:d.nomMachine},{label:'Produit',valeur:d.nomProduit},{label:'N° Opération',valeur:d.numeroOperation},{label:'Qté produite',valeur:`${d.quantiteProduite} pcs`},{label:'Qté rebut',valeur:`${d.quantiteRebut} pcs`},{label:'Durée marche',valeur:ft(d.runTime)},{label:'Durée arrêt',valeur:ft(d.stopTime)},{label:'Réglage',valeur:ft(d.setupTime)},{label:'Statut',valeur:d.statut},{label:'Date',valeur:fd(d.dateEnregistrement)}];}

// ✅ MODIFIÉ : Zone → Location (label affiché)
function getLignesWMS(d:HistoriqueWMS,ft:(m:number)=>string,fd:(d:string)=>string){return[{label:'N° Entrée',valeur:d.numeroEntree},{label:'N° Lot',valeur:d.numeroLot},{label:'Produit',valeur:d.nomProduit},{label:'Location',valeur:d.zone},{label:'Mouvement',valeur:d.typeMouvement},{label:'Qté traitée',valeur:String(d.quantiteTraitee)},{label:'Qté rejetée',valeur:String(d.quantiteRejetee)},{label:'Traitement',valeur:ft(d.dureeTraitement)},{label:'Arrêt',valeur:ft(d.dureeArret)},{label:'Statut',valeur:d.statut},{label:'Date',valeur:fd(d.dateEnregistrement)}];}

function getLignesQDC(d:HistoriqueQDC,fd:(d:string)=>string){return[{label:'N° Entrée',valeur:d.numeroEntree},{label:'Produit',valeur:d.nomProduit},{label:'Machine',valeur:d.nomMachine},{label:'Ligne',valeur:d.ligneProduction},{label:'Type contrôle',valeur:d.typeControle},{label:'Qté contrôlée',valeur:String(d.quantiteControlee)},{label:'Qté défaut',valeur:String(d.quantiteDefaut)},{label:'Taux défaut',valeur:`${d.tauxDefaut}%`},{label:'Statut',valeur:d.statut},{label:'Date',valeur:fd(d.dateEnregistrement)}];}
function getLignesAGV(d:HistoriqueAGV,ft:(m:number)=>string,fd:(d:string)=>string){return[{label:'N° Entrée',valeur:d.numeroEntree},{label:'Code AGV',valeur:d.codeAGV},{label:'N° Transfert',valeur:d.numeroTransfert},{label:'Produit',valeur:d.nomProduit},{label:'Qté transf.',valeur:String(d.quantiteTransferee)},{label:'Incidents',valeur:String(d.nombreIncidents)},{label:'Zone départ',valeur:d.zoneDepart},{label:'Zone arrivée',valeur:d.zoneArrivee},{label:'Durée marche',valeur:ft(d.runTime)},{label:'Durée arrêt',valeur:ft(d.stopTime)},{label:'Statut',valeur:d.statut},{label:'Date',valeur:fd(d.dateEnregistrement)}];}

function CarteItem({src,champs,numero,statut,date,onDetail,onPDF,onPrint}:{src:typeof SOURCE_CONFIG[SourceType];champs:[string,string][];numero:string;statut:string;date:string;onDetail:()=>void;onPDF:()=>void;onPrint:()=>void;}) {
  return (
    <div onClick={onDetail} style={{background:C.white,borderRadius:16,border:`1px solid ${C.bord}`,cursor:'pointer',overflow:'hidden',boxShadow:'0 1px 4px rgba(0,0,0,0.06)',transition:'all 0.2s'}}
      onMouseEnter={e=>{const t=e.currentTarget as HTMLDivElement;t.style.borderColor=src.couleur;t.style.boxShadow=`0 8px 24px ${src.couleur}18`;t.style.transform='translateY(-2px)';}}
      onMouseLeave={e=>{const t=e.currentTarget as HTMLDivElement;t.style.borderColor=C.bord;t.style.boxShadow='0 1px 4px rgba(0,0,0,0.06)';t.style.transform='translateY(0)';}}>
      <div style={{background:src.gradient,padding:'10px 14px',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
        <span style={{fontFamily:'monospace',fontSize:12,fontWeight:700,color:'#fff'}}>{numero}</span>
        <BadgeStatut statut={statut}/>
      </div>
      <div style={{padding:'12px 14px'}}>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'8px 12px',marginBottom:12}}>
          {champs.map(([label,val])=>(
            <div key={label}><div style={{fontSize:10,color:C.slateL,textTransform:'uppercase',letterSpacing:'0.05em',marginBottom:2}}>{label}</div><div style={{fontSize:12,fontWeight:700,color:C.slate}}>{val}</div></div>
          ))}
        </div>
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',paddingTop:10,borderTop:`1px solid ${C.bord}`}}>
          <span style={{fontSize:11,color:C.slateL,fontFamily:'monospace'}}>{date}</span>
          <div style={{display:'flex',gap:4}}>
            {[{icon:'👁',fn:(e:React.MouseEvent)=>{e.stopPropagation();onDetail();}},{icon:'📄',fn:(e:React.MouseEvent)=>{e.stopPropagation();onPDF();}},{icon:'🖨',fn:(e:React.MouseEvent)=>{e.stopPropagation();onPrint();}}].map(({icon,fn})=>(
              <button key={icon} onClick={fn} style={{width:28,height:28,borderRadius:8,border:`1px solid ${C.bord}`,background:C.white,display:'flex',alignItems:'center',justifyContent:'center',fontSize:12,cursor:'pointer',transition:'all 0.15s'}}
                onMouseEnter={e=>{const t=e.currentTarget as HTMLButtonElement;t.style.borderColor=src.couleur;t.style.background=src.clair;}}
                onMouseLeave={e=>{const t=e.currentTarget as HTMLButtonElement;t.style.borderColor=C.bord;t.style.background=C.white;}}>{icon}</button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ✅ MODIFIÉ : ['Zone', item.zone] → ['Location', item.zone]
function CarteSCADA({item,onDetail,ft,fd}:{item:HistoriqueSCADA;onDetail:()=>void;ft:(m:number)=>string;fd:(d:string)=>string}){const src=SOURCE_CONFIG.scada;const lg=getLignesSCADA(item,ft,fd);return<CarteItem src={src} numero={item.numeroEntree} statut={item.statut} date={fd(item.dateEnregistrement)} champs={[['Centre travail',item.nomMachine],['N° Opération',item.numeroOperation],['Qté produite',`${item.quantiteProduite} pcs`],['Qté rebut',`${item.quantiteRebut} pcs`],['Durée marche',ft(item.runTime)],['Durée arrêt',ft(item.stopTime)]]} onDetail={onDetail} onPDF={()=>exportPDFCarte(lg,`SCADA — ${item.numeroEntree}`,src.rgb)} onPrint={()=>imprimerCarte(lg,`SCADA — ${item.numeroEntree}`,src.couleur)}/>;}
function CarteWMS({item,onDetail,ft,fd}:{item:HistoriqueWMS;onDetail:()=>void;ft:(m:number)=>string;fd:(d:string)=>string}){const src=SOURCE_CONFIG.wms;const lg=getLignesWMS(item,ft,fd);return<CarteItem src={src} numero={item.numeroEntree} statut={item.statut} date={fd(item.dateEnregistrement)} champs={[['Location',item.zone],['N° Lot',item.numeroLot],['Mouvement',item.typeMouvement],['Qté traitée',String(item.quantiteTraitee)],['Traitement',ft(item.dureeTraitement)],['Arrêt',ft(item.dureeArret)]]} onDetail={onDetail} onPDF={()=>exportPDFCarte(lg,`WMS — ${item.numeroEntree}`,src.rgb)} onPrint={()=>imprimerCarte(lg,`WMS — ${item.numeroEntree}`,src.couleur)}/>;}
function CarteQDC({item,onDetail,fd}:{item:HistoriqueQDC;onDetail:()=>void;fd:(d:string)=>string}){const src=SOURCE_CONFIG.qdc;const lg=getLignesQDC(item,fd);return<CarteItem src={src} numero={item.numeroEntree} statut={item.statut} date={fd(item.dateEnregistrement)} champs={[['Ligne',item.ligneProduction],['Contrôle',item.typeControle],['Qté contrôlée',String(item.quantiteControlee)],['Qté défaut',String(item.quantiteDefaut)],['Taux défaut',`${item.tauxDefaut}%`],['Machine',item.nomMachine]]} onDetail={onDetail} onPDF={()=>exportPDFCarte(lg,`QDC — ${item.numeroEntree}`,src.rgb)} onPrint={()=>imprimerCarte(lg,`QDC — ${item.numeroEntree}`,src.couleur)}/>;}
function CarteAGV({item,onDetail,ft,fd}:{item:HistoriqueAGV;onDetail:()=>void;ft:(m:number)=>string;fd:(d:string)=>string}){const src=SOURCE_CONFIG.agv;const lg=getLignesAGV(item,ft,fd);return<CarteItem src={src} numero={item.numeroEntree} statut={item.statut} date={fd(item.dateEnregistrement)} champs={[['Code AGV',item.codeAGV],['N° Transfert',item.numeroTransfert],['Qté transférée',String(item.quantiteTransferee)],['Incidents',String(item.nombreIncidents)],['Zone départ',item.zoneDepart],['Zone arrivée',item.zoneArrivee]]} onDetail={onDetail} onPDF={()=>exportPDFCarte(lg,`AGV — ${item.numeroEntree}`,src.rgb)} onPrint={()=>imprimerCarte(lg,`AGV — ${item.numeroEntree}`,src.couleur)}/>;}

function RenduCarte({item,source,vm}:{item:HistoriqueItem;source:SourceType;vm:ReturnType<typeof useHistoriqueViewModel>}){
  const od=()=>vm.ouvrirDetail(item);
  if(source==='scada') return<CarteSCADA item={item as HistoriqueSCADA} onDetail={od} ft={vm.formaterTemps} fd={vm.formaterDate}/>;
  if(source==='wms')   return<CarteWMS   item={item as HistoriqueWMS}   onDetail={od} ft={vm.formaterTemps} fd={vm.formaterDate}/>;
  if(source==='qdc')   return<CarteQDC   item={item as HistoriqueQDC}   onDetail={od} fd={vm.formaterDate}/>;
  return                    <CarteAGV    item={item as HistoriqueAGV}   onDetail={od} ft={vm.formaterTemps} fd={vm.formaterDate}/>;
}

// ════════════════════════════════════════════════════════════
export default function HistoriqueView() {
  const vm  = useHistoriqueViewModel();
  const src = SOURCE_CONFIG[vm.source];

  const fetchToutesDonnees = async (): Promise<any[]> => {
    const query = new URLSearchParams();
    if (vm.params.recherche)     query.append("recherche",     vm.params.recherche);
    if (vm.params.statut)        query.append("statut",        vm.params.statut);
    if (vm.params.dateDebut)     query.append("dateDebut",     vm.params.dateDebut);
    if (vm.params.dateFin)       query.append("dateFin",       vm.params.dateFin);
    if (vm.params.centreTravail) query.append("centreTravail", vm.params.centreTravail);
    query.append("page","1");
    query.append("pageSize", String(vm.totalLignes > 0 ? vm.totalLignes : 9999));
    const res = await fetch(`${API_BASE_URL}/historique/${vm.source}?${query}`);
    if (!res.ok) throw new Error(`Erreur API : ${res.status}`);
    return (await res.json()).donnees;
  };

  // ══════════════════════════════════════════════════════════
  // ✅ EXPORT EXCEL STYLÉ — ExcelJS
  // ══════════════════════════════════════════════════════════
  const exporterExcel = async () => {
    try {
      const toutes = await fetchToutesDonnees();
      const wb = new ExcelJS.Workbook();
      wb.creator = 'KPI Dashboard'; wb.created = new Date();
     const ws = wb.addWorksheet(src.label.replace(/[*?:\\/\[\]]/g, '-'), { pageSetup:{ paperSize:9, orientation:'landscape', fitToPage:true } });

      // ── Ligne 1 : Titre ──────────────────────────────────
      const nbCols = vm.source === 'qdc' ? 10 : 11;
      ws.mergeCells(1, 1, 1, nbCols);
      const t = ws.getCell('A1');
      t.value = `HISTORIQUE DES DONNÉES — ${src.label.toUpperCase()}   |   ${new Date().toLocaleDateString('fr-FR')} ${new Date().toLocaleTimeString('fr-FR')}   |   ${toutes.length} enregistrements`;
      t.font  = { name:'Arial', size:13, bold:true, color:{ argb:'FF'+src.excelText } };
      t.fill  = { type:'pattern', pattern:'solid', fgColor:{ argb:'FF'+src.excelHeader } };
      t.alignment = { horizontal:'center', vertical:'middle' };
      ws.getRow(1).height = 36;

      // ── Ligne 2 : Sous-titre coloré clair ────────────────
      ws.mergeCells(2, 1, 2, nbCols);
      const s2 = ws.getCell('A2');
      s2.value = `Source : ${src.label}   •   Filtres appliqués   •   Généré par KPI Dashboard`;
      s2.font  = { name:'Arial', size:9, italic:true, color:{ argb:'FF'+src.excelHeader } };
      s2.fill  = { type:'pattern', pattern:'solid', fgColor:{ argb:'FF'+src.excelAlt } };
      s2.alignment = { horizontal:'center', vertical:'middle' };
      s2.border = { bottom:{ style:'medium', color:{ argb:'FF'+src.excelHeader } } };
      ws.getRow(2).height = 18;

      // ── Ligne 3 : vide ───────────────────────────────────
      ws.getRow(3).height = 8;

      // ── Définition des colonnes ──────────────────────────
      type ColDef = { header:string; key:string; width:number };
      let colonnes: ColDef[] = [];
      if (vm.source==='scada') colonnes=[
        {header:'N° Entrée',key:'numeroEntree',width:16},{header:'Machine',key:'nomMachine',width:20},
        {header:'Produit',key:'nomProduit',width:24},{header:'N° Opération',key:'numeroOperation',width:15},
        {header:'N° Ordre',key:'numeroOrdre',width:13},{header:'Qté produite',key:'qp',width:13},
        {header:'Qté rebut',key:'qr',width:12},{header:'Durée marche',key:'rm',width:15},
        {header:'Durée arrêt',key:'st',width:14},{header:'Statut',key:'statut',width:14},
        {header:'Date',key:'date',width:22},
      ];
      // ✅ MODIFIÉ : Zone → Location dans l'en-tête Excel
      else if (vm.source==='wms') colonnes=[
        {header:'N° Entrée',key:'numeroEntree',width:16},{header:'Produit',key:'nomProduit',width:24},
        {header:'N° Lot',key:'numeroLot',width:14},{header:'Location',key:'zone',width:14},
        {header:'Mouvement',key:'typeMouvement',width:16},{header:'Qté traitée',key:'qt',width:13},
        {header:'Qté rejetée',key:'qrej',width:13},{header:'Traitement',key:'dt',width:14},
        {header:'Arrêt',key:'da',width:12},{header:'Statut',key:'statut',width:14},
        {header:'Date',key:'date',width:22},
      ];
      else if (vm.source==='qdc') colonnes=[
        {header:'N° Entrée',key:'numeroEntree',width:16},{header:'Produit',key:'nomProduit',width:24},
        {header:'Machine',key:'nomMachine',width:20},{header:'Ligne',key:'ligneProduction',width:14},
        {header:'Type contrôle',key:'typeControle',width:16},{header:'Qté contrôlée',key:'qc',width:14},
        {header:'Qté défaut',key:'qd',width:13},{header:'Taux défaut',key:'td',width:13},
        {header:'Statut',key:'statut',width:14},{header:'Date',key:'date',width:22},
      ];
      else colonnes=[
        {header:'N° Entrée',key:'numeroEntree',width:16},{header:'Code AGV',key:'codeAGV',width:14},
        {header:'N° Transfert',key:'numeroTransfert',width:16},{header:'Produit',key:'nomProduit',width:24},
        {header:'Qté transf.',key:'qt',width:13},{header:'Incidents',key:'ni',width:12},
        {header:'Zone départ',key:'zd',width:15},{header:'Zone arrivée',key:'za',width:15},
        {header:'Statut',key:'statut',width:14},{header:'Date',key:'date',width:22},
        {header:'Durée marche',key:'rm',width:15},
      ];

      colonnes.forEach((col,i) => { ws.getColumn(i+1).width = col.width; });

      // ── Ligne 4 : En-têtes ───────────────────────────────
      const hRow = ws.getRow(4);
      hRow.height = 30;
      colonnes.forEach((col,i) => {
        const cell = hRow.getCell(i+1);
        cell.value = col.header;
        cell.font  = { name:'Arial', size:10, bold:true, color:{ argb:'FF'+src.excelText } };
        cell.fill  = { type:'pattern', pattern:'solid', fgColor:{ argb:'FF'+src.excelHeader } };
        cell.alignment = { horizontal:'center', vertical:'middle', wrapText:true };
        cell.border = {
          top:   { style:'medium', color:{ argb:'FF'+src.excelHeader } },
          bottom:{ style:'medium', color:{ argb:'FF'+src.excelHeader } },
          left:  { style:'thin',   color:{ argb:'FFCBD5E1' } },
          right: { style:'thin',   color:{ argb:'FFCBD5E1' } },
        };
      });

      // ── Lignes de données ────────────────────────────────
      toutes.forEach((item:any, idx:number) => {
        const isAlt = idx % 2 === 1;
        const bgRow = isAlt ? src.excelAlt : 'FFFFFF';

        let vals: any[] = [];
        if (vm.source==='scada') vals=[item.numeroEntree,item.nomMachine,item.nomProduit,item.numeroOperation,item.numeroOrdre,item.quantiteProduite,item.quantiteRebut,vm.formaterTemps(item.runTime),vm.formaterTemps(item.stopTime),item.statut,vm.formaterDate(item.dateEnregistrement)];
        else if (vm.source==='wms') vals=[item.numeroEntree,item.nomProduit,item.numeroLot,item.zone,item.typeMouvement,item.quantiteTraitee,item.quantiteRejetee,vm.formaterTemps(item.dureeTraitement),vm.formaterTemps(item.dureeArret),item.statut,vm.formaterDate(item.dateEnregistrement)];
        else if (vm.source==='qdc') vals=[item.numeroEntree,item.nomProduit,item.nomMachine,item.ligneProduction,item.typeControle,item.quantiteControlee,item.quantiteDefaut,`${item.tauxDefaut}%`,item.statut,vm.formaterDate(item.dateEnregistrement)];
        else vals=[item.numeroEntree,item.codeAGV,item.numeroTransfert,item.nomProduit,item.quantiteTransferee,item.nombreIncidents,item.zoneDepart,item.zoneArrivee,item.statut,vm.formaterDate(item.dateEnregistrement),vm.formaterTemps(item.runTime)];

        const dRow = ws.getRow(4 + idx + 1);
        dRow.height = 20;
        vals.forEach((val, ci) => {
          const cell = dRow.getCell(ci+1);
          cell.value = val;

          const key = colonnes[ci]?.key ?? '';

          // Statut → couleur badge
          if (key === 'statut' && STATUT_EXCEL[val]) {
            const sc = STATUT_EXCEL[val];
            cell.fill = { type:'pattern', pattern:'solid', fgColor:{ argb:'FF'+sc.bg } };
            cell.font = { name:'Arial', size:9, bold:true, color:{ argb:'FF'+sc.fg } };
            cell.alignment = { horizontal:'center', vertical:'middle' };
          }
          // N° Entrée → gras coloré
          else if (key === 'numeroEntree') {
            cell.fill = { type:'pattern', pattern:'solid', fgColor:{ argb:'FF'+bgRow } };
            cell.font = { name:'Arial', size:9, bold:true, color:{ argb:'FF'+src.excelHeader } };
            cell.alignment = { horizontal:'center', vertical:'middle' };
          }
          // Quantités numériques → vert/rouge
          else if (key === 'qp' || key === 'qt' || key === 'qc') {
            cell.fill = { type:'pattern', pattern:'solid', fgColor:{ argb:'FF'+bgRow } };
            cell.font = { name:'Arial', size:9, bold:true, color:{ argb:'FF065F46' } };
            cell.alignment = { horizontal:'right', vertical:'middle' };
          }
          else if (key === 'qr' || key === 'qrej' || key === 'qd') {
            cell.fill = { type:'pattern', pattern:'solid', fgColor:{ argb:'FF'+bgRow } };
            cell.font = { name:'Arial', size:9, bold:true, color:{ argb:'FFB91C1C' } };
            cell.alignment = { horizontal:'right', vertical:'middle' };
          }
          // Incidents AGV → rouge si >0
          else if (key === 'ni') {
            cell.fill = { type:'pattern', pattern:'solid', fgColor:{ argb:'FF'+bgRow } };
            cell.font = { name:'Arial', size:9, bold:true, color:{ argb: Number(val)>0 ? 'FFB91C1C' : 'FF065F46' } };
            cell.alignment = { horizontal:'right', vertical:'middle' };
          }
          // Default
          else {
            cell.fill = { type:'pattern', pattern:'solid', fgColor:{ argb:'FF'+bgRow } };
            cell.font = { name:'Arial', size:9 };
            cell.alignment = { horizontal: typeof val === 'number' ? 'right' : 'left', vertical:'middle' };
          }

          cell.border = {
            top:   { style:'hair', color:{ argb:'FFE2E8F0' } },
            bottom:{ style:'hair', color:{ argb:'FFE2E8F0' } },
            left:  { style:'hair', color:{ argb:'FFE2E8F0' } },
            right: { style:'hair', color:{ argb:'FFE2E8F0' } },
          };
        });
      });

      // ── Pied de page ─────────────────────────────────────
      const footRow = ws.getRow(4 + toutes.length + 2);
      ws.mergeCells(footRow.number, 1, footRow.number, nbCols);
      const fc = footRow.getCell(1);
      fc.value = `✔  ${toutes.length} enregistrements exportés  •  Source ${src.label}  •  KPI Dashboard  •  ${new Date().toLocaleDateString('fr-FR')}`;
      fc.font  = { name:'Arial', size:9, italic:true, color:{ argb:'FF94A3B8' } };
      fc.fill  = { type:'pattern', pattern:'solid', fgColor:{ argb:'FFF8FAFC' } };
      fc.alignment = { horizontal:'center', vertical:'middle' };
      fc.border = { top:{ style:'medium', color:{ argb:'FF'+src.excelHeader } } };
      footRow.height = 20;

      // ── Figer les 4 premières lignes + filtre auto ────────
      ws.views = [{ state:'frozen', ySplit:4, activeCell:'A5' }];
      ws.autoFilter = { from:{ row:4, column:1 }, to:{ row:4, column:colonnes.length } };

      // ── Télécharger ───────────────────────────────────────
      const buffer = await wb.xlsx.writeBuffer();
      saveAs(new Blob([buffer],{ type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }),
        `Historique_${src.label}_${new Date().toLocaleDateString('fr-FR').replace(/\//g,'-')}.xlsx`);

    } catch (err) {
      alert("Erreur export Excel : " + (err instanceof Error ? err.message : String(err)));
    }
  };

  // ── Export PDF (TOUTES les données) ───────────────────────
  const exporterPDF = async () => {
    try {
      const toutes = await fetchToutesDonnees();
      const doc=new jsPDF({orientation:'landscape'});
      doc.setFillColor(...src.rgb); doc.rect(0,0,297,20,'F');
      doc.setTextColor(255,255,255); doc.setFontSize(14);
      doc.text(`Historique des données — ${src.label}`,14,13);
      doc.setFontSize(8);
      doc.text(`Exporté le ${new Date().toLocaleDateString('fr-FR')} · Total : ${vm.totalLignes} résultats`,200,13);
      let cols:string[]=[]; let rows:string[][]=[];
      if(vm.source==='scada'){cols=['N° Entrée','Machine','Opération','Ordre','Qté prod.','Qté rebut','Marche','Arrêt','Statut','Date'];rows=toutes.map((d:any)=>[d.numeroEntree,d.nomMachine,d.numeroOperation,d.numeroOrdre,String(d.quantiteProduite),String(d.quantiteRebut),vm.formaterTemps(d.runTime),vm.formaterTemps(d.stopTime),d.statut,vm.formaterDate(d.dateEnregistrement)]);}
      // ✅ MODIFIÉ : Zone → Location dans export PDF
      else if(vm.source==='wms'){cols=['N° Entrée','Produit','N° Lot','Location','Mouvement','Qté traitée','Qté rejetée','Statut','Date'];rows=toutes.map((d:any)=>[d.numeroEntree,d.nomProduit,d.numeroLot,d.zone,d.typeMouvement,String(d.quantiteTraitee),String(d.quantiteRejetee),d.statut,vm.formaterDate(d.dateEnregistrement)]);}
      else if(vm.source==='qdc'){cols=['N° Entrée','Produit','Machine','Ligne','Contrôle','Qté ctrl.','Qté déf.','Taux déf.','Statut','Date'];rows=toutes.map((d:any)=>[d.numeroEntree,d.nomProduit,d.nomMachine,d.ligneProduction,d.typeControle,String(d.quantiteControlee),String(d.quantiteDefaut),`${d.tauxDefaut}%`,d.statut,vm.formaterDate(d.dateEnregistrement)]);}
      else{cols=['N° Entrée','Code AGV','Transfert','Produit','Qté transf.','Incidents','Départ','Arrivée','Statut','Date'];rows=toutes.map((d:any)=>[d.numeroEntree,d.codeAGV,d.numeroTransfert,d.nomProduit,String(d.quantiteTransferee),String(d.nombreIncidents),d.zoneDepart,d.zoneArrivee,d.statut,vm.formaterDate(d.dateEnregistrement)]);}
      autoTable(doc,{head:[cols],body:rows,startY:26,styles:{fontSize:8,cellPadding:3},headStyles:{fillColor:src.rgb,textColor:255,fontStyle:'bold'},alternateRowStyles:{fillColor:[248,250,255]}});
      doc.save(`Historique_${src.label}_${new Date().toLocaleDateString('fr-FR').replace(/\//g,'-')}.pdf`);
    } catch(err){ alert("Erreur PDF : "+(err instanceof Error?err.message:String(err))); }
  };

  // ── Impression ────────────────────────────────────────────
  const imprimerPage = async () => {
    try {
      const toutes = await fetchToutesDonnees();
      // ✅ MODIFIÉ : Zone → Location dans impression
      const entetes:Record<string,string>={
        scada:'<th>N° Entrée</th><th>Machine</th><th>Opération</th><th>Qté prod.</th><th>Qté rebut</th><th>Statut</th><th>Date</th>',
        wms:  '<th>N° Entrée</th><th>N° Lot</th><th>Location</th><th>Mouvement</th><th>Qté traitée</th><th>Statut</th><th>Date</th>',
        qdc:  '<th>N° Entrée</th><th>Ligne</th><th>Contrôle</th><th>Qté ctrl.</th><th>Taux déf.</th><th>Statut</th><th>Date</th>',
        agv:  '<th>N° Entrée</th><th>Code AGV</th><th>Transfert</th><th>Qté transf.</th><th>Incidents</th><th>Statut</th><th>Date</th>',
      };
      const lignesHTML=toutes.map((item:any)=>{
        if(vm.source==='scada') return `<tr><td>${item.numeroEntree}</td><td>${item.nomMachine}</td><td>${item.numeroOperation}</td><td>${item.quantiteProduite}</td><td>${item.quantiteRebut}</td><td>${item.statut}</td><td>${vm.formaterDate(item.dateEnregistrement)}</td></tr>`;
        if(vm.source==='wms')   return `<tr><td>${item.numeroEntree}</td><td>${item.numeroLot}</td><td>${item.zone}</td><td>${item.typeMouvement}</td><td>${item.quantiteTraitee}</td><td>${item.statut}</td><td>${vm.formaterDate(item.dateEnregistrement)}</td></tr>`;
        if(vm.source==='qdc')   return `<tr><td>${item.numeroEntree}</td><td>${item.ligneProduction}</td><td>${item.typeControle}</td><td>${item.quantiteControlee}</td><td>${item.tauxDefaut}%</td><td>${item.statut}</td><td>${vm.formaterDate(item.dateEnregistrement)}</td></tr>`;
        return `<tr><td>${item.numeroEntree}</td><td>${item.codeAGV}</td><td>${item.numeroTransfert}</td><td>${item.quantiteTransferee}</td><td>${item.nombreIncidents}</td><td>${item.statut}</td><td>${vm.formaterDate(item.dateEnregistrement)}</td></tr>`;
      }).join('');
      const w=window.open('','_blank'); if(!w) return;
      w.document.write(`<!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8"><title>Historique ${src.label}</title><style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:Arial,sans-serif;font-size:12px;color:#1a2035}.hdr{background:${src.couleur};color:white;padding:16px 20px}.hdr h1{font-size:16px;margin-bottom:3px}.meta{font-size:10px;opacity:.8}.body{padding:16px 20px}table{width:100%;border-collapse:collapse}th{background:${src.couleur};color:white;padding:7px 10px;text-align:left;font-size:10px}td{padding:6px 10px;border-bottom:1px solid #e5e7eb;font-size:11px}tr:nth-child(even) td{background:#f8faff}@media print{body{-webkit-print-color-adjust:exact}}</style></head><body><div class="hdr"><h1>Historique des données — ${src.label}</h1><div class="meta">Exporté le ${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR')} · Total : ${vm.totalLignes} résultats</div></div><div class="body"><table><thead><tr>${entetes[vm.source]}</tr></thead><tbody>${lignesHTML}</tbody></table></div><script>window.onload=()=>{window.print();window.close()}<\/script></body></html>`);
      w.document.close();
    } catch(err){ alert("Erreur impression : "+(err instanceof Error?err.message:String(err))); }
  };

  const pageSize  = vm.params.pageSize || 6;
  const startIndex = ((vm.params.page||1)-1)*pageSize+1;
  const endIndex   = Math.min((vm.params.page||1)*pageSize, vm.totalLignes);

  return (
    <div style={{padding:24,background:C.bg,minHeight:'100vh'}}>

      {/* ── HERO ── */}
      <div style={{background:C.white,borderRadius:20,marginBottom:24,border:`1px solid ${C.bord}`,boxShadow:'0 1px 4px rgba(0,0,0,0.06)',overflow:'hidden'}}>
        <div style={{height:5,background:'linear-gradient(90deg,#2563eb 0%,#7c3aed 33%,#059669 66%,#dc2626 100%)'}}/>
        <div style={{padding:'24px 32px',display:'flex',alignItems:'center',justifyContent:'space-between',flexWrap:'wrap',gap:16}}>
          <div>
            <div style={{marginBottom:12,display:'flex',alignItems:'center',gap:8,flexWrap:'wrap'}}>
              <span style={{display:'inline-flex',alignItems:'center',gap:6,background:'#f1f5f9',border:`1px solid ${C.bord}`,borderRadius:20,padding:'4px 14px',fontSize:11,fontWeight:700,letterSpacing:'0.08em',textTransform:'uppercase',color:C.slateM}}>
                <span style={{width:7,height:7,borderRadius:'50%',background:C.slateL,display:'inline-block'}}/>
                HISTORIQUE DES DONNÉES
                <span style={{display:'inline-flex',alignItems:'center',gap:4,background:vm.connexionStatut==='connected'?'#10b981':vm.connexionStatut==='connecting'?'#f59e0b':'#ef4444',color:'#fff',borderRadius:20,padding:'2px 9px 2px 7px',fontSize:10,fontWeight:700,marginLeft:2}}>
                  <span style={{width:6,height:6,borderRadius:'50%',background:'#fff',display:'inline-block'}}/>
                  {vm.connexionStatut==='connected'?'LIVE':vm.connexionStatut==='connecting'?'Connexion...':'Déconnecté'}
                </span>
              </span>
              {(Object.entries(SOURCE_CONFIG) as [SourceType,typeof SOURCE_CONFIG[SourceType]][]).map(([id,s])=>(
                <span key={id} onClick={()=>vm.changerSource(id)} style={{display:'inline-flex',alignItems:'center',gap:4,padding:'4px 12px',borderRadius:20,cursor:'pointer',fontSize:11,fontWeight:700,background:vm.source===id?s.clair:'#f8fafc',color:vm.source===id?s.couleur:C.slateL,border:`1px solid ${vm.source===id?s.bord:C.bord}`,transition:'all 0.15s',boxShadow:vm.source===id?`0 2px 8px ${s.couleur}20`:'none'}}>
                  {s.icone} {s.label}
                </span>
              ))}
            </div>
            <h1 style={{fontSize:28,fontWeight:900,color:C.slate,margin:'0 0 6px',letterSpacing:'-0.5px'}}>Historique des <span style={{color:src.couleur}}>données</span></h1>
            <p style={{fontSize:13,color:C.slateM,margin:0}}>Consultez l'historique complet — SCADA · WMS · QDC · AGV</p>
            {vm.derniereMAJ&&<div style={{fontSize:11,color:C.slateL,marginTop:6,fontFamily:'monospace',display:'flex',alignItems:'center',gap:5}}><span style={{width:6,height:6,borderRadius:'50%',background:'#10b981',display:'inline-block'}}/>Dernière mise à jour : {vm.derniereMAJ.toLocaleTimeString('fr-FR')}</div>}
          </div>
          <div style={{display:'flex',gap:8}}>
            {[{label:'⬇ Excel',action:exporterExcel,hover:'#059669'},{label:'📄 PDF',action:exporterPDF,hover:'#dc2626'},{label:'🖨 Imprimer',action:imprimerPage,hover:'#2563eb'}].map(b=>(
              <button key={b.label} onClick={b.action} style={{display:'flex',alignItems:'center',gap:6,padding:'9px 18px',borderRadius:10,border:`1.5px solid ${C.bord}`,background:C.white,color:C.slateM,fontSize:13,fontWeight:700,cursor:'pointer',transition:'all 0.15s'}}
                onMouseEnter={e=>{const t=e.currentTarget as HTMLButtonElement;t.style.borderColor=b.hover;t.style.color=b.hover;t.style.background=b.hover+'0f';t.style.transform='translateY(-1px)';t.style.boxShadow=`0 4px 12px ${b.hover}20`;}}
                onMouseLeave={e=>{const t=e.currentTarget as HTMLButtonElement;t.style.borderColor=C.bord;t.style.color=C.slateM;t.style.background=C.white;t.style.transform='translateY(0)';t.style.boxShadow='none';}}>
                {b.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── ONGLETS SOURCES ── */}
      <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:14,marginBottom:20}}>
        {(Object.entries(SOURCE_CONFIG) as [SourceType,typeof SOURCE_CONFIG[SourceType]][]).map(([id,s])=>(
          <button key={id} onClick={()=>vm.changerSource(id)} style={{background:C.white,border:`2px solid ${vm.source===id?s.couleur:C.bord}`,borderRadius:18,padding:'16px 18px',textAlign:'left',cursor:'pointer',overflow:'hidden',position:'relative',boxShadow:vm.source===id?`0 6px 20px ${s.couleur}20`:'0 1px 4px rgba(0,0,0,0.06)',transform:vm.source===id?'translateY(-2px)':'none',transition:'all 0.2s'}}>
            <div style={{position:'absolute',top:0,left:0,right:0,height:3,background:s.gradient,opacity:vm.source===id?1:0,transition:'opacity 0.2s'}}/>
            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:10}}>
              <span style={{fontSize:24}}>{s.icone}</span>
              <span style={{fontSize:11,fontWeight:700,fontFamily:'monospace',padding:'3px 10px',borderRadius:20,background:vm.source===id?s.clair:'#f1f5f9',color:vm.source===id?s.couleur:C.slateL,border:`1px solid ${vm.source===id?s.bord:C.bord}`}}>{vm.source===id?String(vm.totalLignes):'—'}</span>
            </div>
            <div style={{fontSize:10,color:C.slateL,textTransform:'uppercase',letterSpacing:'0.06em',marginBottom:3}}>Source</div>
            <div style={{fontSize:14,fontWeight:800,color:vm.source===id?s.couleur:C.slate}}>{s.label}</div>
          </button>
        ))}
      </div>

      {/* ── FILTRES ── */}
      <div style={{background:C.white,border:`1px solid ${C.bord}`,borderRadius:14,padding:'14px 18px',marginBottom:16,display:'flex',alignItems:'center',gap:10,flexWrap:'wrap',boxShadow:'0 1px 4px rgba(0,0,0,0.05)'}}>
        <div style={{position:'relative',flex:1,minWidth:200}}>
          <span style={{position:'absolute',left:12,top:'50%',transform:'translateY(-50%)',fontSize:14,color:C.slateL}}>🔍</span>
          <input style={{width:'100%',paddingLeft:38,paddingRight:16,paddingTop:9,paddingBottom:9,border:`1px solid ${C.bord}`,borderRadius:10,fontSize:13,background:'#f8fafc',outline:'none',color:C.slate,fontFamily:'inherit'}}
            placeholder="Rechercher par numéro d'entrée, ordre..."
            value={vm.params.recherche??''} onChange={e=>vm.setRecherche(e.target.value)}
            onFocus={e=>(e.target.style.borderColor=src.couleur)} onBlur={e=>(e.target.style.borderColor=C.bord)}/>
        </div>
        <div style={{width:1,height:28,background:C.bord}}/>
        {[{label:'Du',val:vm.params.dateDebut??'',fn:vm.setDateDebut},{label:'Au',val:vm.params.dateFin??'',fn:vm.setDateFin}].map(f=>(
          <div key={f.label} style={{display:'flex',alignItems:'center',gap:6}}>
            <span style={{fontSize:10,color:C.slateL,fontWeight:700,textTransform:'uppercase',letterSpacing:'0.05em'}}>{f.label}</span>
            <input type="date" value={f.val} onChange={e=>f.fn(e.target.value)} style={{padding:'8px 12px',border:`1px solid ${C.bord}`,borderRadius:10,fontSize:12,background:'#f8fafc',outline:'none',color:C.slate,fontFamily:'inherit'}}
              onFocus={e=>(e.target.style.borderColor=src.couleur)} onBlur={e=>(e.target.style.borderColor=C.bord)}/>
          </div>
        ))}
        <div style={{width:1,height:28,background:C.bord}}/>
        <select value={vm.params.statut??''} onChange={e=>vm.setStatut(e.target.value)} style={{padding:'8px 14px',border:`1px solid ${C.bord}`,borderRadius:10,fontSize:13,background:'#f8fafc',outline:'none',color:C.slate,fontFamily:'inherit'}}
          onFocus={e=>(e.target.style.borderColor=src.couleur)} onBlur={e=>(e.target.style.borderColor=C.bord)}>
          <option value="">Tous les statuts</option>
          {STATUTS[vm.source].map(s=><option key={s} value={s}>{s}</option>)}
        </select>
        {vm.source==='scada'&&(<>
          <div style={{width:1,height:28,background:C.bord}}/>
          <select value={vm.params.centreTravail??''} onChange={e=>vm.setCentreTravail(e.target.value)} style={{padding:'8px 14px',border:`1px solid ${C.bord}`,borderRadius:10,fontSize:13,background:'#f8fafc',outline:'none',color:C.slate,fontFamily:'inherit',cursor:'pointer'}}
            onFocus={e=>(e.target.style.borderColor=src.couleur)} onBlur={e=>(e.target.style.borderColor=C.bord)}>
            <option value="">Tous les centres</option>
            {vm.centresTravail.map(c=><option key={c} value={c}>{c}</option>)}
          </select>
        </>)}
        <button onClick={vm.resetFiltres} style={{marginLeft:'auto',padding:'8px 16px',borderRadius:10,border:`1px solid ${C.bord}`,background:C.white,color:C.slateM,fontSize:13,fontWeight:600,cursor:'pointer'}}>↺ Réinitialiser</button>
      </div>

      {/* ── ZONE DONNÉES ── */}
      <div style={{background:C.white,border:`1px solid ${C.bord}`,borderRadius:16,overflow:'hidden',boxShadow:'0 1px 4px rgba(0,0,0,0.05)'}}>
        <div style={{padding:'12px 18px',borderBottom:`1px solid ${C.bord}`,background:'#fafafa',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
          <div style={{display:'flex',alignItems:'center',gap:10}}>
            <div style={{width:32,height:32,borderRadius:9,background:src.clair,border:`1px solid ${src.bord}`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:15}}>{src.icone}</div>
            <div><div style={{fontSize:13,fontWeight:800,color:C.slate}}>Résultats {src.label}</div><div style={{fontSize:11,color:C.slateL}}>Page {vm.params.page} · {vm.totalLignes} entrées</div></div>
            <span style={{fontSize:11,fontWeight:700,fontFamily:'monospace',padding:'3px 10px',borderRadius:20,background:src.clair,color:src.couleur,border:`1px solid ${src.bord}`}}>{vm.totalLignes} résultats</span>
          </div>
          <div style={{display:'flex',gap:4,padding:4,background:'#f1f5f9',borderRadius:10}}>
            {[{mode:'cartes' as const,icon:'▦'},{mode:'tableau' as const,icon:'☰'}].map(({mode,icon})=>(
              <button key={mode} onClick={()=>vm.setVueMode(mode)} style={{width:32,height:32,borderRadius:7,border:'none',background:vm.vueMode===mode?C.white:'transparent',color:vm.vueMode===mode?src.couleur:C.slateL,fontSize:14,cursor:'pointer',fontWeight:600,boxShadow:vm.vueMode===mode?'0 1px 4px rgba(0,0,0,0.08)':'none',transition:'all 0.15s'}}>{icon}</button>
            ))}
          </div>
        </div>

        {vm.loading&&<div style={{display:'flex',alignItems:'center',justifyContent:'center',padding:'64px 24px',color:C.slateL}}><div style={{textAlign:'center'}}><div style={{fontSize:32,marginBottom:12}}>⏳</div><div style={{fontSize:14,fontWeight:500}}>Chargement des données {src.label}...</div></div></div>}
        {vm.error&&<div style={{margin:16,padding:'12px 16px',background:'#fff1f2',border:'1px solid #fecdd3',borderRadius:12,color:'#dc2626',fontSize:13}}>❌ {vm.error}</div>}

        {!vm.loading&&!vm.error&&vm.vueMode==='cartes'&&(
          <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:14,padding:16}}>
            {vm.donnees.map((item,i)=><RenduCarte key={i} item={item} source={vm.source} vm={vm}/>)}
          </div>
        )}

        {!vm.loading&&!vm.error&&vm.vueMode==='tableau'&&(
          <div style={{overflowX:'auto'}}>
            <table style={{width:'100%',borderCollapse:'collapse',fontSize:13}}>
              <thead>
                <tr style={{background:'#fafafa',borderBottom:`1px solid ${C.bord}`}}>
                  {vm.source==='scada'&&['N° Entrée','Machine','Opération','Qté produite','Qté rebut','Statut','Date','Actions'].map(h=><th key={h} style={{padding:'11px 14px',textAlign:'left',fontSize:10,fontWeight:700,color:C.slateL,textTransform:'uppercase',letterSpacing:'0.07em',whiteSpace:'nowrap'}}>{h}</th>)}
                  {/* ✅ MODIFIÉ : Zone → Location dans en-tête tableau */}
                  {vm.source==='wms'&&['N° Entrée','Lot','Location','Mouvement','Qté traitée','Statut','Date','Actions'].map(h=><th key={h} style={{padding:'11px 14px',textAlign:'left',fontSize:10,fontWeight:700,color:C.slateL,textTransform:'uppercase',letterSpacing:'0.07em',whiteSpace:'nowrap'}}>{h}</th>)}
                  {vm.source==='qdc'&&['N° Entrée','Ligne','Contrôle','Qté contrôlée','Taux défaut','Statut','Date','Actions'].map(h=><th key={h} style={{padding:'11px 14px',textAlign:'left',fontSize:10,fontWeight:700,color:C.slateL,textTransform:'uppercase',letterSpacing:'0.07em',whiteSpace:'nowrap'}}>{h}</th>)}
                  {vm.source==='agv'&&['N° Entrée','AGV','Transfert','Qté transférée','Incidents','Statut','Date','Actions'].map(h=><th key={h} style={{padding:'11px 14px',textAlign:'left',fontSize:10,fontWeight:700,color:C.slateL,textTransform:'uppercase',letterSpacing:'0.07em',whiteSpace:'nowrap'}}>{h}</th>)}
                </tr>
              </thead>
              <tbody>
                {vm.donnees.map((item,i)=>(
                  <tr key={i} onClick={()=>vm.ouvrirDetail(item)} style={{borderBottom:`1px solid #f1f5f9`,cursor:'pointer',transition:'background 0.12s'}}
                    onMouseEnter={e=>(e.currentTarget as HTMLTableRowElement).style.background=src.clair}
                    onMouseLeave={e=>(e.currentTarget as HTMLTableRowElement).style.background=''}>
                    {vm.source==='scada'&&(()=>{const d=item as HistoriqueSCADA;const lg=getLignesSCADA(d,vm.formaterTemps,vm.formaterDate);return(<>
                      <td style={{padding:'11px 14px'}}><span style={{fontFamily:'monospace',fontSize:11,fontWeight:700,color:src.couleur,background:src.clair,padding:'3px 8px',borderRadius:6,border:`1px solid ${src.bord}`}}>{d.numeroEntree}</span></td>
                      <td style={{padding:'11px 14px',fontSize:12,color:C.slate}}>{d.nomMachine}</td>
                      <td style={{padding:'11px 14px',fontSize:11,color:C.slateM,fontFamily:'monospace'}}>{d.numeroOperation}</td>
                      <td style={{padding:'11px 14px',fontSize:12,fontWeight:700,color:'#059669'}}>{d.quantiteProduite}</td>
                      <td style={{padding:'11px 14px',fontSize:12,fontWeight:700,color:'#dc2626'}}>{d.quantiteRebut}</td>
                      <td style={{padding:'11px 14px'}}><BadgeStatut statut={d.statut}/></td>
                      <td style={{padding:'11px 14px',fontSize:11,color:C.slateL,fontFamily:'monospace'}}>{vm.formaterDate(d.dateEnregistrement)}</td>
                      <td style={{padding:'11px 14px'}}><div style={{display:'flex',gap:4}}>
                        <button onClick={e=>{e.stopPropagation();vm.ouvrirDetail(item)}} style={{width:28,height:28,borderRadius:7,border:`1px solid ${C.bord}`,background:C.white,cursor:'pointer',fontSize:12,display:'flex',alignItems:'center',justifyContent:'center'}}>👁</button>
                        <button onClick={e=>{e.stopPropagation();exportPDFCarte(lg,`SCADA — ${d.numeroEntree}`,src.rgb)}} style={{width:28,height:28,borderRadius:7,border:`1px solid ${C.bord}`,background:C.white,cursor:'pointer',fontSize:12,display:'flex',alignItems:'center',justifyContent:'center'}}>📄</button>
                        <button onClick={e=>{e.stopPropagation();imprimerCarte(lg,`SCADA — ${d.numeroEntree}`,src.couleur)}} style={{width:28,height:28,borderRadius:7,border:`1px solid ${C.bord}`,background:C.white,cursor:'pointer',fontSize:12,display:'flex',alignItems:'center',justifyContent:'center'}}>🖨</button>
                      </div></td>
                    </>);})()}
                    {vm.source==='wms'&&(()=>{const d=item as HistoriqueWMS;const lg=getLignesWMS(d,vm.formaterTemps,vm.formaterDate);return(<>
                      <td style={{padding:'11px 14px'}}><span style={{fontFamily:'monospace',fontSize:11,fontWeight:700,color:src.couleur,background:src.clair,padding:'3px 8px',borderRadius:6,border:`1px solid ${src.bord}`}}>{d.numeroEntree}</span></td>
                      <td style={{padding:'11px 14px',fontSize:11,color:C.slateM,fontFamily:'monospace'}}>{d.numeroLot}</td>
                      {/* ✅ MODIFIÉ : d.zone affiché sous colonne "Location" */}
                      <td style={{padding:'11px 14px',fontSize:12,color:C.slate}}>{d.zone}</td>
                      <td style={{padding:'11px 14px',fontSize:12,color:C.slate}}>{d.typeMouvement}</td>
                      <td style={{padding:'11px 14px',fontSize:12,fontWeight:700,color:'#059669'}}>{d.quantiteTraitee}</td>
                      <td style={{padding:'11px 14px'}}><BadgeStatut statut={d.statut}/></td>
                      <td style={{padding:'11px 14px',fontSize:11,color:C.slateL,fontFamily:'monospace'}}>{vm.formaterDate(d.dateEnregistrement)}</td>
                      <td style={{padding:'11px 14px'}}><div style={{display:'flex',gap:4}}>
                        <button onClick={e=>{e.stopPropagation();vm.ouvrirDetail(item)}} style={{width:28,height:28,borderRadius:7,border:`1px solid ${C.bord}`,background:C.white,cursor:'pointer',fontSize:12,display:'flex',alignItems:'center',justifyContent:'center'}}>👁</button>
                        <button onClick={e=>{e.stopPropagation();exportPDFCarte(lg,`WMS — ${d.numeroEntree}`,src.rgb)}} style={{width:28,height:28,borderRadius:7,border:`1px solid ${C.bord}`,background:C.white,cursor:'pointer',fontSize:12,display:'flex',alignItems:'center',justifyContent:'center'}}>📄</button>
                        <button onClick={e=>{e.stopPropagation();imprimerCarte(lg,`WMS — ${d.numeroEntree}`,src.couleur)}} style={{width:28,height:28,borderRadius:7,border:`1px solid ${C.bord}`,background:C.white,cursor:'pointer',fontSize:12,display:'flex',alignItems:'center',justifyContent:'center'}}>🖨</button>
                      </div></td>
                    </>);})()}
                    {vm.source==='qdc'&&(()=>{const d=item as HistoriqueQDC;const lg=getLignesQDC(d,vm.formaterDate);return(<>
                      <td style={{padding:'11px 14px'}}><span style={{fontFamily:'monospace',fontSize:11,fontWeight:700,color:src.couleur,background:src.clair,padding:'3px 8px',borderRadius:6,border:`1px solid ${src.bord}`}}>{d.numeroEntree}</span></td>
                      <td style={{padding:'11px 14px',fontSize:12,color:C.slate}}>{d.ligneProduction}</td>
                      <td style={{padding:'11px 14px',fontSize:11,color:C.slateM,fontFamily:'monospace'}}>{d.typeControle}</td>
                      <td style={{padding:'11px 14px',fontSize:12,fontWeight:700,color:C.slate}}>{d.quantiteControlee}</td>
                      <td style={{padding:'11px 14px',fontSize:12,fontWeight:700,color:d.tauxDefaut>10?'#dc2626':'#059669'}}>{d.tauxDefaut}%</td>
                      <td style={{padding:'11px 14px'}}><BadgeStatut statut={d.statut}/></td>
                      <td style={{padding:'11px 14px',fontSize:11,color:C.slateL,fontFamily:'monospace'}}>{vm.formaterDate(d.dateEnregistrement)}</td>
                      <td style={{padding:'11px 14px'}}><div style={{display:'flex',gap:4}}>
                        <button onClick={e=>{e.stopPropagation();vm.ouvrirDetail(item)}} style={{width:28,height:28,borderRadius:7,border:`1px solid ${C.bord}`,background:C.white,cursor:'pointer',fontSize:12,display:'flex',alignItems:'center',justifyContent:'center'}}>👁</button>
                        <button onClick={e=>{e.stopPropagation();exportPDFCarte(lg,`QDC — ${d.numeroEntree}`,src.rgb)}} style={{width:28,height:28,borderRadius:7,border:`1px solid ${C.bord}`,background:C.white,cursor:'pointer',fontSize:12,display:'flex',alignItems:'center',justifyContent:'center'}}>📄</button>
                        <button onClick={e=>{e.stopPropagation();imprimerCarte(lg,`QDC — ${d.numeroEntree}`,src.couleur)}} style={{width:28,height:28,borderRadius:7,border:`1px solid ${C.bord}`,background:C.white,cursor:'pointer',fontSize:12,display:'flex',alignItems:'center',justifyContent:'center'}}>🖨</button>
                      </div></td>
                    </>);})()}
                    {vm.source==='agv'&&(()=>{const d=item as HistoriqueAGV;const lg=getLignesAGV(d,vm.formaterTemps,vm.formaterDate);return(<>
                      <td style={{padding:'11px 14px'}}><span style={{fontFamily:'monospace',fontSize:11,fontWeight:700,color:src.couleur,background:src.clair,padding:'3px 8px',borderRadius:6,border:`1px solid ${src.bord}`}}>{d.numeroEntree}</span></td>
                      <td style={{padding:'11px 14px',fontSize:12,color:C.slate}}>{d.codeAGV}</td>
                      <td style={{padding:'11px 14px',fontSize:11,color:C.slateM,fontFamily:'monospace'}}>{d.numeroTransfert}</td>
                      <td style={{padding:'11px 14px',fontSize:12,fontWeight:700,color:'#059669'}}>{d.quantiteTransferee}</td>
                      <td style={{padding:'11px 14px',fontSize:12,fontWeight:700,color:d.nombreIncidents>0?'#dc2626':'#059669'}}>{d.nombreIncidents}</td>
                      <td style={{padding:'11px 14px'}}><BadgeStatut statut={d.statut}/></td>
                      <td style={{padding:'11px 14px',fontSize:11,color:C.slateL,fontFamily:'monospace'}}>{vm.formaterDate(d.dateEnregistrement)}</td>
                      <td style={{padding:'11px 14px'}}><div style={{display:'flex',gap:4}}>
                        <button onClick={e=>{e.stopPropagation();vm.ouvrirDetail(item)}} style={{width:28,height:28,borderRadius:7,border:`1px solid ${C.bord}`,background:C.white,cursor:'pointer',fontSize:12,display:'flex',alignItems:'center',justifyContent:'center'}}>👁</button>
                        <button onClick={e=>{e.stopPropagation();exportPDFCarte(lg,`AGV — ${d.numeroEntree}`,src.rgb)}} style={{width:28,height:28,borderRadius:7,border:`1px solid ${C.bord}`,background:C.white,cursor:'pointer',fontSize:12,display:'flex',alignItems:'center',justifyContent:'center'}}>📄</button>
                        <button onClick={e=>{e.stopPropagation();imprimerCarte(lg,`AGV — ${d.numeroEntree}`,src.couleur)}} style={{width:28,height:28,borderRadius:7,border:`1px solid ${C.bord}`,background:C.white,cursor:'pointer',fontSize:12,display:'flex',alignItems:'center',justifyContent:'center'}}>🖨</button>
                      </div></td>
                    </>);})()}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* ── PAGINATION ── */}
        {!vm.loading&&vm.totalPages>1&&(
          <div style={{padding:'12px 18px',borderTop:`1px solid ${C.bord}`,background:'#fafafa',display:'flex',alignItems:'center',justifyContent:'space-between',flexWrap:'wrap',gap:10}}>
            <span style={{fontSize:11,color:C.slateL,fontFamily:'monospace'}}>Affichage {startIndex}–{endIndex} sur {vm.totalLignes} résultats</span>
            <div style={{display:'flex',gap:4,alignItems:'center'}}>
              <button onClick={()=>vm.setPage(1)} disabled={vm.params.page===1} style={{width:32,height:32,borderRadius:8,border:`1px solid ${C.bord}`,background:C.white,fontSize:12,cursor:'pointer',color:C.slateM,display:'flex',alignItems:'center',justifyContent:'center',opacity:vm.params.page===1?0.4:1}}>«</button>
              <button onClick={()=>vm.setPage(vm.params.page-1)} disabled={vm.params.page===1} style={{width:32,height:32,borderRadius:8,border:`1px solid ${C.bord}`,background:C.white,fontSize:13,cursor:'pointer',color:C.slateM,display:'flex',alignItems:'center',justifyContent:'center',opacity:vm.params.page===1?0.4:1}}>‹</button>
              {Array.from({length:Math.min(vm.totalPages,5)},(_,i)=>{
                let p; if(vm.totalPages<=5){p=i+1;}else if(vm.params.page<=3){p=i+1;}else if(vm.params.page>=vm.totalPages-2){p=vm.totalPages-4+i;}else{p=vm.params.page-2+i;}
                return<button key={p} onClick={()=>vm.setPage(p)} style={{width:32,height:32,borderRadius:8,fontSize:13,fontWeight:p===vm.params.page?700:500,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',background:p===vm.params.page?src.couleur:C.white,color:p===vm.params.page?'#fff':C.slateM,border:`1px solid ${p===vm.params.page?src.couleur:C.bord}`,transition:'all 0.15s'}}>{p}</button>;
              })}
              <button onClick={()=>vm.setPage(vm.params.page+1)} disabled={vm.params.page===vm.totalPages} style={{width:32,height:32,borderRadius:8,border:`1px solid ${C.bord}`,background:C.white,fontSize:13,cursor:'pointer',color:C.slateM,display:'flex',alignItems:'center',justifyContent:'center',opacity:vm.params.page===vm.totalPages?0.4:1}}>›</button>
              <button onClick={()=>vm.setPage(vm.totalPages)} disabled={vm.params.page===vm.totalPages} style={{width:32,height:32,borderRadius:8,border:`1px solid ${C.bord}`,background:C.white,fontSize:12,cursor:'pointer',color:C.slateM,display:'flex',alignItems:'center',justifyContent:'center',opacity:vm.params.page===vm.totalPages?0.4:1}}>»</button>
            </div>
          </div>
        )}
      </div>

      {vm.detailOuvert&&vm.elementSelectionne&&(
        <HistoriqueDetailModal item={vm.elementSelectionne} source={vm.source} onFermer={vm.fermerDetail} formaterTemps={vm.formaterTemps} formaterDate={vm.formaterDate}/>
      )}
    </div>
  );
}
