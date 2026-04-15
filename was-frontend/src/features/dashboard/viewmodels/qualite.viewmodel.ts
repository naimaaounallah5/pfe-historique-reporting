// features/dashboard/viewmodels/qualite.viewmodel.ts
import { useState, useEffect, useCallback } from 'react';
import type { 
  QualiteResponse, QualiteQueryParams, 
  TauxDefautGlobal, DefautParProduit, DefautParTemps, DefautParMachine, QualiteFilters 
} from '../models/qualite.model';
import { qualiteService } from '../services/qualite.service';

export const useQualiteViewModel = () => {
  const [data, setData] = useState<QualiteResponse | null>(null);
  const [global, setGlobal] = useState<TauxDefautGlobal | null>(null);
  const [parProduit, setParProduit] = useState<DefautParProduit[]>([]);
  const [parTemps, setParTemps] = useState<DefautParTemps[]>([]);
  const [parMachine, setParMachine] = useState<DefautParMachine[]>([]);
  const [availableFilters, setAvailableFilters] = useState<QualiteFilters>({
    annees: [], trimestres: [], produits: [], machines: [], categories: []
  });

  const [queryParams, setQueryParams] = useState<QualiteQueryParams>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboard = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await qualiteService.getDashboard(queryParams);
      
      setData(response);
      setGlobal(response.global);
      setParProduit(response.parProduit);
      setParTemps(response.parTemps);
      setParMachine(response.parMachine);
      setAvailableFilters(response.filters);
    } catch (err) {
      setError('Erreur lors du chargement des données qualité');
      console.error('Erreur fetchDashboard:', err);
    } finally {
      setLoading(false);
    }
  }, [queryParams]);

  useEffect(() => { fetchDashboard(); }, [fetchDashboard]);

  // Filtres
  const setAnnee = (annee: number | undefined) => setQueryParams(p => ({ ...p, annee }));
  const setTrimestre = (trimestre: number | undefined) => setQueryParams(p => ({ ...p, trimestre }));
  const setProduit = (produit: string | undefined) => setQueryParams(p => ({ ...p, produit }));
  const setMachine = (machine: string | undefined) => setQueryParams(p => ({ ...p, machine }));
  const setCategorie = (categorie: string | undefined) => setQueryParams(p => ({ ...p, categorie }));
  const resetFilters = () => setQueryParams({});

  // Données groupées par trimestre/année
  const parTempsTrimestre = parTemps.reduce((acc, item) => {
    const key = `T${item.trimestre} ${item.annee}`;
    if (!acc[key]) {
      acc[key] = {
        label: key,
        mois: 0,
        trimestre: item.trimestre,
        annee: item.annee,
        nombreControles: 0,
        nombreDefauts: 0,
        tauxDefaut: 0
      };
    }
    acc[key].nombreControles += item.nombreControles;
    acc[key].nombreDefauts += item.nombreDefauts;
    return acc;
  }, {} as Record<string, DefautParTemps>);

  const parTempsAnnee = parTemps.reduce((acc, item) => {
    const key = `${item.annee}`;
    if (!acc[key]) {
      acc[key] = {
        label: key,
        mois: 0,
        trimestre: 0,
        annee: item.annee,
        nombreControles: 0,
        nombreDefauts: 0,
        tauxDefaut: 0
      };
    }
    acc[key].nombreControles += item.nombreControles;
    acc[key].nombreDefauts += item.nombreDefauts;
    return acc;
  }, {} as Record<string, DefautParTemps>);

  // Calculer les taux pour les données groupées
  const parTempsTrimestreList = Object.values(parTempsTrimestre).map(item => ({
    ...item,
    tauxDefaut: item.nombreControles > 0 
      ? Math.round((item.nombreDefauts / item.nombreControles) * 100 * 100) / 100
      : 0
  }));

  const parTempsAnneeList = Object.values(parTempsAnnee).map(item => ({
    ...item,
    tauxDefaut: item.nombreControles > 0 
      ? Math.round((item.nombreDefauts / item.nombreControles) * 100 * 100) / 100
      : 0
  }));

  return {
    data, global, loading, error,
    parProduit,
    parTempsMois: parTemps,
    parTempsTrimestre: parTempsTrimestreList,
    parTempsAnnee: parTempsAnneeList,
    parMachine,
    availableFilters,
    queryParams,
    setAnnee, setTrimestre, setProduit, setMachine, setCategorie,
    resetFilters, refetch: fetchDashboard
  };
};