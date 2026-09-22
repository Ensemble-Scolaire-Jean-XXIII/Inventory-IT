import { api } from "./api";
import { User } from "../types/models";

export const authService = {
  login: async (
    username: string,
    password: string,
  ): Promise<{ token: string; user: User }> => {
    return api.post("/auth/login", { username, password });
  },
  me: async (): Promise<User> => {
    return api.get("/auth/me");
  },
  updateProfile: async (email: string | null): Promise<User> => {
    return api.put("/auth/profile", { email });
  },
  updatePassword: async (
    currentPassword: string,
    newPassword: string,
  ): Promise<{ success: boolean }> => {
    return api.put("/auth/password", { currentPassword, newPassword });
  },
};