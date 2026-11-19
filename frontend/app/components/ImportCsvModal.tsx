"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { FieldInputType, ImportObjectsResult, ObjectType } from "../types/models";
import { parseCsv, ParsedCsv } from "../lib/csv";
import { CsvValidationResult, validateCsv } from "../lib/csvValidation";
import { parseFieldOptions } from "../lib/format";

interface ImportCsvModalProps {
  type: ObjectType;
  onClose: () => void;
  onImport: (
    objectTypeId: number,
    rows: Array<{ name: string; data: Record<string, unknown> }>,
  ) => Promise<ImportObjectsResult>;
}

const TYPE_LABELS: Record<FieldInputType, string> = {
  text: "Texte",
  number: "Nombre",
  date: "Date",
  mac: "MAC",
  ip: "IP",
  select: "Liste",
  boolean: "Oui/Non",
};

export default function ImportCsvModal({
  type,
  onClose,
  onImport,
}: ImportCsvModalProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState("");
  const [csv, setCsv] = useState<ParsedCsv | null>(null);
  const [validation, setValidation] = useState<CsvValidationResult | null>(null);
  const [readError, setReadError] = useState("");
  const [isImporting, setIsImporting] = useState(false);
  const [result, setResult] = useState<ImportObjectsResult | null>(null);
  const [serverErrors, setServerErrors] = useState<
    Array<{ line: number; error: string }>
  >([]);

  const handleFile = async (file: File | undefined) => {
    if (!file) return;
    setReadError("");
    setResult(null);
    setServerErrors([]);
    setFileName(file.name);
    try {
      const parsed = parseCsv(await file.text());
      setCsv(parsed);
      setValidation(validateCsv(type, parsed));
    } catch {
      setCsv(null);
      setValidation(null);
      setReadError("Impossible de lire ce fichier CSV.");
    }
  };

  const handleImport = async () => {
    if (!validation || validation.rows.length === 0) return;
    setIsImporting(true);
    setServerErrors([]);
    try {
      const rows = validation.rows.map(({ name, data }) => ({ name, data }));
      const res = await onImport(type.id, rows);
      setServerErrors(
        res.errors.map((error) => ({
          line: validation.rows[error.row - 1]?.line ?? error.row,
          error: error.error,
        })),
      );
      setResult(res);
    } catch (err) {
      setReadError(
        err instanceof Error ? err.message : "Erreur lors de l'import.",
      );
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="crm-card w-full max-w-3xl max-h-[92vh] p-0 overflow-hidden flex flex-col">
        <div className="flex items-start justify-between gap-3 px-5 py-4 border-b border-(--border-color)">
          <div>
            <h2 className="text-base font-bold">Importer des objets — {type.name}</h2>
            <p className="text-xs text-(--text-muted) mt-0.5">
              Le modèle contient une ligne d&apos;exemple à remplacer. Les lignes
              valides sont créées, les autres sont signalées ci-dessous.
            </p>
          </div>
          <button
            onClick={onClose}
            className="crm-btn-ghost h-8 w-8 p-0 shrink-0"
            aria-label="Fermer"
          >
            <Image
              src="/icons/cancel.webp"
              alt=""
              width={14}
              height={14}
              className="object-contain brightness-0 invert"
              unoptimized
            />
          </button>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar px-5 py-4 flex flex-col gap-4">
          <div className="rounded-lg border border-(--border-color) bg-(--input-bg) p-3">
            <p className="text-xs font-semibold mb-2">
              Colonnes attendues (séparateur « ; »)
            </p>
            <div className="flex flex-wrap gap-1.5">
              <span className="text-xs font-mono px-2 py-0.5 rounded bg-accent/15 border border-accent/30">
                name <span className="text-red-400">*</span>
              </span>
              {type.fields.map((field) => (
                <span
                  key={field.id}
                  className="text-xs font-mono px-2 py-0.5 rounded bg-white/5 border border-(--border-color)"
                >
                  {field.field_key}
                  {field.is_required && <span className="text-red-400"> *</span>}
                </span>
              ))}
            </div>
            <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-x-5 gap-y-1.5">
              {type.fields.map((field) => {
                const options = parseFieldOptions(field.options);
                return (
                  <div
                    key={field.id}
                    className="flex flex-wrap items-center gap-x-1.5 text-xs"
                  >
                    <code className="font-mono text-(--accent)">
                      {field.field_key}
                    </code>
                    <span className="text-(--text-muted)">
                      {field.label} · {TYPE_LABELS[field.input_type]}
                    </span>
                    {field.is_required && (
                      <span className="text-red-400">requis</span>
                    )}
                    {field.input_type === "select" && options.length > 0 && (
                      <span className="text-(--text-muted) w-full">
                        options : {options.join(" | ")}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <input
              ref={inputRef}
              type="file"
              accept=".csv,text/csv"
              className="hidden"
              onChange={(event) => handleFile(event.target.files?.[0])}
            />
            <button
              type="button"
              className="crm-btn-ghost text-sm"
              onClick={() => inputRef.current?.click()}
            >
              Choisir un fichier CSV
            </button>
            {fileName && (
              <span className="text-xs text-(--text-muted)">{fileName}</span>
            )}
          </div>

          {readError && (
            <p className="text-xs text-red-400">{readError}</p>
          )}

          {csv && validation && (
            <>
              <div className="flex items-center gap-3 flex-wrap text-xs">
                <span className="px-2 py-1 rounded bg-emerald-500/15 text-emerald-300">
                  {validation.rows.length} ligne
                  {validation.rows.length > 1 ? "s" : ""} valide
                  {validation.rows.length > 1 ? "s" : ""}
                </span>
                <span className="px-2 py-1 rounded bg-red-500/15 text-red-300">
                  {validation.errors.length} erreur
                  {validation.errors.length > 1 ? "s" : ""}
                </span>
              </div>

              {validation.missingHeaders.length > 0 && (
                <p className="text-xs text-red-400">
                  Colonnes obligatoires absentes :{" "}
                  {validation.missingHeaders.join(", ")}.
                </p>
              )}
              {validation.unknownHeaders.length > 0 && (
                <p className="text-xs text-amber-400">
                  Colonnes ignorées : {validation.unknownHeaders.join(", ")}.
                </p>
              )}

              {csv.rows.length > 0 && (
                <div className="rounded-lg border border-(--border-color) overflow-auto custom-scrollbar">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-(--bg-table-header) sticky top-0">
                      <tr>
                        <th className="px-2 py-2 font-semibold">Ligne</th>
                        {csv.headers.map((header) => (
                          <th key={header} className="px-2 py-2 font-semibold">
                            {header}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {csv.rows.slice(0, 5).map((row) => (
                        <tr
                          key={row.line}
                          className="border-t border-(--border-color)"
                        >
                          <td className="px-2 py-1.5 text-(--text-muted)">
                            {row.line}
                          </td>
                          {csv.headers.map((header) => (
                            <td key={header} className="px-2 py-1.5">
                              {row.values[header] || "—"}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {csv.rows.length > 5 && (
                    <p className="px-2 py-1.5 text-xs text-(--text-muted)">
                      … et {csv.rows.length - 5} autre
                      {csv.rows.length - 5 > 1 ? "s" : ""} ligne
                      {csv.rows.length - 5 > 1 ? "s" : ""}.
                    </p>
                  )}
                </div>
              )}

              {(validation.errors.length > 0 || serverErrors.length > 0) && (
                <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 max-h-40 overflow-y-auto custom-scrollbar">
                  <p className="text-xs font-semibold text-red-300 mb-1">
                    Lignes rejetées
                  </p>
                  <ul className="space-y-0.5 text-xs text-red-200">
                    {validation.errors.map((error, index) => (
                      <li key={`v-${index}`}>
                        Ligne {error.line} — {error.error}
                      </li>
                    ))}
                    {serverErrors.map((error, index) => (
                      <li key={`s-${index}`}>
                        Ligne {error.line} — {error.error}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {result && (
                <p className="text-xs text-emerald-300">
                  {result.count} objet{result.count > 1 ? "s" : ""} importé
                  {result.count > 1 ? "s" : ""}.
                </p>
              )}
            </>
          )}
        </div>

        <div className="flex items-center justify-end gap-2 px-5 py-3 border-t border-(--border-color)">
          <button type="button" className="crm-btn-ghost text-sm" onClick={onClose}>
            {result ? "Terminer" : "Annuler"}
          </button>
          {!result && (
            <button
              type="button"
              className="crm-btn-primary text-sm"
              disabled={!validation || validation.rows.length === 0 || isImporting}
              onClick={handleImport}
            >
              {isImporting
                ? "Import…"
                : `Importer ${validation?.rows.length ?? 0} ligne${(validation?.rows.length ?? 0) > 1 ? "s" : ""}`}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
