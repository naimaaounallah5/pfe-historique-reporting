// ============================================================
//  historique.viewmodel.ts — Logique + appels API + SignalR
//  ✅ CORRIGÉ : fetchCentres dédié (tous les centres, sans pagination)
// ============================================================

import { useState, useCallback, useEffect, useRef } from "react";
import * as signalR from "@microsoft/signalr";
import type {
  SourceType, HistoriqueQueryParams, HistoriquePageResult,
  HistoriqueItem
} from "../models/historique.model";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5088/api";
const HUB_URL      = "http://localhost:5088/hubs/dashboard";

let _connection: signalR.HubConnection | null = null;
let _connectionPromise: Promise<void> | null  = null;

function getConnection(): signalR.HubConnection {
  if (!_connection) {
    _connection = new signalR.HubConnectionBuilder()
      .withUrl(HUB_URL)
      .withAutomaticReconnect([0, 2000, 5000, 10000, 30000])
      .configureLogging(signalR.LogLevel.Warning)
      .build();
  }
  return _connection;
}

async function startConnection(): Promise<void> {
  const conn = getConnection();
  if (conn.state === signalR.HubConnectionState.Connected)  return;
  if (conn.state === signalR.HubConnectionState.Connecting) return;
  if (!_connectionPromise) {
    _connectionPromise = conn.start()
      .then(()    => console.log("✅ Historique - Connecté en temps réel"))
      .catch(err  => console.error("❌ Historique - Erreur connexion:", err))
      .finally(() => { _connectionPromise = null; });
  }
  return _connectionPromise;
}

