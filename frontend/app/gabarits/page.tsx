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
import RefreshButton from "../components/RefreshButton";
import { typeService } from "../services/typeService";
import { fieldService } from "../services/fieldService";
import { useSearch } from "../hooks/useSearch";
import { useToast } from "../contexts/ToastContext";
import { useUndo } from "../hooks/useUndo";

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
  const { undoAction, setUndoAction, runWithUndo } = useUndo();
  const [types, setTypes] = useState<ObjectType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const [newTypeName, setNewTypeName] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  const [editingTypeId, setEditingTypeId] = useState<string | number | null>(
    null,
  );
  const [typeEditForm, setTypeEditForm] = useState<Partial<ObjectType>>({});

  useEffect(() => {
    if (undoAction) {
      showToast(
        undoAction.message,
        "undo",
        undoAction.duration,
        undoAction.onUndo,
      );
      setUndoAction(null);
    }
  }, [undoAction, setUndoAction, showToast]);

  const loadTypes = useCallback(async () => {
    setIsLoading(true);
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
        sort_order: types.length + 1,
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

  const handleSaveType = (id: string | number) => {
    const payload = {
      name: typeEditForm.name?.trim(),
      sort_order: Number(typeEditForm.sort_order),
    };
    const previousData = types;
    runWithUndo({
      message: "Modification effectuée. Annulation possible pendant 3s.",
      mutate: () =>
        setTypes((prev) =>
          prev.map((t) =>
            t.id === id
              ? {
                  ...t,
                  name: payload.name ?? t.name,
                  sort_order: payload.sort_order,
                }
              : t,
          ),
        ),
      persist: async () => {
        await typeService.update(Number(id), payload);
        await loadTypes();
      },
      rollback: () => setTypes(previousData),
    });
    setEditingTypeId(null);
  };

  const handleDeleteType = (id: string | number) => {
    const type = types.find((t) => t.id === id);
    if (
      !type ||
      !window.confirm(
        `Supprimer le type « ${type.name} » ? Tous ses objets seront supprimés.`,
      )
    ) {
      return;
    }
    const previousData = types;
    runWithUndo({
      message: "Suppression effectuée. Annulation possible pendant 3s.",
      mutate: () => setTypes((prev) => prev.filter((t) => t.id !== type.id)),
      persist: async () => {
        await typeService.remove(type.id);
        await loadTypes();
      },
      rollback: () => {
        setTypes(previousData);
        setSelectedId(type.id);
      },
    });
    if (selectedId === type.id) setSelectedId(null);
  };

  const handleReorderTypes = async (orderedIds: (string | number)[]) => {
    if (orderedIds.length !== types.length) return;
    const idToOrder = new Map(types.map((t) => [t.id, t.sort_order]));
    const nextTypes = orderedIds
      .map((id) => types.find((t) => t.id === id))
      .filter(Boolean)
      .map((t, i) => ({ ...t, sort_order: i + 1 })) as ObjectType[];

    setTypes(nextTypes);
    try {
      await Promise.all(
        nextTypes
          .filter((t) => idToOrder.get(t.id) !== t.sort_order)
          .map((t) => typeService.update(t.id, { sort_order: t.sort_order })),
      );
      notify(true, "Ordre mis à jour.", "");
      await loadTypes();
    } catch (err) {
      notify(false, "", err instanceof Error ? err.message : "Erreur.");
      await loadTypes();
    }
  };

  return (
    <div className="flex flex-col flex-1 min-h-0 px-4 py-4">
      <div className="flex items-center justify-between gap-3 flex-wrap mb-1">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Gabarits</h1>
          <p className="text-sm text-(--text-muted)">
            Définis les types d'objets et leurs gabarits de champs
            personnalisés.
          </p>
        </div>
        <RefreshButton onRefresh={loadTypes} />
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
              onReorder={handleReorderTypes}
            />
          </div>
        </div>

        <div className="flex flex-col min-h-0">
          {selected ? (
            <FieldEditor
              key={selected.id}
              type={selected}
              onChanged={loadTypes}
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
  onReorder,
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
  onReorder: (orderedIds: (string | number)[]) => void;
}) {
  const { searchQuery, setSearchQuery, filteredData } = useSearch(
    types,
    (t, q) => t.name.toLowerCase().includes(q),
  );

  const handleDrop = (fromId: string | number, toId: string | number) => {
    const fromIndex = filteredData.findIndex((t) => t.id === fromId);
    const toIndex = filteredData.findIndex((t) => t.id === toId);
    if (fromIndex < 0 || toIndex < 0 || fromIndex === toIndex) return;
    const next = [...filteredData];
    const [moved] = next.splice(fromIndex, 1);
    next.splice(toIndex, 0, moved);
    onReorder(next.map((t) => t.id));
  };

  const columns: Column<ObjectType>[] = [
    {
      field: "name",
      label: "Type d'objet",
      sortable: false,
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
        data={filteredData}
        columns={columns}
        keyExtractor={(item) => item.id}
        editingId={editingTypeId}
        editForm={typeEditForm}
        setEditForm={setTypeEditForm}
        onEdit={onEdit}
        onSave={onSave}
        onCancel={onCancel}
        onDelete={onDelete}
        onReorder={searchQuery ? undefined : handleDrop}
        rowClassName={(item) =>
          selectedId === item.id ? "bg-accent/15" : ""
        }
        isLoading={isLoading}
        emptyMessage="Aucun type."
      />
    </div>
  );
}

function FieldEditor({
  type,
  onChanged,
}: {
  type: ObjectType;
  onChanged: () => Promise<void>;
}) {
  const { showToast } = useToast();
  const { undoAction, setUndoAction, runWithUndo } = useUndo();
  const [fields, setFields] = useState<ObjectField[]>(type.fields);
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
    sort_order: type.fields.length + 1,
  });

  useEffect(() => {
    setFields(type.fields);
  }, [type.fields]);

  useEffect(() => {
    if (undoAction) {
      showToast(
        undoAction.message,
        "undo",
        undoAction.duration,
        undoAction.onUndo,
      );
      setUndoAction(null);
    }
  }, [undoAction, setUndoAction, showToast]);

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
        sort_order: type.fields.length + 2,
      });
      await onChanged();
    } catch (err) {
      notify(false, "", err instanceof Error ? err.message : "Erreur.");
    }
  };

  const handleSaveField = () => {
    const id = Number(editingId);
    const options =
      editForm.input_type === "select"
        ? parseOptions(editForm.optionsText || "")
        : undefined;
    const payload = {
      label: editForm.label,
      field_key: editForm.field_key,
      input_type: editForm.input_type,
      options,
      is_required: editForm.is_required,
      sort_order: Number(editForm.sort_order),
    };
    const previousData = fields;
    runWithUndo({
      message: "Modification effectuée. Annulation possible pendant 3s.",
      mutate: () =>
        setFields((prev) =>
          prev.map((f) =>
            f.id === id
              ? {
                  ...f,
                  label: payload.label ?? f.label,
                  field_key: payload.field_key ?? f.field_key,
                  input_type: payload.input_type ?? f.input_type,
                  options: payload.options === undefined ? f.options : payload.options,
                  is_required: payload.is_required ?? f.is_required,
                  sort_order: payload.sort_order,
                }
              : f,
          ),
        ),
      persist: async () => {
        await fieldService.update(id, payload);
        await onChanged();
      },
      rollback: () => setFields(previousData),
    });
    setEditingId(null);
  };

  const handleDeleteField = (id: string | number) => {
    const previousData = fields;
    runWithUndo({
      message: "Suppression effectuée. Annulation possible pendant 3s.",
      mutate: () =>
        setFields((prev) => prev.filter((f) => f.id !== id)),
      persist: async () => {
        await fieldService.remove(Number(id));
        await onChanged();
      },
      rollback: () => setFields(previousData),
    });
  };

  const handleReorderFields = async (
    fromId: string | number,
    toId: string | number,
  ) => {
    const fromIndex = fields.findIndex((f) => f.id === fromId);
    const toIndex = fields.findIndex((f) => f.id === toId);
    if (fromIndex < 0 || toIndex < 0 || fromIndex === toIndex) return;
    const reordered = [...fields];
    const [moved] = reordered.splice(fromIndex, 1);
    reordered.splice(toIndex, 0, moved);
    const nextFields = reordered.map((f, i) => ({
      ...f,
      sort_order: i + 1,
    }));
    const idToOrder = new Map(fields.map((f) => [f.id, f.sort_order]));

    setFields(nextFields);
    try {
      await Promise.all(
        nextFields
          .filter((f) => idToOrder.get(f.id) !== f.sort_order)
          .map((f) => fieldService.update(f.id, { sort_order: f.sort_order })),
      );
      notify(true, "Ordre mis à jour.", "");
      await onChanged();
    } catch (err) {
      notify(false, "", err instanceof Error ? err.message : "Erreur.");
      setFields(type.fields);
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
        <RefreshButton onRefresh={onChanged} />
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
          data={fields}
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
          onReorder={handleReorderFields}
          emptyMessage="Aucun champ défini. Ajoutes-en un avec le formulaire."
        />
      </div>
    </div>
  );
}