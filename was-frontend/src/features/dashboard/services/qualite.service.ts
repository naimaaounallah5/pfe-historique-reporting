// features/dashboard/services/qualite.service.ts
import axios from 'axios';
import type { QualiteResponse, QualiteQueryParams } from '../models/qualite.model';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5088/api';

const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' }
});

// Token JWT
api.interceptors.request.use(config => {
  const token = localStorage.getItem('lmobile_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export const qualiteService = {
  getDashboard: async (params?: QualiteQueryParams): Promise<QualiteResponse> => {
    const queryParams = new URLSearchParams();
    
    if (params?.annee) queryParams.append('annee', params.annee.toString());
    if (params?.trimestre) queryParams.append('trimestre', params.trimestre.toString());
    if (params?.produit) queryParams.append('produit', params.produit);
    if (params?.machine) queryParams.append('machine', params.machine);
    if (params?.categorie) queryParams.append('categorie', params.categorie);

    const { data } = await api.get<QualiteResponse>('/Qualite/dashboard', { 
      params: queryParams 
    });
    
    return data;
  }
};