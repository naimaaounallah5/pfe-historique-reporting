import axios from 'axios';
import type { Rapport, CreateRapportDTO, EnvoyerRapportDTO, RapportFiltre } from '../models/Rapport';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5088/api';
const USE_MOCK = false;

const MOCK_RAPPORTS: Rapport[] = [
  { id: 1, titre: 'Rapport de production Janvier 2025', type: 'Production',  format: 'PDF',   statut: 'Envoyé',     dateCreation: '2025-01-15', contenu: '', administrateurId: 1 },
  { id: 2, titre: 'Contrôle qualité — Lots Q1',         type: 'Qualité',     format: 'PDF',   statut: 'Envoyé',     dateCreation: '2025-01-18', contenu: '', administrateurId: 1 },
  { id: 3, titre: 'Bilan maintenance machines Février', type: 'Maintenance', format: 'PDF',   statut: 'En attente', dateCreation: '2025-02-02', contenu: '', administrateurId: 1 },
  { id: 4, titre: 'Mouvements de stock — Entrepôt A',   type: 'Stock',       format: 'PDF',   statut: 'Créé',       dateCreation: '2025-02-10', contenu: '', administrateurId: 1 },
  { id: 5, titre: 'Synthèse production Trimestre 1',    type: 'Production',  format: 'Excel', statut: 'Brouillon',  dateCreation: '2025-02-15', contenu: '', administrateurId: 1 },
  { id: 6, titre: 'Rapport AGV — Transferts Mars',      type: 'Maintenance', format: 'PDF',   statut: 'Envoyé',     dateCreation: '2025-03-01', contenu: '', administrateurId: 1 },
  { id: 7, titre: 'Analyse qualité lots B2',            type: 'Qualité',     format: 'PDF',   statut: 'Créé',       dateCreation: '2025-03-05', contenu: '', administrateurId: 1 },
  { id: 8, titre: 'Stock critique — Alerte Mars',       type: 'Stock',       format: 'Excel', statut: 'En attente', dateCreation: '2025-03-10', contenu: '', administrateurId: 1 },
];
let mockData = [...MOCK_RAPPORTS];

const MIME_EXCEL = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

const api = axios.create({ baseURL: BASE_URL, headers: { 'Content-Type': 'application/json' } });

api.interceptors.request.use(config => {
  const token = localStorage.getItem('lmobile_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

const downloadBlob = (data: BlobPart, filename: string, mime: string) => {
  const url = window.URL.createObjectURL(new Blob([data], { type: mime }));
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
};

const RapportService = {

  getAll: async (filtre?: Partial<RapportFiltre>): Promise<Rapport[]> => {
    if (USE_MOCK) {
      await new Promise((r) => setTimeout(r, 400));
      let result = [...mockData];
      if (filtre?.search) result = result.filter((r) => r.titre.toLowerCase().includes(filtre.search!.toLowerCase()));
      if (filtre?.type)   result = result.filter((r) => r.type   === filtre.type);
      if (filtre?.statut) result = result.filter((r) => r.statut === filtre.statut);
      if (filtre?.format) result = result.filter((r) => r.format === filtre.format);
      return result;
    }
    const params = new URLSearchParams();
    if (filtre?.search) params.append('search', filtre.search);
    if (filtre?.type)   params.append('type',   filtre.type);
    if (filtre?.statut) params.append('statut', filtre.statut);
    if (filtre?.format) params.append('format', filtre.format);
    const { data } = await api.get<Rapport[]>('/rapports', { params });
    return data;
  },

  create: async (dto: CreateRapportDTO): Promise<Rapport> => {
    if (USE_MOCK) {
      await new Promise((r) => setTimeout(r, 600));
      const newRapport: Rapport = {
        id: mockData.length + 1, titre: dto.titre, type: dto.type, format: dto.format,
        contenu: dto.contenu, statut: 'Créé',
        dateCreation: new Date().toISOString(),
        administrateurId: dto.administrateurId,
      };
      mockData = [newRapport, ...mockData];
      return newRapport;
    }
    const { data } = await api.post<Rapport>('/rapports', dto);
    return data;
  },

  delete: async (id: number): Promise<void> => {
    if (USE_MOCK) { mockData = mockData.filter((r) => r.id !== id); return; }
    await api.delete(`/rapports/${id}`);
  },

  // ✅ CORRIGÉ — passer seqId
  downloadPdf: async (id: number, seqId: number): Promise<void> => {
    const response = await api.get(`/rapports/${id}/download`, {
      params: { format: 'PDF', seq: seqId },
      responseType: 'blob',
    });
    downloadBlob(response.data, `rapport_${String(seqId).padStart(3,'0')}.pdf`, 'application/pdf');
  },

  // ✅ CORRIGÉ — passer seqId
  downloadCsv: async (id: number, seqId: number): Promise<void> => {
    const response = await api.get(`/rapports/${id}/download`, {
      params: { format: 'CSV', seq: seqId },
      responseType: 'blob',
    });
    downloadBlob(response.data, `rapport_${String(seqId).padStart(3,'0')}.xlsx`, MIME_EXCEL);
  },

  download: async (id: number, format: 'PDF' | 'Excel', seqId: number): Promise<void> => {
    if (format === 'PDF') return RapportService.downloadPdf(id, seqId);
    return RapportService.downloadCsv(id, seqId);
  },

  exportAllPdf: async (): Promise<void> => {
    const response = await api.get('/rapports/export-all', {
      params: { format: 'PDF' },
      responseType: 'blob',
    });
    downloadBlob(response.data, 'rapports_liste.pdf', 'application/pdf');
  },

  exportAllCsv: async (): Promise<void> => {
    const response = await api.get('/rapports/export-all', {
      params: { format: 'CSV' },
      responseType: 'blob',
    });
    downloadBlob(response.data, 'rapports_liste.xlsx', MIME_EXCEL);
  },

  exportAll: async (format: 'PDF' | 'Excel'): Promise<void> => {
    if (format === 'PDF') return RapportService.exportAllPdf();
    return RapportService.exportAllCsv();
  },

  envoyer: async (dto: EnvoyerRapportDTO): Promise<void> => {
    if (USE_MOCK) {
      await new Promise((r) => setTimeout(r, 1000));
      const rapport = mockData.find((r) => r.id === dto.rapportId);
      if (rapport) rapport.statut = 'Envoyé';
      return;
    }
    const formData = new FormData();
    formData.append('rapportId',  String(dto.rapportId));
    formData.append('sujet',      dto.sujet);
    formData.append('message',    dto.message ?? '');
    dto.destinataires.forEach((email) => formData.append('destinataires', email));
    if (dto.pieceJointe) formData.append('pieceJointe', dto.pieceJointe);
    await api.post(`/rapports/${dto.rapportId}/envoyer`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  // ✅ CORRIGÉ — passer seqId
  imprimer: async (id: number, seqId: number): Promise<void> => {
    const response = await api.get(`/rapports/${id}/download`, {
      params: { format: 'PDF', seq: seqId },
      responseType: 'blob',
    });
    const url = window.URL.createObjectURL(
      new Blob([response.data], { type: 'application/pdf' })
    );
    const win = window.open(url, '_blank');
    if (win) win.onload = () => { win.focus(); win.print(); };
  },
};

export default RapportService;