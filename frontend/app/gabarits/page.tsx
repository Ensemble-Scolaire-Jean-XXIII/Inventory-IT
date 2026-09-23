"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import { ObjectType, Column } from "../types/models";
import DataTable from "../components/DataTable";
import RefreshButton from "../components/RefreshButton";
import FieldEditor from "../components/FieldEditor";
import { typeService } from "../services/typeService";
import { useSearch } from "../hooks/useSearch";
import { useToast } from "../contexts/ToastContext";
import { useUndo } from "../hooks/useUndo";

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
    const previousData = types;
    const nextTypes = orderedIds
      .map((id) => types.find((t) => t.id === id))
      .filter(Boolean)
      .map((t, i) => ({ ...t, sort_order: i + 1 })) as ObjectType[];

    setTypes(nextTypes);
    try {
      await typeService.reorder(nextTypes.map((t) => t.id));
      notify(true, "Ordre mis à jour.", "");
      await loadTypes();
    } catch (err) {
      notify(false, "", err instanceof Error ? err.message : "Erreur.");
      setTypes(previousData);
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
              isLoading={isLoading}
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
    ...(searchQuery
      ? []
      : [
          {
            field: "__drag",
            label: "",
            className: "w-8",
            render: () => (
              <Image
                src="/icons/drag.webp"
                alt=""
                width={14}
                height={14}
                className="object-contain brightness-0 invert opacity-50 mx-auto cursor-grab shrink-0"
                unoptimized
              />
            ),
          } as Column<ObjectType>,
        ]),
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
        actionsHeader={
          <input
            type="text"
            className="crm-input w-full py-1 text-xs"
            placeholder="Rechercher…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        }
        isLoading={isLoading}
        emptyMessage="Aucun type."
      />
    </div>
  );
}
