import { ObjectField, ObjectType } from "../types/models";
import { parseFieldOptions } from "./format";
import { CSV_NAME_HEADER, ParsedCsv } from "./csv";

export interface CsvRowError {
  line: number;
  error: string;
}

export interface PreparedRow {
  line: number;
  name: string;
  data: Record<string, unknown>;
}

export interface CsvValidationResult {
  rows: PreparedRow[];
  errors: CsvRowError[];
  missingHeaders: string[];
  unknownHeaders: string[];
}

const MAC_ADDRESS_REGEX = /^([0-9A-Fa-f]{2}[:-]){5}[0-9A-Fa-f]{2}$/;
const IPV4_REGEX = /^((25[0-5]|(2[0-4]|1\d|[1-9]|)\d)\.?\b){4}$/;

type ValueResult =
  | { ok: true; value: unknown }
  | { ok: false; error: string };

const validateValue = (field: ObjectField, raw: string): ValueResult => {
  switch (field.input_type) {
    case "number": {
      const value = Number(raw);
      if (!Number.isFinite(value)) {
        return { ok: false, error: `« ${field.label} » doit être un nombre.` };
      }
      return { ok: true, value };
    }
    case "boolean": {
      const normalized = raw.toLowerCase();
      if (["true", "1", "oui", "yes"].includes(normalized)) {
        return { ok: true, value: true };
      }
      if (["false", "0", "non", "no"].includes(normalized)) {
        return { ok: true, value: false };
      }
      return { ok: false, error: `« ${field.label} » doit être Oui ou Non.` };
    }
    case "select": {
      const options = parseFieldOptions(field.options);
      if (options.length > 0 && !options.includes(raw)) {
        return {
          ok: false,
          error: `« ${field.label} » : « ${raw} » n'est pas une option autorisée (${options.join(", ")}).`,
        };
      }
      return { ok: true, value: raw };
    }
    case "date":
      if (Number.isNaN(new Date(raw).getTime())) {
        return { ok: false, error: `« ${field.label} » : date invalide.` };
      }
      return { ok: true, value: raw };
    case "mac":
      if (!MAC_ADDRESS_REGEX.test(raw)) {
        return {
          ok: false,
          error: `« ${field.label} » : adresse MAC invalide (AA:BB:CC:DD:EE:FF).`,
        };
      }
      return { ok: true, value: raw };
    case "ip":
      if (!IPV4_REGEX.test(raw)) {
        return { ok: false, error: `« ${field.label} » : adresse IP invalide.` };
      }
      return { ok: true, value: raw };
    default:
      return { ok: true, value: raw };
  }
};

export const validateCsv = (
  type: ObjectType,
  csv: ParsedCsv,
): CsvValidationResult => {
  const expectedHeaders = [
    CSV_NAME_HEADER,
    ...type.fields.map((field) => field.field_key),
  ];
  const requiredHeaders = [
    CSV_NAME_HEADER,
    ...type.fields
      .filter((field) => field.is_required)
      .map((field) => field.field_key),
  ];
  const headerSet = new Set(csv.headers);
  const missingHeaders = requiredHeaders.filter((header) => !headerSet.has(header));
  const unknownHeaders = csv.headers.filter(
    (header) => header && !expectedHeaders.includes(header),
  );

  if (missingHeaders.length > 0 || csv.rows.length === 0) {
    return { rows: [], errors: [], missingHeaders, unknownHeaders };
  }

  const rows: PreparedRow[] = [];
  const errors: CsvRowError[] = [];

  for (const row of csv.rows) {
    const name = (row.values[CSV_NAME_HEADER] || "").trim();
    const rowErrors: string[] = [];
    if (!name) rowErrors.push("Le nom de l'objet est requis.");

    const data: Record<string, unknown> = {};
    for (const field of type.fields) {
      const raw = (row.values[field.field_key] || "").trim();
      if (!raw) {
        if (field.is_required) {
          rowErrors.push(`Champ obligatoire « ${field.label} » manquant.`);
        }
        continue;
      }
      const result = validateValue(field, raw);
      if (!result.ok) rowErrors.push(result.error);
      else data[field.field_key] = result.value;
    }

    for (const error of rowErrors) {
      errors.push({ line: row.line, error });
    }
    if (rowErrors.length === 0) {
      rows.push({ line: row.line, name, data });
    }
  }

  return { rows, errors, missingHeaders, unknownHeaders };
};
