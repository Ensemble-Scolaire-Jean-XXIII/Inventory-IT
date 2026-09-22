import { api } from "./api";
import {
  InventoryObject,
  CreateObjectPayload,
  UpdateObjectPayload,
} from "../types/models";

export const objectService = {
  getAll: async (): Promise<InventoryObject[]> => {
    return api.get("/objects");
  },
  create: async (data: CreateObjectPayload): Promise<{ id: number }> => {
    return api.post("/objects", data);
  },
  update: async (
    id: number,
    data: UpdateObjectPayload,
  ): Promise<unknown> => {
    return api.put(`/objects/${id}`, data);
  },
  remove: async (id: number): Promise<unknown> => {
    return api.delete(`/objects/${id}`);
  },
};