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
    const typeId = result.insertId;

    // Create default "État" field with enum values
    await pool.query(
      `INSERT INTO object_fields (object_type_id, label, field_key, input_type, options, is_required, sort_order)
       VALUES (?, 'État', 'etat', 'select', ?, 1, 0)`,
      [typeId, JSON.stringify(["Neuf", "Bon état", "Usagé", "HS"])],
    );

    return typeId;
  } catch (error: any) {
    throw handleDatabaseError(error);
  }
};

export const reorderTypes = async (ids: number[]): Promise<void> => {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    for (let i = 0; i < ids.length; i++) {
      const [result]: any = await conn.query(
        "UPDATE object_types SET sort_order = ? WHERE id = ?",
        [i + 1, ids[i]],
      );
      if (result.affectedRows === 0) {
        throw new AppError("Type d'objet introuvable.", 404);
      }
    }
    await conn.commit();
  } catch (error: any) {
    await conn.rollback().catch(() => {});
    if (error instanceof AppError) throw error;
    throw handleDatabaseError(error);
  } finally {
    conn.release();
  }
};

export const updateType = async (
  id: number,
  data: { name?: string; sort_order?: number },
): Promise<void> => {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const [typeRows]: any = await conn.query(
      "SELECT id, sort_order FROM object_types WHERE id = ? FOR UPDATE",
      [id],
    );
    const current = typeRows[0];
    if (!current) {
      throw new AppError("Type d'objet introuvable.", 404);
    }

    if (
      data.sort_order !== undefined &&
      data.sort_order !== current.sort_order
    ) {
      const [otherRows]: any = await conn.query(
        "SELECT id, sort_order FROM object_types WHERE sort_order = ? AND id != ? FOR UPDATE",
        [data.sort_order, id],
      );
      if (otherRows.length > 0) {
        const other = otherRows[0];
        await conn.query(
          "UPDATE object_types SET sort_order = ? WHERE id = ?",
          [current.sort_order, other.id],
        );
      }
    }

    await conn.query(
      "UPDATE object_types SET name = COALESCE(?, name), sort_order = COALESCE(?, sort_order) WHERE id = ?",
      [data.name?.trim(), data.sort_order, id],
    );

    await conn.commit();
  } catch (error: any) {
    await conn.rollback().catch(() => {});
    if (error instanceof AppError) throw error;
    throw handleDatabaseError(error);
  } finally {
    conn.release();
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