export const useHistoriqueViewModel = () => {

  const [source, setSource] = useState<SourceType>("scada");

  const [donnees,     setDonnees]     = useState<HistoriqueItem[]>([]);
  const [totalLignes, setTotalLignes] = useState(0);
  const [totalPages,  setTotalPages]  = useState(0);

  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState<string | null>(null);
  const [vueMode, setVueMode] = useState<"cartes" | "tableau">("cartes");

  const [connexionStatut, setConnexionStatut] =
    useState<"connecting" | "connected" | "disconnected">("connecting");
  const [derniereMAJ, setDerniereMAJ] = useState<Date | null>(null);

  const [detailOuvert,       setDetailOuvert]       = useState(false);
  const [elementSelectionne, setElementSelectionne] = useState<HistoriqueItem | null>(null);

  // ── Liste dynamique des centres de travail ────────────────
  const [centresTravail, setCentresTravail] = useState<string[]>([]);

  const [params, setParams] = useState<HistoriqueQueryParams>({
    page: 1, pageSize: 6
  });

  // ── ✅ Fetch TOUS les centres de travail (appel dédié sans pagination) ──
  const fetchCentres = useCallback(async () => {
    if (source !== 'scada') return;
    try {
      const res = await fetch(
        `${API_BASE_URL}/historique/scada?page=1&pageSize=9999`
      );
      if (!res.ok) return;
      const data: HistoriquePageResult<HistoriqueItem> = await res.json();
      const centres = [...new Set(
        (data.donnees as any[]).map((d: any) => d.nomMachine).filter(Boolean)
      )].sort();
      setCentresTravail(centres);
    } catch {
      // silencieux — ne bloque pas l'UI
    }
  }, [source]);

  // ── Fetch données (page courante uniquement) ──────────────
  const fetchDonnees = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const query = new URLSearchParams();
      if (params.recherche)     query.append("recherche",     params.recherche);
      if (params.statut)        query.append("statut",        params.statut);
      if (params.dateDebut)     query.append("dateDebut",     params.dateDebut);
      if (params.dateFin)       query.append("dateFin",       params.dateFin);
      if (params.centreTravail) query.append("centreTravail", params.centreTravail);
      query.append("page",     String(params.page));
      query.append("pageSize", String(params.pageSize));

      const url      = `${API_BASE_URL}/historique/${source}?${query.toString()}`;
      const response = await fetch(url);
      if (!response.ok) throw new Error(`Erreur API : ${response.status}`);

      const data: HistoriquePageResult<HistoriqueItem> = await response.json();
      setDonnees(data.donnees);
      setTotalLignes(data.totalLignes);
      setTotalPages(data.totalPages);
      setDerniereMAJ(new Date());

      // ✅ SUPPRIMÉ : extraction centres depuis la page courante
      // Les centres sont maintenant chargés via fetchCentres (toutes les données)

    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue");
    } finally {
      setLoading(false);
    }
  }, [source, params]);

  const fetchRef = useRef(fetchDonnees);
  useEffect(() => { fetchRef.current = fetchDonnees; }, [fetchDonnees]);

  // ── Charger les données à chaque changement de params/source ──
  useEffect(() => { fetchDonnees(); }, [fetchDonnees]);

  // ── ✅ Charger TOUS les centres dès que la source est SCADA ──
  useEffect(() => { fetchCentres(); }, [fetchCentres]);

  // ── SignalR temps réel ────────────────────────────────────
  useEffect(() => {
    const conn = getConnection();

    conn.on("HistoriqueMisAJour", () => {
      fetchRef.current();
      // ✅ Recharger aussi les centres si SCADA (nouveaux équipements possibles)
      if (source === 'scada') fetchCentres();
    });

    conn.onreconnecting(() => setConnexionStatut("connecting"));
    conn.onreconnected(()   => { setConnexionStatut("connected"); fetchRef.current(); });
    conn.onclose(()         => setConnexionStatut("disconnected"));

    startConnection()
      .then(()  => setConnexionStatut("connected"))
      .catch(() => setConnexionStatut("disconnected"));

    return () => { conn.off("HistoriqueMisAJour"); };
  }, [source, fetchCentres]);

  // ── Changer de source ─────────────────────────────────────
  const changerSource = (s: SourceType) => {
    setSource(s);
    setParams({ page: 1, pageSize: 6 });
    setCentresTravail([]); // reset immédiat, fetchCentres rechargera si scada
  };

  // ── Filtres ───────────────────────────────────────────────
  const setRecherche     = (r: string) => setParams(p => ({ ...p, recherche: r,     page: 1 }));
  const setStatut        = (s: string) => setParams(p => ({ ...p, statut: s,        page: 1 }));
  const setDateDebut     = (d: string) => setParams(p => ({ ...p, dateDebut: d,     page: 1 }));
  const setDateFin       = (d: string) => setParams(p => ({ ...p, dateFin: d,       page: 1 }));
  const setCentreTravail = (c: string) => setParams(p => ({ ...p, centreTravail: c, page: 1 }));
  const setPage          = (n: number) => setParams(p => ({ ...p, page: n }));
  const resetFiltres     = ()          => setParams({ page: 1, pageSize: 6 });

  // ── Détail modal ──────────────────────────────────────────
  const ouvrirDetail = (item: HistoriqueItem) => {
    setElementSelectionne(item);
    setDetailOuvert(true);
  };
  const fermerDetail = () => {
    setDetailOuvert(false);
    setElementSelectionne(null);
  };

  // ── Formatage ─────────────────────────────────────────────
  const formaterTemps = (minutes: number): string => {
    const h = Math.floor(minutes / 60).toString().padStart(2, "0");
    const m = (minutes % 60).toString().padStart(2, "0");
    return `${h}:${m}:00`;
  };

  const formaterDate = (date: string): string => {
    return new Date(date).toLocaleString("fr-FR", {
      day: "2-digit", month: "2-digit", year: "numeric",
      hour: "2-digit", minute: "2-digit"
    });
  };

  return {
    source, changerSource,
    donnees, totalLignes, totalPages,
    loading, error,
    vueMode, setVueMode,
    params, setRecherche, setStatut,
    setDateDebut, setDateFin,
    setCentreTravail,
    centresTravail,
    setPage, resetFiltres,
    detailOuvert, elementSelectionne,
    ouvrirDetail, fermerDetail,
    formaterTemps, formaterDate,
    connexionStatut,
    derniereMAJ,
    refetch: fetchDonnees,
  };
};