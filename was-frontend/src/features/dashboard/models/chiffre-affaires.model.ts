// features/dashboard/models/chiffre-affaires.model.ts
export interface CA_Global {
  caTotal: number;
  croissanceAnnuelle: number;
  nombreClientsActifs: number;
  nombreProduitsVendus: number;
  caMoyenMensuel: number;
}

export interface CA_Client {
  clientId: number;
  clientNom: string;
  clientPrenom: string;
  ca: number;
  partPourcentage: number;
  evolutionAnnuelle: number;
}

export interface CA_Produit {
  produitId: number;
  produitNom: string;
  categorie: string;
  ca: number;
  quantiteVendue: number;
  partPourcentage: number;
  evolutionAnnuelle: number;
}

export interface CA_Temps {
  periode: string;
  mois: number;
  trimestre: number;
  annee: number;
  ca: number;
  nbVentes: number;
}

export interface CA_Response {
  global: CA_Global;
  clients: CA_Client[];
  produits: CA_Produit[];
  temps: CA_Temps[];
  annees: number[];
  trimestres: number[];
}

export interface CA_QueryParams {
  annee?: number;
  trimestre?: number;
  clientId?: number;
  produitId?: number;
}