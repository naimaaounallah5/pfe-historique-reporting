export interface InterfaceCard {
  id: string
  title: string
  description: string
  icon: string
  accentColor: string
  gradientFrom: string
  gradientTo: string
  borderColor: string
  textAccent: string
  tags: string[]
  route: string
}

export interface VueEnsembleData {
  cards: InterfaceCard[]
}