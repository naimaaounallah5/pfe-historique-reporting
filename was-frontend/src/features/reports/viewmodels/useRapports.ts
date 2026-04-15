import { useState, useEffect, useCallback, useRef } from 'react';
import * as signalR from '@microsoft/signalr';
import type { Rapport, RapportFiltre } from '../models/Rapport';
import RapportService from '../services/rapport.service';

const ITEMS_PER_PAGE = 8;
const HUB_URL = 'http://localhost:5088/hubs/production';

const defaultFiltre: RapportFiltre = {
  search: '', type: '', statut: '', format: '',
};

let globalConnection: signalR.HubConnection | null = null;
let globalConnectionPromise: Promise<void> | null = null;
let globalConnectionCount = 0;

export const useRapports = () => {
  const [rapports, setRapports] = useState<Rapport[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filtre, setFiltreState] = useState<RapportFiltre>(defaultFiltre);
  const [page, setPage] = useState(1);
  const [connexionStatut, setConnexionStatut] = useState('connecting');
  const [derniereMAJ, setDerniereMAJ] = useState<Date | null>(null);
  const [exportWarning, setExportWarning] = useState<string | null>(null);
  
  const connexionRef = useRef<any>(null);
  const reconnectTimerRef = useRef<any>(null);
  const instanceId = useRef(Math.random().toString(36).substring(7));

  const fetchRapports = useCallback(async (showLoading = true) => {
    if (showLoading) setLoading(true);
    setError(null);
    try {
      const data = await RapportService.getAll();
      setRapports(data.sort((a: any, b: any) => a.id - b.id));
      setDerniereMAJ(new Date());
    } catch (err) {
      setError('Erreur lors du chargement des rapports.');
    } finally {
      if (showLoading) setLoading(false);
    }
  }, []);

  useEffect(() => { 
    fetchRapports(); 
  }, [fetchRapports]);

  useEffect(() => {
    const instanceId_ = instanceId.current;
    globalConnectionCount++;

    if (globalConnection) {
      connexionRef.current = globalConnection;
      setConnexionStatut(globalConnection.state === 'Connected' ? 'connected' : 'connecting');
      globalConnection.on('rapportsmisajour', () => fetchRapports(false));
      return;
    }

    const connect = async () => {
      if (globalConnectionPromise) {
        await globalConnectionPromise;
        connexionRef.current = globalConnection;
        setConnexionStatut(globalConnection?.state === 'Connected' ? 'connected' : 'connecting');
        return;
      }

      const connection = new signalR.HubConnectionBuilder()
        .withUrl(HUB_URL)
        .withAutomaticReconnect([0, 2000, 5000, 10000])
        .configureLogging(signalR.LogLevel.Warning)
        .build();

      connection.on('rapportsmisajour', () => fetchRapports(false));
      connection.on('RapportsMisAJour', () => fetchRapports(false));

      connection.onclose(() => {
        setConnexionStatut('disconnected');
        globalConnection = null;
        globalConnectionPromise = null;
        if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
        reconnectTimerRef.current = setTimeout(connect, 5000);
      });

      connection.onreconnecting(() => setConnexionStatut('reconnecting'));

      connection.onreconnected(() => {
        setConnexionStatut('connected');
        fetchRapports(false);
      });

      globalConnectionPromise = connection.start()
        .then(() => {
          setConnexionStatut('connected');
          globalConnection = connection;
          connexionRef.current = connection;
          console.log(' ✅ Rapport - Connecté en temps réel');
        })
        .catch(() => {
          setConnexionStatut('disconnected');
          globalConnection = null;
          globalConnectionPromise = null;
          if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
          reconnectTimerRef.current = setTimeout(connect, 10000);
        });

      await globalConnectionPromise;
    };

    connect();

    return () => {
      globalConnectionCount--;
      if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
      if (globalConnectionCount === 0 && globalConnection) {
        globalConnection.stop().catch(() => {});
        globalConnection = null;
        globalConnectionPromise = null;
      }
    };
  }, [fetchRapports]);

  const rapportsFiltres = rapports.filter((r: any) => {
    const matchSearch = filtre.search === '' ||
      r.titre?.toLowerCase().includes(filtre.search.toLowerCase()) ||
      String(r.id).includes(filtre.search);
    const matchType = filtre.type === '' || r.type === filtre.type;
    const matchStatut = filtre.statut === '' || r.statut === filtre.statut;
    const matchFormat = filtre.format === '' || r.format === filtre.format;
    return matchSearch && matchType && matchStatut && matchFormat;
  });

  const totalPages = Math.max(1, Math.ceil(rapportsFiltres.length / ITEMS_PER_PAGE));
  const rapportsPage = rapportsFiltres.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  const stats = {
    total: rapports.length,
    envoyes: rapports.filter((r: any) => r.statut === 'Envoyé').length,
    enAttente: rapports.filter((r: any) => r.statut === 'En attente').length,
    brouillons: rapports.filter((r: any) => r.statut === 'Brouillon').length,
  };

  const setFiltre = (partial: any) => {
    setFiltreState((prev) => ({ ...prev, ...partial }));
    setPage(1);
  };

  const deleteRapport = async (id: number) => {
    try {
      await RapportService.delete(id);
      fetchRapports(true);
    } catch {
      setError('Erreur lors de la suppression.');
    }
  };

 const downloadRapport = async (id: number, format: 'PDF' | 'Excel', seqId: number = 0) => {
  try {
    await RapportService.download(id, format, seqId);
  } catch {
    setError('Erreur lors du téléchargement.');
  }
};

  // Fonction exportAll avec vérification du tableau vide (TABLE 5.2 - Scénario alternatif)
  const exportAll = async (format: 'PDF' | 'Excel') => {
    // Vérification selon le scénario alternatif : Tableau vide
    if (rapportsFiltres.length === 0) {
      setExportWarning('⚠️ Tableau vide : Aucune donnée à exporter. Veuillez vérifier vos filtres.');
      setTimeout(() => setExportWarning(null), 5000);
      return; // Arrêter le téléchargement
    }
    
    // Si des données existent, procéder à l'export
    try {
      await RapportService.exportAll(format);
    } catch {
      setError("Erreur lors de l'export.");
    }
  };

  const imprimerRapport = async (id: number) => {
    try {
      const rapport = rapports.find((r: any) => r.id === id);
      if (!rapport) return;

      let optionsArray: { label: string; valeur: string }[] = [];
      if (rapport.optionsData) {
        try {
          const parsed = JSON.parse(rapport.optionsData);
          if (Array.isArray(parsed)) {
            optionsArray = parsed.map((o: any) => ({
              label: o.label ?? '',
              valeur: o.value ?? o.valeur ?? '',
            }));
          }
        } catch { optionsArray = []; }
      }
      
      const iframe = document.createElement('iframe');
      iframe.style.position = 'fixed';
      iframe.style.right = '0';
      iframe.style.bottom = '0';
      iframe.style.width = '0';
      iframe.style.height = '0';
      iframe.style.border = 'none';
      document.body.appendChild(iframe);

      const doc = iframe.contentWindow?.document;
      if (!doc) return;

      doc.open();
      doc.write(`
        <!DOCTYPE html>
        <html lang="fr">
        <head>
          <meta charset="UTF-8"/>
          <title>${rapport.titre}</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: Arial, sans-serif; padding: 32px; color: #111827; font-size: 13px; }
            .hdr { text-align: center; margin-bottom: 24px; padding-bottom: 16px; border-bottom: 3px solid #4F46E5; }
            .hdr h1 { font-size: 22px; font-weight: 700; margin-bottom: 6px; color: #1e1b4b; }
            .hdr .meta { font-size: 12px; color: #6b7280; }
            .section-title { font-size: 11px; font-weight: 700; text-transform: uppercase; color: #4F46E5; letter-spacing: .08em; margin: 20px 0 10px; padding-bottom: 4px; border-bottom: 1px solid #e0e7ff; }
            .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 10px; }
            .field { background: #f9fafb; border-radius: 8px; padding: 10px 14px; border-left: 3px solid #e0e7ff; }
            .field-label { font-size: 10px; font-weight: 700; text-transform: uppercase; color: #6b7280; margin-bottom: 3px; }
            .field-value { font-size: 13px; font-weight: 600; color: #111827; }
            .field-full { background: #f9fafb; border-radius: 8px; padding: 10px 14px; border-left: 3px solid #e0e7ff; margin-bottom: 10px; }
            .badge { display: inline-block; padding: 3px 12px; border-radius: 20px; font-size: 11px; font-weight: 700; }
            .sent { background: #d1fae5; color: #065f46; }
            .created { background: #dbeafe; color: #1e40af; }
            .options-table { width: 100%; border-collapse: collapse; margin-top: 6px; }
            .options-table th { background: #4F46E5; color: #fff; padding: 8px 12px; text-align: left; font-size: 11px; text-transform: uppercase; }
            .options-table td { padding: 8px 12px; border-bottom: 1px solid #e5e7eb; font-size: 12px; }
            .options-table tr:nth-child(even) td { background: #f5f3ff; }
            .ftr { margin-top: 32px; padding-top: 12px; border-top: 2px solid #e5e7eb; text-align: center; font-size: 10px; color: #9ca3af; }
            @media print { @page { margin: 1.5cm; size: A4; } body { padding: 0; } }
          </style>
        </head>
        <body>
          <div class="hdr">
            <h1>📄 ${rapport.titre}</h1>
            <div class="meta">#RPT-${String(rapport.id).padStart(3,'0')} · Généré le ${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR')}</div>
          </div>

          <div class="section-title">Informations générales</div>
          <div class="grid">
            <div class="field">
              <div class="field-label">Statut</div>
              <div class="field-value">
                <span class="badge ${rapport.statut === 'Envoyé' ? 'sent' : 'created'}">● ${rapport.statut}</span>
              </div>
            </div>
            <div class="field">
              <div class="field-label">Format</div>
              <div class="field-value">${rapport.format}</div>
            </div>
            <div class="field">
              <div class="field-label">Type</div>
              <div class="field-value">${rapport.type}</div>
            </div>
            <div class="field">
              <div class="field-label">Date création</div>
              <div class="field-value">${new Date(rapport.dateCreation).toLocaleDateString('fr-FR')}</div>
            </div>
            ${rapport.responsable ? `
            <div class="field">
              <div class="field-label">Responsable</div>
              <div class="field-value">${rapport.responsable}</div>
            </div>` : ''}
            ${rapport.dateRapport ? `
            <div class="field">
              <div class="field-label">Date du rapport</div>
              <div class="field-value">${new Date(rapport.dateRapport).toLocaleDateString('fr-FR')}</div>
            </div>` : ''}
          </div>

          ${rapport.contenu ? `
          <div class="section-title">Description</div>
          <div class="field-full">
            <div class="field-value" style="font-weight:400;line-height:1.6">${rapport.contenu}</div>
          </div>` : ''}

          ${optionsArray.length > 0 ? `
          <div class="section-title">Détails du rapport · ${optionsArray.length} champs</div>
          <table class="options-table">
<thead><tr><th>Champ</th><th>Valeur</th></tr></thead>
            <tbody>
              ${optionsArray.map(o => `
                <tr>
                  <td style="font-weight:600;color:#4F46E5">${o.label}</td>
                  <td>${o.valeur}</td>
                 </tr>`).join('')}
            </tbody>
          </table>` : ''}

          <div class="ftr">
            I-mobile WAS v2.4 — ISO 9001 | ${rapport.titre} | Imprimé le ${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR')}
          </div>
        </body>
        </html>
      `);
      doc.close();

      iframe.contentWindow?.focus();
      setTimeout(() => {
        iframe.contentWindow?.print();
        setTimeout(() => document.body.removeChild(iframe), 2000);
      }, 500);

    } catch {
      setError("Erreur lors de l'impression.");
    }
  };

  return {
    rapports,
    rapportsFiltres,
    loading,
    error,
    filtre,
    setFiltre,
    page,
    totalPages,
    rapportsPage,
    goToPage: setPage,
    refresh: () => fetchRapports(true),
    deleteRapport,
    downloadRapport,
    exportAll,
    imprimerRapport,
    stats,
    connexionStatut,
    derniereMAJ,
    exportWarning,
  };
};