export interface RentabiliteKpi {
  rentabiliteMoyenne:     number;
  nbMachinesRentables:    number;
  nbMachinesNonRentables: number;
  nombreOrdres:           number;
  revenuTotal:            number;
  coutMachineTotal:       number;
}

export interface RentabiliteParTemps {
  label:             string;
  mois:              number;
  trimestre:         number;
  annee:             number;
  rentabiliteMoyenne: number;
  revenuTotal:       number;
  coutMachineTotal:  number;
  nombreOrdres:      number;
}

export interface RentabiliteParProduit {
  produit:            string;
  categorie:          string;
  rentabiliteMoyenne: number;
  revenuTotal:        number;
  coutMachineTotal:   number;
  nombreOrdres:       number;
  estRentable:        boolean;
}

export interface RentabiliteParMachine {
  machine:            string;
  groupe:             string;
  site:               string;
  rentabiliteMoyenne: number;
  revenuTotal:        number;
  coutMachineTotal:   number;
  heuresMachine:      number;
  nombreOrdres:       number;
  estRentable:        boolean;
}

export interface RentabiliteResponse {
  kpi:        RentabiliteKpi;
  parTemps:   RentabiliteParTemps[];
  parProduit: RentabiliteParProduit[];
  parMachine: RentabiliteParMachine[];
}