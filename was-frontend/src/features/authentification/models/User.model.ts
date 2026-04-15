export interface UserModel {
  id: number;
  identifiant: string;
  nom: string;
  prenom: string;
  role: string;
}

export interface LoginRequestModel {
  identifiant: string;
  password: string;
}

export interface LoginResponseModel {
  success: boolean;
  user: UserModel;
  message: string;
}

export interface LoginFormStateModel {
  identifiant: string;
  password: string;
  showPassword: boolean;
  loading: boolean;
  error: string | null;
  success: boolean;
}