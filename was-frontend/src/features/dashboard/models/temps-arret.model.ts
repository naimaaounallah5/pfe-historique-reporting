// was-frontend/src/features/dashboard/models/temps-arret.model.ts

export interface TempsArretGlobal {
  totalArretMinutes: number;
  totalArretHeures: number;
  nbOrdres: number;
  moyenneArretParOrdre: number;
}

export interface TempsArretMachine {
  machineId: number;
  machineNom: string;
  machineGroupe: string;
  totalArretMinutes: number;
  totalArretHeures: number;
  nbOrdres: number;
  pourcentage: number;
}

export interface TempsArretTemps {
  periode: string;
  annee: number;
  mois?: number;
  trimestre?: number;
  totalArretMinutes: number;
  nbOrdres: number;
}

export interface TempsArretProduit {
  produitId: number;
  produitNom: string;
  totalArretMinutes: number;
  nbOrdres: number;
  moyenneArretParOrdre: number;
}

export interface TempsArretResponse {
  global: TempsArretGlobal;
  parMachine: TempsArretMachine[];
  parTemps: TempsArretTemps[];
  parProduit: TempsArretProduit[];
  annees: number[];
}

export interface TempsArretQueryParams {
  machineId?: number;
  produitId?: number;
  annee?: number;
  trimestre?: number;
}