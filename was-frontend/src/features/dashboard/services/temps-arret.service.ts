// was-frontend/src/features/dashboard/services/temps-arret.service.ts
import axios from 'axios';
import type { TempsArretResponse, TempsArretQueryParams } from '../models/temps-arret.model';

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

export const tempsArretService = {
  getDashboard: async (params?: TempsArretQueryParams): Promise<TempsArretResponse> => {
    const queryParams = new URLSearchParams();
    
    if (params?.machineId) queryParams.append('machineId', params.machineId.toString());
    if (params?.produitId) queryParams.append('produitId', params.produitId.toString());
    if (params?.annee) queryParams.append('annee', params.annee.toString());
    if (params?.trimestre) queryParams.append('trimestre', params.trimestre.toString());

    const { data } = await api.get<TempsArretResponse>('/TempsArret/dashboard', { 
      params: queryParams 
    });
    
    return data;
  }
};