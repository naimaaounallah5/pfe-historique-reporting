import { useState } from 'react'
import type { VueEnsembleData } from '../models/vue-ensemble.types'

const mockData: VueEnsembleData = {
  cards: [
    {
      id: 'dashboard',
      title: 'Dashboard Production',
      description: "Vue consolidée de toute la production. KPIs, graphiques de tendance et heatmap d'activité par poste.",
      icon: '📊',
      accentColor:  'bg-blue-500',
      gradientFrom: '#eff6ff',
      gradientTo:   '#dbeafe',
      borderColor:  '#bfdbfe',
      textAccent:   '#1e40af',
      tags: ['KPIs', 'Graphiques', 'SCADA · QDC · AGV'],
      route: '/dashboard',
    },
    {
      id: 'query',
      title: 'Requête de données',
      description: "Interrogez l'historique complet via filtres OData. Recherchez par date, source, opérateur ou poste.",
      icon: '🔍',
      accentColor:  'bg-violet-500',
      gradientFrom: '#f5f3ff',
      gradientTo:   '#ede9fe',
      borderColor:  '#ddd6fe',
      textAccent:   '#5b21b6',
      tags: ['Filtres OData', 'Export CSV', 'Export Excel'],
      route: '/query',
    },
    {
      id: 'reports',
      title: 'Générateur de rapport',
      description: 'Créez des rapports PDF ou Excel professionnels à partir des données de production.',
      icon: '📄',
      accentColor:  'bg-emerald-500',
      gradientFrom: '#f0fdf4',
      gradientTo:   '#dcfce7',
      borderColor:  '#bbf7d0',
      textAccent:   '#065f46',
      tags: ['PDF', 'Excel', 'Conforme ISO 9001'],
      route: '/reports',
    },
    {
      id: 'orders',
      title: 'Ordres de production',
      description: 'Consultez tous les ordres de fabrication avec statut, opérateur et historique complet.',
      icon: '📦',
      accentColor:  'bg-amber-500',
      gradientFrom: '#fffbeb',
      gradientTo:   '#fef3c7',
      borderColor:  '#fde68a',
      textAccent:   '#92400e',
      tags: ['Statut temps réel', 'Traçabilité', 'ISO 9001'],
      route: '/orders',
    },
  ],
}

export function useVueEnsemble() {
  const [data] = useState<VueEnsembleData>(mockData)
  return {
    cards: data.cards,
  }
}