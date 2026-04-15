import axios from 'axios'
import type { OrdreProduction, OrdreProductionDetailDTO } from '../models/OrdreProduction'

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5088/api'

// ✅ Axios avec token JWT
const api = axios.create({ baseURL: BASE_URL })
api.interceptors.request.use(config => {
  const token = localStorage.getItem('lmobile_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

const OrdreService = {

  getAll: async (search?: string, statut?: number, codeSite?: string): Promise<OrdreProduction[]> => {
    const params = new URLSearchParams()
    if (search)               params.append('search', search)
    if (statut !== undefined) params.append('statut', String(statut))
    if (codeSite)             params.append('codeSite', codeSite)
    const res = await api.get(`/ordresproduction?${params}`)
    return res.data
  },

  getDetail: async (numero: string): Promise<OrdreProductionDetailDTO> => {
    const res = await api.get(`/ordresproduction/${numero}/detail`)
    return res.data
  },

  exportTableauPdf: (search?: string, statut?: number, codeSite?: string) => {
    const params = new URLSearchParams()
    if (search)               params.append('search', search)
    if (statut !== undefined) params.append('statut', String(statut))
    if (codeSite)             params.append('codeSite', codeSite)
    const token = localStorage.getItem('lmobile_token')
    params.append('token', token ?? '')
    window.open(`${BASE_URL}/ordresproduction/export-tableau-pdf?${params}`, '_blank')
  },

  exportTableauExcel: (search?: string, statut?: number, codeSite?: string) => {
    const params = new URLSearchParams()
    if (search)               params.append('search', search)
    if (statut !== undefined) params.append('statut', String(statut))
    if (codeSite)             params.append('codeSite', codeSite)
    const token = localStorage.getItem('lmobile_token')
    params.append('token', token ?? '')
    window.open(`${BASE_URL}/ordresproduction/export-tableau-excel?${params}`, '_blank')
  },

  exportOrdrePdf: (numero: string) => {
    const token = localStorage.getItem('lmobile_token')
    window.open(`${BASE_URL}/ordresproduction/${numero}/export-pdf?token=${token}`, '_blank')
  },

  exportOrdreExcel: (numero: string) => {
    const token = localStorage.getItem('lmobile_token')
    window.open(`${BASE_URL}/ordresproduction/${numero}/export-excel?token=${token}`, '_blank')
  },

  imprimerTableau: () => window.print(),
  imprimerOrdre:   (numero: string) => {
    const token = localStorage.getItem('lmobile_token')
    window.open(`${BASE_URL}/ordresproduction/${numero}/export-pdf?token=${token}`, '_blank')
  },
}

export default OrdreService