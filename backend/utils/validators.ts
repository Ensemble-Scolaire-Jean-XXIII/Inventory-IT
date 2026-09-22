import { AppError } from "../utils/appError";

export const MAC_ADDRESS_REGEX = /^([0-9A-Fa-f]{2}[:-]){5}[0-9A-Fa-f]{2}$/;

export const IPv4_REGEX =
  /^((25[0-5]|(2[0-4]|1\d|[1-9]|)\d)\.?\b){4}$/;

export const validateMacAddress = (value: string): boolean =>
  MAC_ADDRESS_REGEX.test(value.trim());

export const validateIpAddress = (value: string): boolean =>
  IPv4_REGEX.test(value.trim());

export const validateFieldValue = (
  inputType: string,
  value: unknown,
): { error?: string } => {
  if (value === null || value === undefined || value === "") return {};

  if (inputType === "number") {
    if (typeof value !== "number" || Number.isNaN(value)) {
      return { error: "La valeur doit être un nombre." };
    }
  }

  if (inputType === "date") {
    const date = new Date(String(value));
    if (Number.isNaN(date.getTime())) {
      return { error: "La date est invalide." };
    }
  }

  if (inputType === "mac") {
    if (typeof value !== "string" || !validateMacAddress(value)) {
      return { error: "Adresse MAC invalide (format attendu : AA:BB:CC:DD:EE:FF)." };
    }
  }

  if (inputType === "ip") {
    if (typeof value !== "string" || !validateIpAddress(value)) {
      return { error: "Adresse IP invalide." };
    }
  }

  if (inputType === "boolean") {
    if (typeof value !== "boolean") {
      return { error: "La valeur doit être un booléen." };
    }
  }

  return {};
};