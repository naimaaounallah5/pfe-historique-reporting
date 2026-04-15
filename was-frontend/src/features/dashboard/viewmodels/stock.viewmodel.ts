// features/dashboard/viewmodels/stock.viewmodel.ts
import { useState, useEffect, useCallback } from 'react';
import type { 
  StockResponse, StockQueryParams, 
  StockGlobal, StockParProduit, StockParTemps 
} from '../models/stock.model';
import { stockService } from '../services/stock.service';

export const useStockViewModel = () => {
  const [data, setData] = useState<StockResponse | null>(null);
  const [global, setGlobal] = useState<StockGlobal | null>(null);
  const [parProduit, setParProduit] = useState<StockParProduit[]>([]);
  const [parTemps, setParTemps] = useState<StockParTemps[]>([]);

  const [queryParams, setQueryParams] = useState<StockQueryParams>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboard = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await stockService.getDashboard(queryParams);
      console.log('Premier produit:', response.parProduit[0]);

setData(response);
console.log('typeProduit:', response.parProduit[0].typeProduit);
console.log('Tous les types:', [...new Set(response.parProduit.map(p => p.typeProduit))]);

      setData(response);
      setGlobal(response.global);
      setParProduit(response.parProduit);
      console.log('Tous les typeProduit:', [...new Set(response.parProduit.map(p => p.typeProduit))]);

      setParTemps(response.parTemps);
    } catch (err) {
      setError('Erreur lors du chargement des données stock');
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
        entrees: 0,
        sorties: 0,
        stockMoyen: 0,
        _count: 0
      } as any;
    }
    acc[key].entrees += item.entrees;
    acc[key].sorties += item.sorties;
    acc[key].stockMoyen += item.stockMoyen;
    acc[key]._count += 1;
    return acc;
  }, {} as Record<string, any>);

  const parTempsAnnee = parTemps.reduce((acc, item) => {
    const key = `${item.annee}`;
    if (!acc[key]) {
      acc[key] = {
        label: key,
        mois: 0,
        trimestre: 0,
        annee: item.annee,
        entrees: 0,
        sorties: 0,
        stockMoyen: 0,
        _count: 0
      } as any;
    }
    acc[key].entrees += item.entrees;
    acc[key].sorties += item.sorties;
    acc[key].stockMoyen += item.stockMoyen;
    acc[key]._count += 1;
    return acc;
  }, {} as Record<string, any>);

  const parTempsTrimestreList = Object.values(parTempsTrimestre).map(item => ({
    ...item,
    stockMoyen: item._count > 0 ? Math.round((item.stockMoyen / item._count) * 100) / 100 : 0
  }));

  const parTempsAnneeList = Object.values(parTempsAnnee).map(item => ({
    ...item,
    stockMoyen: item._count > 0 ? Math.round((item.stockMoyen / item._count) * 100) / 100 : 0
  }));

  // Produits en alerte (stock < 100)
  const produitsEnAlerte = parProduit.filter(p => p.estEnAlerte);

  return {
    data, global, loading, error,
    parProduit,
    parTempsMois: parTemps,
    parTempsTrimestre: parTempsTrimestreList,
    parTempsAnnee: parTempsAnneeList,
    produitsEnAlerte,
    queryParams,
    setAnnee, setTrimestre, setProduit, setCategorie,
    resetFilters, refetch: fetchDashboard
  };
};