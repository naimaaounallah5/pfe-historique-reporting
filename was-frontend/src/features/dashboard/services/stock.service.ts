// features/dashboard/services/stock.service.ts
import axios from 'axios';
import type { StockResponse, StockQueryParams } from '../models/stock.model';

// ✅ CORRECTION : Changer le port de 5050 à 5088
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

export const stockService = {
  getDashboard: async (params?: StockQueryParams): Promise<StockResponse> => {
    const queryParams = new URLSearchParams();
    
    if (params?.annee) queryParams.append('annee', params.annee.toString());
    if (params?.trimestre) queryParams.append('trimestre', params.trimestre.toString());
    if (params?.produit) queryParams.append('produit', params.produit);
    if (params?.categorie) queryParams.append('categorie', params.categorie);

    const { data } = await api.get<StockResponse>('/stock/dashboard', { 
      params: queryParams 
    });
    
    return data;
  }
};