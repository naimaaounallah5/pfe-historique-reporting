import type { LoginRequestModel, LoginResponseModel } from "../models/User.model";

const API_BASE_URL = "http://localhost:5088/api";

export const AuthService = {
  login: async (request: LoginRequestModel): Promise<LoginResponseModel> => {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(request),
    });

    const data = await response.json();

    // Normalisation PascalCase → camelCase
    if (data.User && !data.user) data.user = data.User;
    if (data.Success !== undefined && data.success === undefined) data.success = data.Success;
    if (data.Message !== undefined && data.message === undefined) data.message = data.Message;

    // ✅ On retourne directement sans throw
    // Le message "Identifiant incorrect." ou "Mot de passe incorrect." passe tel quel
    return data as LoginResponseModel;
  },

  saveUser: (nom: string, prenom: string, role: string): void => {
    localStorage.setItem("lmobile_user", JSON.stringify({ nom, prenom, role }));
  },

  getUser: (): { nom: string; prenom: string; role: string } | null => {
    const u = localStorage.getItem("lmobile_user");
    return u ? JSON.parse(u) : null;
  },

  isAuthenticated: (): boolean => {
    return !!localStorage.getItem("lmobile_user");
  },

  logout: (): void => {
    localStorage.removeItem("lmobile_user");
  },
};