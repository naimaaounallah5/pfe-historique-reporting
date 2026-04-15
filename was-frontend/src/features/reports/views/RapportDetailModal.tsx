import React from 'react';
import type { Rapport } from '../models/Rapport';

const TYPE_COLORS: Record<string, { bg: string; border: string; text: string }> = {
  Production:  { bg: '#EEF2FF', border: '#4F46E5', text: '#4F46E5' },
  Qualité:     { bg: '#ECFDF5', border: '#059669', text: '#059669' },
  Maintenance: { bg: '#FFFBEB', border: '#D97706', text: '#D97706' },
  Stock:       { bg: '#F5F3FF', border: '#7C3AED', text: '#7C3AED' },
};

const TYPE_ICONS: Record<string, string> = {
  Production: '🏭', Qualité: '✅', Maintenance: '🔧', Stock: '📦',
};

const STATUT_STYLE: Record<string, { bg: string; text: string }> = {
  'Envoyé':     { bg: '#ECFDF5', text: '#059669' },
  'Créé':       { bg: '#EEF2FF', text: '#4F46E5' },
  'En attente': { bg: '#FFFBEB', text: '#D97706' },
  'Brouillon':  { bg: '#F9FAFB', text: '#6B7280' },
};

const RapportDetailModal: React.FC<{
  rapport: Rapport | null;
  onClose: () => void;
  sequentialId?: number; // ✅ ID séquentiel du tableau
}> = ({ rapport, onClose, sequentialId }) => {
  if (!rapport) return null;

  const colors = TYPE_COLORS[rapport.type]    || TYPE_COLORS['Production'];
  const statut = STATUT_STYLE[rapport.statut] || { bg: '#F3F4F6', text: '#374151' };

  let options: { label: string; value: string }[] = [];
  if (rapport.optionsData) {
    try { options = JSON.parse(rapport.optionsData); } catch {}
  }

  const fmt = (d?: string | null) =>
    d ? new Date(d).toLocaleDateString('fr-FR') : '—';

  // ✅ Afficher l'ID séquentiel s'il est fourni, sinon l'ID réel
  const displayId = sequentialId && sequentialId > 0
    ? String(sequentialId).padStart(3, '0')
    : String(rapport.id).padStart(3, '0');

  return (
    <div onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div onClick={(e) => e.stopPropagation()}
        style={{ background: 'white', borderRadius: 20, width: 680, maxWidth: '96vw', maxHeight: '88vh', display: 'flex', flexDirection: 'column', boxShadow: '0 24px 64px rgba(0,0,0,0.18)', fontFamily: "'DM Sans', sans-serif", overflow: 'hidden' }}>

        {/* HEADER */}
        <div style={{ background: `linear-gradient(135deg, ${colors.border}, ${colors.border}bb)`, padding: '20px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>
              {TYPE_ICONS[rapport.type] || '📄'}
            </div>
            <div>
              <div style={{ fontSize: 16, fontWeight: 700, color: 'white' }}>{rapport.titre}</div>
              {/* ✅ ID cohérent avec le tableau */}
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.75)', marginTop: 3 }}>
                #RPT-{displayId} · {rapport.type} · {rapport.format}
              </div>
            </div>
          </div>
          <button onClick={onClose} style={{ width: 30, height: 30, borderRadius: 8, background: 'rgba(255,255,255,0.2)', border: '1px solid rgba(255,255,255,0.3)', color: 'white', cursor: 'pointer', fontSize: 14 }}>✕</button>
        </div>

        {/* BODY */}
        <div style={{ overflowY: 'auto', flex: 1, padding: 24 }}>

          {/* INFOS GÉNÉRALES */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 20 }}>
            {[
              { label: 'Statut',       value: rapport.statut,             badge: true  },
              { label: 'Format',       value: rapport.format,             badge: false },
              { label: 'Responsable',  value: rapport.responsable || '—', badge: false },
              { label: 'Date rapport', value: fmt(rapport.dateRapport),   badge: false },
            ].map((item) => (
              <div key={item.label} style={{ background: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: 10, padding: '12px 14px' }}>
                <div style={{ fontSize: 10.5, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 5 }}>
                  {item.label}
                </div>
                {item.badge
                  ? <span style={{ fontSize: 12, fontWeight: 600, padding: '3px 10px', borderRadius: 20, background: statut.bg, color: statut.text }}>● {item.value}</span>
                  : <div style={{ fontSize: 13, fontWeight: 500, color: '#111827' }}>{item.value}</div>}
              </div>
            ))}
          </div>

          {/* DESCRIPTION */}
          {rapport.contenu && (
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#374151', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 8 }}>
                📝 Description
              </div>
              <div style={{ background: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: 10, padding: '12px 16px', fontSize: 13, color: '#374151', lineHeight: 1.6 }}>
                {rapport.contenu}
              </div>
            </div>
          )}

          {/* OPTIONS */}
          {options.length > 0 && (
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#374151', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 8 }}>
                Détails du rapport
                <span style={{ background: colors.bg, color: colors.text, padding: '2px 9px', borderRadius: 20, fontSize: 11 }}>
                  {options.length} champs
                </span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {options.map((opt, i) => (
                  <div key={i} style={{ display: 'flex', background: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: 10, overflow: 'hidden' }}>
                    <div style={{ background: colors.bg, padding: '11px 14px', minWidth: 180, borderRight: `2px solid ${colors.border}25` }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: colors.text }}>{opt.label}</div>
                    </div>
                    <div style={{ padding: '11px 16px', fontSize: 13, color: opt.value ? '#111827' : '#9CA3AF', fontStyle: opt.value ? 'normal' : 'italic', flex: 1 }}>
                      {opt.value || 'Non renseigné'}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {options.length === 0 && !rapport.contenu && (
            <div style={{ textAlign: 'center', padding: '32px 0', color: '#9CA3AF' }}>
              <div style={{ fontSize: 40, marginBottom: 10 }}>📄</div>
              <div style={{ fontSize: 13 }}>Aucun détail disponible pour ce rapport</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RapportDetailModal;