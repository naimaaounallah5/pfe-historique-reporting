export interface ProductionKpi {
  coutTotalProduction: number;
  coutTotalMatiere:    number;
  coutTotalMachine:    number;
  nombreOrdres:        number;
  coutMoyenParOrdre:   number;
}

export interface CoutParTemps {
  label:        string;
  mois:         number;
  trimestre:    number;
  annee:        number;
  coutTotal:    number;
  coutMatiere:  number;
  coutMachine:  number;
  nombreOrdres: number;
}

export interface CoutParProduit {
  produit:          string;
  categorie:        string;
  coutTotal:        number;
  coutMatiere:      number;
  coutMachine:      number;
  nombreOrdres:     number;
  quantiteProduite: number;
}

export interface CoutParMachine {
  machine:       string;
  groupe:        string;
  site:          string;
  coutTotal:     number;
  coutMachine:   number;
  heuresMachine: number;
  nombreOrdres:  number;
}

export interface ProductionResponse {
  kpi:        ProductionKpi;
  parTemps:   CoutParTemps[];
  parProduit: CoutParProduit[];
  parMachine: CoutParMachine[];
}