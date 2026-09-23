"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import {
  ObjectType,
  InventoryObject,
  CreateObjectPayload,
  Column,
} from "../types/models";
import DataTable from "./DataTable";
import FieldInput from "./FieldInput";
import AddObjectForm from "./AddObjectForm";
import ChartsPanel from "./ChartsPanel";
import { useSearch } from "../hooks/useSearch";
import { useSort } from "../hooks/useSort";
import { displayValue } from "../lib/format";

interface TypePanelProps {
  type: ObjectType;
  rows: InventoryObject[];
  onAdd: (payload: CreateObjectPayload) => Promise<boolean>;
  onUpdate: (
    id: number,
    payload: { name?: string; data?: Record<string, unknown> },
  ) => Promise<boolean>;
  onDelete: (id: number) => Promise<boolean>;
}

const sortValue = (value: unknown): string | number => {
  if (typeof value === "number") return value;
  return String(value ?? "").toLowerCase();
};

export default function TypePanel({
  type,
  rows,
  onAdd,
  onUpdate,
  onDelete,
}: TypePanelProps) {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | number | null>(null);
  const [editForm, setEditForm] = useState<Partial<InventoryObject>>({});

  const { searchQuery, setSearchQuery, filteredData } = useSearch(
    rows,
    (item, query) =>
      item.name.toLowerCase().includes(query) ||
      Object.values(item.data || {}).some((v) =>
        String(v ?? "")
          .toLowerCase()
          .includes(query),
      ),
  );

  const { sortField, sortDirection, handleSort } = useSort("name", "asc");

  const sortedRows = useMemo(() => {
    const sorted = [...filteredData];
    sorted.sort((a, b) => {
      const av = sortValue(a.data?.[sortField] ?? (a as any)[sortField]);
      const bv = sortValue(b.data?.[sortField] ?? (b as any)[sortField]);
      let cmp = 0;
      if (typeof av === "number" && typeof bv === "number") cmp = av - bv;
      else cmp = String(av).localeCompare(String(bv), "fr", { numeric: true });
      return sortDirection === "asc" ? cmp : -cmp;
    });
    return sorted;
  }, [filteredData, sortField, sortDirection]);

  const handleEditValue = (key: string) => (value: unknown) =>
    setEditForm((prev) => ({
      ...prev,
      data: { ...(prev.data || {}), [key]: value },
    }));

  const buildPayloadFromForm = (): {
    name?: string;
    data?: Record<string, unknown>;
  } => {
    const data: Record<string, unknown> = {};
    for (const field of type.fields) {
      const v = editForm.data?.[field.field_key];
      if (v !== undefined) data[field.field_key] = v;
    }
    const name = typeof editForm.name === "string" ? editForm.name.trim() : "";
    return name ? { name, data } : { data };
  };

  const handleSave = async (id: string | number) => {
    const ok = await onUpdate(Number(id), buildPayloadFromForm());
    if (ok) setEditingId(null);
  };

  const handleDelete = async (id: string | number) => {
    await onDelete(Number(id));
  };

  const columns: Column<InventoryObject>[] = [
    {
      field: "name",
      label: "Nom",
      sortable: true,
      className: "w-[15%]",
      render: (item) => (
        <span className="font-medium truncate block">{item.name}</span>
      ),
      renderEdit: (form, update) => (
        <input
          type="text"
          className="crm-input py-1 px-2 text-xs"
          value={form.name || ""}
          onChange={(e) => update({ name: e.target.value })}
          placeholder="Nom"
        />
      ),
    },
    ...type.fields.map((field) => ({
      field: field.field_key,
      label: field.label,
      sortable: true,
      render: (item: InventoryObject) => (
        <span className="truncate block">
          {displayValue(item.data?.[field.field_key])}
        </span>
      ),
      renderEdit: (form: Partial<InventoryObject>) => (
        <FieldInput
          field={field}
          value={form.data?.[field.field_key]}
          onChange={handleEditValue(field.field_key)}
        />
      ),
    })),
  ];

  return (
    <div id={`panel-${type.id}`} className="flex flex-col gap-3 shrink-0">
      <div className="flex items-center gap-3 flex-wrap">
        <h2 className="text-lg font-bold tracking-tight">{type.name}</h2>
        <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-accent/15 text-(--text-main) border border-(--border-color)">
          {rows.length} {rows.length > 1 ? "objets" : "objet"}
        </span>
        <div className="ml-auto flex items-center gap-2 flex-wrap">
          <input
            type="text"
            className="crm-input w-full sm:w-56 py-1 text-xs"
            placeholder={`Rechercher dans ${type.name.toLowerCase()}…`}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <button
            onClick={() => setShowForm((v) => !v)}
            className={
              showForm ? "crm-btn-primary text-xs" : "crm-btn-ghost text-xs"
            }
          >
            <Image
              src={showForm ? "/icons/hide.webp" : "/icons/add.webp"}
              alt={showForm ? "Masquer" : "Ajouter"}
              width={14}
              height={14}
              className="object-contain brightness-0 invert shrink-0"
              unoptimized
            />
            {showForm ? "Masquer le formulaire" : "Ajouter un objet"}
          </button>
        </div>
      </div>

      {showForm && (
        <div className="crm-card p-4">
          <AddObjectForm type={type} onAdd={onAdd} />
        </div>
      )}

      <div className="flex flex-col desktop:flex-row gap-3 min-h-0 desktop:flex-1">
        <div className="flex-1 min-w-0 crm-card p-0 flex">
          <DataTable
            data={sortedRows}
            columns={columns}
            keyExtractor={(item) => item.id}
            editingId={editingId}
            editForm={editForm}
            setEditForm={setEditForm}
            onEdit={(item) => {
              setEditingId(item.id);
              setEditForm(item);
            }}
            onSave={handleSave}
            onCancel={() => setEditingId(null)}
            onDelete={handleDelete}
            sortField={sortField}
            sortDirection={sortDirection}
            onSort={handleSort}
            isLoading={false}
            emptyMessage={`Aucun ${type.name.toLowerCase()} trouvé.`}
          />
        </div>

        <div className="shrink-0 desktop:w-85 crm-card p-0 overflow-hidden desktop:h-fit desktop:sticky desktop:top-0">
          <div className="px-4 pt-3 border-b border-(--border-color)">
            <h3 className="text-sm font-bold uppercase tracking-wider text-(--text-muted)">
              Statistiques
            </h3>
            <p className="text-xs text-(--text-muted) mt-0.5 mb-3">
              Évoluent selon la recherche appliquée au tableau.
            </p>
          </div>
          <ChartsPanel type={type} rows={filteredData} />
        </div>
      </div>
    </div>
  );
}
