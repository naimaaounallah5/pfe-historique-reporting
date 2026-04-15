import { useState, useEffect, useCallback, useRef } from 'react';
import * as signalR from '@microsoft/signalr';
import type { ProductionResponse, CoutParTemps } from '../models/production.model';

const API_URL = 'http://localhost:5088/api/production';
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

export const useProduction = () => {
  const [data,            setData]            = useState<ProductionResponse | null>(null);
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
      setError('Erreur chargement données production.');
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
                console.log('✅ Production — Connecté en temps réel');

        })
        .catch(() => setConnexionStatut('disconnected'));
    } else {
      setConnexionStatut('connected');
    }

    return () => { conn.off('DashboardMisAJour', handler); };
  }, []);

  // ── Données groupées par trimestre/année ─────────────────
  const parTempsTrimestre: CoutParTemps[] = data
    ? Object.values(
        data.parTemps.reduce((acc, item) => {
          const key = `T${item.trimestre}-${item.annee}`;
          if (!acc[key]) acc[key] = {
            label: `T${item.trimestre} ${item.annee}`,
            mois: item.mois, trimestre: item.trimestre, annee: item.annee,
            coutTotal: 0, coutMatiere: 0, coutMachine: 0, nombreOrdres: 0,
          };
          acc[key].coutTotal    += item.coutTotal;
          acc[key].coutMatiere  += item.coutMatiere;
          acc[key].coutMachine  += item.coutMachine;
          acc[key].nombreOrdres += item.nombreOrdres;
          return acc;
        }, {} as Record<string, CoutParTemps>)
      )
    : [];

  const parTempsAnnee: CoutParTemps[] = data
    ? Object.values(
        data.parTemps.reduce((acc, item) => {
          const key = `${item.annee}`;
          if (!acc[key]) acc[key] = {
            label: `${item.annee}`,
            mois: 0, trimestre: 0, annee: item.annee,
            coutTotal: 0, coutMatiere: 0, coutMachine: 0, nombreOrdres: 0,
          };
          acc[key].coutTotal    += item.coutTotal;
          acc[key].coutMatiere  += item.coutMatiere;
          acc[key].coutMachine  += item.coutMachine;
          acc[key].nombreOrdres += item.nombreOrdres;
          return acc;
        }, {} as Record<string, CoutParTemps>)
      )
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