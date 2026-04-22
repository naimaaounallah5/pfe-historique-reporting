import { STATUT_LABELS, STATUT_COLORS, STATUT_BG } from '../models/OrdreProduction'
import type { useOrdreDetail } from '../viewmodels/useOrdreDetail'

type Props = { vm: ReturnType<typeof useOrdreDetail> }

export default function OrdreDetailModal({ vm }: Props) {
  if (!vm.isOpen) return null

  const ordre = vm.detail?.ordre

  return (
    <div className="ord-overlay" onClick={vm.fermer}>
      <div className="ord-modal" onClick={e => e.stopPropagation()}>

        {/* ── Header ── */}
        <div className="ord-modal-header">
          <div style={{ flex: 1 }}>
      
            <h2 className="ord-modal-title">
              {vm.loading ? 'Chargement...' : `Ordre ${ordre?.numero ?? ''}`}
            </h2>
            {ordre && (
              <span className="ord-modal-statut"
                style={{ color: STATUT_COLORS[ordre.statut], background: STATUT_BG[ordre.statut] }}>
                ● {STATUT_LABELS[ordre.statut]}
              </span>
            )}
          </div>

          {/* ✅ Bouton fermer corrigé — directement dans le header sans wrapper */}
          <button
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              vm.fermer()
            }}
            style={{
              width: 36, height: 36,
              borderRadius: 9,
              border: '1.5px solid rgba(255,255,255,0.3)',
              background: 'rgba(255,255,255,0.15)',
              color: '#fff',
              fontSize: 16,
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              zIndex: 10,
              position: 'relative',
              transition: 'all 0.15s',
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLButtonElement).style.background = 'rgba(239,68,68,0.45)'
              ;(e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(239,68,68,0.6)'
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.15)'
              ;(e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(255,255,255,0.3)'
            }}
          >
            ✕
          </button>
        </div>

        {vm.loading ? (
          <div className="ord-loading">Chargement des données...</div>
        ) : !vm.detail ? (
          <div className="ord-loading">Ordre introuvable.</div>
        ) : (
          <>
            {/* ── Onglets ── */}
            <div className="ord-tabs">
              {(['infos', 'lignes', 'composants', 'operations'] as const).map(t => (
                <button key={t}
                  className={`ord-tab ${vm.onglet === t ? 'active' : ''}`}
                  onClick={() => vm.setOnglet(t)}>
                  {t === 'infos'      && `ℹ️ Informations`}
                  {t === 'lignes'     && `📋 Lignes (${vm.detail!.lignes.length})`}
                  {t === 'composants' && `🔩 Composants (${vm.detail!.composants.length})`}
                  {t === 'operations' && `⚙️ Opérations (${vm.detail!.operations.length})`}
                </button>
              ))}
            </div>

            {/* ── Contenu onglets ── */}
            <div className="ord-tab-content">

              {/* Onglet Infos */}
              {vm.onglet === 'infos' && ordre && (
                <div className="ord-infos-grid">
                  {[
                    ['N° Ordre',    ordre.numero],
                    ['Description', ordre.description ?? '-'],
                    ['Statut',      STATUT_LABELS[ordre.statut]],
                    ['Opérateur',   ordre.operateurAssigne ?? '-'],
                    ['Site',        ordre.codeSite ?? '-'],
                    ['Gamme',       ordre.numeroGamme ?? '-'],
                    ['Quantité',    ordre.quantite?.toLocaleString('fr-FR') ?? '-'],
                    ['Date début',  ordre.dateDebut  ? new Date(ordre.dateDebut).toLocaleDateString('fr-FR')  : '-'],
                    ['Date fin',    ordre.dateFin    ? new Date(ordre.dateFin).toLocaleDateString('fr-FR')    : '-'],
                    ['Date prévue', ordre.datePrevue ? new Date(ordre.datePrevue).toLocaleDateString('fr-FR') : '-'],
                  ].map(([label, value]) => (
                    <div key={label} className="ord-info-card">
                      <div className="ord-info-label">{label}</div>
                      <div className="ord-info-value">{value}</div>
                    </div>
                  ))}
                </div>
              )}

              {/* Onglet Lignes */}
              {vm.onglet === 'lignes' && (
                vm.detail!.lignes.length === 0 ? (
                  <div className="ord-empty">Aucune ligne pour cet ordre.</div>
                ) : (
                  <table className="ord-table">
                    <thead>
                      <tr>
                        <th>N° Ligne</th>
                        <th>Réf. Article</th>
                        <th>Description</th>
                        <th>U.M.</th>
                        <th>Quantité</th>
                        <th>Terminée</th>
                        <th>Restante</th>
                        <th>Taux rebut</th>
                      </tr>
                    </thead>
                    <tbody>
                      {vm.detail!.lignes.map(l => (
                        <tr key={l.id}>
                          <td>{l.numeroLigne ?? '-'}</td>
                          <td><span className="ord-ref">{l.referenceArticle ?? '-'}</span></td>
                          <td>{l.description ?? '-'}</td>
                          <td>{l.uniteMesure ?? '-'}</td>
                          <td>{l.quantite?.toLocaleString('fr-FR') ?? '-'}</td>
                          <td className="ord-success">{l.quantiteTerminee?.toLocaleString('fr-FR') ?? '-'}</td>
                          <td className="ord-warn">{l.quantiteRestante?.toLocaleString('fr-FR') ?? '-'}</td>
                          <td>{l.tauxRebut != null ? `${l.tauxRebut}%` : '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )
              )}

              {/* Onglet Composants */}
              {vm.onglet === 'composants' && (
                vm.detail!.composants.length === 0 ? (
                  <div className="ord-empty">Aucun composant pour cet ordre.</div>
                ) : (
                  <table className="ord-table">
                    <thead>
                      <tr>
                        <th style={{ minWidth: '140px', width: '140px' }}>Réf. Article</th>
                        <th>Description</th>
                        <th>U.M.</th>
                        <th>Quantité</th>
                        <th>Attendue</th>
                        <th>Restante</th>
                        <th>Taux rebut</th>
                        <th>Date besoin</th>
                      </tr>
                    </thead>
                    <tbody>
                      {vm.detail!.composants.map(c => (
                        <tr key={c.id}>
                          <td><span className="ord-ref">{c.referenceArticle ?? '-'}</span></td>
                          <td>{c.description ?? '-'}</td>
                          <td>{c.uniteMesure ?? '-'}</td>
                          <td>{c.quantite?.toLocaleString('fr-FR') ?? '-'}</td>
                          <td>{c.quantiteAttendue?.toLocaleString('fr-FR') ?? '-'}</td>
                          <td className="ord-warn">{c.quantiteRestante?.toLocaleString('fr-FR') ?? '-'}</td>
                          <td>{c.tauxRebut != null ? `${c.tauxRebut}%` : '-'}</td>
                          <td>{c.dateBesoin ? new Date(c.dateBesoin).toLocaleDateString('fr-FR') : '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )
              )}

              {/* Onglet Opérations */}
              {vm.onglet === 'operations' && (
                vm.detail!.operations.length === 0 ? (
                  <div className="ord-empty">Aucune opération pour cet ordre.</div>
                ) : (
                  <table className="ord-table">
                    <thead>
                      <tr>
                        <th>N° Op.</th>
                        <th>Description</th>
                        <th>Centre travail</th>
                    
                        <th>T. Réglage</th>
                        <th>T. Exécution</th>
                        <th>Date début</th>
                        <th>Date fin</th>
                      </tr>
                    </thead>
                    <tbody>
                      {vm.detail!.operations.map(op => (
                        <tr key={op.id}>
                          <td><span className="ord-ref">{op.numeroOperation ?? '-'}</span></td>
                          <td>{op.description ?? '-'}</td>
                          <td>{op.numeroCentreTravail ?? '-'}</td>
                          <td>{op.tempsReglage    != null ? `${op.tempsReglage} min`    : '-'}</td>
                          <td>{op.tempsExecution  != null ? `${op.tempsExecution} min`  : '-'}</td>
                          <td>{op.dateDebut ? new Date(op.dateDebut).toLocaleDateString('fr-FR') : '-'}</td>
                          <td>{op.dateFin   ? new Date(op.dateFin).toLocaleDateString('fr-FR')   : '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}