import { useState, useEffect, useCallback, useRef } from 'react';
import * as signalR from '@microsoft/signalr';
import type { RentabiliteResponse, RentabiliteParTemps } from '../models/rentabilite.model';

const API_URL = 'http://localhost:5088/api/rentabilite';
const HUB_URL = 'http://localhost:5088/hubs/dashboard';

// ── Connexion singleton partagée ─────────────────────────────
let _dashConn: signalR.HubConnection | null = null;
function getDashConnection(): signalR.HubConnection {
  if (!_dashConn) {
    _dashConn = new signalR.HubConnectionBuilder()
      .withUrl(HUB_URL, {
        skipNegotiation: true,
        transport: signalR.HttpTransportType.WebSockets,
      })
      .withAutomaticReconnect([0, 2000, 5000, 10000])
      .configureLogging(signalR.LogLevel.Warning)
      .build();
  }
  return _dashConn;
}

export const useRentabilite = () => {
  const [data,            setData]            = useState<RentabiliteResponse | null>(null);
  const [loading,         setLoading]         = useState(true);
  const [error,           setError]           = useState<string | null>(null);
  const [connexionStatut, setConnexionStatut] = useState<'connecting'|'connected'|'disconnected'>('connecting');
  const [derniereMAJ,     setDerniereMAJ]     = useState<Date | null>(null);

  const [annee,     setAnnee]     = useState<string>('');
  const [trimestre, setTrimestre] = useState<string>('');
  const [produitId, setProduitId] = useState<string>('');
  const [machineId, setMachineId] = useState<string>('');

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (annee)     params.append('annee',     annee);
      if (trimestre) params.append('trimestre', trimestre);
      if (produitId) params.append('produitId', produitId);
      if (machineId) params.append('machineId', machineId);
      const res  = await fetch(`${API_URL}?${params}`);
      const json = await res.json();
      setData(json);
      setDerniereMAJ(new Date());
    } catch {
      setError('Erreur chargement données rentabilité.');
    } finally {
      setLoading(false);
    }
  }, [annee, trimestre, produitId, machineId]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const fetchRef = useRef(fetchData);
  useEffect(() => { fetchRef.current = fetchData; }, [fetchData]);

  // ── SignalR — connexion singleton partagée ───────────────
  useEffect(() => {
    const conn = getDashConnection();

    const handler = () => {
      console.log('[SignalR] DashboardMisAJour → reload rentabilite');
      fetchRef.current();
    };
    conn.on('DashboardMisAJour', handler);

    conn.onreconnecting(() => setConnexionStatut('connecting'));
    conn.onreconnected(()   => setConnexionStatut('connected'));
    conn.onclose(()         => setConnexionStatut('disconnected'));

    if (conn.state === signalR.HubConnectionState.Disconnected) {
      conn.start()
        .then(() => {
          setConnexionStatut('connected');
          console.log('[SignalR] Rentabilite connecté');
        })
        .catch(() => setConnexionStatut('disconnected'));
    } else {
      setConnexionStatut('connected');
    }

    // ← Retirer seulement le listener — ne pas stopper la connexion !
    return () => { conn.off('DashboardMisAJour', handler); };
  }, []);

  // ── Données groupées par trimestre ───────────────────────
  const parTempsTrimestre: RentabiliteParTemps[] = data
    ? Object.values(
        data.parTemps.reduce((acc, item) => {
          const key = `T${item.trimestre}-${item.annee}`;
          if (!acc[key]) acc[key] = {
            label: `T${item.trimestre} ${item.annee}`,
            mois: item.mois, trimestre: item.trimestre, annee: item.annee,
            rentabiliteMoyenne: 0, revenuTotal: 0,
            coutMachineTotal: 0, nombreOrdres: 0,
            _count: 0,
          } as any;
          acc[key].revenuTotal        += item.revenuTotal;
          acc[key].coutMachineTotal   += item.coutMachineTotal;
          acc[key].nombreOrdres       += item.nombreOrdres;
          acc[key]._count             += 1;
          acc[key].rentabiliteMoyenne += item.rentabiliteMoyenne;
          return acc;
        }, {} as Record<string, any>)
      ).map((g: any) => ({
        ...g,
        rentabiliteMoyenne: Math.round(g.rentabiliteMoyenne / g._count * 100) / 100,
      }))
    : [];

  const parTempsAnnee: RentabiliteParTemps[] = data
    ? Object.values(
        data.parTemps.reduce((acc, item) => {
          const key = `${item.annee}`;
          if (!acc[key]) acc[key] = {
            label: `${item.annee}`,
            mois: 0, trimestre: 0, annee: item.annee,
            rentabiliteMoyenne: 0, revenuTotal: 0,
            coutMachineTotal: 0, nombreOrdres: 0,
            _count: 0,
          } as any;
          acc[key].revenuTotal        += item.revenuTotal;
          acc[key].coutMachineTotal   += item.coutMachineTotal;
          acc[key].nombreOrdres       += item.nombreOrdres;
          acc[key]._count             += 1;
          acc[key].rentabiliteMoyenne += item.rentabiliteMoyenne;
          return acc;
        }, {} as Record<string, any>)
      ).map((g: any) => ({
        ...g,
        rentabiliteMoyenne: Math.round(g.rentabiliteMoyenne / g._count * 100) / 100,
      }))
    : [];

  const resetFiltres = () => {
    setAnnee(''); setTrimestre('');
    setProduitId(''); setMachineId('');
  };

  return {
    data, loading, error,
    connexionStatut, derniereMAJ,
    annee,     setAnnee,
    trimestre, setTrimestre,
    produitId, setProduitId,
    machineId, setMachineId,
    resetFiltres, refresh: fetchData,
    parTempsMois:      data?.parTemps   ?? [],
    parTempsTrimestre,
    parTempsAnnee,
    parProduit:        data?.parProduit ?? [],
    parMachine:        data?.parMachine ?? [],
    kpi:               data?.kpi        ?? null,
  };
};