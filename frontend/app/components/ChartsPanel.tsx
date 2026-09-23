"use client";

import { useMemo, useState } from "react";
import { ObjectType, InventoryObject, ObjectField } from "../types/models";
import { DoughnutChart, BarsChart } from "./charts";
import { monthKey, monthLabel } from "../lib/format";

const isCategorical = (field: ObjectField) =>
  field.input_type === "select" || field.input_type === "boolean";

const stringify = (value: unknown): string => {
  if (value === null || value === undefined || value === "") return "Non renseigné";
  if (typeof value === "boolean") return value ? "Oui" : "Non";
  return String(value);
};

const MONTHS_COUNT = 12;

export default function ChartsPanel({
  type,
  rows,
}: {
  type: ObjectType;
  rows: InventoryObject[];
}) {
  const categoricalFields = useMemo(
    () => type.fields.filter(isCategorical),
    [type.fields],
  );

  const [donutFieldKey, setDonutFieldKey] = useState<string>(
    categoricalFields[0]?.field_key || "__none__",
  );

  const donutData = useMemo(() => {
    if (donutFieldKey === "__none__") return [];
    const buckets: Record<string, number> = {};
    for (const row of rows) {
      const value = stringify(row.data?.[donutFieldKey]);
      buckets[value] = (buckets[value] || 0) + 1;
    }
    return Object.entries(buckets)
      .map(([label, value]) => ({ label, value }))
      .sort((a, b) => b.value - a.value);
  }, [rows, donutFieldKey]);

  const barData = useMemo(() => {
    const now = new Date();
    const labels: string[] = [];
    const counts: Record<string, number> = {};
    for (let i = MONTHS_COUNT - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      labels.push(key);
      counts[key] = 0;
    }
    for (const row of rows) {
      const key = monthKey(row.created_at);
      if (counts[key] !== undefined) counts[key] += 1;
    }
    return labels.map((key) => ({
      label: monthLabel(key),
      value: counts[key],
    }));
  }, [rows]);

  return (
    <div className="flex flex-col h-full gap-3 p-4">
      <div className="shrink-0">
        <div className="flex items-center justify-between gap-2 mb-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-(--text-muted)">
            Répartition
          </h3>
          {categoricalFields.length > 0 && (
            <select
              className="crm-input py-1 text-xs cursor-pointer"
              value={donutFieldKey}
              onChange={(e) => setDonutFieldKey(e.target.value)}
            >
              {categoricalFields.map((f) => (
                <option key={f.id} value={f.field_key}>
                  {f.label}
                </option>
              ))}
            </select>
          )}
        </div>
        <DoughnutChart data={donutData} />
      </div>

      <div className="pt-3 border-t border-(--border-color)">
        <h3 className="text-xs font-bold uppercase tracking-wider text-(--text-muted) mb-3">
          Ajouts / dernier mois
        </h3>
        <BarsChart data={barData} />
      </div>
    </div>
  );
}