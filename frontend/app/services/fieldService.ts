import { api } from "./api";
import { CreateObjectFieldPayload, ObjectField } from "../types/models";

export const fieldService = {
  add: async (
    typeId: number,
    data: CreateObjectFieldPayload,
  ): Promise<{ id: number }> => {
    return api.post(`/types/${typeId}/fields`, data);
  },
  update: async (
    id: number,
    data: Partial<ObjectField>,
  ): Promise<unknown> => {
    return api.put(`/fields/${id}`, data);
  },
  remove: async (id: number): Promise<unknown> => {
    return api.delete(`/fields/${id}`);
  },
};