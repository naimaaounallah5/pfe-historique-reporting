// features/dashboard/services/chiffre-affaires.service.ts
import axios from 'axios';
import type { CA_Response, CA_QueryParams } from '../models/chiffre-affaires.model';

// ✅ CORRECTION : Utiliser le bon endpoint /ChiffreAffaires/dashboard (avec majuscule)
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5088/api';

const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' }
});

api.interceptors.request.use(config => {
  const token = localStorage.getItem('lmobile_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export const chiffreAffairesService = {
  getDashboard: async (params?: CA_QueryParams): Promise<CA_Response> => {
    const queryParams = new URLSearchParams();
    
    if (params?.annee) queryParams.append('annee', params.annee.toString());
    if (params?.trimestre) queryParams.append('trimestre', params.trimestre.toString());
    if (params?.clientId) queryParams.append('clientId', params.clientId.toString());
    if (params?.produitId) queryParams.append('produitId', params.produitId.toString());

    // ✅ URL correcte : /ChiffreAffaires/dashboard (avec majuscule)
    const { data } = await api.get<CA_Response>('/ChiffreAffaires/dashboard', { 
      params: queryParams 
    });
    
    return data;
  }
};