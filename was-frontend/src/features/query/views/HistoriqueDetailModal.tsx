// ============================================================
//  HistoriqueDetailModal.tsx — Modal détail centré
//  ✅ CORRIGÉ : Statuts QDC (Conforme, Non conforme, Critique, En attente, Annulé)
// ============================================================

import { useEffect, useState } from "react";
import jsPDF from "jspdf";
import type {
  SourceType, HistoriqueItem,
  HistoriqueSCADA, HistoriqueWMS,
  HistoriqueQDC, HistoriqueAGV
} from "../models/historique.model";

interface Props {
  item          : HistoriqueItem;
  source        : SourceType;
  onFermer      : () => void;
  formaterTemps : (m: number) => string;
  formaterDate  : (d: string) => string;
}

const SOURCE_STYLE: Record<SourceType, {
  couleur: string; clair: string; bord: string;
  gradient: string; rgb: [number,number,number]; label: string;
  couleurLight: string;
}> = {
  scada: { couleur:'#2563eb', clair:'#eff6ff', bord:'#bfdbfe', gradient:'linear-gradient(135deg,#1d4ed8,#3b82f6)', rgb:[37,99,235],  label:'SCADA', couleurLight:'#dbeafe' },
  wms:   { couleur:'#059669', clair:'#ecfdf5', bord:'#a7f3d0', gradient:'linear-gradient(135deg,#047857,#10b981)', rgb:[5,150,105],   label:'WMS',   couleurLight:'#d1fae5' },
  qdc:   { couleur:'#d97706', clair:'#fffbeb', bord:'#fde68a', gradient:'linear-gradient(135deg,#b45309,#f59e0b)', rgb:[217,119,6],   label:'QDC',   couleurLight:'#fef3c7' },
  agv:   { couleur:'#dc2626', clair:'#fff1f2', bord:'#fecdd3', gradient:'linear-gradient(135deg,#b91c1c,#f87171)', rgb:[220,38,38],   label:'AGV',   couleurLight:'#fee2e2' },
};

const C = {
  slate:  '#0f172a',
  slateM: '#475569',
  slateL: '#94a3b8',
  bord:   '#e2e8f0',
  bg:     '#f8fafc',
  white:  '#ffffff',
};

const DESTINATAIRES: Record<SourceType, { label: string; email: string }[]> = {
  scada: [
    { label: 'Responsable Production (SCADA)', email: 'naounallah581@gmail.com' },
    { label: 'Directeur Général',              email: 'naounallah581@gmail.com' },
  ],
  wms: [
    { label: 'Responsable Logistique (WMS)',   email: 'naounallah581@gmail.com' },
    { label: 'Directeur Général',              email: 'naounallah581@gmail.com' },
  ],
  qdc: [
    { label: 'Responsable Qualité (QDC)',      email: 'naounallah581@gmail.com' },
    { label: 'Directeur Général',              email: 'naounallah581@gmail.com' },
  ],
  agv: [
    { label: 'Responsable Maintenance (AGV)',  email: 'naounallah581@gmail.com' },
    { label: 'Directeur Général',              email: 'naounallah581@gmail.com' },
  ],
};

function LigneDetail({ label, valeur, couleur }: {
  label: string; valeur: string | number; couleur?: string;
}) {
  return (
    <div style={{
      display:'flex', justifyContent:'space-between', alignItems:'center',
      padding:'10px 14px', background:C.bg, borderRadius:10,
      border:`1px solid ${C.bord}`,
    }}>
      <span style={{ fontSize:12, color:C.slateM, fontWeight:600 }}>{label}</span>
      <span style={{ fontSize:13, fontWeight:700, color: couleur ?? C.slate, fontFamily:'monospace' }}>
        {valeur}
      </span>
    </div>
  );
}

function Section({ titre, couleur, children }: {
  titre: string; couleur: string; children: React.ReactNode;
}) {
  return (
    <div style={{ marginBottom:20 }}>
      <div style={{
        fontSize:10, color:couleur, fontWeight:800,
        textTransform:'uppercase', letterSpacing:'0.1em',
        marginBottom:8, display:'flex', alignItems:'center', gap:8,
      }}>
        <div style={{ flex:1, height:1, background:`${couleur}30` }} />
        {titre}
        <div style={{ flex:1, height:1, background:`${couleur}30` }} />
      </div>
      <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
        {children}
      </div>
    </div>
  );
}

