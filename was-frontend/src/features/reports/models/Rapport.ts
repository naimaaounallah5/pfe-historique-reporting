export type RapportType   = 'Production' | 'Qualité' | 'Maintenance' | 'Stock';
export type RapportFormat = 'PDF' | 'Excel';
export type RapportStatut = 'Créé' | 'Envoyé' | 'En attente' | 'Brouillon';

export interface Rapport {
  id:               number;
  titre:            string;
  type:             RapportType;
  format:           RapportFormat;
  statut:           RapportStatut;
  contenu:          string;
  optionsData?:     string;
  responsable?:     string;
  dateRapport?:     string;  // ✅ un seul champ
  dateCreation:     string;
  administrateurId: number;
}

export interface CreateRapportDTO {
  titre:            string;
  type:             RapportType;
  format:           RapportFormat;
  contenu:          string;
  optionsData?:     string;
  responsable?:     string;
  dateRapport?:     string;  // ✅ un seul champ
  administrateurId: number;
}

export interface EnvoyerRapportDTO {
  rapportId:     number;
  destinataires: string[];
  sujet:         string;
  message?:      string;
  pieceJointe?:  File | null;
}


export interface RapportFiltre {
  search: string;
  type:   string;
  statut: string;
  format: string;
}
export interface Administrateur {
  id: number;
  nom: string;
  email: string;
  initiales: string;
  couleur: string;
}
