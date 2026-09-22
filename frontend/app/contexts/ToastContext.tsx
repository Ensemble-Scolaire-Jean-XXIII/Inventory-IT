"use client";

import React, { createContext, useContext, useState, useCallback } from "react";
import Toast from "../components/Toast";
import { ToastContextType, ToastType } from "../types/models";

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toast, setToast] = useState<{
    message: string;
    type: ToastType;
    duration?: number;
    onUndo?: () => void;
  } | null>(null);

  const showToast = useCallback(
    (
      message: string,
      type: ToastType,
      duration = 5000,
      onUndo?: () => void,
    ) => {
      setToast({ message, type, duration, onUndo });
    },
    [],
  );

  const hideToast = useCallback(() => {
    setToast(null);
  }, []);

  return (
    <ToastContext.Provider value={{ showToast, hideToast }}>
      {children}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          duration={toast.duration}
          onClose={hideToast}
          onUndo={toast.onUndo}
        />
      )}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}