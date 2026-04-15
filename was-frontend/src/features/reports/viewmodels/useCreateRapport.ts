import { useState } from 'react';
import type { RapportType, RapportFormat } from '../models/Rapport';
import RapportService from '../services/rapport.service';

interface OptionActive {
  id:    string;
  label: string;
  value: string;
}

export const useCreateRapport = (onSuccess: (r: any) => void) => {
  const [isOpen,  setIsOpen]  = useState(false);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');
  const [success, setSuccess] = useState(false);

  const [form, setFormState] = useState({
    titre:       '',
    type:        'Production' as RapportType,
    format:      'PDF' as RapportFormat,
    contenu:     '',
    responsable: 'Ahmed B. — Superviseur',
    dateRapport: new Date().toISOString().split('T')[0],
  });

  const [optionsActives, setOptionsActives] = useState<OptionActive[]>([]);

  const openModal = () => {
    setIsOpen(true);
    setError('');
    setSuccess(false);
    setOptionsActives([]);
    setFormState({
      titre: '', type: 'Production', format: 'PDF', contenu: '',
      responsable: 'Ahmed B. — Superviseur',
      dateRapport: new Date().toISOString().split('T')[0],
    });
  };

  const closeModal = () => setIsOpen(false);

  const setField = (key: string, value: string) => {
    setFormState((prev) => ({ ...prev, [key]: value }));
    if (key === 'type') setOptionsActives([]);
  };

  const toggleOption = (id: string, label: string) => {
    setOptionsActives((prev) =>
      prev.find((o) => o.id === id)
        ? prev.filter((o) => o.id !== id)
        : [...prev, { id, label, value: '' }]
    );
  };

  const setOptionValue = (id: string, value: string) => {
    setOptionsActives((prev) =>
      prev.map((o) => (o.id === id ? { ...o, value } : o))
    );
  };

  const isOptionActive = (id: string) => !!optionsActives.find((o) => o.id === id);
  const getOptionValue = (id: string) => optionsActives.find((o) => o.id === id)?.value ?? '';

  const submit = async () => {
    if (!form.titre.trim())          { setError('Le titre est obligatoire.');         return; }
    if (optionsActives.length === 0) { setError('Sélectionnez au moins une option.'); return; }

    setLoading(true);
    setError('');
    try {
      const optionsData = JSON.stringify(
        optionsActives.map((o) => ({ label: o.label, value: o.value }))
      );
      const rapport = await RapportService.create({
        titre:            form.titre,
        type:             form.type,
        format:           form.format,
        contenu:          form.contenu,
        responsable:      form.responsable,
        dateRapport:      form.dateRapport,
        optionsData,
        administrateurId: 1,
      });
      setSuccess(true);
      setTimeout(() => { closeModal(); onSuccess(rapport); }, 1500);
    } catch {
      setError('Erreur lors de la création.');
    } finally {
      setLoading(false);
    }
  };

  return {
    isOpen, loading, error, success, form, setField,
    optionsActives, toggleOption, setOptionValue,
    isOptionActive, getOptionValue, openModal, closeModal, submit,
  };
};