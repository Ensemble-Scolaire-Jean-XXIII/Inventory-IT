"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { ToastProps } from "../types/models";

export default function Toast({
  message,
  type,
  duration = 5000,
  onClose,
  onUndo,
}: ToastProps) {
  const [progress, setProgress] = useState(100);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  useEffect(() => {
    if (!message) return;

    setProgress(100);
    const startTime = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, 100 - (elapsed / duration) * 100);
      setProgress(remaining);
      if (remaining <= 0) {
        clearInterval(interval);
        onClose();
      }
    }, 50);

    return () => clearInterval(interval);
  }, [message, duration, onClose]);

  if (!message || !mounted) return null;

  const isUndo = type === "undo";
  const isError = type === "error";
  const isSuccess = type === "success";

  const dotColor = isError
    ? "bg-red-500"
    : isUndo
      ? "bg-[var(--accent)]"
      : isSuccess
        ? "bg-emerald-400"
        : "bg-blue-400";

  const progressBarColor = isError
    ? "bg-red-500"
    : isUndo
      ? "bg-[var(--accent)]"
      : isSuccess
        ? "bg-emerald-400"
        : "bg-[var(--accent)]";

  const toastContent = (
    <div className="toast-in fixed bottom-6 right-6 z-9999 bg-(--bg-card) backdrop-blur-xl border border-(--border-color) text-(--text-main) rounded-2xl shadow-2xl overflow-hidden min-w-85">
      <div className="px-6 py-4 flex items-center justify-between gap-6">
        <div className="flex items-center gap-3">
          <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${dotColor}`} />
          <span className="text-sm font-medium tracking-wide">{message}</span>
        </div>

        <div className="flex items-center gap-4 ml-auto shrink-0">
          {isUndo && onUndo && (
            <button
              onClick={() => {
                onUndo();
                onClose();
              }}
              className="text-xs font-bold text-(--accent) hover:opacity-80 transition-opacity uppercase tracking-wider cursor-pointer"
            >
              Annuler
            </button>
          )}
          <button
            onClick={onClose}
            className="text-(--text-muted) hover:text-(--text-main) transition-colors text-lg font-bold cursor-pointer"
          >
            &times;
          </button>
        </div>
      </div>

      <div className="w-full bg-white/10 h-1">
        <div
          className={`${progressBarColor} h-full transition-all duration-75 ease-linear`}
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );

  return createPortal(toastContent, document.body);
}