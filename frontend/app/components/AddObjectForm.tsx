"use client";

import { useState, useEffect } from "react";
import { ObjectType, CreateObjectPayload } from "../types/models";
import FieldInput from "./FieldInput";
import { useFormPersistence } from "../hooks/useFormPersistence";

interface AddObjectFormProps {
  type: ObjectType;
  onAdd: (payload: CreateObjectPayload) => Promise<boolean>;
}

interface FormValues {
  name: string;
  values: Record<string, unknown>;
  count: number;
}

const initialFormValues: FormValues = { name: "", values: {}, count: 1 };

export default function AddObjectForm({ type, onAdd }: AddObjectFormProps) {
  const [formValues, setFormValues, clearForm] = useFormPersistence<FormValues>(
    `addObject_${type.id}`,
    initialFormValues,
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { name, values, count } = formValues;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    const data: Record<string, unknown> = {};
    for (const field of type.fields) {
      if (values[field.field_key] !== undefined) {
        data[field.field_key] = values[field.field_key];
      }
    }
    const ok = await onAdd({
      object_type_id: type.id,
      name: name.trim(),
      data,
      count,
    });
    setIsSubmitting(false);
    if (ok) {
      clearForm();
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-6 gap-3 items-end"
    >
      <div>
        <label className="block text-xs text-(--text-muted) mb-1">
          Nom <span className="text-red-400">*</span>
        </label>
        <input
          type="text"
          className="crm-input"
          value={name}
          onChange={(e) => setFormValues({ name: e.target.value })}
          placeholder="Nom de l'objet"
          required
        />
      </div>

      <div>
        <label className="block text-xs text-(--text-muted) mb-1">
          Quantité
        </label>
        <input
          type="number"
          className="crm-input"
          value={count}
          onChange={(e) => setFormValues({ count: Math.max(1, Math.min(100, Number(e.target.value) || 1)) })}
          min="1"
          max="100"
          placeholder="1"
        />
      </div>

      {type.fields.map((field) => (
        <div key={field.id}>
          <label className="block text-xs text-(--text-muted) mb-1">
            {field.label}
            {field.is_required && <span className="text-red-400">*</span>}
          </label>
          <FieldInput
            field={field}
            value={values[field.field_key]}
            onChange={(value) =>
              setFormValues({ values: { ...values, [field.field_key]: value } })
            }
            required={field.is_required}
          />
        </div>
      ))}

      <div>
        <label className="block text-xs text-(--text-muted) mb-1">
          &nbsp;
        </label>
        <button
          type="submit"
          className="crm-btn-primary w-full"
          disabled={isSubmitting}
        >
          {isSubmitting ? "Ajout…" : "Ajouter"}
        </button>
      </div>
    </form>
  );
}