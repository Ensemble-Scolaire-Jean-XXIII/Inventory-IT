import { pool } from "../config/db";
import { ObjectField, FieldInputType } from "../models/types";
import { AppError, handleDatabaseError } from "../utils/appError";

export const getFieldById = async (id: number): Promise<ObjectField | null> => {
  try {
    const [rows]: any = await pool.query(
      "SELECT * FROM object_fields WHERE id = ?",
      [id],
    );
    return rows[0] || null;
  } catch (error: any) {
    throw handleDatabaseError(error);
  }
};

export const addField = async (data: {
  object_type_id: number;
  label: string;
  field_key: string;
  input_type: FieldInputType;
  options?: string[];
  is_required?: boolean;
  sort_order?: number;
}): Promise<number> => {
  try {
    const options =
      data.input_type === "select" && data.options
        ? JSON.stringify(data.options)
        : null;
    const [result]: any = await pool.query(
      "INSERT INTO object_fields (object_type_id, label, field_key, input_type, options, is_required, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?)",
      [
        data.object_type_id,
        data.label.trim(),
        data.field_key.trim(),
        data.input_type,
        options,
        data.is_required ? 1 : 0,
        data.sort_order ?? 0,
      ],
    );
    return result.insertId;
  } catch (error: any) {
    throw handleDatabaseError(error);
  }
};

export const updateField = async (
  id: number,
  data: {
    label?: string;
    field_key?: string;
    input_type?: FieldInputType;
    options?: string[];
    is_required?: boolean;
    sort_order?: number;
  },
): Promise<void> => {
  try {
    const options =
      data.input_type === "select" && data.options
        ? JSON.stringify(data.options)
        : data.input_type
          ? null
          : undefined;
    const [result]: any = await pool.query(
      "UPDATE object_fields SET label = COALESCE(?, label), field_key = COALESCE(?, field_key), input_type = COALESCE(?, input_type), options = COALESCE(?, options), is_required = COALESCE(?, is_required), sort_order = COALESCE(?, sort_order) WHERE id = ?",
      [
        data.label?.trim(),
        data.field_key?.trim(),
        data.input_type,
        options,
        data.is_required === undefined ? undefined : data.is_required ? 1 : 0,
        data.sort_order,
        id,
      ],
    );
    if (result.affectedRows === 0) {
      throw new AppError("Champ introuvable.", 404);
    }
  } catch (error: any) {
    if (error instanceof AppError) throw error;
    throw handleDatabaseError(error);
  }
};

export const deleteField = async (id: number): Promise<void> => {
  try {
    const [result]: any = await pool.query(
      "DELETE FROM object_fields WHERE id = ?",
      [id],
    );
    if (result.affectedRows === 0) {
      throw new AppError("Champ introuvable.", 404);
    }
  } catch (error: any) {
    if (error instanceof AppError) throw error;
    throw handleDatabaseError(error);
  }
};