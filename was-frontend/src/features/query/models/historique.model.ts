// ============================================================
//  historique.model.ts — Types TypeScript pour l'historique
//  ✅ CORRIGÉ : zone + ligneProduction dans QueryParams
//  ✅ CORRIGÉ : numeroOF, typeDefaut, niveauBatterie ajoutés
// ============================================================

export type SourceType = 'scada' | 'wms' | 'qdc' | 'agv';

export interface HistoriqueQueryParams {
  recherche?      : string;
  statut?         : string;
  dateDebut?      : string;
  dateFin?        : string;
  centreTravail?  : string;   // SCADA
  zone?           : string;   // ✅ WMS + AGV
  ligneProduction?: string;   // ✅ QDC
  page            : number;
  pageSize        : number;
}

export interface HistoriquePageResult<T> {
  donnees     : T[];
  totalLignes : number;
  page        : number;
  pageSize    : number;
  totalPages  : number;
}

export interface HistoriqueSCADA {
  id                 : number;
  numeroEntree       : string;
  nomMachine         : string;
  nomProduit         : string;
  numeroOperation    : string;
  numeroOrdre        : string;
  quantiteProduite   : number;
  quantiteRebut      : number;
  runTime            : number;
  stopTime           : number;
  setupTime          : number;
  heureDebut         : string;
  heureFin           : string | null;
  statut             : string;
  dateEnregistrement : string;
}

export interface HistoriqueWMS {
  id                 : number;
  numeroEntree       : string;
  nomProduit         : string;
  numeroLot          : string;
  numeroOF?          : string;   // ✅ AJOUTÉ
  zone               : string;
  typeMouvement      : string;
  quantiteTraitee    : number;
  quantiteRejetee    : number;
  dureeTraitement    : number;
  dureeArret         : number;
  statut             : string;
  dateEnregistrement : string;
}

export interface HistoriqueQDC {
  id                 : number;
  numeroEntree       : string;
  nomProduit         : string;
  nomMachine         : string;
  ligneProduction    : string;
  typeControle       : string;
  typeDefaut?        : string;   // ✅ AJOUTÉ
  quantiteControlee  : number;
  quantiteDefaut     : number;
  tauxDefaut         : number;
  statut             : string;
  dateEnregistrement : string;
}

export interface HistoriqueAGV {
  id                  : number;
  numeroEntree        : string;
  nomProduit          : string;
  codeAGV             : string;
  numeroTransfert     : string;
  niveauBatterie?     : number;  // ✅ AJOUTÉ
  quantiteTransferee  : number;
  nombreIncidents     : number;
  runTime             : number;
  stopTime            : number;
  zoneDepart          : string;
  zoneArrivee         : string;
  statut              : string;
  dateEnregistrement  : string;
}

export type HistoriqueItem =
  | HistoriqueSCADA
  | HistoriqueWMS
  | HistoriqueQDC
  | HistoriqueAGV;