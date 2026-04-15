export interface OrdreProduction {
  id: number
  horodatage?: string
  statut: number
  numero: string
  numeroAuto?: string        // ← AJOUT
  description?: string
  descriptionRecherche?: string
  description2?: string
  dateCreation?: string
  dateDerniereModif?: string
  typeSource?: number
  numeroSource?: string
  numeroGamme?: string
  codeVariante?: string
  dateDebut?: string
  dateFin?: string
  datePrevue?: string
  dateFinReelle?: string
  bloque?: boolean
  codeSite?: string
  codeEmplacement?: string
  quantite?: number
  coutUnitaire?: number
  montantCout?: number
  operateurAssigne?: string
  dateHeureDebut?: string
  dateHeureFin?: string
}

export interface LigneOrdreProduction {
  id: number
  statut: number
  numeroOrdreProduction: string
  numeroLigne?: number
  referenceArticle?: string
  description?: string
  quantite?: number
  quantiteTerminee?: number
  quantiteRestante?: number
  tauxRebut?: number
  dateDebut?: string
  dateFin?: string
  uniteMesure?: string
  numeroBOM?: string
}

export interface ComposantOrdre {
  id: number
  statut: number
  numeroOrdreProduction: string
  referenceArticle?: string
  description?: string
  uniteMesure?: string
  quantite?: number
  quantiteAttendue?: number
  quantiteRestante?: number
  tauxRebut?: number
  dateBesoin?: string
}

export interface OperationGamme {
  id: number
  statut: number
  numeroOrdreProduction: string
  numeroOperation?: string
  description?: string
  numeroCentreTravail?: string
  groupeCentreTravail?: string
  tempsReglage?: number
  tempsExecution?: number
  dateDebut?: string
  dateFin?: string
  statutGamme?: number
}

export interface OrdreProductionDetailDTO {
  ordre: OrdreProduction
  lignes: LigneOrdreProduction[]
  composants: ComposantOrdre[]
  operations: OperationGamme[]
}

export const STATUT_LABELS: Record<number, string> = {
  0: 'Simulé',
  1: 'Planifié',
  2: 'En cours',
  3: 'Terminé',
}

export const STATUT_COLORS: Record<number, string> = {
  0: '#6B7280',
  1: '#3B82F6',
  2: '#F59E0B',
  3: '#10B981',
}

export const STATUT_BG: Record<number, string> = {
  0: '#F3F4F6',
  1: '#EFF6FF',
  2: '#FFFBEB',
  3: '#F0FDF4',
}