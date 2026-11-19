import { api } from "./api";
import {
  InventoryObject,
  CreateObjectPayload,
  UpdateObjectPayload,
  ImportObjectRowPayload,
  ImportObjectsResult,
} from "../types/models";

export const objectService = {
  getAll: async (): Promise<InventoryObject[]> => {
    return api.get("/objects");
  },
  create: async (data: CreateObjectPayload): Promise<{ id: number; count: number }> => {
    return api.post("/objects", data);
  },
  importRows: async (
    object_type_id: number,
    rows: ImportObjectRowPayload[],
  ): Promise<ImportObjectsResult> => {
    return api.post("/objects/import", { object_type_id, rows });
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