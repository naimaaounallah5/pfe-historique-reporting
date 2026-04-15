import { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import * as signalR from '@microsoft/signalr'
import type { OrdreProduction } from '../models/OrdreProduction'
import OrdreService from '../services/ordre.service'

const ITEMS_PER_PAGE = 8
const HUB_URL = 'http://localhost:5088/hubs/production'

// ── Singleton SignalR hors React ─────────────────────────────
let _connection: signalR.HubConnection | null = null
let _connectionPromise: Promise<void> | null = null

function getConnection(): signalR.HubConnection {
  if (!_connection) {
    _connection = new signalR.HubConnectionBuilder()
      .withUrl(HUB_URL)
      .withAutomaticReconnect([0, 2000, 5000, 10000])
      .configureLogging(signalR.LogLevel.Warning)
      .build()
  }
  return _connection
}

async function startConnection(): Promise<void> {
  const conn = getConnection()
  if (conn.state === signalR.HubConnectionState.Connected) return
  if (conn.state === signalR.HubConnectionState.Connecting) return
  if (!_connectionPromise) {
    _connectionPromise = conn.start()
      .then(() => console.log('✅ Ordre Production - Connecté en temps réel'))
      .catch(err => console.error('❌ Ordre Production - Erreur connexion:', err))
      .finally(() => { _connectionPromise = null })
  }
  return _connectionPromise
}
// ─────────────────────────────────────────────────────────────

export const useOrdres = () => {
  const [ordres,       setOrdres]       = useState<OrdreProduction[]>([])
  const [loading,      setLoading]      = useState(true)
  const [error,        setError]        = useState('')
  const [search,       setSearch]       = useState('')
  const [filtreStatut, setFiltreStatut] = useState<number | undefined>(undefined)
  const [filtreSite,   setFiltreSite]   = useState('')
  const [page,         setPage]         = useState(1)

  const [connexionStatut, setConnexionStatut] = useState<'connecting' | 'connected' | 'disconnected'>('connecting')
  const [derniereMAJ,     setDerniereMAJ]     = useState<Date | null>(null)

  const charger = useCallback(async () => {
    try {
      setLoading(true)
      setError('')
      const data = await OrdreService.getAll(
        search || undefined,
        filtreStatut,
        filtreSite || undefined
      )
      setOrdres(data.sort((a, b) => a.id - b.id))
      setPage(1)
      setDerniereMAJ(new Date())
    } catch {
      setError('Erreur lors du chargement des ordres.')
    } finally {
      setLoading(false)
    }
  }, [search, filtreStatut, filtreSite])

  const chargerRef = useRef(charger)
  useEffect(() => {
    chargerRef.current = charger
  }, [charger])

  // ── SignalR ──────────────────────────────────────────────
  useEffect(() => {
    const conn = getConnection()

    conn.on('OrdresMisAJour', () => {
      console.log('📡 Ordre Production - Mise à jour reçue')
      chargerRef.current()
    })

    conn.onreconnecting(() => {
      console.log('🔄 Ordre Production - Reconnexion...')
      setConnexionStatut('connecting')
    })
    conn.onreconnected(() => {
      console.log('✅ Ordre Production - Reconnecté')
      setConnexionStatut('connected')
    })
    conn.onclose(() => {
      console.log('🔌 Ordre Production - Connexion fermée')
      setConnexionStatut('disconnected')
    })

    startConnection()
      .then(() => setConnexionStatut('connected'))
      .catch(() => setConnexionStatut('disconnected'))

    return () => {
      conn.off('OrdresMisAJour')
    }
  }, [])

  useEffect(() => { charger() }, [charger])

  const stats = useMemo(() => ({
    total:    ordres.length,
    simule:   ordres.filter(o => o.statut === 0).length,
    planifie: ordres.filter(o => o.statut === 1).length,
    enCours:  ordres.filter(o => o.statut === 2).length,
    termine:  ordres.filter(o => o.statut === 3).length,
  }), [ordres])

  const sitesDisponibles = useMemo(() =>
    [...new Set(ordres.map(o => o.codeSite).filter(Boolean))] as string[],
  [ordres])

  const totalPages = Math.ceil(ordres.length / ITEMS_PER_PAGE)
  const ordresPage = ordres.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE)

  // ✅ IMPRIMER TABLEAU - Version finale
  const imprimerTableau = async () => {
    // 1. Vérification tableau vide
    if (ordres.length === 0) {
      alert("📭 Aucun ordre à imprimer");
      return;
    }

    // 2. Demander le nombre de copies
    const copiesInput = prompt("🖨️ Nombre de copies à imprimer :", "1");
    if (copiesInput === null) return;
    
    const nbCopies = parseInt(copiesInput);
    if (isNaN(nbCopies) || nbCopies < 1) {
      alert("❌ Veuillez saisir un nombre valide (1 ou plus)");
      return;
    }

    try {
      // 3. Générer le PDF
      const params = new URLSearchParams()
      if (search) params.append('search', search)
      if (filtreStatut !== undefined) params.append('statut', String(filtreStatut))
      if (filtreSite) params.append('codeSite', filtreSite)

      const response = await fetch(
        `http://localhost:5088/api/ordresproduction/export-tableau-pdf?${params}`
      )
      
      if (!response.ok) throw new Error(`Erreur HTTP: ${response.status}`);
      
      const blob = await response.blob()
      const blobUrl = URL.createObjectURL(blob)
      
      // 4. Ouvrir le PDF et déclencher l'impression
      const win = window.open(blobUrl, '_blank');
      
      if (win) {
        win.onload = () => {
          setTimeout(() => {
            // Afficher la boîte d'impression
            win.print();
            
            // ✅ Afficher le message de confirmation immédiatement
            alert(`✅ Impression lancée !\n\n${nbCopies} copie(s) ont été envoyées à l'imprimante.`);
            
            // Fermer l'onglet après 2 secondes
            setTimeout(() => {
              win.close();
            }, 2000);
            
          }, 500);
        };
      } else {
        alert("❌ Veuillez autoriser les popups pour ce site.");
      }
      
      setTimeout(() => URL.revokeObjectURL(blobUrl), 10000);
      
    } catch (error) {
      console.error('❌ Erreur impression:', error)
      alert("❌ Erreur lors de la génération du PDF. Veuillez réessayer.");
    }
  }

  return {
    ordres: ordresPage,
    tousLesOrdres: ordres,
    loading, error, stats,
    search, setSearch,
    filtreStatut, setFiltreStatut,
    filtreSite, setFiltreSite,
    sitesDisponibles,
    page, setPage, totalPages,
    totalOrdres: ordres.length,
    connexionStatut,
    derniereMAJ,
    exportTableauPdf:   () => OrdreService.exportTableauPdf(search || undefined, filtreStatut, filtreSite || undefined),
    exportTableauExcel: () => OrdreService.exportTableauExcel(search || undefined, filtreStatut, filtreSite || undefined),
    imprimerTableau,
  }
}