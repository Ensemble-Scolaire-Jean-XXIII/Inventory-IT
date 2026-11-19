import { ObjectField, ObjectType } from "../types/models";
import { parseFieldOptions } from "./format";

export const CSV_NAME_HEADER = "name";

export interface CsvRow {
  line: number;
  values: Record<string, string>;
}

export interface ParsedCsv {
  headers: string[];
  rows: CsvRow[];
}

const detectDelimiter = (line: string): string => {
  const counts: Record<string, number> = { ";": 0, ",": 0, "\t": 0 };
  let quoted = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (quoted && line[i + 1] === '"') i++;
      else quoted = !quoted;
    } else if (!quoted && char in counts) {
      counts[char]++;
    }
  }
  let best = ";";
  for (const candidate of [";", ",", "\t"]) {
    if (counts[candidate] > counts[best]) best = candidate;
  }
  return best;
};

const parseLine = (line: string, delimiter: string): string[] => {
  const cells: string[] = [];
  let current = "";
  let quoted = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (quoted && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        quoted = !quoted;
      }
    } else if (char === delimiter && !quoted) {
      cells.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }
  cells.push(current.trim());
  return cells;
};

const splitLines = (text: string): string[] => {
  const normalized = text.replace(/\r\n?/g, "\n");
  const lines: string[] = [];
  let current = "";
  let quoted = false;
  for (let i = 0; i < normalized.length; i++) {
    const char = normalized[i];
    if (char === '"') {
      if (quoted && normalized[i + 1] === '"') {
        current += '""';
        i++;
      } else {
        quoted = !quoted;
        current += char;
      }
    } else if (char === "\n" && !quoted) {
      lines.push(current);
      current = "";
    } else {
      current += char;
    }
  }
  if (current.length > 0) lines.push(current);
  return lines;
};

export const parseCsv = (text: string): ParsedCsv => {
  const numbered = splitLines(text.replace(/^\uFEFF/, "")).map((content, i) => ({
    content,
    line: i + 1,
  }));
  const first = numbered.find((entry) => entry.content.trim() !== "");
  if (!first) return { headers: [], rows: [] };

  const delimiter = detectDelimiter(first.content);
  const headers = parseLine(first.content, delimiter).map((header) =>
    header.trim(),
  );
  const rows = numbered
    .filter((entry) => entry.line > first.line && entry.content.trim() !== "")
    .map((entry) => {
      const cells = parseLine(entry.content, delimiter);
      const values: Record<string, string> = {};
      headers.forEach((header, index) => {
        if (header) values[header] = cells[index] ?? "";
      });
      return { line: entry.line, values };
    });

  return { headers, rows };
};

const escapeCsvValue = (value: string): string => {
  if (/[";\n\r]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
};

const EXAMPLE_TEXT: Record<string, string> = {
  modele: "Modèle Pro 2026",
  numero_de_serie: "SN123456789",
  emplacement: "Salle 12",
  os: "Debian 12",
  cpu: "Intel Core i5",
  ram: "16 Go",
  stockage: "512 Go SSD",
  utilisateur: "Dupont Jean",
};

const EXAMPLE_NUMBERS: Record<string, string> = {
  nombre_de_ports: "24",
  nombre_de_boutons: "3",
  taille: "24",
};

export const buildExampleValue = (field: ObjectField): string => {
  switch (field.input_type) {
    case "boolean":
      return "Oui";
    case "date":
      return new Date().toISOString().slice(0, 10);
    case "mac":
      return "AA:BB:CC:DD:EE:01";
    case "ip":
      return "192.168.1.10";
    case "number":
      return EXAMPLE_NUMBERS[field.field_key] ?? "24";
    case "select":
      return parseFieldOptions(field.options)[0] ?? "Exemple";
    default:
      return EXAMPLE_TEXT[field.field_key] ?? "Exemple";
  }
};

export const buildTemplateCsv = (type: ObjectType): string => {
  const headers = [
    CSV_NAME_HEADER,
    ...type.fields.map((field) => field.field_key),
  ];
  const example = [
    `${type.name}-01`,
    ...type.fields.map(buildExampleValue),
  ];
  return `${[headers, example]
    .map((row) => row.map(escapeCsvValue).join(";"))
    .join("\n")}\n`;
};

export const downloadCsv = (filename: string, content: string): void => {
  const blob = new Blob([`\uFEFF${content}`], {
    type: "text/csv;charset=utf-8;",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 0);
};
