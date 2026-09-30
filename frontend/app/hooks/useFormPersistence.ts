"use client";

import { useEffect, useState, useCallback } from "react";

export function useFormPersistence<T>(
  formKey: string,
  initialValues: T,
): [T, (values: Partial<T>) => void, () => void] {
  const [values, setValues] = useState<T>(() => {
    if (typeof window === "undefined") return initialValues;
    try {
      const saved = localStorage.getItem(`form_${formKey}`);
      if (saved) {
        const parsed = JSON.parse(saved);
        return { ...initialValues, ...parsed };
      }
    } catch {
      // ignore parse errors
    }
    return initialValues;
  });

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem(`form_${formKey}`, JSON.stringify(values));
    }
  }, [formKey, values]);

  const updateValues = useCallback((newValues: Partial<T>) => {
    setValues((prev) => ({ ...prev, ...newValues }));
  }, []);

  const clearForm = useCallback(() => {
    setValues(initialValues);
    if (typeof window !== "undefined") {
      localStorage.removeItem(`form_${formKey}`);
    }
  }, [formKey, initialValues]);

  return [values, updateValues, clearForm];
}