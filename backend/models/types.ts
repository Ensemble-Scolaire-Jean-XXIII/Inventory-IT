export type FieldInputType =
  | "text"
  | "number"
  | "date"
  | "mac"
  | "ip"
  | "select"
  | "boolean";

export interface User {
  id: string;
  email: string;
  first_name?: string | null;
  last_name?: string | null;
  password_hash: string;
  created_at?: string;
}

export interface ObjectType {
  id: number;
  name: string;
  sort_order: number;
  created_at?: string;
}

export interface ObjectTypeWithFields extends ObjectType {
  fields: ObjectField[];
}

export interface ObjectField {
  id: number;
  object_type_id: number;
  label: string;
  field_key: string;
  input_type: FieldInputType;
  options?: string[] | null;
  is_required: boolean;
  sort_order: number;
}

export interface InventoryObject {
  id: number;
  object_type_id: number;
  name: string;
  data: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

export interface CreateObjectPayload {
  object_type_id: number;
  name: string;
  data?: Record<string, unknown>;
  count?: number;
}

export interface UpdateObjectPayload {
  name?: string;
  data?: Record<string, unknown>;
}