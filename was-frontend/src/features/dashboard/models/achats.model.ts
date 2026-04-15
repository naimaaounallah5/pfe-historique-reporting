export interface AchatsKpiGlobal {
  montantTotalAchats : number;
  nombreCommandes    : number;
  nombreRetards      : number;
  tauxRetard         : number;
  delaiMoyenReel     : number;
  delaiMoyenConvenu  : number;
}

export interface AchatParFournisseur {
  nomFournisseur  : string;
  pays            : string;
  montantTotal    : number;
  nombreCommandes : number;
  nombreRetards   : number;
}

export interface AchatParTemps {
  label           : string;
  mois            : number;
  trimestre       : number;
  annee           : number;
  montantTotal    : number;
  nombreCommandes : number;
}

export interface AchatParProduit {
  description     : string;
  categorie       : string;
  groupe          : string;
  montantTotal    : number;
  quantiteTotale  : number;
  nombreCommandes : number;
}

export interface AchatsFilters {
  annees       : number[];
  trimestres   : number[];
  fournisseurs : string[];
  produits     : string[];
  pays         : string[];
}

export interface AchatsResponse {
  global         : AchatsKpiGlobal;
  parFournisseur : AchatParFournisseur[];
  parTemps       : AchatParTemps[];
  parProduit     : AchatParProduit[];
  filters        : AchatsFilters;
}

export interface AchatsQueryParams {
  annee?       : number;
  trimestre?   : number;
  fournisseur? : string;
  produit?     : string;
}

// ── Retard Livraison ─────────────────────────────────────────

export interface RetardParFournisseur {
  nomFournisseur   : string;
  pays             : string;
  nombreRetards    : number;
  nombreCommandes  : number;
  tauxRetard       : number;
  delaiMoyenRetard : number;
}

export interface RetardParTemps {
  label            : string;
  mois             : number;
  trimestre        : number;
  annee            : number;
  nombreRetards    : number;
  nombreCommandes  : number;
  tauxRetard       : number;
  delaiMoyenRetard : number; // ← ajouté
}

export interface RetardParProduit {
  description      : string;
  categorie        : string;
  nombreRetards    : number;
  nombreCommandes  : number;
  tauxRetard       : number;
  delaiMoyenRetard : number;
}

export interface RetardResponse {
  parFournisseur : RetardParFournisseur[];
  parTemps       : RetardParTemps[];
  parProduit     : RetardParProduit[];
}