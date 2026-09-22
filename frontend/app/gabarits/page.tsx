"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import {
  ObjectType,
  ObjectField,
  FieldInputType,
  Column,
} from "../types/models";
import DataTable from "../components/DataTable";
import { typeService } from "../services/typeService";
import { fieldService } from "../services/fieldService";
import { useSearch } from "../hooks/useSearch";
import { useSort } from "../hooks/useSort";
import { useToast } from "../contexts/ToastContext";

const INPUT_TYPE_LABELS: Record<FieldInputType, string> = {
  text: "Texte",
  number: "Nombre",
  date: "Date",
  mac: "Adresse MAC",
  ip: "Adresse IP",
  select: "Liste de choix",
  boolean: "Oui / Non",
};

const INPUT_TYPES = Object.keys(INPUT_TYPE_LABELS) as FieldInputType[];

export default function GabaritsPage() {
  const { showToast } = useToast();
  const [types, setTypes] = useState<ObjectType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const [newTypeName, setNewTypeName] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  const [editingTypeId, setEditingTypeId] = useState<string | number | null>(
    null,
  );
  const [typeEditForm, setTypeEditForm] = useState<Partial<ObjectType>>({});

  const loadTypes = useCallback(async () => {
    try {
      const res = await typeService.getAll();
      setTypes(res);
      setSelectedId((prev) => {
        if (prev !== null && res.some((t) => t.id === prev)) return prev;
        return res.length > 0 ? res[0].id : null;
      });
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : "Erreur de chargement.",
        "error",
      );
    } finally {
      setIsLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    loadTypes();
  }, [loadTypes]);

  const selected = types.find((t) => t.id === selectedId) || null;

  const notify = (ok: boolean, okMsg: string, errMsg: string) => {
    if (ok) showToast(okMsg, "success");
    else showToast(errMsg, "error");
  };

  const handleCreateType = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTypeName.trim()) return;
    setIsCreating(true);
    try {
      const { id } = await typeService.create({
        name: newTypeName.trim(),
        sort_order: types.length,
      });
      notify(true, "Type créé.", "");
      setNewTypeName("");
      await loadTypes();
      setSelectedId(id);
    } catch (err) {
      notify(false, "", err instanceof Error ? err.message : "Erreur.");
    } finally {
      setIsCreating(false);
    }
  };

  const handleSaveType = async (id: string | number) => {
    try {
      await typeService.update(Number(id), {
        name: typeEditForm.name,
        sort_order: Number(typeEditForm.sort_order),
      });
      setEditingTypeId(null);
      notify(true, "Type mis à jour.", "");
      loadTypes();
    } catch (err) {
      notify(false, "", err instanceof Error ? err.message : "Erreur.");
    }
  };

  const handleDeleteType = async (id: string | number) => {
    const type = types.find((t) => t.id === id);
    if (
      !type ||
      !window.confirm(
        `Supprimer le type « ${type.name} » ? Tous ses objets seront supprimés.`,
      )
    ) {
      return;
    }
    try {
      await typeService.remove(type.id);
      notify(true, "Type supprimé.", "");
      if (selectedId === type.id) setSelectedId(null);
      loadTypes();
    } catch (err) {
      notify(false, "", err instanceof Error ? err.message : "Erreur.");
    }
  };

  return (
    <div className="flex flex-col min-h-0 px-4 py-4">
      <div className="flex items-center justify-between gap-3 flex-wrap mb-1">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Gabarits</h1>
          <p className="text-sm text-(--text-muted)">
            Définis les types d'objets et leurs gabarits de champs
            personnalisés.
          </p>
        </div>
        <button
          onClick={loadTypes}
          className="crm-btn-ghost text-xs h-9 w-9 p-0"
          title="Actualiser"
        >
          <Image
            src="/icons/refresh.webp"
            alt="Actualiser"
            width={14}
            height={14}
            className="object-contain brightness-0 invert shrink-0"
            unoptimized
          />
        </button>
      </div>

      <div className="grid grid-cols-1 desktop:grid-cols-[1.1fr_1.6fr] gap-4 desktop:flex-1 desktop:min-h-0">
        <div className="flex flex-col min-h-0 gap-3">
          <form
            onSubmit={handleCreateType}
            className="crm-card p-4 flex flex-col sm:flex-row gap-2"
          >
            <input
              type="text"
              className="crm-input flex-1"
              placeholder="Nom du nouveau type (ex. Imprimante)"
              value={newTypeName}
              onChange={(e) => setNewTypeName(e.target.value)}
            />
            <button
              type="submit"
              className="crm-btn-primary shrink-0 text-sm"
              disabled={isCreating}
            >
              <Image
                src="/icons/add.webp"
                alt="Créer"
                width={14}
                height={14}
                className="object-contain brightness-0 invert shrink-0"
                unoptimized
              />
              Créer le type
            </button>
          </form>

          <div className="flex-1 min-h-0 crm-card p-0 overflow-hidden flex">
            <TypeList
              types={types}
              selectedId={selectedId}
              onSelect={setSelectedId}
              isLoading={isLoading}
              editingTypeId={editingTypeId}
              typeEditForm={typeEditForm}
              setTypeEditForm={setTypeEditForm}
              onEdit={(item) => {
                setEditingTypeId(item.id);
                setTypeEditForm(item);
              }}
              onSave={handleSaveType}
              onCancel={() => setEditingTypeId(null)}
              onDelete={handleDeleteType}
            />
          </div>
        </div>

        <div className="flex flex-col min-h-0">
          {selected ? (
            <FieldEditor
              key={selected.id}
              type={selected}
              onChanged={loadTypes}
              showToast={showToast}
            />
          ) : (
            <div className="crm-card flex-1 grid place-items-center text-(--text-muted)">
              Sélectionne un type pour gérer son gabarit.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function TypeList({
  types,
  selectedId,
  onSelect,
  isLoading,
  editingTypeId,
  typeEditForm,
  setTypeEditForm,
  onEdit,
  onSave,
  onCancel,
  onDelete,
}: {
  types: ObjectType[];
  selectedId: number | null;
  onSelect: (id: number) => void;
  isLoading: boolean;
  editingTypeId: string | number | null;
  typeEditForm: Partial<ObjectType>;
  setTypeEditForm: React.Dispatch<React.SetStateAction<Partial<ObjectType>>>;
  onEdit: (item: ObjectType) => void;
  onSave: (id: string | number) => void;
  onCancel: () => void;
  onDelete: (id: string | number) => void;
}) {
  const { searchQuery, setSearchQuery, filteredData } = useSearch(
    types,
    (t, q) => t.name.toLowerCase().includes(q),
  );
  const { sortField, sortDirection, handleSort } = useSort("name", "asc");

  const sorted = [...filteredData].sort((a, b) =>
    sortDirection === "asc"
      ? a.name.localeCompare(b.name, "fr")
      : b.name.localeCompare(a.name, "fr"),
  );

  const columns: Column<ObjectType>[] = [
    {
      field: "name",
      label: "Type d'objet",
      sortable: true,
      className: "w-[45%]",
      render: (item) => (
        <button
          onClick={() => onSelect(item.id)}
          className={`text-left font-medium truncate block w-full cursor-pointer ${
            selectedId === item.id ? "text-(--accent)" : ""
          }`}
        >
          {item.name}
        </button>
      ),
      renderEdit: (form, update) => (
        <input
          type="text"
          className="crm-input py-1 px-2 text-xs"
          value={form.name || ""}
          onChange={(e) => update({ name: e.target.value })}
        />
      ),
    },
    {
      field: "sort_order",
      label: "Ordre",
      className: "w-16",
      render: (item) => <span>{item.sort_order}</span>,
      renderEdit: (form, update) => (
        <input
          type="number"
          className="crm-input py-1 px-2 text-xs"
          value={form.sort_order ?? 0}
          onChange={(e) => update({ sort_order: Number(e.target.value) })}
        />
      ),
    },
    {
      field: "fields",
      label: "Champs",
      className: "w-16",
      render: (item) => <span>{item.fields.length}</span>,
    },
  ];

  return (
    <div className="flex flex-col min-h-0 w-full">
      <div className="flex justify-end px-3 py-2 border-b border-(--border-color)">
        <input
          type="text"
          className="crm-input w-56 py-1 text-xs"
          placeholder="Rechercher…"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>
      <DataTable<ObjectType>
        data={sorted}
        columns={columns}
        keyExtractor={(item) => item.id}
        editingId={editingTypeId}
        editForm={typeEditForm}
        setEditForm={setTypeEditForm}
        onEdit={onEdit}
        onSave={onSave}
        onCancel={onCancel}
        onDelete={onDelete}
        sortField={sortField}
        sortDirection={sortDirection}
        onSort={handleSort}
        isLoading={isLoading}
        emptyMessage="Aucun type."
      />
    </div>
  );
}

function FieldEditor({
  type,
  onChanged,
  showToast,
}: {
  type: ObjectType;
  onChanged: () => Promise<void>;
  showToast: (msg: string, type: "success" | "error") => void;
}) {
  const [editingId, setEditingId] = useState<string | number | null>(null);
  const [editForm, setEditForm] = useState<
    Partial<ObjectField> & {
      optionsText?: string;
    }
  >({});

  const [newField, setNewField] = useState<{
    label: string;
    field_key: string;
    input_type: FieldInputType;
    optionsText: string;
    is_required: boolean;
    sort_order: number;
  }>({
    label: "",
    field_key: "",
    input_type: "text",
    optionsText: "",
    is_required: false,
    sort_order: type.fields.length,
  });

  const notify = (ok: boolean, okMsg: string, errMsg: string) => {
    if (ok) showToast(okMsg, "success");
    else showToast(errMsg, "error");
  };

  const parseOptions = (text: string): string[] | undefined => {
    const parts = text
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    return parts.length > 0 ? parts : undefined;
  };

  const handleAddField = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newField.label.trim() || !newField.field_key.trim()) {
      notify(false, "", "Libellé et clé sont requis.");
      return;
    }
    if (newField.input_type === "select" && !newField.optionsText.trim()) {
      notify(
        false,
        "",
        "Une liste de choix a besoin d'options (séparées par des virgules).",
      );
      return;
    }
    try {
      await fieldService.add(type.id, {
        label: newField.label.trim(),
        field_key: newField.field_key.trim(),
        input_type: newField.input_type,
        options:
          newField.input_type === "select"
            ? parseOptions(newField.optionsText)
            : undefined,
        is_required: newField.is_required,
        sort_order: newField.sort_order,
      });
      notify(true, "Champ ajouté.", "");
      setNewField({
        label: "",
        field_key: "",
        input_type: "text",
        optionsText: "",
        is_required: false,
        sort_order: type.fields.length + 1,
      });
      await onChanged();
    } catch (err) {
      notify(false, "", err instanceof Error ? err.message : "Erreur.");
    }
  };

  const handleSaveField = async () => {
    const options =
      editForm.input_type === "select"
        ? parseOptions(editForm.optionsText || "")
        : undefined;
    try {
      await fieldService.update(Number(editingId), {
        label: editForm.label,
        field_key: editForm.field_key,
        input_type: editForm.input_type,
        options,
        is_required: editForm.is_required,
        sort_order: Number(editForm.sort_order),
      });
      setEditingId(null);
      notify(true, "Champ mis à jour.", "");
      await onChanged();
    } catch (err) {
      notify(false, "", err instanceof Error ? err.message : "Erreur.");
    }
  };

  const handleDeleteField = async (id: number | string) => {
    if (!window.confirm("Supprimer ce champ du gabarit ?")) return;
    try {
      await fieldService.remove(Number(id));
      notify(true, "Champ supprimé.", "");
      await onChanged();
    } catch (err) {
      notify(false, "", err instanceof Error ? err.message : "Erreur.");
    }
  };

  const columns: Column<ObjectField>[] = [
    {
      field: "label",
      label: "Libellé",
      className: "w-[22%]",
      render: (item) => (
        <span className="font-medium truncate block">{item.label}</span>
      ),
      renderEdit: (form, update) => (
        <input
          type="text"
          className="crm-input py-1 px-2 text-xs"
          value={form.label || ""}
          onChange={(e) => update({ label: e.target.value })}
        />
      ),
    },
    {
      field: "field_key",
      label: "Clé",
      className: "w-[16%]",
      render: (item) => (
        <span className="text-xs font-mono text-(--text-muted) truncate block">
          {item.field_key}
        </span>
      ),
      renderEdit: (form, update) => (
        <input
          type="text"
          className="crm-input py-1 px-2 text-xs"
          value={form.field_key || ""}
          onChange={(e) => update({ field_key: e.target.value })}
        />
      ),
    },
    {
      field: "input_type",
      label: "Type",
      className: "w-[18%]",
      render: (item) => (
        <span className="text-xs truncate block">
          {INPUT_TYPE_LABELS[item.input_type]}
        </span>
      ),
      renderEdit: (form, update) => (
        <select
          className="crm-input py-1 px-2 text-xs cursor-pointer"
          value={form.input_type || "text"}
          onChange={(e) =>
            update({ input_type: e.target.value as FieldInputType })
          }
        >
          {INPUT_TYPES.map((t) => (
            <option key={t} value={t}>
              {INPUT_TYPE_LABELS[t]}
            </option>
          ))}
        </select>
      ),
    },
    {
      field: "options",
      label: "Options",
      render: (item) =>
        item.input_type === "select" ? (
          <span className="text-xs text-(--text-muted) truncate block">
            {(item.options || []).join(", ")}
          </span>
        ) : (
          <span className="text-xs text-(--text-muted)">—</span>
        ),
      renderEdit: (form, update) => {
        const f = form as Partial<ObjectField> & { optionsText?: string };
        return (
          <input
            type="text"
            className="crm-input py-1 px-2 text-xs"
            placeholder={
              f.input_type === "select" ? "option1, option2…" : "Sans objet"
            }
            value={f.optionsText ?? (f.options || []).join(", ")}
            onChange={(e) =>
              update({ optionsText: e.target.value } as Partial<ObjectField>)
            }
          />
        );
      },
    },
    {
      field: "is_required",
      label: "Req.",
      className: "w-14",
      render: (item) => (
        <span className="text-xs">{item.is_required ? "Oui" : "Non"}</span>
      ),
      renderEdit: (form, update) => (
        <input
          type="checkbox"
          className="w-4 h-4 cursor-pointer"
          checked={Boolean(form.is_required)}
          onChange={(e) => update({ is_required: e.target.checked })}
        />
      ),
    },
    {
      field: "sort_order",
      label: "Ordre",
      className: "w-14",
      render: (item) => <span className="text-xs">{item.sort_order}</span>,
      renderEdit: (form, update) => (
        <input
          type="number"
          className="crm-input py-1 px-2 text-xs"
          value={form.sort_order ?? 0}
          onChange={(e) => update({ sort_order: Number(e.target.value) })}
        />
      ),
    },
  ];

  return (
    <div className="flex flex-col min-h-0 gap-3">
      <div className="crm-card p-4 flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-lg font-bold tracking-tight">{type.name}</h2>
          <p className="text-xs text-(--text-muted)">
            Gabarit personnalisé — {type.fields.length} champs (
            {type.fields.filter((f) => f.is_required).length} requis)
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onChanged}
            className="crm-btn-ghost text-xs h-9 w-9 p-0"
            title="Actualiser"
          >
            <Image
              src="/icons/refresh.webp"
              alt="Actualiser"
              width={14}
              height={14}
              className="object-contain brightness-0 invert shrink-0"
              unoptimized
            />
          </button>
        </div>
      </div>

      <form
        onSubmit={handleAddField}
        className="crm-card p-4 grid grid-cols-1 md:grid-cols-2 desktop:grid-cols-6 gap-3 items-end"
      >
        <div>
          <label className="block text-xs text-(--text-muted) mb-1">
            Libellé
          </label>
          <input
            type="text"
            className="crm-input"
            placeholder="Adresse MAC"
            value={newField.label}
            onChange={(e) =>
              setNewField({ ...newField, label: e.target.value })
            }
          />
        </div>
        <div>
          <label className="block text-xs text-(--text-muted) mb-1">
            Clé technique
          </label>
          <input
            type="text"
            className="crm-input"
            placeholder="adresse_mac"
            value={newField.field_key}
            onChange={(e) =>
              setNewField({ ...newField, field_key: e.target.value })
            }
          />
        </div>
        <div>
          <label className="block text-xs text-(--text-muted) mb-1">Type</label>
          <select
            className="crm-input cursor-pointer"
            value={newField.input_type}
            onChange={(e) =>
              setNewField({
                ...newField,
                input_type: e.target.value as FieldInputType,
              })
            }
          >
            {INPUT_TYPES.map((t) => (
              <option key={t} value={t}>
                {INPUT_TYPE_LABELS[t]}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs text-(--text-muted) mb-1">
            Ordre
          </label>
          <input
            type="number"
            className="crm-input"
            value={newField.sort_order}
            onChange={(e) =>
              setNewField({ ...newField, sort_order: Number(e.target.value) })
            }
          />
        </div>
        <div className="flex items-end gap-3 md:col-span-2 desktop:col-span-1">
          <label className="flex items-center gap-2 text-xs text-(--text-muted) cursor-pointer mb-2">
            <input
              type="checkbox"
              className="w-4 h-4 cursor-pointer"
              checked={newField.is_required}
              onChange={(e) =>
                setNewField({ ...newField, is_required: e.target.checked })
              }
            />
            Requis
          </label>
          <button type="submit" className="crm-btn-primary text-sm flex-1">
            <Image
              src="/icons/add.webp"
              alt="Ajouter"
              width={14}
              height={14}
              className="object-contain brightness-0 invert shrink-0"
              unoptimized
            />
            Ajouter le champ
          </button>
        </div>
        {newField.input_type === "select" && (
          <div className="md:col-span-2 desktop:col-span-6 -mt-1">
            <label className="block text-xs text-(--text-muted) mb-1">
              Options (séparées par des virgules)
            </label>
            <input
              type="text"
              className="crm-input"
              placeholder="En service, En réserve, Réformé…"
              value={newField.optionsText}
              onChange={(e) =>
                setNewField({ ...newField, optionsText: e.target.value })
              }
            />
          </div>
        )}
      </form>

      <div className="flex-1 min-h-0 crm-card p-0 overflow-hidden flex">
        <DataTable<ObjectField>
          data={type.fields}
          columns={columns}
          keyExtractor={(item) => item.id}
          editingId={editingId}
          editForm={editForm}
          setEditForm={setEditForm}
          onEdit={(item) => {
            setEditingId(item.id);
            setEditForm({
              ...item,
              optionsText: (item.options || []).join(", "),
            });
          }}
          onSave={() => handleSaveField()}
          onCancel={() => setEditingId(null)}
          onDelete={(id) => handleDeleteField(id)}
          emptyMessage="Aucun champ défini. Ajoutes-en un avec le formulaire."
        />
      </div>
    </div>
  );
}
