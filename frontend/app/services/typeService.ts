import { api } from "./api";
import { ObjectType, CreateObjectTypePayload } from "../types/models";

export const typeService = {
  getAll: async (): Promise<ObjectType[]> => {
    return api.get("/types");
  },
  create: async (data: CreateObjectTypePayload): Promise<{ id: number }> => {
    return api.post("/types", data);
  },
  update: async (
    id: number,
    data: Partial<ObjectType>,
  ): Promise<unknown> => {
    return api.put(`/types/${id}`, data);
  },
  reorder: async (ids: number[]): Promise<unknown> => {
    return api.put("/types/reorder", { ids });
  },
  remove: async (id: number): Promise<unknown> => {
    return api.delete(`/types/${id}`);
  },
};