export default function HistoriqueDetailModal({
  item, source, onFermer, formaterTemps, formaterDate
}: Props) {

  const s = SOURCE_STYLE[source];
  const numero = (item as HistoriqueSCADA).numeroEntree;

  const [emailSent,        setEmailSent]        = useState(false);
  const [emailLoading,     setEmailLoading]     = useState(false);
  const [emailErreur,      setEmailErreur]      = useState('');
  const [showEmailModal,   setShowEmailModal]   = useState(false);
  const [destinataireIndex, setDestinatataireIndex] = useState(0);

  const destinataireChoisi = DESTINATAIRES[source][destinataireIndex].email;

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onFermer(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onFermer]);

  const construireContenuEmail = (): { sujet: string; corps: string } => {
    const maintenant  = new Date().toLocaleString('fr-FR');
    const labelSource = s.label;

    const buildHTML = (titre: string, lignes: { label: string; valeur: string; couleur?: string }[], statut: string) => {

      // ✅ COULEURS QDC CORRIGÉES
      const couleurStatut =
        statut === 'Critique'      ? { grad:'linear-gradient(135deg,#7c2d12,#dc2626)', light:'#fff1f2' } :
        statut === 'Non conforme'  ? { grad:'linear-gradient(135deg,#b91c1c,#ef4444)', light:'#fff1f2' } :
        statut === 'Conforme'      ? { grad:'linear-gradient(135deg,#15803d,#22c55e)', light:'#f0fdf4' } :
        statut === 'En attente'    ? { grad:'linear-gradient(135deg,#b45309,#f59e0b)', light:'#fffbeb' } :
        statut === 'En marche'     ? { grad:'linear-gradient(135deg,#15803d,#22c55e)', light:'#f0fdf4' } :
        statut === 'En panne'      ? { grad:'linear-gradient(135deg,#b91c1c,#ef4444)', light:'#fff1f2' } :
        statut === 'En réglage'    ? { grad:'linear-gradient(135deg,#b45309,#f59e0b)', light:'#fffbeb' } :
        statut === 'Arrêt allumé'  ? { grad:'linear-gradient(135deg,#1d4ed8,#3b82f6)', light:'#eff6ff' } :
                                    { grad:'linear-gradient(135deg,#374151,#6b7280)', light:'#f8fafc' };

      const rows = lignes.map(l => {
        const tc  = l.couleur ?? '#1a2035';
        const bgc = l.couleur
          ? l.couleur === '#b91c1c' ? '#fff1f2'
          : l.couleur === '#15803d' ? '#f0fdf4'
          : l.couleur === '#b45309' ? '#fffbeb'
          : l.couleur === '#1d4ed8' ? '#eff6ff'
          : couleurStatut.light
          : '#f8fafc';
        return `
          <tr>
            <td style="padding:10px 16px;font-size:12px;font-weight:600;color:${tc};background:${bgc};border-radius:8px 0 0 8px;width:40%;">${l.label}</td>
            <td style="padding:10px 16px;font-size:13px;font-weight:700;color:${tc};background:${bgc};border-radius:0 8px 8px 0;">${l.valeur}</td>
          </tr>
          <tr><td colspan="2" style="padding:2px 0;"></td></tr>`;
      }).join('');

      return `<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"/></head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:Arial,sans-serif;">
  <div style="max-width:600px;margin:30px auto;border-radius:20px;overflow:hidden;box-shadow:0 8px 40px rgba(0,0,0,0.15);">
    <div style="background:${couleurStatut.grad};padding:32px;text-align:center;">
      <div style="font-size:11px;color:rgba(255,255,255,0.7);font-weight:700;text-transform:uppercase;letter-spacing:0.12em;margin-bottom:8px;">I-mobile WAS — ${labelSource}</div>
      <div style="font-size:24px;font-weight:900;color:#ffffff;margin-bottom:10px;">${titre}</div>
      <div style="display:inline-block;background:rgba(255,255,255,0.2);border-radius:20px;padding:4px 16px;">
        <span style="font-size:11px;color:rgba(255,255,255,0.9);">Envoyé le ${maintenant}</span>
      </div>
    </div>
    <div style="background:#ffffff;padding:24px;">
      <table style="width:100%;border-collapse:separate;border-spacing:0 2px;">
        <tbody>${rows}</tbody>
      </table>
    </div>
    <div style="background:${couleurStatut.grad};padding:16px;text-align:center;">
      <div style="font-size:11px;color:rgba(255,255,255,0.8);margin-bottom:4px;">I-mobile WAS — Système de supervision industrielle</div>
      <div style="margin-top:6px;font-size:11px;color:#ffffff;font-weight:700;">I-Mobile © 2026</div>
    </div>
  </div>
</body>
</html>`;
    };

    if (source === 'scada') {
      const d  = item as HistoriqueSCADA;
      const sc = d.statut === 'En panne' ? '#b91c1c' : d.statut === 'En marche' ? '#15803d' : d.statut === 'En réglage' ? '#b45309' : d.statut === 'Arrêt allumé' ? '#1d4ed8' : '#374151';
      return {
        sujet: `Rapport SCADA — ${d.numeroEntree} — ${d.statut}`,
        corps: buildHTML(`Rapport SCADA — ${d.numeroEntree}`, [
          { label:'N° Entrée',    valeur:d.numeroEntree,                                  couleur:sc },
          { label:'N° Ordre',     valeur:d.numeroOrdre },
          { label:'Date',         valeur:formaterDate(d.dateEnregistrement) },
          { label:'Statut',       valeur:d.statut,                                        couleur:sc },
          { label:'Machine',      valeur:d.nomMachine },
          { label:'Produit',      valeur:d.nomProduit },
          { label:'N° Opération', valeur:d.numeroOperation },
          { label:'Qté produite', valeur:`${d.quantiteProduite} pcs`,                    couleur:'#15803d' },
          { label:'Qté rebut',    valeur:`${d.quantiteRebut} pcs`,                       couleur:d.quantiteRebut > 0 ? '#b91c1c' : '#15803d' },
          { label:'Heure début',  valeur:formaterDate(d.heureDebut) },
          { label:'Heure fin',    valeur:d.heureFin ? formaterDate(d.heureFin) : '—' },
          { label:'Durée marche', valeur:formaterTemps(d.runTime),                        couleur:'#15803d' },
          { label:'Durée arrêt',  valeur:formaterTemps(d.stopTime),                       couleur:d.stopTime > 0 ? '#b91c1c' : '#15803d' },
          { label:'Réglage',      valeur:formaterTemps(d.setupTime) },
        ], d.statut)
      };
    }

    if (source === 'wms') {
      const d  = item as HistoriqueWMS;
      const sc = d.statut === 'En panne' ? '#b91c1c' : d.statut === 'En marche' ? '#15803d' : d.statut === 'En réglage' ? '#b45309' : d.statut === 'Arrêt allumé' ? '#1d4ed8' : '#374151';
      return {
        sujet: `Rapport WMS — ${d.numeroEntree} — ${d.statut}`,
        corps: buildHTML(`Rapport WMS — ${d.numeroEntree}`, [
          { label:'N° Entrée',   valeur:d.numeroEntree,                        couleur:sc },
          { label:'N° Lot',      valeur:d.numeroLot },
          { label:'Date',        valeur:formaterDate(d.dateEnregistrement) },
          { label:'Statut',      valeur:d.statut,                              couleur:sc },
          { label:'Produit',     valeur:d.nomProduit },
          { label:'Location',    valeur:d.zone },
          { label:'Mouvement',        valeur:d.typeMouvement },
          { label:'Qté traitée', valeur:String(d.quantiteTraitee),             couleur:'#15803d' },
          { label:'Qté rejetée', valeur:String(d.quantiteRejetee),             couleur:d.quantiteRejetee > 0 ? '#b91c1c' : '#15803d' },
          { label:'Traitement',  valeur:formaterTemps(d.dureeTraitement),      couleur:'#15803d' },
          { label:'Arrêt',       valeur:formaterTemps(d.dureeArret),           couleur:d.dureeArret > 0 ? '#b91c1c' : '#15803d' },
        ], d.statut)
      };
    }

    // ✅ SECTION QDC CORRIGÉE
    if (source === 'qdc') {
      const d  = item as HistoriqueQDC;
      const sc = d.statut === 'Critique'     ? '#7c2d12' 
               : d.statut === 'Non conforme' ? '#b91c1c' 
               : d.statut === 'Conforme'     ? '#15803d' 
               : d.statut === 'En attente'   ? '#b45309' 
               : '#374151';
      return {
        sujet: `Rapport QDC — ${d.numeroEntree} — ${d.statut}`,
        corps: buildHTML(`Rapport QDC — ${d.numeroEntree}`, [
          { label:'N° Entrée',     valeur:d.numeroEntree,          couleur:sc },
          { label:'Date',          valeur:formaterDate(d.dateEnregistrement) },
          { label:'Statut',        valeur:d.statut,                couleur:sc },
          { label:'Produit',       valeur:d.nomProduit },
          { label:'Machine',       valeur:d.nomMachine },
          { label:'Ligne',         valeur:d.ligneProduction },
          { label:'Type contrôle', valeur:d.typeControle },
          { label:'Qté contrôlée', valeur:String(d.quantiteControlee) },
          { label:'Qté défaut',    valeur:String(d.quantiteDefaut), couleur:d.quantiteDefaut > 0 ? '#b91c1c' : '#15803d' },
          { label:'Taux défaut',   valeur:`${d.tauxDefaut}%`,      couleur:d.tauxDefaut > 10 ? '#b91c1c' : d.tauxDefaut > 5 ? '#b45309' : '#15803d' },
        ], d.statut)
      };
    }

    const d  = item as HistoriqueAGV;
    const sc = d.statut === 'En panne' ? '#b91c1c' : d.statut === 'En marche' ? '#15803d' : d.statut === 'En réglage' ? '#b45309' : d.statut === 'Arrêt allumé' ? '#1d4ed8' : '#374151';
    return {
      sujet: `Rapport AGV — ${d.numeroEntree} — ${d.statut}`,
      corps: buildHTML(`Rapport AGV — ${d.numeroEntree}`, [
        { label:'N° Entrée',    valeur:d.numeroEntree,                couleur:sc },
        { label:'Date',         valeur:formaterDate(d.dateEnregistrement) },
        { label:'Statut',       valeur:d.statut,                      couleur:sc },
        { label:'Code AGV',     valeur:d.codeAGV },
        { label:'N° Transfert', valeur:d.numeroTransfert },
        { label:'Produit',      valeur:d.nomProduit },
        { label:'Qté transf.',  valeur:String(d.quantiteTransferee),  couleur:'#15803d' },
        { label:'Incidents',    valeur:String(d.nombreIncidents),     couleur:d.nombreIncidents > 0 ? '#b91c1c' : '#15803d' },
        { label:'Zone départ',  valeur:d.zoneDepart },
        { label:'Zone arrivée', valeur:d.zoneArrivee },
        { label:'Durée marche', valeur:formaterTemps(d.runTime),      couleur:'#15803d' },
        { label:'Durée arrêt',  valeur:formaterTemps(d.stopTime),     couleur:d.stopTime > 0 ? '#b91c1c' : '#15803d' },
      ], d.statut)
    };
  };

  const envoyerEmail = async () => {
    setEmailLoading(true);
    setEmailErreur('');
    try {
      const { sujet, corps } = construireContenuEmail();
      const response = await fetch('http://localhost:5088/api/email/historique', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ destinataire: destinataireChoisi, sujet, corps }),
      });
      if (!response.ok) throw new Error('Erreur envoi email');
      setEmailSent(true);
      setShowEmailModal(false);
    } catch {
      setEmailErreur('Échec envoi email');
    } finally {
      setEmailLoading(false);
    }
  };

  const getLignesDetail = (): { label: string; valeur: string }[] => {
    if (source === 'scada') {
      const d = item as HistoriqueSCADA;
      return [
        { label:'N° Entrée',    valeur:d.numeroEntree },
        { label:'N° Ordre',     valeur:d.numeroOrdre },
        { label:'Date',         valeur:formaterDate(d.dateEnregistrement) },
        { label:'Statut',       valeur:d.statut },
        { label:'Machine',      valeur:d.nomMachine },
        { label:'Produit',      valeur:d.nomProduit },
        { label:'N° Opération', valeur:d.numeroOperation },
        { label:'Qté produite', valeur:`${d.quantiteProduite} pcs` },
        { label:'Qté rebut',    valeur:`${d.quantiteRebut} pcs` },
        { label:'Heure début',  valeur:formaterDate(d.heureDebut) },
        { label:'Heure fin',    valeur:d.heureFin ? formaterDate(d.heureFin) : '—' },
        { label:'Durée marche', valeur:formaterTemps(d.runTime) },
        { label:'Durée arrêt',  valeur:formaterTemps(d.stopTime) },
        { label:'Réglage',      valeur:formaterTemps(d.setupTime) },
      ];
    }
    if (source === 'wms') {
      const d = item as HistoriqueWMS;
      return [
        { label:'N° Entrée',   valeur:d.numeroEntree },
        { label:'N° Lot',      valeur:d.numeroLot },
        { label:'Date',        valeur:formaterDate(d.dateEnregistrement) },
        { label:'Statut',      valeur:d.statut },
        { label:'Produit',     valeur:d.nomProduit },
        { label:'Location',    valeur:d.zone },
        { label:'Type',        valeur:d.typeMouvement },
        { label:'Qté traitée', valeur:String(d.quantiteTraitee) },
        { label:'Qté rejetée', valeur:String(d.quantiteRejetee) },
        { label:'Traitement',  valeur:formaterTemps(d.dureeTraitement) },
        { label:'Arrêt',       valeur:formaterTemps(d.dureeArret) },
      ];
    }
    // ✅ QDC CORRIGÉ
    if (source === 'qdc') {
      const d = item as HistoriqueQDC;
      return [
        { label:'N° Entrée',     valeur:d.numeroEntree },
        { label:'Date',          valeur:formaterDate(d.dateEnregistrement) },
        { label:'Statut',        valeur:d.statut },
        { label:'Produit',       valeur:d.nomProduit },
        { label:'Machine',       valeur:d.nomMachine },
        { label:'Ligne',         valeur:d.ligneProduction },
        { label:'Type contrôle', valeur:d.typeControle },
        { label:'Qté contrôlée', valeur:String(d.quantiteControlee) },
        { label:'Qté défaut',    valeur:String(d.quantiteDefaut) },
        { label:'Taux défaut',   valeur:`${d.tauxDefaut}%` },
      ];
    }
    const d = item as HistoriqueAGV;
    return [
      { label:'N° Entrée',    valeur:d.numeroEntree },
      { label:'Date',         valeur:formaterDate(d.dateEnregistrement) },
      { label:'Statut',       valeur:d.statut },
      { label:'Code AGV',     valeur:d.codeAGV },
      { label:'N° Transfert', valeur:d.numeroTransfert },
      { label:'Produit',      valeur:d.nomProduit },
      { label:'Qté transf.',  valeur:String(d.quantiteTransferee) },
      { label:'Incidents',    valeur:String(d.nombreIncidents) },
      { label:'Zone départ',  valeur:d.zoneDepart },
      { label:'Zone arrivée', valeur:d.zoneArrivee },
      { label:'Durée marche', valeur:formaterTemps(d.runTime) },
      { label:'Durée arrêt',  valeur:formaterTemps(d.stopTime) },
    ];
  };

  const exporterPDFDetail = () => {
    const doc    = new jsPDF();
    const lignes = getLignesDetail();
    doc.setFillColor(...s.rgb); doc.rect(0,0,210,28,'F');
    doc.setTextColor(255,255,255);
    doc.setFontSize(16); doc.setFont('helvetica','bold');
    doc.text(`Détail ${s.label} — ${numero}`, 14, 12);
    doc.setFontSize(9); doc.setFont('helvetica','normal');
    doc.text(`Exporté le ${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR')}`, 14, 22);
    let y = 38;
    doc.setTextColor(0,0,0);
    lignes.forEach((ligne,i) => {
      if (i%2===0) { doc.setFillColor(248,250,255); doc.rect(14,y-4,182,8,'F'); }
      doc.setFontSize(9); doc.setFont('helvetica','bold'); doc.setTextColor(100,100,100);
      doc.text(ligne.label, 16, y);
      doc.setFont('helvetica','normal'); doc.setTextColor(30,30,30);
      doc.text(String(ligne.valeur), 100, y);
      y += 10;
    });
    doc.save(`Detail_${s.label}_${numero.replace('#','')}.pdf`);
  };

  const imprimerDetail = () => {
    const lignes     = getLignesDetail();
    const lignesHTML = lignes.map((l,i) => `
      <tr style="background:${i%2===0?'#f8faff':'#fff'}">
        <td style="padding:10px 14px;font-weight:600;color:#6b7280;font-size:12px;width:40%">${l.label}<\/td>
        <td style="padding:10px 14px;font-size:13px;color:#1a2035;font-weight:700">${l.valeur}<\/td>
      <\/tr>`).join('');
    const w = window.open('','_blank'); if (!w) return;
    w.document.write(`<!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8">
      <title>Détail ${s.label} ${numero}</title>
      <style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:Arial,sans-serif;color:#1a2035}
      .hdr{background:${s.couleur};color:white;padding:22px 28px}.hdr h1{font-size:20px;margin-bottom:4px}
      .meta{font-size:11px;opacity:.8}.body{padding:24px}
      table{width:100%;border-collapse:collapse}td{border-bottom:1px solid #f0f0f0}
      @media print{body{-webkit-print-color-adjust:exact}}<\/style><\/head><body>
      <div class="hdr"><h1>Détail ${s.label} — ${numero}</h1>
      <div class="meta">Exporté le ${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR')}<\/div><\/div>
      <div class="body"><table><tbody>${lignesHTML}<\/tbody><\/table><\/div>
      <script>window.onload=()=>{window.print();window.close()}<\/script><\/body><\/html>`);
    w.document.close();
  };

  // ✅ RENDER QDC CORRIGÉ
  const renderContenu = () => {
    if (source === 'scada') {
      const d = item as HistoriqueSCADA;
      return (<>
        <Section titre="Informations générales" couleur={s.couleur}>
          <LigneDetail label="N° Entrée"    valeur={d.numeroEntree}    couleur={s.couleur} />
          <LigneDetail label="N° Ordre"     valeur={d.numeroOrdre} />
          <LigneDetail label="Date"         valeur={formaterDate(d.dateEnregistrement)} />
          <LigneDetail label="Statut"       valeur={d.statut} />
        </Section>
        <Section titre="Production" couleur={s.couleur}>
          <LigneDetail label="Machine"      valeur={d.nomMachine} />
          <LigneDetail label="Produit"      valeur={d.nomProduit} />
          <LigneDetail label="N° Opération" valeur={d.numeroOperation} />
          <LigneDetail label="Qté produite" valeur={`${d.quantiteProduite} pcs`} couleur="#059669" />
          <LigneDetail label="Qté rebut"    valeur={`${d.quantiteRebut} pcs`}    couleur={d.quantiteRebut > 0 ? '#dc2626' : C.slate} />
        </Section>
        <Section titre="Temps" couleur={s.couleur}>
          <LigneDetail label="Heure début"  valeur={formaterDate(d.heureDebut)} />
          <LigneDetail label="Heure fin"    valeur={d.heureFin ? formaterDate(d.heureFin) : '—'} />
          <LigneDetail label="Durée marche" valeur={formaterTemps(d.runTime)}  couleur={s.couleur} />
          <LigneDetail label="Durée arrêt"  valeur={formaterTemps(d.stopTime)} couleur={d.stopTime > 0 ? '#dc2626' : C.slate} />
          <LigneDetail label="Réglage"      valeur={formaterTemps(d.setupTime)} />
        </Section>
      </>);
    }
    if (source === 'wms') {
      const d = item as HistoriqueWMS;
      return (<>
        <Section titre="Informations générales" couleur={s.couleur}>
          <LigneDetail label="N° Entrée" valeur={d.numeroEntree} couleur={s.couleur} />
          <LigneDetail label="N° Lot"    valeur={d.numeroLot} />
          <LigneDetail label="Date"      valeur={formaterDate(d.dateEnregistrement)} />
          <LigneDetail label="Statut"    valeur={d.statut} />
        </Section>
        <Section titre="Mouvement" couleur={s.couleur}>
          <LigneDetail label="Produit"     valeur={d.nomProduit} />
          <LigneDetail label="Location"    valeur={d.zone} />
          <LigneDetail label="Mouvement"        valeur={d.typeMouvement} />
          <LigneDetail label="Qté traitée" valeur={d.quantiteTraitee} couleur="#059669" />
          <LigneDetail label="Qté rejetée" valeur={d.quantiteRejetee} couleur={d.quantiteRejetee > 0 ? '#dc2626' : C.slate} />
        </Section>
        <Section titre="Durées" couleur={s.couleur}>
          <LigneDetail label="Traitement" valeur={formaterTemps(d.dureeTraitement)} couleur="#059669" />
          <LigneDetail label="Arrêt"      valeur={formaterTemps(d.dureeArret)}      couleur={d.dureeArret > 0 ? '#dc2626' : C.slate} />
        </Section>
      </>);
    }
    // ✅ RENDER QDC CORRIGÉ
    if (source === 'qdc') {
      const d = item as HistoriqueQDC;
      const statutColor = d.statut === 'Critique' ? '#7c2d12'
                        : d.statut === 'Non conforme' ? '#b91c1c'
                        : d.statut === 'Conforme' ? '#059669'
                        : d.statut === 'En attente' ? '#b45309'
                        : C.slate;
      return (<>
        <Section titre="Informations générales" couleur={s.couleur}>
          <LigneDetail label="N° Entrée" valeur={d.numeroEntree} couleur={s.couleur} />
          <LigneDetail label="Date"      valeur={formaterDate(d.dateEnregistrement)} />
          <LigneDetail label="Statut"    valeur={d.statut} couleur={statutColor} />
        </Section>
        <Section titre="Contrôle qualité" couleur={s.couleur}>
          <LigneDetail label="Produit"        valeur={d.nomProduit} />
          <LigneDetail label="Machine"        valeur={d.nomMachine} />
          <LigneDetail label="Ligne"          valeur={d.ligneProduction} />
          <LigneDetail label="Type contrôle"  valeur={d.typeControle} />
          <LigneDetail label="Qté contrôlée"  valeur={d.quantiteControlee} />
          <LigneDetail label="Qté défaut"     valeur={d.quantiteDefaut} couleur={d.quantiteDefaut > 0 ? '#dc2626' : '#059669'} />
          <LigneDetail label="Taux défaut"    valeur={`${d.tauxDefaut}%`}
            couleur={d.tauxDefaut > 10 ? '#dc2626' : d.tauxDefaut > 5 ? '#d97706' : '#059669'} />
        </Section>
      </>);
    }
    const d = item as HistoriqueAGV;
    return (<>
      <Section titre="Informations générales" couleur={s.couleur}>
        <LigneDetail label="N° Entrée" valeur={d.numeroEntree} couleur={s.couleur} />
        <LigneDetail label="Date"      valeur={formaterDate(d.dateEnregistrement)} />
        <LigneDetail label="Statut"    valeur={d.statut} />
      </Section>
      <Section titre="Transfert" couleur={s.couleur}>
        <LigneDetail label="Code AGV"       valeur={d.codeAGV} />
        <LigneDetail label="N° Transfert"   valeur={d.numeroTransfert} />
        <LigneDetail label="Produit"        valeur={d.nomProduit} />
        <LigneDetail label="Qté transférée" valeur={d.quantiteTransferee} couleur="#059669" />
        <LigneDetail label="Incidents"      valeur={d.nombreIncidents} couleur={d.nombreIncidents > 0 ? '#dc2626' : '#059669'} />
      </Section>
      <Section titre="Trajet" couleur={s.couleur}>
        <LigneDetail label="Zone départ"  valeur={d.zoneDepart} />
        <LigneDetail label="Zone arrivée" valeur={d.zoneArrivee} />
        <LigneDetail label="Durée marche" valeur={formaterTemps(d.runTime)}  couleur={s.couleur} />
        <LigneDetail label="Durée arrêt"  valeur={formaterTemps(d.stopTime)} couleur={d.stopTime > 0 ? '#dc2626' : C.slate} />
      </Section>
    </>);
  };

  return (
    <>
      <div onClick={onFermer} style={{ position:'fixed', inset:0, background:'rgba(15,23,42,0.55)', backdropFilter:'blur(4px)', zIndex:40 }} />

      {showEmailModal && (
        <>
          <div onClick={() => setShowEmailModal(false)} style={{ position:'fixed', inset:0, background:'rgba(15,23,42,0.7)', backdropFilter:'blur(4px)', zIndex:60 }} />
          <div style={{ position:'fixed', inset:0, zIndex:70, display:'flex', alignItems:'center', justifyContent:'center', padding:24, pointerEvents:'none' }}>
            <div style={{ background:C.white, borderRadius:18, width:'100%', maxWidth:440, boxShadow:'0 32px 80px rgba(0,0,0,0.25)', border:`1px solid ${s.bord}`, pointerEvents:'all', overflow:'hidden' }}>
              <div style={{ background:s.gradient, padding:'18px 24px', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                  <span style={{ fontSize:20 }}>📧</span>
                  <div>
                    <div style={{ fontSize:11, color:'rgba(255,255,255,0.7)', fontWeight:700, textTransform:'uppercase' }}>Envoyer Email</div>
                    <div style={{ fontSize:16, fontWeight:800, color:'#fff' }}>Sélectionner le destinataire</div>
                  </div>
                </div>
                <button onClick={() => setShowEmailModal(false)} style={{ width:32, height:32, borderRadius:8, background:'rgba(255,255,255,0.2)', border:'1px solid rgba(255,255,255,0.3)', color:'#fff', cursor:'pointer', fontSize:14, fontWeight:700, display:'flex', alignItems:'center', justifyContent:'center' }}>✕</button>
              </div>
              <div style={{ padding:'20px 24px', display:'flex', flexDirection:'column', gap:10 }}>
                <div style={{ fontSize:12, color:C.slateM, fontWeight:600, marginBottom:4 }}>Choisissez le destinataire :</div>
                {DESTINATAIRES[source].map((dest, index) => (
                  <label key={index} style={{ display:'flex', alignItems:'center', gap:12, padding:'12px 16px', borderRadius:12, border:`2px solid ${destinataireIndex === index ? s.couleur : C.bord}`, background: destinataireIndex === index ? s.clair : C.white, cursor:'pointer' }}>
                    <input
                      type="radio"
                      name="destinataire"
                      value={index}
                      checked={destinataireIndex === index}
                      onChange={() => setDestinatataireIndex(index)}
                      style={{ accentColor: s.couleur, width:16, height:16 }}
                    />
                    <div>
                      <div style={{ fontSize:13, fontWeight:700, color:C.slate }}>{dest.label}</div>
                      <div style={{ fontSize:11, color:C.slateL, fontFamily:'monospace' }}>{dest.email}</div>
                    </div>
                  </label>
                ))}
                {emailErreur && (
                  <div style={{ padding:'8px 14px', borderRadius:8, background:'#fff1f2', border:'1px solid #fecdd3', color:'#dc2626', fontSize:12, fontWeight:600, textAlign:'center' }}>❌ {emailErreur}</div>
                )}
                <div style={{ display:'flex', gap:10, marginTop:8 }}>
                  <button onClick={() => setShowEmailModal(false)} style={{ flex:1, padding:'11px 0', borderRadius:11, border:`1px solid ${C.bord}`, background:C.white, color:C.slateM, fontSize:13, fontWeight:700, cursor:'pointer' }}>Annuler</button>
                  <button onClick={envoyerEmail} disabled={emailLoading} style={{ flex:2, padding:'11px 0', borderRadius:11, border:'none', background:s.gradient, color:'#fff', fontSize:13, fontWeight:700, cursor: emailLoading ? 'not-allowed' : 'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:6, opacity: emailLoading ? 0.85 : 1 }}>
                    {emailLoading ? '📤 Envoi...' : '📧 Envoyer Email'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      <div style={{ position:'fixed', inset:0, zIndex:50, display:'flex', alignItems:'center', justifyContent:'center', padding:24, pointerEvents:'none' }}>
        <div style={{ background:C.white, borderRadius:22, width:'100%', maxWidth:620, maxHeight:'88vh', display:'flex', flexDirection:'column', overflow:'hidden', boxShadow:'0 32px 80px rgba(0,0,0,0.22)', border:`1px solid ${s.bord}`, pointerEvents:'all' }}>
          <div style={{ background:s.gradient, padding:'20px 26px', display:'flex', alignItems:'center', justifyContent:'space-between', position:'relative', overflow:'hidden' }}>
            <div style={{ position:'absolute',top:-40,right:-40,width:160,height:160,borderRadius:'50%',background:'rgba(255,255,255,0.08)',pointerEvents:'none' }} />
            <div style={{ display:'flex', alignItems:'center', gap:14, position:'relative', zIndex:1 }}>
              <div style={{ width:48, height:48, borderRadius:14, background:'rgba(255,255,255,0.2)', border:'1.5px solid rgba(255,255,255,0.3)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:20 }}>
                {source==='scada' ? '🏭' : source==='wms' ? '📦' : source==='qdc' ? '🔍' : '🤖'}
              </div>
              <div>
                <div style={{ fontSize:11, color:'rgba(255,255,255,0.7)', fontWeight:700, letterSpacing:'0.08em', textTransform:'uppercase', marginBottom:3 }}>Détail — {s.label}</div>
                <div style={{ fontSize:20, fontWeight:900, color:'#fff', letterSpacing:'-0.5px', fontFamily:'monospace' }}>{numero}</div>
              </div>
            </div>
            <button onClick={onFermer} style={{ width:36, height:36, borderRadius:10, background:'rgba(255,255,255,0.2)', border:'1px solid rgba(255,255,255,0.3)', color:'#fff', cursor:'pointer', fontSize:15, fontWeight:700, display:'flex', alignItems:'center', justifyContent:'center', position:'relative', zIndex:1 }}>✕</button>
          </div>
          <div style={{ flex:1, overflowY:'auto', padding:'22px 26px' }}>
            {renderContenu()}
          </div>
          <div style={{ padding:'16px 26px', borderTop:`1px solid ${C.bord}`, background:'#fafafa', display:'flex', flexDirection:'column', gap:10 }}>
            {emailSent && (
              <div style={{ padding:'8px 14px', borderRadius:8, background:'#f0fdf4', border:'1px solid #bbf7d0', color:'#059669', fontSize:12, fontWeight:600, textAlign:'center' }}>
                ✅ Email envoyé avec succès au responsable !
              </div>
            )}
            <div style={{ display:'flex', gap:10 }}>
              <button onClick={imprimerDetail} style={{ flex:1, padding:'11px 0', borderRadius:11, border:`1px solid ${C.bord}`, background:C.white, color:C.slateM, fontSize:14, fontWeight:700, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:6 }}>
                🖨️ Imprimer
              </button>
              <button onClick={() => { setEmailSent(false); setEmailErreur(''); setShowEmailModal(true); }} style={{ flex:1, padding:'11px 0', borderRadius:11, border:'none', background:'linear-gradient(135deg,#2563eb,#3b82f6)', color:'#fff', fontSize:14, fontWeight:700, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:6 }}>
                📧 Envoyer Email
              </button>
              <button onClick={exporterPDFDetail} style={{ flex:1, padding:'11px 0', borderRadius:11, border:'none', background:s.gradient, color:'#fff', fontSize:14, fontWeight:700, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:6 }}>
                📄 Exporter PDF
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}