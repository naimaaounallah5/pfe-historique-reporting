import React, { useRef } from 'react';
import type { useEmailModal } from '../viewmodels/useEmailModal';

type EmailModalVM = ReturnType<typeof useEmailModal>;
interface Props { vm: EmailModalVM; }

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
  'linear-gradient(135deg,#4F8EF7,#7C3AED)',
  'linear-gradient(135deg,#22C55E,#059669)',
  'linear-gradient(135deg,#F59E0B,#D97706)',
  'linear-gradient(135deg,#A78BFA,#7C3AED)',
  'linear-gradient(135deg,#EF4444,#DC2626)',
];

const EmailModal: React.FC<Props> = ({ vm }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  if (!vm.isOpen) return null;
  const rapport = vm.rapportSelectionne!;

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if ((e.key === 'Enter' || e.key === ',') && vm.searchQuery.trim()) {
      e.preventDefault();
      vm.addDestinataire(vm.searchQuery.trim());
    }
    if (e.key === 'Backspace' && !vm.searchQuery && vm.destinataires.length > 0)
      vm.removeDestinataire(vm.destinataires[vm.destinataires.length - 1].email);
  };

  return (
    <div className="modal-overlay open"
      onClick={(e) => { if (e.target === e.currentTarget) vm.closeModal(); }}>
      <div className="email-modal" onClick={(e) => e.stopPropagation()}>

        {/* HEADER */}
        <div className="email-hdr">
          <div>
            <div className="email-hdr-title">✉ Envoyer le rapport</div>
            <div className="email-hdr-sub">Choisissez les destinataires et rédigez votre message</div>
          </div>
          <button className="close-x" onClick={vm.closeModal}>✕</button>
        </div>

        {/* SUCCESS */}
        {vm.success ? (
          <div className="success-scr" style={{ display:'flex' }}>
            <div className="success-ico">✅</div>
            <div className="success-ttl">Rapport envoyé avec succès !</div>
            <div className="success-sub">
              Le rapport <strong>{rapport.titre}</strong> a bien été envoyé à :
            </div>
            <div className="success-recipients">
              {vm.destinataires.map((d) => (
                <span key={d.email} className="rtag">{d.nom}</span>
              ))}
            </div>
            <button className="btn btn-ghost" style={{ marginTop:20 }} onClick={vm.closeModal}>
              Fermer
            </button>
          </div>
        ) : (
          <>
            {/* INFO RAPPORT */}
            <div className="rpt-info-box">
              <div className="rpt-info-ico">📄</div>
              <div>
                <div className="rpt-info-name">{rapport.titre}</div>
<div className="r-rpt-info-meta">
  #RPT-{String(vm.seqId > 0 ? vm.seqId : rapport.id).padStart(3,'0')} · {rapport.type} · {rapport.format}
</div>           
  </div>
            </div>

            <div className="email-body">

              {/* DESTINATAIRES */}
              <label className="field-lbl">Destinataires *</label>
              <div className="recipients-box"
                onClick={() => document.getElementById('tag-input')?.focus()}>
                {vm.destinataires.map((d) => (
                  <span key={d.email} className="rtag">
                    {d.nom}
                    <span className="rtag-x" onClick={() => vm.removeDestinataire(d.email)}>✕</span>
                  </span>
                ))}
                <input id="tag-input" className="rtag-inp" type="text"
                  placeholder={vm.destinataires.length === 0
                    ? 'Tapez un email ou cherchez un administrateur…' : 'Ajouter…'}
                  value={vm.searchQuery}
                  onChange={(e) => vm.setSearchQuery(e.target.value)}
                  onKeyDown={handleKeyDown} />
              </div>

              {/* SUGGESTIONS */}
              {vm.suggestionsFiltrees.length > 0 && (
                <div className="sugg-box">
                  <div className="sugg-lbl">Administrateurs disponibles</div>
                  {vm.suggestionsFiltrees.map((admin, i) => (
                    <div key={admin.email} className="sugg-row"
                      onClick={() => vm.addDestinataire(admin.email, admin.nom)}>
                      <div className="sugg-av"
                        style={{ background: AVATAR_COLORS[i % AVATAR_COLORS.length] }}>
                        {admin.initiales}
                      </div>
                      <div>
                        <div className="sugg-name">{admin.nom}</div>
                        <div className="sugg-email">{admin.email}</div>
                      </div>
                      <span className="sugg-role">Administrateur</span>
                    </div>
                  ))}
                </div>
              )}

              {/* OBJET */}
              <label className="field-lbl">Objet de l'email *</label>
              <input className="form-input" type="text"
                placeholder="Objet de l'email…"
                value={vm.sujet}
                onChange={(e) => vm.setSujet(e.target.value)} />

              {/* MESSAGE */}
              <label className="field-lbl">Message (optionnel)</label>
              <textarea className="email-ta"
                placeholder={"Bonjour,\n\nVeuillez trouver ci-joint le rapport…"}
                value={vm.message}
                onChange={(e) => vm.setMessage(e.target.value)}
                maxLength={500} />
              <div className="char-ct">{vm.message.length} / 500</div>

              {/* PIECE JOINTE */}
              <label className="field-lbl">Pièce jointe (optionnel)</label>
              {vm.pieceJointe ? (
                <div className="file-preview show">
                  <div className={`file-preview-ico ${
                    vm.pieceJointe.name.endsWith('.pdf') ? 'pdf' :
                    vm.pieceJointe.name.endsWith('.xlsx') ? 'xlsx' : 'other'}`}>
                    {fileIcon(vm.pieceJointe.name)}
                  </div>
                  <div>
                    <div className="file-preview-name">{vm.pieceJointe.name}</div>
                    <div className="file-preview-size">{formatSize(vm.pieceJointe.size)}</div>
                  </div>
                  <div className="file-remove" onClick={vm.removePieceJointe}>✕</div>
                </div>
              ) : (
                <div className="file-upload-zone"
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    if (e.dataTransfer.files[0]) vm.setPieceJointe(e.dataTransfer.files[0]);
                  }}
                  onClick={() => fileInputRef.current?.click()}>
                  <input ref={fileInputRef} type="file" style={{ display:'none' }}
                    accept=".pdf,.xlsx,.xls,.docx,.csv"
                    onChange={(e) => {
                      if (e.target.files?.[0]) vm.setPieceJointe(e.target.files[0]);
                    }} />
                  <div className="file-upload-ico">📎</div>
                  <div>
                    <div className="file-upload-text">
                      Glissez un fichier ici ou{' '}
                      <span style={{ color:'var(--accent)', fontWeight:600 }}>parcourir</span>
                    </div>
                    <div className="file-upload-hint">PDF, Excel, Word, CSV — Max 10 Mo</div>
                  </div>
                </div>
              )}

              {vm.error && (
                <div style={{ marginTop:12, padding:'10px 14px', borderRadius:8,
                  background:'rgba(239,68,68,0.1)', border:'1px solid rgba(239,68,68,0.3)',
                  color:'#EF4444', fontSize:13 }}>⚠ {vm.error}</div>
              )}
            </div>

            {/* FOOTER */}
            <div className="email-ftr">
              <div className="email-ftr-info">
                {vm.pieceJointe
                  ? <span style={{ color:'var(--accent)' }}>📎 {vm.pieceJointe.name} ({formatSize(vm.pieceJointe.size)})</span>
                  : <span>📎 Aucune pièce jointe</span>}
              </div>
              <div style={{ display:'flex', gap:10 }}>
                <button className="btn btn-ghost btn-sm" onClick={vm.closeModal}>Annuler</button>
                {/* BOUTON CORRIGÉ */}
                <button 
                  className="r-send-btn" 
                  onClick={vm.envoyer}
                  disabled={vm.loading || vm.destinataires.length === 0}
                >
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

export default EmailModal;