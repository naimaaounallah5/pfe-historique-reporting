import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import type { LoginFormStateModel, LoginRequestModel } from "../models/User.model";
import { AuthService } from "../services/Auth.service";

export interface LoginViewModel {
  state: LoginFormStateModel;
  mounted: boolean;
  focused: string;
  isValid: boolean;
  onIdentifiantChange: (v: string) => void;
  onPasswordChange: (v: string) => void;
  onTogglePassword: () => void;
  onFocus: (field: string) => void;
  onBlur: () => void;
  onSubmit: () => Promise<void>;
}

export const useLoginViewModel = (): LoginViewModel => {
  const navigate = useNavigate();

  const [state, setState] = useState<LoginFormStateModel>({
    identifiant: "",
    password: "",
    showPassword: false,
    loading: false,
    error: null,
    success: false,
  });

  const [mounted, setMounted] = useState(false);
  const [focused, setFocused] = useState("");

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 100);
    return () => clearTimeout(t);
  }, []);

  const isValid =
    state.identifiant.trim().length > 0 && state.password.length >= 4;

  const onIdentifiantChange = (v: string) =>
    setState(s => ({ ...s, identifiant: v, error: null }));

  const onPasswordChange = (v: string) =>
    setState(s => ({ ...s, password: v, error: null }));

  const onTogglePassword = () =>
    setState(s => ({ ...s, showPassword: !s.showPassword }));

  const onFocus = (field: string) => setFocused(field);
  const onBlur = () => setFocused("");

  const onSubmit = async () => {
    if (!isValid || state.loading) return;
    setState(s => ({ ...s, loading: true, error: null }));

    try {
      const request: LoginRequestModel = {
        identifiant: state.identifiant,
        password: state.password,
      };

      const response = await AuthService.login(request);

      if (response.success) {
        // ✅ Connexion réussie
        AuthService.saveUser(response.user.nom, response.user.prenom, response.user.role);
        setState(s => ({ ...s, loading: false, success: true }));
        setTimeout(() => navigate("/vue-ensemble"), 800);
      } else {
        // ✅ Affiche exactement "Identifiant incorrect." ou "Mot de passe incorrect."
        setState(s => ({ ...s, loading: false, error: response.message }));
      }
    } catch (error) {
      setState(s => ({
        ...s,
        loading: false,
        error: "Erreur d'accès au serveur.",
      }));
    }
  };

  return {
    state, mounted, focused, isValid,
    onIdentifiantChange, onPasswordChange,
    onTogglePassword, onFocus, onBlur, onSubmit,
  };
};