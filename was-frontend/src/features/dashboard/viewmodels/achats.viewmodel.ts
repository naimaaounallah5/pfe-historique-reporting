// ============================================================
//  achats.viewmodel.ts — ViewModel pour les KPIs Achats
// ============================================================

import { useState, useEffect, useCallback } from "react";
import type {
  AchatsResponse, AchatsQueryParams, AchatsKpiGlobal,
  AchatParFournisseur, AchatParTemps, AchatParProduit, AchatsFilters,
  RetardResponse, RetardParFournisseur, RetardParTemps, RetardParProduit,
} from "../models/achats.model";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5088/api";

export const useAchatsViewModel = () => {

  const [global, setGlobal]                = useState<AchatsKpiGlobal | null>(null);
  const [parFournisseur, setParFournisseur] = useState<AchatParFournisseur[]>([]);
  const [parTemps, setParTemps]            = useState<AchatParTemps[]>([]);
  const [parProduit, setParProduit]        = useState<AchatParProduit[]>([]);
  const [availableFilters, setAvailableFilters] = useState<AchatsFilters>({
    annees: [], trimestres: [], fournisseurs: [], produits: [], pays: [],
  });

  const [retardParFournisseur, setRetardParFournisseur] = useState<RetardParFournisseur[]>([]);
  const [retardParTemps,       setRetardParTemps]       = useState<RetardParTemps[]>([]);
  const [retardParProduit,     setRetardParProduit]     = useState<RetardParProduit[]>([]);

  const [queryParams, setQueryParams] = useState<AchatsQueryParams>({});
  const [loading, setLoading]         = useState<boolean>(false);
  const [error, setError]             = useState<string | null>(null);

  const fetchDashboard = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (queryParams.annee)       params.append("annee",       String(queryParams.annee));
      if (queryParams.trimestre)   params.append("trimestre",   String(queryParams.trimestre));
      if (queryParams.fournisseur) params.append("fournisseur", queryParams.fournisseur);
      if (queryParams.produit)     params.append("produit",     queryParams.produit);

      const qs = params.toString();

      const [resAchats, resRetard] = await Promise.all([
        fetch(`${API_BASE_URL}/achats/dashboard?${qs}`),
        fetch(`${API_BASE_URL}/achats/retard?${qs}`),
      ]);

      if (!resAchats.ok) throw new Error(`Erreur API achats : ${resAchats.status}`);
      if (!resRetard.ok) throw new Error(`Erreur API retard : ${resRetard.status}`);

      const dataAchats: AchatsResponse = await resAchats.json();
      const dataRetard: RetardResponse = await resRetard.json();

      setGlobal(dataAchats.global);
      setParFournisseur(dataAchats.parFournisseur);
      setParTemps(dataAchats.parTemps);
      setParProduit(dataAchats.parProduit);
      setAvailableFilters(dataAchats.filters);

      setRetardParFournisseur(dataRetard.parFournisseur ?? []);
      setRetardParTemps(dataRetard.parTemps ?? []);
      setRetardParProduit(dataRetard.parProduit ?? []);

    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue");
    } finally {
      setLoading(false);
    }
  }, [queryParams]);

  useEffect(() => { fetchDashboard(); }, [fetchDashboard]);

  const setAnnee       = (annee: number | undefined)       => setQueryParams(p => ({ ...p, annee }));
  const setTrimestre   = (trimestre: number | undefined)   => setQueryParams(p => ({ ...p, trimestre }));
  const setFournisseur = (fournisseur: string | undefined) => setQueryParams(p => ({ ...p, fournisseur }));
  const setProduit     = (produit: string | undefined)     => setQueryParams(p => ({ ...p, produit }));
  const resetFilters   = () => setQueryParams({});

  // ── Charts Montant Achats ────────────────────────────────

  const chartFournisseurData = {
    labels: parFournisseur.map(f => f.nomFournisseur),
    datasets: [{
      label: "Montant Total Achats (DT)",
      data: parFournisseur.map(f => f.montantTotal),
      backgroundColor: "rgba(59,130,246,0.75)",
      borderColor: "rgba(59,130,246,1)",
      borderWidth: 1, borderRadius: 4,
    }],
  };

  const chartTempsMois = {
    labels: parTemps.map(t => t.label),
    datasets: [{
      label: "Montant Total Achats (DT)",
      data: parTemps.map(t => t.montantTotal),
      borderColor: "rgba(16,185,129,1)",
      backgroundColor: "rgba(16,185,129,0.1)",
      borderWidth: 2, fill: true, tension: 0.4,
      pointBackgroundColor: "rgba(16,185,129,1)", pointRadius: 4,
    }],
  };

  const parTrimestreGrouped = parTemps.reduce((acc, t) => {
    const key = `T${t.trimestre} ${t.annee}`;
    if (!acc[key]) acc[key] = { montantTotal: 0, nombreCommandes: 0 };
    acc[key].montantTotal    += t.montantTotal;
    acc[key].nombreCommandes += t.nombreCommandes;
    return acc;
  }, {} as Record<string, { montantTotal: number; nombreCommandes: number }>);

  const parTempsTrimestre = Object.entries(parTrimestreGrouped).map(([label, v]) => ({
    label, montantTotal: v.montantTotal, nombreCommandes: v.nombreCommandes,
  }));

  const chartTempsTrimestre = {
    labels: parTempsTrimestre.map(t => t.label),
    datasets: [{
      label: "Montant Total Achats (DT)",
      data: parTempsTrimestre.map(t => t.montantTotal),
      borderColor: "rgba(16,185,129,1)",
      backgroundColor: "rgba(16,185,129,0.1)",
      borderWidth: 2, fill: true, tension: 0.4,
      pointBackgroundColor: "rgba(16,185,129,1)", pointRadius: 4,
    }],
  };

  const parAnneeGrouped = parTemps.reduce((acc, t) => {
    const key = String(t.annee);
    if (!acc[key]) acc[key] = { montantTotal: 0, nombreCommandes: 0 };
    acc[key].montantTotal    += t.montantTotal;
    acc[key].nombreCommandes += t.nombreCommandes;
    return acc;
  }, {} as Record<string, { montantTotal: number; nombreCommandes: number }>);

  const parTempsAnnee = Object.entries(parAnneeGrouped).map(([label, v]) => ({
    label, montantTotal: v.montantTotal, nombreCommandes: v.nombreCommandes,
  }));

  const chartTempsAnnee = {
    labels: parTempsAnnee.map(t => t.label),
    datasets: [{
      label: "Montant Total Achats (DT)",
      data: parTempsAnnee.map(t => t.montantTotal),
      borderColor: "rgba(16,185,129,1)",
      backgroundColor: "rgba(16,185,129,0.1)",
      borderWidth: 2, fill: true, tension: 0.4,
      pointBackgroundColor: "rgba(16,185,129,1)", pointRadius: 4,
    }],
  };

  const chartProduitData = {
    labels: parProduit.map(p => p.description),
    datasets: [{
      label: "Montant Total Achats (DT)",
      data: parProduit.map(p => p.montantTotal),
      backgroundColor: "rgba(245,158,11,0.75)",
      borderColor: "rgba(245,158,11,1)",
      borderWidth: 1, borderRadius: 4,
    }],
  };

  const chartProduitPieData = {
    labels: parProduit.map(p => p.description),
    datasets: [{
      data: parProduit.map(p => p.montantTotal),
      backgroundColor: [
        "rgba(59,130,246,0.8)","rgba(16,185,129,0.8)",
        "rgba(245,158,11,0.8)","rgba(239,68,68,0.8)",
        "rgba(139,92,246,0.8)","rgba(236,72,153,0.8)",
        "rgba(20,184,166,0.8)","rgba(251,146,60,0.8)",
      ],
      borderWidth: 2, borderColor: "#fff",
    }],
  };

  // ── Groupements Retard Trimestre ─────────────────────────

  const retardTrimestreGrouped = retardParTemps.reduce((acc, t) => {
    const key = `T${t.trimestre} ${t.annee}`;
    if (!acc[key]) acc[key] = { totalDelai: 0, nombreRetards: 0, nombreCommandes: 0 };
    acc[key].totalDelai      += t.delaiMoyenRetard * (t.nombreRetards > 0 ? t.nombreRetards : 0);
    acc[key].nombreRetards   += t.nombreRetards;
    acc[key].nombreCommandes += t.nombreCommandes;
    return acc;
  }, {} as Record<string, { totalDelai: number; nombreRetards: number; nombreCommandes: number }>);

  const retardParTempsTrimestre = Object.entries(retardTrimestreGrouped).map(([label, v]) => ({
    label,
    mois:             0,
    trimestre:        0,
    annee:            0,
    nombreRetards:    v.nombreRetards,
    nombreCommandes:  v.nombreCommandes,
    tauxRetard:       v.nombreCommandes > 0
      ? Math.round((v.nombreRetards / v.nombreCommandes) * 10000) / 100
      : 0,
    delaiMoyenRetard: v.nombreRetards > 0
      ? Math.round((v.totalDelai / v.nombreRetards) * 100) / 100
      : 0,
  }));

  // ── Groupements Retard Année ─────────────────────────────

  const retardAnneeGrouped = retardParTemps.reduce((acc, t) => {
    const key = String(t.annee);
    if (!acc[key]) acc[key] = { totalDelai: 0, nombreRetards: 0, nombreCommandes: 0 };
    acc[key].totalDelai      += t.delaiMoyenRetard * (t.nombreRetards > 0 ? t.nombreRetards : 0);
    acc[key].nombreRetards   += t.nombreRetards;
    acc[key].nombreCommandes += t.nombreCommandes;
    return acc;
  }, {} as Record<string, { totalDelai: number; nombreRetards: number; nombreCommandes: number }>);

  const retardParTempsAnnee = Object.entries(retardAnneeGrouped).map(([label, v]) => ({
    label,
    mois:             0,
    trimestre:        0,
    annee:            0,
    nombreRetards:    v.nombreRetards,
    nombreCommandes:  v.nombreCommandes,
    tauxRetard:       v.nombreCommandes > 0
      ? Math.round((v.nombreRetards / v.nombreCommandes) * 10000) / 100
      : 0,
    delaiMoyenRetard: v.nombreRetards > 0
      ? Math.round((v.totalDelai / v.nombreRetards) * 100) / 100
      : 0,
  }));

  // ── Max axes ─────────────────────────────────────────────

  const maxDelaiRetardFournisseur = retardParFournisseur.length > 0
    ? Math.max(...retardParFournisseur.map(f => Number(f.delaiMoyenRetard))) + 1 : 6;
  const maxDelaiRetardProduit = retardParProduit.length > 0
    ? Math.max(...retardParProduit.map(p => Number(p.delaiMoyenRetard))) + 1 : 6;
  const maxDelaiRetardTemps = retardParTemps.length > 0
    ? Math.max(...retardParTemps.map(t => Number(t.delaiMoyenRetard))) + 1 : 6;
  const maxDelaiRetardTempsTrimestre = retardParTempsTrimestre.length > 0
    ? Math.max(...retardParTempsTrimestre.map(t => t.delaiMoyenRetard)) + 1 : 6;
  const maxDelaiRetardTempsAnnee = retardParTempsAnnee.length > 0
    ? Math.max(...retardParTempsAnnee.map(t => t.delaiMoyenRetard)) + 1 : 6;

  // ── Charts Retard (gardés pour compatibilité) ────────────

  const chartRetardFournisseurData = {
    labels: retardParFournisseur.map(f => f.nomFournisseur),
    datasets: [{
      label: "Délai moyen de retard (jours)",
      data: retardParFournisseur.map(f => Number(f.delaiMoyenRetard)),
      backgroundColor: retardParFournisseur.map(f =>
        Number(f.delaiMoyenRetard) > 0 ? "rgba(239,68,68,0.75)" : "rgba(209,213,219,0.5)"
      ),
      borderWidth: 1, borderRadius: 4,
    }],
  };

  const chartRetardTempsMois = {
    labels: retardParTemps.map(t => t.label),
    datasets: [{
      label: "Délai moyen de retard (jours)",
      data: retardParTemps.map(t => Number(t.delaiMoyenRetard)),
      borderColor: "rgba(239,68,68,1)",
      backgroundColor: "rgba(239,68,68,0.12)",
      borderWidth: 2, fill: true, tension: 0.4,
      pointBackgroundColor: "rgba(239,68,68,1)", pointRadius: 4,
    }],
  };

  const chartRetardTempsTrimestre = {
    labels: retardParTempsTrimestre.map(t => t.label),
    datasets: [{
      label: "Délai moyen de retard (jours)",
      data: retardParTempsTrimestre.map(t => t.delaiMoyenRetard),
      borderColor: "rgba(239,68,68,1)",
      backgroundColor: "rgba(239,68,68,0.12)",
      borderWidth: 2, fill: true, tension: 0.4,
      pointBackgroundColor: "rgba(239,68,68,1)", pointRadius: 4,
    }],
  };

  const chartRetardTempsAnnee = {
    labels: retardParTempsAnnee.map(t => t.label),
    datasets: [{
      label: "Délai moyen de retard (jours)",
      data: retardParTempsAnnee.map(t => t.delaiMoyenRetard),
      borderColor: "rgba(239,68,68,1)",
      backgroundColor: "rgba(239,68,68,0.12)",
      borderWidth: 2, fill: true, tension: 0.4,
      pointBackgroundColor: "rgba(239,68,68,1)", pointRadius: 4,
    }],
  };

  const chartRetardProduitData = {
    labels: retardParProduit.map(p => p.description),
    datasets: [{
      label: "Délai moyen de retard (jours)",
      data: retardParProduit.map(p => Number(p.delaiMoyenRetard)),
      backgroundColor: retardParProduit.map(p =>
        Number(p.delaiMoyenRetard) > 0 ? "rgba(239,68,68,0.75)" : "rgba(209,213,219,0.5)"
      ),
      borderWidth: 1, borderRadius: 4,
    }],
  };

  return {
    global, parFournisseur, parTemps, parProduit, availableFilters,
    retardParFournisseur, retardParTemps, retardParProduit,
    parTempsMois: parTemps,
    parTempsTrimestre,
    parTempsAnnee,
    retardParTempsMois:       retardParTemps,
    retardParTempsTrimestre,
    retardParTempsAnnee,
    maxDelaiRetardFournisseur,
    maxDelaiRetardProduit,
    maxDelaiRetardTemps,
    maxDelaiRetardTempsTrimestre,
    maxDelaiRetardTempsAnnee,
    loading, error, queryParams,
    setAnnee, setTrimestre, setFournisseur, setProduit,
    resetFilters, refetch: fetchDashboard,
    chartFournisseurData,
    chartTempsMois, chartTempsTrimestre, chartTempsAnnee,
    chartProduitData, chartProduitPieData,
    chartRetardFournisseurData,
    chartRetardTempsMois, chartRetardTempsTrimestre, chartRetardTempsAnnee,
    chartRetardProduitData,
  };
};