// was-frontend/src/features/dashboard/viewmodels/temps-arret.viewmodel.ts
import { useState, useEffect, useCallback, useRef } from 'react';
import * as signalR from '@microsoft/signalr';
import type {
  TempsArretResponse, TempsArretQueryParams,
  TempsArretGlobal, TempsArretMachine, TempsArretTemps, TempsArretProduit
} from '../models/temps-arret.model';
import { tempsArretService } from '../services/temps-arret.service';

const HUB_URL = 'http://localhost:5088/hubs/dashboard';

// ── Singleton SignalR ─────────────────────────────────────────
let _connection: signalR.HubConnection | null = null;
let _connectionPromise: Promise<void> | null  = null;

function getConnection(): signalR.HubConnection {
  if (!_connection) {
    _connection = new signalR.HubConnectionBuilder()
      .withUrl(HUB_URL)                             // ✅ PAS de skipNegotiation
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
      .then(()   => console.log('✅ Temps Arret - Connecté en temps réel'))
      .catch(err => console.error('❌ Temps Arret - Erreur connexion:', err))
      .finally(() => { _connectionPromise = null; });
  }
  return _connectionPromise;
}
// ─────────────────────────────────────────────────────────────

export const useTempsArretViewModel = () => {
  const [data,     setData]     = useState<TempsArretResponse | null>(null);
  const [global,   setGlobal]   = useState<TempsArretGlobal | null>(null);
  const [machines, setMachines] = useState<TempsArretMachine[]>([]);
  const [temps,    setTemps]    = useState<TempsArretTemps[]>([]);
  const [produits, setProduits] = useState<TempsArretProduit[]>([]);
  const [annees,   setAnnees]   = useState<number[]>([]);

  const [queryParams, setQueryParams] = useState<TempsArretQueryParams>({});
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState<string | null>(null);

  const [connexionStatut, setConnexionStatut] =
    useState<'connecting' | 'connected' | 'disconnected'>('connecting');
  const [derniereMAJ, setDerniereMAJ] = useState<Date | null>(null);

  const fetchDashboard = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      console.log('📡 Fetching Temps Arret avec params:', queryParams);
      const response = await tempsArretService.getDashboard(queryParams);
      setData(response);
      setGlobal(response.global);
      setMachines(response.parMachine);
      setTemps(response.parTemps);
      setProduits(response.parProduit);
      setAnnees(response.annees);
      setDerniereMAJ(new Date());
      console.log('✅ Données Temps Arret reçues:', {
        global: response.global,
        machines: response.parMachine.length,
        temps: response.parTemps.length,
        produits: response.parProduit.length
      });
    } catch (err) {
      setError('Erreur lors du chargement des données');
      console.error('❌ Erreur fetchDashboard:', err);
    } finally {
      setLoading(false);
    }
  }, [queryParams]);

  // ── Ref pour SignalR ──────────────────────────────────────
  const fetchRef = useRef(fetchDashboard);
  useEffect(() => { fetchRef.current = fetchDashboard; }, [fetchDashboard]);

  useEffect(() => { fetchDashboard(); }, [fetchDashboard]);

  // ── SignalR ───────────────────────────────────────────────
  useEffect(() => {
    const conn = getConnection();

    conn.on('DashboardMisAJour', () => {
      console.log('📡 Temps Arret - Mise à jour reçue');
      fetchRef.current();
    });

    conn.onreconnecting(() => {
      console.log('🔄 Temps Arret - Reconnexion...');
      setConnexionStatut('connecting');
    });
    conn.onreconnected(() => {
      console.log('✅ Temps Arret - Reconnecté');
      setConnexionStatut('connected');
      fetchRef.current();
    });
    conn.onclose(() => {
      console.log('🔌 Temps Arret - Connexion fermée');
      setConnexionStatut('disconnected');
    });

    startConnection()
      .then(()  => setConnexionStatut('connected'))
      .catch(() => setConnexionStatut('disconnected'));

    return () => {
      conn.off('DashboardMisAJour');
    };
  }, []);

  // ── Filtres ───────────────────────────────────────────────
  const setMachineId = (machineId: number | undefined) => setQueryParams(p => ({ ...p, machineId }));
  const setProduitId = (produitId: number | undefined) => setQueryParams(p => ({ ...p, produitId }));
  const setAnnee     = (annee: number | undefined)     => setQueryParams(p => ({ ...p, annee }));
  const setTrimestre = (trimestre: number | undefined) => setQueryParams(p => ({ ...p, trimestre }));
  const resetFilters = () => setQueryParams({});

  const topMachines = [...machines].sort((a,b) => b.totalArretMinutes - a.totalArretMinutes).slice(0, 10);
  const topProduits = [...produits].sort((a,b) => b.totalArretMinutes - a.totalArretMinutes).slice(0, 10);

  const tempsParTrimestre = temps.reduce((acc, item) => {
    if (item.trimestre) {
      const key = `T${item.trimestre} ${item.annee}`;
      if (!acc[key]) acc[key] = { periode:key, annee:item.annee, trimestre:item.trimestre, totalArretMinutes:0, nbOrdres:0, _count:0 };
      acc[key].totalArretMinutes += item.totalArretMinutes;
      acc[key].nbOrdres          += item.nbOrdres;
      acc[key]._count            += 1;
    }
    return acc;
  }, {} as Record<string, any>);

  const tempsParAnnee = temps.reduce((acc, item) => {
    const key = `${item.annee}`;
    if (!acc[key]) acc[key] = { periode:key, annee:item.annee, totalArretMinutes:0, nbOrdres:0, _count:0 };
    acc[key].totalArretMinutes += item.totalArretMinutes;
    acc[key].nbOrdres          += item.nbOrdres;
    acc[key]._count            += 1;
    return acc;
  }, {} as Record<string, any>);

  const formatHeures = (minutes: number) => (minutes / 60).toFixed(1) + ' h';

  return {
    data, global, loading, error,
    machines,
    tempsMois:     temps,
    tempsTrimestre: Object.values(tempsParTrimestre),
    tempsAnnee:    Object.values(tempsParAnnee),
    produits,
    topMachines, topProduits,
    annees,
    queryParams,
    setMachineId, setProduitId, setAnnee, setTrimestre,
    resetFilters, refetch: fetchDashboard,
    formatHeures,
    connexionStatut, derniereMAJ,
  };
};