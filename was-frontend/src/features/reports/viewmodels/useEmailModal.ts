import { useState, useCallback } from 'react';
import type { Rapport, EnvoyerRapportDTO } from '../models/Rapport';
import RapportService from '../services/rapport.service';

interface Administrateur {
  id: number;
  nom: string;
  email: string;
  initiales: string;
  couleur: string;
}

interface Destinataire { email: string; nom: string; }

const ADMINS_DISPONIBLES: Administrateur[] = [
  { id: 1, nom: 'Naima Aounallah', email: 'naounallah581@gmail.com',    initiales: 'JD', couleur: 'linear-gradient(135deg,#4F8EF7,#7C3AED)' },
  { id: 2, nom: 'Hatem Yakoubi',   email: 'hatem.yakoubi@l-mobile.com', initiales: 'MB', couleur: 'linear-gradient(135deg,#22C55E,#059669)' },
  { id: 3, nom: 'Karim Hassan',    email: 'k.hassan@l-mobile.com',      initiales: 'KH', couleur: 'linear-gradient(135deg,#F59E0B,#D97706)' },
  { id: 4, nom: 'Sophie Moreau',   email: 's.moreau@l-mobile.com',      initiales: 'SM', couleur: 'linear-gradient(135deg,#A78BFA,#7C3AED)' },
  { id: 5, nom: 'Thomas Klein',    email: 't.klein@l-mobile.com',       initiales: 'TK', couleur: 'linear-gradient(135deg,#EF4444,#DC2626)' },
];

const MAX_FILE_SIZE = 10 * 1024 * 1024;

export const useEmailModal = () => {
  const [isOpen,             setIsOpen]             = useState(false);
  const [rapportSelectionne, setRapportSelectionne] = useState<Rapport | null>(null);
  const [seqId,              setSeqId]              = useState(0); // ✅ AJOUT
  const [destinataires,      setDestinataires]      = useState<Destinataire[]>([]);
  const [searchQuery,        setSearchQuery]        = useState('');
  const [sujet,              setSujet]              = useState('');
  const [message,            setMessage]            = useState('');
  const [pieceJointe,        setPieceJointeState]   = useState<File | null>(null);
  const [loading,            setLoading]            = useState(false);
  const [error,              setError]              = useState<string | null>(null);
  const [success,            setSuccess]            = useState(false);
  const [envoiUnique,        setEnvoiUnique]        = useState(false);

  // ✅ CORRIGÉ — accepte seqId
  const openModal = useCallback((rapport: Rapport, seq: number = 0) => {
    setRapportSelectionne(rapport);
    setSeqId(seq); // ✅ AJOUT
    setDestinataires([]);
    setSujet(rapport.titre);
    setMessage('');
    setPieceJointeState(null);
    setError(null);
    setSuccess(false);
    setSearchQuery('');
    setEnvoiUnique(false);
    setIsOpen(true);
  }, []);

  const closeModal = () => {
    setIsOpen(false);
    setRapportSelectionne(null);
    setSeqId(0); // ✅ AJOUT
    setSuccess(false);
    setEnvoiUnique(false);
  };

  const suggestionsFiltrees = ADMINS_DISPONIBLES.filter((a) =>
    !destinataires.find((d) => d.email === a.email) &&
    (searchQuery === '' ||
      a.nom.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.email.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const addDestinataire = (email: string, nom?: string) => {
    const e = email.trim();
    if (!e || destinataires.find((d) => d.email === e)) return;
    setDestinataires((prev) => [...prev, { email: e, nom: nom || e }]);
    setSearchQuery('');
  };

  const removeDestinataire = (email: string) =>
    setDestinataires((prev) => prev.filter((d) => d.email !== email));

  const setPieceJointe = (file: File | null) => {
    if (!file) { setPieceJointeState(null); return; }
    if (file.size > MAX_FILE_SIZE) { setError('Fichier trop volumineux (max 10 Mo).'); return; }
    setPieceJointeState(file);
    setError(null);
  };

  const removePieceJointe = () => setPieceJointeState(null);

  const envoyer = async () => {
    if (envoiUnique || loading) return;
    if (!rapportSelectionne) return;
    if (destinataires.length === 0) { setError('Ajoutez au moins un destinataire.'); return; }
    if (!sujet.trim()) { setError("L'objet de l'email est obligatoire."); return; }

    setEnvoiUnique(true);
    setLoading(true);
    setError(null);

    try {
      const dto: EnvoyerRapportDTO = {
        rapportId:     rapportSelectionne.id,
        destinataires: destinataires.map((d) => d.email),
        sujet, message, pieceJointe,
      };
      await RapportService.envoyer(dto);
    } catch (err: any) {
      const status = err?.response?.status;
      if (status && status >= 400) {
        setError("Erreur lors de l'envoi de l'email.");
        setEnvoiUnique(false);
        setLoading(false);
        return;
      }
    } finally {
      setLoading(false);
    }

    setSuccess(true);
  };

  return {
    isOpen, rapportSelectionne, seqId, openModal, closeModal, // ✅ seqId exposé
    destinataires, addDestinataire, removeDestinataire,
    searchQuery, setSearchQuery, suggestionsFiltrees,
    sujet, setSujet, message, setMessage,
    pieceJointe, setPieceJointe, removePieceJointe,
    loading, error, success, envoyer,
  };
};