export interface QuickStat {
  id: string
  label: string
  value: string
  color: string
  icon: string
}

export interface InterfaceCard {
  id: string
  title: string
  description: string
  icon: string
  borderColor: string
  tags: string[]
  route: string
}

export interface ScheduledReport {
  id: string
  title: string
  frequency: string
  recipient: string
  active: boolean
}