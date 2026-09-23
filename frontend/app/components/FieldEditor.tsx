"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import {
  ObjectType,
  ObjectField,
  FieldInputType,
  Column,
} from "../types/models";
import DataTable from "./DataTable";
import { fieldService } from "../services/fieldService";
import { uniqueKey } from "../lib/format";
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

export default function FieldEditor({
  type,
  isLoading = false,
  onChanged,
}: {
  type: ObjectType;
  isLoading?: boolean;
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
    input_type: FieldInputType;
    optionsText: string;
    is_required: boolean;
  }>({
    label: "",
    input_type: "text",
    optionsText: "",
    is_required: false,
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
    if (!newField.label.trim()) {
      notify(false, "", "Le libellé est requis.");
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
        field_key: uniqueKey(
          newField.label.trim(),
          fields.map((f) => f.field_key),
        ),
        input_type: newField.input_type,
        options:
          newField.input_type === "select"
            ? parseOptions(newField.optionsText)
            : undefined,
        is_required: newField.is_required,
        sort_order: fields.length + 1,
      });
      notify(true, "Champ ajouté.", "");
      setNewField({
        label: "",
        input_type: "text",
        optionsText: "",
        is_required: false,
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
                  options:
                    payload.options === undefined ? f.options : payload.options,
                  is_required: payload.is_required ?? f.is_required,
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
      mutate: () => setFields((prev) => prev.filter((f) => f.id !== id)),
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
    const previousFields = fields;
    const reordered = [...fields];
    const [moved] = reordered.splice(fromIndex, 1);
    reordered.splice(toIndex, 0, moved);
    const nextFields = reordered.map((f, i) => ({
      ...f,
      sort_order: i + 1,
    }));

    setFields(nextFields);
    try {
      await fieldService.reorder(
        type.id,
        nextFields.map((f) => f.id),
      );
      notify(true, "Ordre mis à jour.", "");
      await onChanged();
    } catch (err) {
      notify(false, "", err instanceof Error ? err.message : "Erreur.");
      setFields(previousFields);
    }
  };

  const columns: Column<ObjectField>[] = [
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
    },
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
    },
  ];

  return (
    <div className="flex flex-col flex-1 min-h-0 gap-3">
      <div className="crm-card p-4">
        <h2 className="text-lg font-bold tracking-tight">{type.name}</h2>
        <p className="text-xs text-(--text-muted)">
          Gabarit personnalisé — {type.fields.length} champs (
          {type.fields.filter((f) => f.is_required).length} requis)
        </p>
      </div>

      <form
        onSubmit={handleAddField}
        className="crm-card p-4 grid grid-cols-1 md:grid-cols-4 gap-3 items-end"
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
        <label className="flex items-center gap-2 text-xs text-(--text-muted) cursor-pointer select-none md:-translate-y-1.5">
          <span
            className={`relative inline-flex w-10 h-6 items-center rounded-full border transition-colors shrink-0 ${
              newField.is_required
                ? "bg-(--accent) border-(--accent)"
                : "bg-(--input-bg) border-(--border-color)"
            }`}
          >
            <input
              type="checkbox"
              className="sr-only"
              checked={newField.is_required}
              onChange={(e) =>
                setNewField({ ...newField, is_required: e.target.checked })
              }
            />
            <span
              className={`absolute h-4.5 w-4.5 rounded-full transition-transform duration-200 ${
                newField.is_required
                  ? "translate-x-4.5 bg-white"
                  : "translate-x-0.75 bg-(--text-muted)"
              }`}
            />
          </span>
          Requis
        </label>
        <button type="submit" className="crm-btn-primary text-sm">
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
        {newField.input_type === "select" && (
          <div className="md:col-span-4 -mt-1">
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
          isLoading={isLoading}
          emptyMessage="Aucun champ défini. Ajoutes-en un avec le formulaire."
        />
      </div>
    </div>
  );
}
