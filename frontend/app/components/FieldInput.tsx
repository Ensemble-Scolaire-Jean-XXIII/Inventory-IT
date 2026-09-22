"use client";

import { ObjectField } from "../types/models";

interface FieldInputProps {
  field: ObjectField;
  value: unknown;
  onChange: (value: unknown) => void;
  required?: boolean;
}

export default function FieldInput({
  field,
  value,
  onChange,
  required,
}: FieldInputProps) {
  const common = "crm-input";

  const selectOptions = field.options && field.options.length > 0
    ? field.options
    : [];

  switch (field.input_type) {
    case "boolean":
      return (
        <select
          className={`${common} cursor-pointer`}
          value={
            value === true ? "true" : value === false ? "false" : ""
          }
          onChange={(e) =>
            onChange(
              e.target.value === "" ? undefined : e.target.value === "true",
            )
          }
        >
          <option value="">—</option>
          <option value="true">Oui</option>
          <option value="false">Non</option>
        </select>
      );
    case "select":
      return (
        <select
          className={`${common} cursor-pointer`}
          value={typeof value === "string" ? value : ""}
          onChange={(e) => onChange(e.target.value || undefined)}
          required={required}
        >
          <option value="">—</option>
          {selectOptions.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      );
    case "number":
      return (
        <input
          type="number"
          className={common}
          value={typeof value === "number" ? value : String(value ?? "")}
          onChange={(e) =>
            onChange(e.target.value === "" ? undefined : Number(e.target.value))
          }
          required={required}
        />
      );
    case "date":
      return (
        <input
          type="date"
          className={common}
          value={typeof value === "string" ? value : ""}
          onChange={(e) => onChange(e.target.value || undefined)}
          required={required}
        />
      );
    case "mac":
      return (
        <input
          type="text"
          className={common}
          placeholder="AA:BB:CC:DD:EE:FF"
          value={typeof value === "string" ? value : ""}
          onChange={(e) => onChange(e.target.value || undefined)}
          required={required}
        />
      );
    case "ip":
      return (
        <input
          type="text"
          className={common}
          placeholder="192.168.0.1"
          value={typeof value === "string" ? value : ""}
          onChange={(e) => onChange(e.target.value || undefined)}
          required={required}
        />
      );
    case "text":
    default:
      return (
        <input
          type="text"
          className={common}
          value={typeof value === "string" ? value : ""}
          onChange={(e) => onChange(e.target.value || undefined)}
          required={required}
        />
      );
  }
}