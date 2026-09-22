import { useEffect } from "react";
import { ToastProps } from "../types/models";

const styles: Record<ToastProps["type"], string> = {
  success: "border-emerald-500/40 bg-emerald-950/90 text-emerald-200",
  error: "border-red-500/40 bg-red-950/90 text-red-200",
  info: "border-sky-500/40 bg-sky-950/90 text-sky-200",
  undo: "border-amber-500/40 bg-amber-950/90 text-amber-200",
};

export default function Toast({
  message,
  type,
  duration = 5000,
  onClose,
  onUndo,
}: ToastProps) {
  useEffect(() => {
    if (!onUndo) {
      const timer = setTimeout(onClose, duration);
      return () => clearTimeout(timer);
    }
  }, [duration, onClose, onUndo]);

  return (
    <div
      className={`fixed bottom-4 right-4 z-[100] flex items-center gap-3 px-4 py-3 rounded-xl border backdrop-blur-xl shadow-2xl text-sm font-medium ${styles[type]}`}
      role="status"
    >
      <span className="wrap-break-word max-w-md">{message}</span>
      {onUndo && (
        <button
          onClick={() => {
            onUndo();
            onClose();
          }}
          className="font-bold underline underline-offset-2 cursor-pointer"
        >
          Annuler
        </button>
      )}
      <button
        onClick={onClose}
        className="opacity-60 hover:opacity-100 cursor-pointer text-xs"
        aria-label="Fermer"
      >
        ✕
      </button>
    </div>
  );
}