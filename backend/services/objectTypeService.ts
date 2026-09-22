import { pool } from "../config/db";
import {
  ObjectType,
  ObjectTypeWithFields,
  ObjectField,
} from "../models/types";
import { AppError, handleDatabaseError } from "../utils/appError";

export const getAllTypesWithFields = async (): Promise<
  ObjectTypeWithFields[]
> => {
  try {
    const [typeRows]: any = await pool.query(
      "SELECT * FROM object_types ORDER BY sort_order ASC, id ASC",
    );
    const [fieldRows]: any = await pool.query(
      "SELECT * FROM object_fields ORDER BY sort_order ASC, id ASC",
    );

    const types = typeRows as ObjectType[];
    const fields = fieldRows as ObjectField[];

    return types.map((type) => ({
      ...type,
      fields: fields.filter((field) => field.object_type_id === type.id),
    }));
  } catch (error: any) {
    throw handleDatabaseError(error);
  }
};

export const getTypeById = async (id: number): Promise<ObjectType | null> => {
  try {
    const [rows]: any = await pool.query(
      "SELECT * FROM object_types WHERE id = ?",
      [id],
    );
    return rows[0] || null;
  } catch (error: any) {
    throw handleDatabaseError(error);
  }
};

export const getFieldsByTypeId = async (
  typeId: number,
): Promise<ObjectField[]> => {
  try {
    const [rows]: any = await pool.query(
      "SELECT * FROM object_fields WHERE object_type_id = ? ORDER BY sort_order ASC, id ASC",
      [typeId],
    );
    return rows as ObjectField[];
  } catch (error: any) {
    throw handleDatabaseError(error);
  }
};

export const createType = async (
  name: string,
  sortOrder?: number,
): Promise<number> => {
  try {
    const [result]: any = await pool.query(
      "INSERT INTO object_types (name, sort_order) VALUES (?, ?)",
      [name.trim(), sortOrder ?? 0],
    );
    return result.insertId;
  } catch (error: any) {
    throw handleDatabaseError(error);
  }
};

export const updateType = async (
  id: number,
  data: { name?: string; sort_order?: number },
): Promise<void> => {
  try {
    const [result]: any = await pool.query(
      "UPDATE object_types SET name = COALESCE(?, name), sort_order = COALESCE(?, sort_order) WHERE id = ?",
      [data.name?.trim(), data.sort_order, id],
    );
    if (result.affectedRows === 0) {
      throw new AppError("Type d'objet introuvable.", 404);
    }
  } catch (error: any) {
    if (error instanceof AppError) throw error;
    throw handleDatabaseError(error);
  }
};

export const deleteType = async (id: number): Promise<void> => {
  try {
    const [result]: any = await pool.query(
      "DELETE FROM object_types WHERE id = ?",
      [id],
    );
    if (result.affectedRows === 0) {
      throw new AppError("Type d'objet introuvable.", 404);
    }
  } catch (error: any) {
    if (error instanceof AppError) throw error;
    throw handleDatabaseError(error);
  }
};