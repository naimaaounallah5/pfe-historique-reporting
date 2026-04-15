// features/dashboard/models/stock.model.ts
export interface StockGlobal {
  stockTotal: number;
  entreesTotales: number;
  sortiesTotales: number;
  nombreProduits: number;
  rotationMoyenne: number;
  produitsEnAlerte: number;
}

export interface StockParProduit {
  produit: string;
  description: string;
  categorie: string;
  groupe: string;
  stockDisponible: number;
  entrees: number;
  sorties: number;
  rotation: number;
  estEnAlerte: boolean;
   typeProduit: string;
}

export interface StockParTemps {
  label: string;
  mois: number;
  trimestre: number;
  annee: number;
  entrees: number;
  sorties: number;
  stockMoyen: number;
}

export interface StockResponse {
  global: StockGlobal;
  parProduit: StockParProduit[];
  parTemps: StockParTemps[];
}

export interface StockQueryParams {
  annee?: number;
  trimestre?: number;
  produit?: string;
  categorie?: string;
}