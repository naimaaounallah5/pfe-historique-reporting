import React from 'react';
import type { useCreateRapport } from '../viewmodels/useCreateRapport';
import type { RapportType } from '../models/Rapport';
const OPTIONS_BY_TYPE: Record<RapportType, { id: string; icon: string; label: string; desc: string; placeholder: string }[]> = {
  Production: [
    { id: 'stock_finis',    icon: '📊', label: 'Stock produits finis',     desc: 'Quantité en stock à la fin',         placeholder: 'Ex : 1250 unités' },
    { id: 'matiere_conso',  icon: '🔩', label: 'Matière consommée',        desc: 'Volume de matière première utilisée', placeholder: 'Ex : 320 kg' },
    { id: 'defectueux',     icon: '❌', label: 'Produits défectueux',       desc: "Nombre d'unités rejetées",           placeholder: 'Ex : 12 unités — taux 1.2%' },
    { id: 'arrets',         icon: '⏱',  label: "Temps d'arrêt machine",    desc: 'Durée totale des pannes',             placeholder: 'Ex : 2h30 — cause: panne moteur' },
    { id: 'heures_travail', icon: '👷', label: 'Heures de travail',        desc: "Nombre d'heures travaillées",         placeholder: 'Ex : 240h — 30 opérateurs' },
    { id: 'energie',        icon: '⚡', label: 'Consommation énergie',     desc: 'Énergie consommée',                  placeholder: 'Ex : 4500 kWh' },
    { id: 'oee',            icon: '🎯', label: 'Taux de rendement (OEE)',  desc: 'Performance globale de la ligne',     placeholder: 'Ex : 82% (objectif 85%)' },
    { id: 'cycles',         icon: '🔄', label: 'Cycles de production',     desc: 'Nombre de cycles et temps/cycle',    placeholder: 'Ex : 450 cycles — 18 min/cycle' },
    { id: 'ordres',         icon: '📋', label: 'Ordres de production',     desc: 'Liste des ordres traités',           placeholder: 'Ex : OP-001, OP-002, OP-003' },
    { id: 'incidents',      icon: '📝', label: 'Incidents & observations', desc: 'Remarques et actions correctives',   placeholder: 'Ex : Incident ligne B — résolu 14h' },
  ],
  Qualité: [
    { id: 'controles',    icon: '🔬', label: 'Résultats des contrôles',  desc: 'Échantillons et résultats',           placeholder: 'Ex : 200 échantillons — 96% conformes' },
    { id: 'defauts',      icon: '❌', label: 'Produits défectueux',      desc: 'Types et quantité de défauts',        placeholder: 'Ex : 8 défauts surface, 3 dimensionnels' },
    { id: 'lots',         icon: '📦', label: 'Lots inspectés',           desc: 'Numéros et statuts',                 placeholder: 'Ex : LOT-001 ✓, LOT-002 ✕' },
    { id: 'mesures',      icon: '📏', label: 'Mesures dimensionnelles',  desc: 'Tolérances et mesures relevées',     placeholder: 'Ex : ±0.02mm — 98% dans tolérance' },
    { id: 'tracabilite',  icon: '🏷️', label: 'Traçabilité fournisseur', desc: "Origine des matières",               placeholder: 'Ex : Fournisseur ABC — lot 2026-03' },
    { id: 'correctives',  icon: '🔧', label: 'Actions correctives',      desc: 'Mesures prises suite aux NC',        placeholder: 'Ex : Réglage machine ligne 2' },
    { id: 'inspecteur',   icon: '✍️', label: 'Inspecteur qualité',       desc: "Nom et visa de l'inspecteur",       placeholder: 'Ex : Marie Bernard' },
    { id: 'conformite',   icon: '📊', label: 'Taux de conformité',       desc: 'Pourcentage global',                placeholder: 'Ex : 96.5% (objectif 95%)' },
    { id: 'audits',       icon: '🎓', label: 'Audits qualité',           desc: 'Nombre et résultats',               placeholder: 'Ex : 2 audits — satisfaisant' },
    { id: 'reclamations', icon: '⚠️', label: 'Réclamations clients',    desc: 'Nombre et nature',                  placeholder: 'Ex : 1 réclamation — délai livraison' },
  ],
  Maintenance: [
    { id: 'pieces',      icon: '🔩', label: 'Pièces remplacées',          desc: 'Liste et quantité',                  placeholder: 'Ex : Joint A ×2, Courroie B ×1' },
    { id: 'cout',        icon: '💰', label: "Coût de l'intervention",     desc: 'Coût total MO + pièces',            placeholder: 'Ex : MO 150€ + pièces 320€ = 470€' },
    { id: 'duree',       icon: '⏱',  label: "Durée d'intervention",      desc: 'Temps total sur la machine',         placeholder: 'Ex : 3h30 — technicien Karim H.' },
    { id: 'prochaine',   icon: '📅', label: 'Prochaine maintenance',      desc: 'Date et type',                       placeholder: 'Ex : 15/04/2026 — préventive' },
    { id: 'arret',       icon: '⚡', label: "Temps d'arrêt",             desc: "Durée d'indisponibilité",            placeholder: "Ex : 4h00 d'arrêt non planifié" },
    { id: 'machine',     icon: '🏭', label: 'Machine / Équipement',       desc: "Identification de l'équipement",    placeholder: 'Ex : AGV-01 — N° série 2024-X' },
    { id: 'mtbf',        icon: '📊', label: 'MTBF / MTTR',               desc: 'Fiabilité et maintenabilité',        placeholder: 'Ex : MTBF 320h — MTTR 2.5h' },
    { id: 'securite',    icon: '🛡️', label: 'Mesures de sécurité',       desc: 'Consignes respectées',              placeholder: 'Ex : Consignation élec., EPI complet' },
    { id: 'resultat',    icon: '✅', label: "Résultat de l'intervention", desc: 'Statut final',                      placeholder: 'Ex : Machine opérationnelle à 100%' },
    { id: 'description', icon: '📝', label: 'Description détaillée',      desc: 'Travaux effectués',                 placeholder: 'Ex : Remplacement joint + nettoyage...' },
  ],
  Stock: [
    { id: 'entrees',    icon: '📥', label: 'Entrées de stock',          desc: 'Articles et quantités réceptionnés',  placeholder: 'Ex : 45 articles — 1200 unités' },
    { id: 'sorties',    icon: '📤', label: 'Sorties de stock',          desc: 'Articles expédiés ou consommés',      placeholder: 'Ex : 38 articles — 980 unités' },
    { id: 'ruptures',   icon: '🚨', label: 'Articles en rupture',       desc: 'Références sous le seuil min',        placeholder: 'Ex : SKU-001, SKU-045, SKU-112' },
    { id: 'valeur',     icon: '💰', label: 'Valeur totale du stock',    desc: 'Estimation financière',               placeholder: 'Ex : 85 000€ (+3% vs mois précédent)' },
    { id: 'rotation',   icon: '🔄', label: 'Rotation des stocks',       desc: 'Fréquence de renouvellement',         placeholder: 'Ex : Taux 4.2 — délai moyen 87j' },
    { id: 'inventaire', icon: '📦', label: 'Inventaire physique',       desc: 'Résultat du dernier inventaire',      placeholder: 'Ex : 15/03 — écart -12 unités' },
    { id: 'zone',       icon: '🏭', label: 'Zone / Entrepôt',           desc: 'Emplacement analysé',                 placeholder: 'Ex : Entrepôt A — Zone critique' },
    { id: 'historique', icon: '📊', label: 'Historique mouvements',     desc: 'Détail de tous les mouvements',       placeholder: 'Ex : 83 mouvements — 45 entrées, 38 sorties' },
    { id: 'peremption', icon: '⏳', label: 'Articles à péremption',    desc: 'Produits dont la date limite approche', placeholder: 'Ex : 5 références — alerte 30j' },
    { id: 'commandes',  icon: '🚚', label: 'Commandes fournisseurs',    desc: 'Références commandées en cours',       placeholder: 'Ex : CMD-001 livraison 20/03' },
  ],
};

