import { api } from "./api";
import { User } from "../types/models";

export interface CreateUserPayload {
  email: string;
  first_name: string;
  last_name: string;
}

export const userService = {
  getUsers: async (): Promise<User[]> => api.get("/users"),

  createUser: async (
    payload: CreateUserPayload,
  ): Promise<{ id: string; name: string; email: string; temporaryPassword?: string }> =>
    api.post("/users", payload),

  removeUser: async (id: string): Promise<void> => api.delete(`/users/${id}`),
};