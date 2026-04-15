import './ReportsPage.css';
import React, { useState } from 'react';
import RapportService from '../services/rapport.service';

import { useRapports }      from '../viewmodels/useRapports';
import { useCreateRapport } from '../viewmodels/useCreateRapport';
import { useEmailModal }    from '../viewmodels/useEmailModal';
import CreateRapportModal   from './CreateRapportModal';
import RapportDetailModal   from './RapportDetailModal';
import type { Rapport, RapportStatut, RapportType } from '../models/Rapport';

const statutBadge: Record<RapportStatut, string> = {
  'Envoyé':     'r-badge sent',
  'Créé':       'r-badge created',
  'En attente': 'r-badge pending',
  'Brouillon':  'r-badge draft',
};
const typeDot: Record<RapportType, string> = {
  'Production':  'r-type-dot r-dot-prod',
  'Qualité':     'r-type-dot r-dot-qual',
  'Maintenance': 'r-type-dot r-dot-maint',
  'Stock':       'r-type-dot r-dot-stock',
};
const fileIcon = (name: string) => {
  const ext = name.split('.').pop()?.toLowerCase();
  if (ext === 'pdf') return '📕';
  if (ext === 'xlsx' || ext === 'xls') return '📗';
  if (ext === 'docx') return '📘';
  return '📄';
};
const formatSize = (bytes: number) => {
  if (bytes < 1024) return `${bytes} o`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} Ko`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
};
const AVATAR_COLORS = [
  'linear-gradient(135deg,#4F46E5,#7C3AED)',
  'linear-gradient(135deg,#059669,#047857)',
  'linear-gradient(135deg,#D97706,#B45309)',
  'linear-gradient(135deg,#7C3AED,#6D28D9)',
  'linear-gradient(135deg,#DC2626,#B91C1C)',
];

const BtnIcon: React.FC<{
  title: string; bg: string; border: string;
  onClick: () => void; children: React.ReactNode;
}> = ({ title, bg, border, onClick, children }) => (
  <button title={title} onClick={onClick}
    style={{
      width: 32, height: 32, minWidth: 32, borderRadius: 8,
      border: `1.5px solid ${border}`, background: bg,
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      cursor: 'pointer', flexShrink: 0, padding: 0, transition: 'all 0.18s ease',
    }}
    onMouseEnter={e => {
      (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-1px)';
      (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 3px 8px rgba(0,0,0,0.15)';
    }}
    onMouseLeave={e => {
      (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(0)';
      (e.currentTarget as HTMLButtonElement).style.boxShadow = 'none';
    }}
  >
    {children}
  </button>
);

const ToastWarning: React.FC<{ message: string; onClose: () => void }> = ({ message, onClose }) => {
  React.useEffect(() => {
    const timer = setTimeout(onClose, 5000);
    return () => clearTimeout(timer);
  }, [onClose]);
  return (
    <div style={{
      position: 'fixed', bottom: 20, right: 20, zIndex: 1000,
      backgroundColor: '#fef3c7', borderLeft: '4px solid #f59e0b',
      borderRadius: 8, padding: '12px 20px',
      boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
      display: 'flex', alignItems: 'center', gap: 10,
      animation: 'slideIn 0.3s ease-out'
    }}>
      <span style={{ fontSize: 20 }}>⚠️</span>
      <span style={{ color: '#b45309', fontWeight: 500 }}>{message}</span>
      <button onClick={onClose} style={{
        background: 'none', border: 'none', cursor: 'pointer',
        color: '#b45309', fontSize: 16, marginLeft: 10
      }}>✕</button>
    </div>
  );
};

// ✅ EmailModal LOCAL avec ID corrigé
const EmailModal: React.FC<{ vm: ReturnType<typeof useEmailModal> }> = ({ vm }) => {
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  if (!vm.isOpen) return null;
  const rapport = vm.rapportSelectionne!;

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if ((e.key === 'Enter' || e.key === ',') && vm.searchQuery.trim()) {
      e.preventDefault(); vm.addDestinataire(vm.searchQuery.trim());
    }
    if (e.key === 'Backspace' && !vm.searchQuery && vm.destinataires.length > 0)
      vm.removeDestinataire(vm.destinataires[vm.destinataires.length - 1].email);
  };

  return (
    <div className="modal-overlay open"
      onClick={(e) => { if (e.target === e.currentTarget) vm.closeModal(); }}>
      <div className="r-email-modal" onClick={(e) => e.stopPropagation()}>
        <div className="r-email-hdr">
          <div>
            <div className="r-email-hdr-title">✉ Envoyer le rapport</div>
          </div>
          <button className="r-close-x" onClick={vm.closeModal}>✕</button>
        </div>
        {vm.success ? (
          <div className="r-success-scr" style={{ display: 'flex' }}>
            <div className="r-success-ico">✅</div>
            <div className="r-success-ttl">Rapport envoyé avec succès !</div>
            <div className="r-success-sub"><strong>{rapport.titre}</strong> a bien été envoyé à :</div>
            <div className="r-success-tags">
              {vm.destinataires.map((d) => <span key={d.email} className="r-rtag">{d.nom}</span>)}
            </div>
          </div>
        ) : (
          <>
            <div className="r-rpt-info-box">
              <div className="r-rpt-info-ico">📄</div>
              <div>
                <div className="r-rpt-info-name">{rapport.titre}</div>
                {/* ✅ CORRIGÉ — ID cohérent avec le tableau */}
                <div className="r-rpt-info-meta">
                  #RPT-{String(vm.seqId > 0 ? vm.seqId : rapport.id).padStart(3,'0')} · {rapport.type} · {rapport.format}
                </div>
              </div>
            </div>
            <div className="r-email-body">
              <label className="r-field-lbl">Destinataires *</label>
              <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                <input id="r-tag-input" className="r-form-input" type="email"
                  placeholder="Ex: contact@gmail.com"
                  value={vm.searchQuery}
                  onChange={(e) => vm.setSearchQuery(e.target.value)}
                  onKeyDown={handleKeyDown} style={{ flex: 1 }} />
                <button className="r-btn primary"
                  onClick={() => vm.addDestinataire(vm.searchQuery.trim())}
                  disabled={!vm.searchQuery.trim()}>＋ Ajouter</button>
              </div>
              {vm.destinataires.length > 0 && (
                <div className="r-recipients-box" style={{ marginBottom: 8 }}>
                  {vm.destinataires.map((d) => (
                    <span key={d.email} className="r-rtag">
                      {d.nom}
                      <span className="r-rtag-x" onClick={() => vm.removeDestinataire(d.email)}>✕</span>
                    </span>
                  ))}
                </div>
              )}
              {vm.suggestionsFiltrees.length > 0 && (
                <div className="r-sugg-box">
                  <div className="r-sugg-lbl">Administrateurs disponibles</div>
                  {vm.suggestionsFiltrees.map((admin, i) => (
                    <div key={admin.email} className="r-sugg-row"
                      onClick={() => vm.addDestinataire(admin.email, admin.nom)}>
                      <div className="r-sugg-av" style={{ background: AVATAR_COLORS[i % AVATAR_COLORS.length] }}>
                        {admin.initiales}
                      </div>
                      <div>
                        <div className="r-sugg-name">{admin.nom}</div>
                        <div className="r-sugg-email">{admin.email}</div>
                      </div>
                      <span className="r-sugg-role">Administrateur</span>
                    </div>
                  ))}
                </div>
              )}
              <label className="r-field-lbl">Objet de l'email *</label>
              <input className="r-form-input" type="text" placeholder="Objet de l'email…"
                value={vm.sujet} onChange={(e) => vm.setSujet(e.target.value)} />
              <label className="r-field-lbl">Message (optionnel)</label>
              <textarea className="r-email-ta"
                placeholder={"Bonjour,\n\nVeuillez trouver ci-joint le rapport…"}
                value={vm.message} onChange={(e) => vm.setMessage(e.target.value)} maxLength={500} />
              <div className="r-char-ct">{vm.message.length} / 500</div>
              <label className="r-field-lbl">Pièce jointe (optionnel)</label>
              {vm.pieceJointe ? (
                <div className="r-file-preview show">
                  <div className={`r-file-prev-ico ${vm.pieceJointe.name.endsWith('.pdf') ? 'pdf' : vm.pieceJointe.name.endsWith('.xlsx') ? 'xlsx' : 'other'}`}>
                    {fileIcon(vm.pieceJointe.name)}
                  </div>
                  <div>
                    <div className="r-file-prev-name">{vm.pieceJointe.name}</div>
                    <div className="r-file-prev-size">{formatSize(vm.pieceJointe.size)}</div>
                  </div>
                  <div className="r-file-remove" onClick={vm.removePieceJointe}>✕</div>
                </div>
              ) : (
                <div className="r-file-zone"
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => { e.preventDefault(); if (e.dataTransfer.files[0]) vm.setPieceJointe(e.dataTransfer.files[0]); }}
                  onClick={() => fileInputRef.current?.click()}>
                  <input ref={fileInputRef} type="file" style={{ display: 'none' }}
                    accept=".pdf,.xlsx,.xls,.docx,.csv"
                    onChange={(e) => { if (e.target.files?.[0]) vm.setPieceJointe(e.target.files[0]); }} />
                  <div className="r-file-ico">📎</div>
                  <div>
                    <div className="r-file-text">Glissez un fichier ici ou{' '}
                      <span style={{ color: '#4F46E5', fontWeight: 600 }}>parcourir</span></div>
                    <div className="r-file-hint">PDF, Excel, Word, CSV — Max 10 Mo</div>
                  </div>
                </div>
              )}
              {vm.error && <div className="r-alert-error" style={{ marginTop: 12 }}>⚠ {vm.error}</div>}
            </div>
            <div className="r-email-ftr">
              <div className="r-email-ftr-info">
                {vm.pieceJointe
                  ? <span style={{ color: '#4F46E5' }}>📎 {vm.pieceJointe.name} ({formatSize(vm.pieceJointe.size)})</span>
                  : <span>📎 Aucune pièce jointe</span>}
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <button className="r-btn" onClick={vm.closeModal}>Annuler</button>
                <button className="r-send-btn" onClick={vm.envoyer}
                  disabled={vm.loading || vm.destinataires.length === 0}>
                  {vm.loading ? '⏳ Envoi…' : '📨 Envoyer'}
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

// ── PAGE PRINCIPALE ──────────────────────────────────────────
const ReportsPage: React.FC = () => {
  const rapportsVM = useRapports();
  const createVM   = useCreateRapport(() => rapportsVM.refresh());
  const emailVM    = useEmailModal();
  const [rapportDetail, setRapportDetail] = useState<{ rapport: Rapport; index: number } | null>(null);

  const { rapportsPage, filtre, setFiltre, page, totalPages, goToPage, stats, loading, error, exportWarning } = rapportsVM;
  const { connexionStatut, derniereMAJ } = rapportsVM;

  const handleDelete = (r: Rapport) => {
    if (window.confirm(`Supprimer "${r.titre}" ?`)) rapportsVM.deleteRapport(r.id);
  };

  return (
    <div className="reports-page">

      {exportWarning && (
        <ToastWarning
          message={exportWarning}
          onClose={() => rapportsVM.exportWarning = null}
        />
      )}

      {/* ── HERO ── */}
      <div className="reports-hero">
        <div>
          <div className="hero-badges">
            <span className="hero-badge module">
              <span className="hero-badge-dot" />
              GÉNÉRATEUR DE RAPPORT
              <span className="hero-badge-live"
                style={{
                  background: connexionStatut === 'connected'  ? '#10b981'
                            : connexionStatut === 'connecting' ? '#f59e0b'
                            : '#ef4444',
                }}>
                <span className={`hero-live-dot${connexionStatut === 'connected' ? ' blink' : ''}`} />
                {connexionStatut === 'connected'   ? 'LIVE'
               : connexionStatut === 'connecting' ? 'Connexion...'
               : 'Déconnecté'}
              </span>
            </span>
          </div>
          <div className="hero-title">📄 Gérer les rapports</div>
          <div className="hero-sub">Créer, consulter, télécharger et envoyer des rapports</div>
          {derniereMAJ && (
            <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.5)', marginTop: '6px' }}>
              Dernière mise à jour : {derniereMAJ.toLocaleTimeString('fr-FR')}
            </div>
          )}
        </div>
        <div className="hero-actions">
          <button className="hero-btn white" onClick={createVM.openModal}>＋ Créer un rapport</button>
        </div>
      </div>

      {/* ── STATS ── */}
      <div className="r-stats-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
        <div className="r-stat-card" style={{ padding: '2rem 2.5rem' }}>
          <div className="r-stat-label" style={{ fontSize: '0.95rem' }}>Total rapports</div>
          <div className="r-stat-value blue" style={{ fontSize: '3rem' }}>{stats.total}</div>
          <div className="r-stat-sub">Tous les rapports</div>
        </div>
        <div className="r-stat-card" style={{ padding: '2rem 2.5rem' }}>
          <div className="r-stat-label" style={{ fontSize: '0.95rem' }}>Envoyés</div>
          <div className="r-stat-value green" style={{ fontSize: '3rem' }}>{stats.envoyes}</div>
          <div className="r-stat-sub">Envoyés par email</div>
        </div>
      </div>

      {/* ── MAIN CARD ── */}
      <div className="r-main-card">
        <div className="r-card-header">
          <div className="r-card-title-wrap">
            <div className="r-card-icon">📄</div>
            <div className="r-card-title">Liste des rapports</div>
            <span className="r-count-badge">{rapportsVM.rapportsFiltres.length} rapports</span>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="r-btn" onClick={() => rapportsVM.exportAll('PDF')}>📥 Exporter PDF</button>
            <button className="r-btn" onClick={() => rapportsVM.exportAll('Excel')}>📊 Exporter CSV</button>
          </div>
        </div>

        <div className="r-toolbar">
          <div className="r-search-wrap">
            <span className="r-search-icon">🔍</span>
            <input className="r-search-input" type="text"
              placeholder="Rechercher un rapport…"
              value={filtre.search}
              onChange={(e) => setFiltre({ search: e.target.value })} />
          </div>
          <select className="r-filter-select" value={filtre.type}
            onChange={(e) => setFiltre({ type: e.target.value as any })}>
            <option value="">Tous les types</option>
            <option value="Production">Production</option>
            <option value="Qualité">Qualité</option>
            <option value="Maintenance">Maintenance</option>
            <option value="Stock">Stock</option>
          </select>
          <select className="r-filter-select" value={filtre.statut}
            onChange={(e) => setFiltre({ statut: e.target.value as any })}>
            <option value="">Tous les statuts</option>
            <option value="Créé">Créé</option>
            <option value="Envoyé">Envoyé</option>
          </select>
          <select className="r-filter-select" value={filtre.format}
            onChange={(e) => setFiltre({ format: e.target.value as any })}>
            <option value="">Format : Tous</option>
            <option value="PDF">PDF</option>
            <option value="Excel">Excel</option>
          </select>
        </div>

        {error && <div className="r-alert-error" style={{ margin: '12px 20px' }}>⚠ {error}</div>}

        <div className="r-table-wrap">
          {loading ? (
            <div className="r-empty">
              <div className="r-empty-icon">⏳</div>
              <div className="r-empty-text">Chargement…</div>
            </div>
          ) : rapportsPage.length === 0 ? (
            <div className="r-empty">
              <div className="r-empty-icon">📭</div>
              <div className="r-empty-text">Aucun rapport trouvé.</div>
            </div>
          ) : (
            <table className="r-table">
              <thead>
                <tr>
                  <th>ID</th><th>Titre</th><th>Type</th>
                  <th>Date création</th><th>Format</th><th>Statut</th><th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {rapportsPage.map((r, index) => {
                  const seqId = (page - 1) * 8 + index + 1;
                  return (
                    <tr key={r.id}>
                      <td>
                        <span className="r-mono">
                          #RPT-{String(seqId).padStart(3,'0')}
                        </span>
                      </td>
                      <td className="r-primary">{r.titre}</td>
                      <td>
                        <span className="r-type-icon">
                          <span className={typeDot[r.type]}></span>{r.type}
                        </span>
                      </td>
                      <td>{new Date(r.dateCreation).toLocaleDateString('fr-FR')}</td>
                      <td><span className="r-mono">{r.format}</span></td>
                      <td><span className={statutBadge[r.statut]}>● {r.statut}</span></td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>

                          <BtnIcon title="Consulter" bg="#F5F3FF" border="#DDD6FE"
                            onClick={() => setRapportDetail({ rapport: r, index: seqId })}>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#7C3AED" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                              <circle cx="12" cy="12" r="3"/>
                            </svg>
                          </BtnIcon>

                          <BtnIcon title="Télécharger PDF" bg="#FEF2F2" border="#FECACA"
                            onClick={() => RapportService.downloadPdf(r.id, seqId)}>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#DC2626" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                              <polyline points="14,2 14,8 20,8"/>
                              <line x1="12" y1="18" x2="12" y2="12"/>
                              <line x1="9" y1="15" x2="15" y2="15"/>
                            </svg>
                          </BtnIcon>

                          <BtnIcon title="Télécharger Excel" bg="#ECFDF5" border="#A7F3D0"
                            onClick={() => RapportService.downloadCsv(r.id, seqId)}>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                              <polyline points="14,2 14,8 20,8"/>
                              <line x1="8" y1="13" x2="16" y2="13"/>
                              <line x1="8" y1="17" x2="16" y2="17"/>
                              <line x1="10" y1="9" x2="14" y2="9"/>
                            </svg>
                          </BtnIcon>

                          {/* ✅ Email — passer seqId */}
                          <BtnIcon title="Envoyer par email" bg="#EEF2FF" border="#C7D2FE"
                            onClick={() => emailVM.openModal(r, seqId)}>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#4F46E5" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                              <polyline points="22,6 12,13 2,6"/>
                            </svg>
                          </BtnIcon>

                          <BtnIcon title="Imprimer" bg="#FFFBEB" border="#FDE68A"
                            onClick={() => RapportService.imprimer(r.id, seqId)}>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#D97706" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="6,9 6,2 18,2 18,9"/>
                              <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/>
                              <rect x="6" y="14" width="12" height="8"/>
                            </svg>
                          </BtnIcon>

                          <BtnIcon title="Supprimer" bg="#FEF2F2" border="#FECACA"
                            onClick={() => handleDelete(r)}>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#DC2626" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="3,6 5,6 21,6"/>
                              <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                              <path d="M10 11v6"/><path d="M14 11v6"/>
                              <path d="M9 6V4h6v2"/>
                            </svg>
                          </BtnIcon>

                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        <div className="r-pagination">
          <span>
            Affichage {rapportsVM.rapportsFiltres.length === 0 ? 0 : (page-1)*8+1}–
            {Math.min(page*8, rapportsVM.rapportsFiltres.length)} sur {rapportsVM.rapportsFiltres.length} rapports
          </span>
          <div className="r-page-btns">
            <button className="r-page-btn" onClick={() => goToPage(Math.max(1,page-1))}>‹</button>
            {Array.from({ length: totalPages }, (_,i) => i+1).map((p) => (
              <button key={p} className={`r-page-btn${p===page?' active':''}`} onClick={() => goToPage(p)}>{p}</button>
            ))}
            <button className="r-page-btn" onClick={() => goToPage(Math.min(totalPages,page+1))}>›</button>
          </div>
        </div>
      </div>

      <CreateRapportModal vm={createVM} />
      <EmailModal vm={emailVM} />
      <RapportDetailModal
        rapport={rapportDetail?.rapport ?? null}
        sequentialId={rapportDetail?.index ?? 0}
        onClose={() => setRapportDetail(null)}
      />
    </div>
  );
};

export default ReportsPage;