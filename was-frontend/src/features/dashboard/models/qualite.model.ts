// features/dashboard/models/qualite.model.ts
export interface TauxDefautGlobal {
  tauxDefautMoyen: number;
  nombreProduitsControles: number;
  nombreDefauts: number;
  nombreProduitsConformes: number;
  tauxConformite: number;
}

export interface DefautParProduit {
  produit: string;
  description: string;
  categorie: string;
  groupe: string;
  nombreControles: number;
  nombreDefauts: number;
  tauxDefaut: number;
  tauxConformite: number;
}

export interface DefautParTemps {
  label: string;
  mois: number;
  trimestre: number;
  annee: number;
  nombreControles: number;
  nombreDefauts: number;
  tauxDefaut: number;
}

export interface DefautParMachine {
  machine: string;
  groupe: string;
  site: string;
  nombreControles: number;
  nombreDefauts: number;
  tauxDefaut: number;
}

export interface QualiteFilters {
  annees: number[];
  trimestres: number[];
  produits: string[];
  machines: string[];
  categories: string[];
}

export interface QualiteResponse {
  global: TauxDefautGlobal;
  parProduit: DefautParProduit[];
  parTemps: DefautParTemps[];
  parMachine: DefautParMachine[];
  filters: QualiteFilters;
}

export interface QualiteQueryParams {
  annee?: number;
  trimestre?: number;
  produit?: string;
  machine?: string;
  categorie?: string;
}