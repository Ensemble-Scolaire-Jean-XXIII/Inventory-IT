import { pool } from "../config/db";
import {
  InventoryObject,
  ObjectField,
  CreateObjectPayload,
  UpdateObjectPayload,
} from "../models/types";
import { AppError, handleDatabaseError } from "../utils/appError";
import { validateFieldValue } from "../utils/validators";
import { getFieldsByTypeId } from "./objectTypeService";

export const getAllObjects = async (): Promise<InventoryObject[]> => {
  try {
    const [rows]: any = await pool.query(
      "SELECT * FROM objects ORDER BY object_type_id ASC, created_at DESC",
    );
    return (rows as InventoryObject[]).map(parseObject);
  } catch (error: any) {
    throw handleDatabaseError(error);
  }
};

export const getObjectsByType = async (
  typeId: number,
): Promise<InventoryObject[]> => {
  try {
    const [rows]: any = await pool.query(
      "SELECT * FROM objects WHERE object_type_id = ? ORDER BY created_at DESC",
      [typeId],
    );
    return (rows as InventoryObject[]).map(parseObject);
  } catch (error: any) {
    throw handleDatabaseError(error);
  }
};

export const createObject = async (
  payload: CreateObjectPayload,
): Promise<number> => {
  try {
    const fields = await getFieldsByTypeId(payload.object_type_id);
    if (fields.length === 0) {
      throw new AppError(
        "Ce type d'objet ne possède aucun gabarit de champ.",
        400,
      );
    }

    const data = await cleanData(fields, payload.data || {});

    const [result]: any = await pool.query(
      "INSERT INTO objects (object_type_id, name, data) VALUES (?, ?, ?)",
      [payload.object_type_id, payload.name.trim(), JSON.stringify(data)],
    );
    return result.insertId;
  } catch (error: any) {
    if (error instanceof AppError) throw error;
    throw handleDatabaseError(error);
  }
};

export const updateObject = async (
  id: number,
  payload: UpdateObjectPayload,
): Promise<void> => {
  try {
    const [rows]: any = await pool.query(
      "SELECT * FROM objects WHERE id = ?",
      [id],
    );
    const existing = (rows[0] as InventoryObject) || null;
    if (!existing) {
      throw new AppError("Objet introuvable.", 404);
    }

    const fields = await getFieldsByTypeId(existing.object_type_id);
    const mergedData = {
      ...(existing.data || {}),
      ...(payload.data || {}),
    };
    const data = await cleanData(fields, mergedData);

    const [result]: any = await pool.query(
      "UPDATE objects SET name = COALESCE(?, name), data = ? WHERE id = ?",
      [payload.name?.trim(), JSON.stringify(data), id],
    );
    if (result.affectedRows === 0) {
      throw new AppError("Objet introuvable.", 404);
    }
  } catch (error: any) {
    if (error instanceof AppError) throw error;
    throw handleDatabaseError(error);
  }
};

export const deleteObject = async (id: number): Promise<void> => {
  try {
    const [result]: any = await pool.query("DELETE FROM objects WHERE id = ?", [
      id,
    ]);
    if (result.affectedRows === 0) {
      throw new AppError("Objet introuvable.", 404);
    }
  } catch (error: any) {
    if (error instanceof AppError) throw error;
    throw handleDatabaseError(error);
  }
};

const cleanData = async (
  fields: ObjectField[],
  raw: Record<string, unknown>,
): Promise<Record<string, unknown>> => {
  const data: Record<string, unknown> = {};
  const requiredMissing: string[] = [];

  for (const field of fields) {
    const rawValue = raw[field.field_key];
    const isEmpty =
      rawValue === undefined ||
      rawValue === null ||
      rawValue === "" ||
      (Array.isArray(rawValue) && rawValue.length === 0);

    if (isEmpty) {
      if (field.is_required) {
        requiredMissing.push(field.label);
      }
      continue;
    }

    let value: unknown = rawValue;

    if (field.input_type === "number") {
      value = Number(rawValue);
    }

    if (field.input_type === "boolean") {
      if (rawValue === "true") value = true;
      else if (rawValue === "false") value = false;
    }

    const { error } = validateFieldValue(field.input_type, value);
    if (error) {
      throw new AppError(`Champ « ${field.label} » : ${error}`, 400);
    }

    data[field.field_key] = value;
  }

  if (requiredMissing.length > 0) {
    throw new AppError(
      `Champs obligatoires manquants : ${requiredMissing.join(", ")}.`,
      400,
    );
  }

  return data;
};

const parseObject = (row: InventoryObject): InventoryObject => {
  let parsedData: Record<string, unknown> | null = null;
  if (row.data && typeof row.data === "object") {
    parsedData = row.data as Record<string, unknown>;
  } else if (row.data) {
    try {
      parsedData = JSON.parse(String(row.data));
    } catch {
      parsedData = null;
    }
  }
  return { ...row, data: parsedData };
};