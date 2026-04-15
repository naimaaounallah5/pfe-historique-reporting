// features/dashboard/viewmodels/chiffre-affaires.viewmodel.ts
import { useState, useEffect, useCallback } from 'react';
import type { 
  CA_Response, CA_QueryParams, 
  CA_Global, CA_Client, CA_Produit, CA_Temps 
} from '../models/chiffre-affaires.model';
import { chiffreAffairesService } from '../services/chiffre-affaires.service';

export const useChiffreAffairesViewModel = () => {
  const [data, setData] = useState<CA_Response | null>(null);
  const [global, setGlobal] = useState<CA_Global | null>(null);
  const [clients, setClients] = useState<CA_Client[]>([]);
  const [produits, setProduits] = useState<CA_Produit[]>([]);
  const [temps, setTemps] = useState<CA_Temps[]>([]);
  const [annees, setAnnees] = useState<number[]>([]);
  const [trimestres, setTrimestres] = useState<number[]>([]);
  const [comparaisonData, setComparaisonData] = useState<{ca1: number, ca2: number} | null>(null);

  const [queryParams, setQueryParams] = useState<CA_QueryParams>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboard = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await chiffreAffairesService.getDashboard(queryParams);
      setData(response);
      setGlobal(response.global);
      setClients(response.clients);
      setProduits(response.produits);
      setTemps(response.temps);
      setAnnees(response.annees);
      setTrimestres(response.trimestres);
      console.log('✅ Ventes — Connecté en temps réel');
    } catch (err) {
      setError('Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  }, [queryParams]);

  useEffect(() => { fetchDashboard(); }, [fetchDashboard]);

  const fetchComparaison = useCallback(async (
    clientId: number,
    produitId: number
  ) => {
    try {
      const response2024 = await chiffreAffairesService.getDashboard({
        clientId: clientId,
        produitId: produitId,
        annee: 2024
      });

      const response2025 = await chiffreAffairesService.getDashboard({
        clientId: clientId,
        produitId: produitId,
        annee: 2025
      });

      const ca1 = response2024.global?.caTotal || 0;
      const ca2 = response2025.global?.caTotal || 0;

      setComparaisonData({ ca1, ca2 });

    } catch (err) {
      console.error('Erreur comparaison:', err);
      setComparaisonData(null);
    }
  }, []);

  const setAnnee     = (annee: number | undefined)     => setQueryParams(p => ({ ...p, annee }));
  const setTrimestre = (trimestre: number | undefined) => setQueryParams(p => ({ ...p, trimestre }));
  const setClientId  = (clientId: number | undefined)  => setQueryParams(p => ({ ...p, clientId }));
  const setProduitId = (produitId: number | undefined) => setQueryParams(p => ({ ...p, produitId }));
  const resetFilters = () => setQueryParams({});

  const tousClients  = [...clients].sort((a, b) => b.ca - a.ca);
  const tousProduits = [...produits].sort((a, b) => b.ca - a.ca);

  const tempsParTrimestre = temps.reduce((acc, item) => {
    const key = `T${item.trimestre} ${item.annee}`;
    if (!acc[key]) acc[key] = {
      periode: key, mois: 0, trimestre: item.trimestre,
      annee: item.annee, ca: 0, nbVentes: 0, _count: 0
    };
    acc[key].ca       += item.ca;
    acc[key].nbVentes += item.nbVentes;
    acc[key]._count   += 1;
    return acc;
  }, {} as Record<string, any>);

  const tempsParAnnee = temps.reduce((acc, item) => {
    const key = `${item.annee}`;
    if (!acc[key]) acc[key] = {
      periode: key, mois: 0, trimestre: 0,
      annee: item.annee, ca: 0, nbVentes: 0, _count: 0
    };
    acc[key].ca       += item.ca;
    acc[key].nbVentes += item.nbVentes;
    acc[key]._count   += 1;
    return acc;
  }, {} as Record<string, any>);

  const formatMonnaie = (valeur: number) => new Intl.NumberFormat('fr-TN', {
    style: 'currency', currency: 'TND',
    minimumFractionDigits: 0, maximumFractionDigits: 0
  }).format(valeur);

  return {
    data, global, loading, error,
    clients, produits,
    tempsMois:      temps,
    tempsTrimestre: Object.values(tempsParTrimestre),
    tempsAnnee:     Object.values(tempsParAnnee),
    tousClients, tousProduits,
    annees, trimestres,
    queryParams,
    setAnnee, setTrimestre, setClientId, setProduitId,
    resetFilters, refetch: fetchDashboard,
    formatMonnaie,
    comparaisonData,
    fetchComparaison,
  };
};