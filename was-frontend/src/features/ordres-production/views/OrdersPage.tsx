import { useOrdres }      from '../viewmodels/useOrdres'
import { useOrdreDetail } from '../viewmodels/useOrdreDetail'
import OrdreDetailModal   from './OrdreDetailModal'
import { STATUT_LABELS, STATUT_COLORS, STATUT_BG } from '../models/OrdreProduction'
import * as signalR from '@microsoft/signalr'
import './OrdersPage.css'
import React from 'react'

// ── BtnIcon ───────────────────────────────────────────────────────
const BtnIcon: React.FC<{
  title: string;
  bg: string;
  border: string;
  onClick: () => void;
  children: React.ReactNode;
}> = ({ title, bg, border, onClick, children }) => (
  <button
    title={title}
    onClick={onClick}
    style={{
      width: 32, height: 32, minWidth: 32,
      borderRadius: 8, border: `1.5px solid ${border}`,
      background: bg, display: 'inline-flex',
      alignItems: 'center', justifyContent: 'center',
      cursor: 'pointer', flexShrink: 0, padding: 0,
      transition: 'all 0.18s ease',
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

// ── Imprimer ordre spécifique ─────────────────────────────────────
const imprimerOrdre = async (numero: string) => {
  const response = await fetch(`http://localhost:5088/api/ordresproduction/${numero}/export-pdf`)
  const blob     = await response.blob()
  const blobUrl  = URL.createObjectURL(blob)
  const iframe   = document.createElement('iframe')
  iframe.style.display = 'none'
  iframe.src = blobUrl
  document.body.appendChild(iframe)
  iframe.onload = () => {
    iframe.contentWindow?.print()
    setTimeout(() => {
      document.body.removeChild(iframe)
      URL.revokeObjectURL(blobUrl)
    }, 2000)
  }
}

export default function OrdersPage() {
  const vm                               = useOrdres()
  const { connexionStatut, derniereMAJ } = vm
  const detail                           = useOrdreDetail()

  return (
    <div className="ord-page">

      {/* ── HERO ─────────────────────────────────────────────── */}
      <div className="ord-hero">
        <div className="ord-hero-left">

          {/* Badge module + indicateur LIVE SignalR */}
          <div className="ord-hero-badge">
            <span
              className="ord-live-dot"
              style={{
                background: connexionStatut === 'connected'  ? '#22c55e'
                          : connexionStatut === 'connecting' ? '#f59e0b'
                          : '#ef4444',
              }}
            />
            Ordre Production

            {connexionStatut === 'connected' && (
              <span style={{
                marginLeft: 10,
                background: '#dcfce7', color: '#16a34a',
                padding: '2px 10px', borderRadius: 20,
                fontSize: 11, fontWeight: 700, letterSpacing: 1,
              }}>
                ● LIVE
              </span>
            )}

            {connexionStatut === 'connecting' && (
              <span style={{
                marginLeft: 10, color: '#f59e0b',
                fontSize: 11, fontWeight: 600,
              }}>
                ⟳ Connexion...
              </span>
            )}

            {connexionStatut === 'disconnected' && (
              <span style={{
                marginLeft: 10, color: '#ef4444',
                fontSize: 11, fontWeight: 600,
              }}>
                ⚠ Déconnecté
              </span>
            )}
          </div>

          <h1 className="ord-hero-title">Ordres de Production</h1>

          <p className="ord-hero-sub">
            Consultez, recherchez et exportez les ordres de fabrication
          </p>

          {/* Dernière mise à jour SignalR */}
          {derniereMAJ && (
            <p className="ord-hero-sub" style={{ marginTop: 4, fontSize: 11, opacity: 0.7 }}>
              Dernière mise à jour : {derniereMAJ.toLocaleTimeString('fr-FR')}
            </p>
          )}

        </div>

        <div className="ord-hero-actions">

          {/* 📥 Export PDF */}
          <button className="ord-btn primary" onClick={vm.exportTableauPdf}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 7 }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#1E3A5F" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14,2 14,8 20,8"/>
              <line x1="12" y1="18" x2="12" y2="12"/>
              <line x1="9"  y1="15" x2="15" y2="15"/>
            </svg>
            Export PDF
          </button>

          {/* 📊 Export Excel */}
          <button className="ord-btn secondary" onClick={vm.exportTableauExcel}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 7 }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14,2 14,8 20,8"/>
              <line x1="8"  y1="13" x2="16" y2="13"/>
              <line x1="8"  y1="17" x2="16" y2="17"/>
              <line x1="10" y1="9"  x2="14" y2="9"/>
            </svg>
            Export Excel
          </button>

          {/* 🖨 Imprimer */}
          <button className="ord-btn ghost" onClick={vm.imprimerTableau}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 7 }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.8)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="6,9 6,2 18,2 18,9"/>
              <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/>
              <rect x="6" y="14" width="12" height="8"/>
            </svg>
            Imprimer
          </button>

        </div>
      </div>{/* ← fermeture ord-hero ✅ */}

      {/* ── STATS ────────────────────────────────────────────── */}
      <div className="ord-stats">
        <div className="ord-stat-card blue">
          <div className="ord-stat-icon">📦</div>
          <div className="ord-stat-info">
            <div className="ord-stat-value">{vm.stats.total}</div>
            <div className="ord-stat-label">Total ordres</div>
          </div>
        </div>
        <div className="ord-stat-card amber">
          <div className="ord-stat-icon">⚙️</div>
          <div className="ord-stat-info">
            <div className="ord-stat-value">{vm.stats.enCours}</div>
            <div className="ord-stat-label">En cours</div>
          </div>
        </div>
        <div className="ord-stat-card green">
          <div className="ord-stat-icon">✅</div>
          <div className="ord-stat-info">
            <div className="ord-stat-value">{vm.stats.termine}</div>
            <div className="ord-stat-label">Terminés</div>
          </div>
        </div>
        <div className="ord-stat-card purple">
          <div className="ord-stat-icon">📅</div>
          <div className="ord-stat-info">
            <div className="ord-stat-value">{vm.stats.planifie}</div>
            <div className="ord-stat-label">Planifiés</div>
          </div>
        </div>
      </div>

      {/* ── FILTRES ──────────────────────────────────────────── */}
      <div className="ord-filters">
        <div className="ord-search-wrap">
          <span className="ord-search-icon">🔍</span>
          <input
            className="ord-search"
            type="text"
            placeholder="Rechercher par N° ordre, description, opérateur..."
            value={vm.search}
            onChange={e => vm.setSearch(e.target.value)}
          />
          {vm.search && (
            <button className="ord-search-clear" onClick={() => vm.setSearch('')}>✕</button>
          )}
        </div>

    <select className="ord-select"
    value={vm.filtreStatut ?? ''}
    onChange={e => vm.setFiltreStatut(
        e.target.value === '' ? undefined : Number(e.target.value)
    )}>
    <option value="">Tous les statuts</option>
    <option value="1">Planifié</option>
    <option value="2">En cours</option>
    <option value="3">Terminé</option>
 </select>

        <select className="ord-select"
          value={vm.filtreSite}
          onChange={e => vm.setFiltreSite(e.target.value)}>
          <option value="">Tous les sites</option>
          {vm.sitesDisponibles.map(s => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>

        <div className="ord-count">
          {vm.totalOrdres} ordre{vm.totalOrdres > 1 ? 's' : ''}
        </div>
      </div>

      {/* ── TABLEAU ──────────────────────────────────────────── */}
      <div className="ord-table-wrap">
        {vm.loading ? (
          <div className="ord-loading">⏳ Chargement...</div>
        ) : vm.error ? (
          <div className="ord-error">❌ {vm.error}</div>
        ) : vm.ordres.length === 0 ? (
          <div className="ord-empty-state">
            <div className="ord-empty-icon">📦</div>
            <div>Aucun ordre trouvé , essayez de modifier vos critères de recherche</div>
          </div>
        ) : (
          <table className="ord-main-table">
            <thead>
              <tr>
                <th>N° Ordre</th>
                <th>Description</th>
                <th>Opérateur</th>
                <th>Site</th>
                <th>Statut</th>
                <th>Quantité</th>
                <th>Date début</th>
                <th>Date fin</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {vm.ordres.map(ordre => (
                <tr key={ordre.id}>
                  {/* ← MODIFIÉ : affiche numero (ORD-001) */}
                  <td><span className="ord-numero">{ordre.numero}</span></td>
                  <td className="ord-desc">{ordre.description ?? '-'}</td>
                  <td>
                    <div className="ord-operateur">
                      <div className="ord-avatar">
                        {(ordre.operateurAssigne ?? 'U').charAt(0)}
                      </div>
                      {ordre.operateurAssigne ?? '-'}
                    </div>
                  </td>
                  <td><span className="ord-site-badge">{ordre.codeSite ?? '-'}</span></td>
                  <td>
                    <span className="ord-statut-badge"
                      style={{ color: STATUT_COLORS[ordre.statut], background: STATUT_BG[ordre.statut] }}>
                      ● {STATUT_LABELS[ordre.statut]}
                    </span>
                  </td>
                  <td className="ord-quantite">{ordre.quantite?.toLocaleString('fr-FR') ?? '-'}</td>
                  <td>{ordre.dateDebut ? new Date(ordre.dateDebut).toLocaleDateString('fr-FR') : '-'}</td>
                  <td>{ordre.dateFin   ? new Date(ordre.dateFin).toLocaleDateString('fr-FR')   : '-'}</td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>

                      {/* 👁 Détails — utilise ordre.numero pour la recherche backend */}
                      <BtnIcon title="Consulter les détails" bg="#F5F3FF" border="#DDD6FE"
                        onClick={() => detail.ouvrirDetail(ordre.numero)}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#7C3AED" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                          <circle cx="12" cy="12" r="3"/>
                        </svg>
                      </BtnIcon>

                      {/* 📄 Export PDF — utilise ordre.numero */}
                      <BtnIcon title="Exporter en PDF" bg="#FEF2F2" border="#FECACA"
                        onClick={() => window.open(`http://localhost:5088/api/ordresproduction/${ordre.numero}/export-pdf`, '_blank')}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#DC2626" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                          <polyline points="14,2 14,8 20,8"/>
                          <line x1="12" y1="18" x2="12" y2="12"/>
                          <line x1="9"  y1="15" x2="15" y2="15"/>
                        </svg>
                      </BtnIcon>

                      {/* 📊 Export Excel — utilise ordre.numero */}
                      <BtnIcon title="Exporter en Excel" bg="#ECFDF5" border="#A7F3D0"
                        onClick={() => window.open(`http://localhost:5088/api/ordresproduction/${ordre.numero}/export-excel`, '_blank')}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                          <polyline points="14,2 14,8 20,8"/>
                          <line x1="8"  y1="13" x2="16" y2="13"/>
                          <line x1="8"  y1="17" x2="16" y2="17"/>
                          <line x1="10" y1="9"  x2="14" y2="9"/>
                        </svg>
                      </BtnIcon>

                      {/* 🖨 Imprimer — utilise ordre.numero */}
                      <BtnIcon title="Imprimer" bg="#FFFBEB" border="#FDE68A"
                        onClick={() => imprimerOrdre(ordre.numero)}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#D97706" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="6,9 6,2 18,2 18,9"/>
                          <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/>
                          <rect x="6" y="14" width="12" height="8"/>
                        </svg>
                      </BtnIcon>

                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* ── PAGINATION ───────────────────────────────────────── */}
      {vm.totalPages > 1 && (
        <div className="ord-pagination">
          <button onClick={() => vm.setPage(p => Math.max(1, p - 1))} disabled={vm.page === 1}>
            ← Précédent
          </button>
          {Array.from({ length: vm.totalPages }, (_, i) => i + 1).map(p => (
            <button key={p}
              className={vm.page === p ? 'active' : ''}
              onClick={() => vm.setPage(p)}>
              {p}
            </button>
          ))}
          <button onClick={() => vm.setPage(p => Math.min(vm.totalPages, p + 1))} disabled={vm.page === vm.totalPages}>
            Suivant →
          </button>
        </div>
      )}

      {/* ── MODAL DETAIL ─────────────────────────────────────── */}
      <OrdreDetailModal vm={detail} />

    </div>
  )
}