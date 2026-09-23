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
  created_at?: string;
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

export interface ObjectType {
  id: number;
  name: string;
  sort_order: number;
  created_at?: string;
  fields: ObjectField[];
}

export interface InventoryObject {
  id: number;
  object_type_id: number;
  name: string;
  data: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

export interface CreateObjectTypePayload {
  name: string;
  sort_order?: number;
}

export interface CreateObjectFieldPayload {
  label: string;
  field_key: string;
  input_type: FieldInputType;
  options?: string[];
  is_required?: boolean;
  sort_order?: number;
}

export interface CreateObjectPayload {
  object_type_id: number;
  name: string;
  data: Record<string, unknown>;
  count?: number;
}

export interface UpdateObjectPayload {
  name?: string;
  data?: Record<string, unknown>;
}

export interface Column<T> {
  field: string;
  label: string;
  sortable?: boolean;
  className?: string;
  render: (item: T) => React.ReactNode;
  renderEdit?: (
    editForm: Partial<T>,
    updateForm: (val: Partial<T>) => void,
  ) => React.ReactNode;
}

export interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  keyExtractor: (item: T) => string | number;
  editingId?: string | number | null;
  editForm: Partial<T>;
  setEditForm: React.Dispatch<React.SetStateAction<Partial<T>>>;
  onEdit: (item: T) => void;
  onSave: (id: string | number, payload: Partial<T>) => void;
  onCancel: () => void;
  onDelete: (id: string | number) => void;
  hideEdit?: boolean;
  isDeletable?: (item: T) => boolean;
  rowClassName?: (item: T) => string;
  onReorder?: (fromId: string | number, toId: string | number) => void;
  sortField?: string;
  sortDirection?: "asc" | "desc";
  onSort?: (field: string) => void;
  isLoading?: boolean;
  emptyMessage?: string;
}

export interface CrudService<T, CreatePayload> {
  getAll: () => Promise<T[]>;
  create: (data: CreatePayload) => Promise<unknown>;
  update: (
    id: string | number,
    data: Partial<T> | Record<string, unknown>,
  ) => Promise<unknown>;
  remove: (id: string | number) => Promise<unknown>;
}

export type ToastType = "success" | "error" | "undo" | "info";

export interface ToastProps {
  message: string;
  type: ToastType;
  duration?: number;
  onClose: () => void;
  onUndo?: () => void;
}

export interface ToastContextType {
  showToast: (
    message: string,
    type: ToastType,
    duration?: number,
    onUndo?: () => void,
  ) => void;
  hideToast: () => void;
}