const TYPE_COLORS: Record<RapportType, { bg: string; border: string; text: string }> = {
  Production:  { bg: '#EEF2FF', border: '#4F46E5', text: '#4F46E5' },
  Qualité:     { bg: '#ECFDF5', border: '#059669', text: '#059669' },
  Maintenance: { bg: '#FFFBEB', border: '#D97706', text: '#D97706' },
  Stock:       { bg: '#F5F3FF', border: '#7C3AED', text: '#7C3AED' },
};

const TYPE_ICONS: Record<RapportType, string> = {
  Production: '🏭', Qualité: '✅', Maintenance: '🔧', Stock: '📦',
};

const inp: React.CSSProperties = {
  width: '100%', border: '1.5px solid #E5E7EB', borderRadius: 9,
  padding: '9px 12px', fontSize: 13, color: '#111827',
  background: 'white', fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box',
};

const Fld: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <div style={{ marginBottom: 13 }}>
    <div style={{ fontSize: 11, fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 6 }}>{label}</div>
    {children}
  </div>
);

const CreateRapportModal: React.FC<{ vm: ReturnType<typeof useCreateRapport> }> = ({ vm }) => {
  if (!vm.isOpen) return null;
  const options = OPTIONS_BY_TYPE[vm.form.type] || [];
  const colors  = TYPE_COLORS[vm.form.type];

  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}
      onClick={(e) => { if (e.target === e.currentTarget) vm.closeModal(); }}
    >
      <div onClick={(e) => e.stopPropagation()}
        style={{ background: 'white', borderRadius: 20, width: 920, maxWidth: '96vw', boxShadow: '0 24px 64px rgba(0,0,0,0.18)', overflow: 'hidden', fontFamily: "'DM Sans', sans-serif" }}>

        {/* HEADER */}
        <div style={{ background: 'linear-gradient(135deg,#4F46E5,#7C3AED)', padding: '20px 26px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: 17, fontWeight: 700, color: 'white' }}>📄 Créer un nouveau rapport</div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.75)', marginTop: 3 }}>Remplissez les informations et cochez les éléments à inclure</div>
          </div>
          <button onClick={vm.closeModal} style={{ width: 30, height: 30, borderRadius: 8, background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.25)', color: 'white', cursor: 'pointer', fontSize: 14 }}>✕</button>
        </div>

        {/* BODY */}
        <div style={{ display: 'flex', height: 550 }}>

          {/* ── GAUCHE ── */}
          <div style={{ width: 400, flexShrink: 0, padding: 20, borderRight: '1px solid #E5E7EB', overflowY: 'auto', background: 'white' }}>
            <Fld label="Titre *">
              <input style={inp} type="text" placeholder="Ex : Rapport production Mars 2026"
                value={vm.form.titre} onChange={(e) => vm.setField('titre', e.target.value)} />
            </Fld>

            <Fld label="Type de rapport *">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                {(['Production','Qualité','Maintenance','Stock'] as RapportType[]).map((t) => {
                  const c = TYPE_COLORS[t];
                  const sel = vm.form.type === t;
                  return (
                    <div key={t} onClick={() => vm.setField('type', t)}
                      style={{ border: `2px solid ${sel ? c.border : '#E5E7EB'}`, borderRadius: 10, padding: '10px 8px', textAlign: 'center', cursor: 'pointer', background: sel ? c.bg : '#FAFAFA', transition: 'all 0.2s' }}>
                      <div style={{ fontSize: 20 }}>{TYPE_ICONS[t]}</div>
                      <div style={{ fontSize: 11.5, fontWeight: 600, color: sel ? c.text : '#374151', marginTop: 3 }}>{t}</div>
                    </div>
                  );
                })}
              </div>
            </Fld>

            <Fld label="Format">
              <select style={inp} value={vm.form.format} onChange={(e) => vm.setField('format', e.target.value)}>
                <option value="PDF">📕 PDF</option>
                <option value="Excel">📗 Excel</option>
              </select>
            </Fld>

            <Fld label="Date du rapport">
                <input style={inp} type="date" value={vm.form.dateRapport} onChange={(e) => vm.setField('dateRapport', e.target.value)} />
          </Fld>
            <Fld label="Responsable">
              <select style={inp} value={vm.form.responsable} onChange={(e) => vm.setField('responsable', e.target.value)}>
                <option>Ahmed B. — Superviseur</option>
                <option>Jean Dupont — Admin</option>
                <option>Marie Bernard — Admin</option>
                <option>Karim Hassan — Admin</option>
              </select>
            </Fld>

            <Fld label="Description">
              <textarea style={{ ...inp, resize: 'vertical', minHeight: 65 } as React.CSSProperties}
                placeholder="Décrivez l'objectif de ce rapport..."
                value={vm.form.contenu}
                onChange={(e) => vm.setField('contenu', e.target.value)} />
            </Fld>
          </div>

          {/* ── DROITE ── */}
          <div style={{ flex: 1, padding: 20, overflowY: 'auto', background: '#F8FAFC' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14, paddingBottom: 12, borderBottom: '1.5px solid #E5E7EB' }}>
              <div style={{ width: 36, height: 36, borderRadius: 9, background: colors.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>
                {TYPE_ICONS[vm.form.type]}
              </div>
              <div>
                <div style={{ fontSize: 13.5, fontWeight: 700, color: '#111827' }}>Options — {vm.form.type}</div>
                <div style={{ fontSize: 11.5, color: '#6B7280', marginTop: 2 }}>Cochez et remplissez les éléments à inclure</div>
              </div>
              <span style={{ marginLeft: 'auto', fontSize: 10.5, fontWeight: 600, padding: '3px 9px', borderRadius: 20, background: colors.bg, color: colors.text }}>
                {vm.optionsActives.length} sélectionnée{vm.optionsActives.length > 1 ? 's' : ''}
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {options.map((opt) => {
                const active = vm.isOptionActive(opt.id);
                return (
                  <div key={opt.id}
                    style={{ background: active ? colors.bg : 'white', border: `1.5px solid ${active ? colors.border : '#E5E7EB'}`, borderRadius: 11, padding: '11px 13px', transition: 'all 0.2s' }}>
                    {/* Header option — cliquable */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 9, cursor: 'pointer' }}
                      onClick={() => vm.toggleOption(opt.id, opt.label)}>
                      <div style={{ width: 20, height: 20, borderRadius: 6, border: `2px solid ${active ? colors.border : '#D1D5DB'}`, background: active ? colors.border : 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, color: 'white', flexShrink: 0 }}>
                        {active ? '✓' : ''}
                      </div>
                      <span style={{ fontSize: 18 }}>{opt.icon}</span>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: active ? colors.text : '#111827' }}>{opt.label}</div>
                        <div style={{ fontSize: 11.5, color: '#6B7280', marginTop: 1 }}>{opt.desc}</div>
                      </div>
                    </div>

                    {/* Champ de saisie — stopPropagation pour ne pas fermer */}
                    {active && (
                      <div style={{ marginTop: 10 }} onClick={(e) => e.stopPropagation()}>
                        <input
                          style={{ ...inp, fontSize: 12.5, padding: '8px 10px', background: 'white' }}
                          type="text"
                          placeholder={opt.placeholder}
                          value={vm.getOptionValue(opt.id)}
                          onChange={(e) => { e.stopPropagation(); vm.setOptionValue(opt.id, e.target.value); }}
                          onClick={(e) => e.stopPropagation()}
                          onFocus={(e) => e.stopPropagation()}
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* FOOTER */}
        <div style={{ padding: '14px 24px', borderTop: '1px solid #F3F4F6', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#FAFAFA' }}>
          <div style={{ fontSize: 12, color: '#9CA3AF' }}>
            {vm.optionsActives.length === 0
              ? 'Sélectionnez au moins une option'
              : `${vm.optionsActives.length} option${vm.optionsActives.length > 1 ? 's' : ''} · les valeurs seront incluses dans le PDF/Excel`}
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            {vm.error   && <span style={{ fontSize: 12, color: '#DC2626' }}>⚠ {vm.error}</span>}
            {vm.success && <span style={{ fontSize: 12, color: '#059669' }}>✅ Rapport créé !</span>}
            <button onClick={vm.closeModal} style={{ padding: '9px 16px', borderRadius: 9, border: '1.5px solid #E5E7EB', background: 'white', color: '#374151', fontWeight: 600, cursor: 'pointer', fontSize: 13 }}>Annuler</button>
            <button onClick={vm.submit} disabled={vm.loading}
              style={{ padding: '9px 20px', borderRadius: 9, border: 'none', background: 'linear-gradient(135deg,#4F46E5,#7C3AED)', color: 'white', fontWeight: 600, cursor: 'pointer', fontSize: 13, opacity: vm.loading ? 0.6 : 1 }}>
              {vm.loading ? '⏳ Création…' : '✓ Créer le rapport'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateRapportModal;