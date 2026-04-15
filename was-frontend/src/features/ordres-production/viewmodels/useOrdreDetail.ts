import { useState } from 'react'
import type { OrdreProductionDetailDTO } from '../models/OrdreProduction'
import OrdreService from '../services/ordre.service'

export const useOrdreDetail = () => {
  const [isOpen,   setIsOpen]   = useState(false)
  const [detail,   setDetail]   = useState<OrdreProductionDetailDTO | null>(null)
  const [loading,  setLoading]  = useState(false)
  const [onglet,   setOnglet]   = useState<'infos' | 'lignes' | 'composants' | 'operations'>('infos')

  const ouvrirDetail = async (numero: string) => {
    setIsOpen(true)
    setLoading(true)
    setOnglet('infos')
    try {
      const data = await OrdreService.getDetail(numero)
      setDetail(data)
    } catch {
      setDetail(null)
    } finally {
      setLoading(false)
    }
  }

  const fermer = () => {
    setIsOpen(false)
    setDetail(null)
  }

  return {
    isOpen, detail, loading, onglet, setOnglet,
    ouvrirDetail, fermer,
    exportPdf:   () => detail && OrdreService.exportOrdrePdf(detail.ordre.numero),
    exportExcel: () => detail && OrdreService.exportOrdreExcel(detail.ordre.numero),
    imprimer:    () => detail && OrdreService.imprimerOrdre(detail.ordre.numero),
  }
}