import { useCallback, useState } from "react";

export interface UndoAction {
  message: string;
  duration: number;
  timerId: ReturnType<typeof setTimeout>;
  onUndo: () => void;
}

export function useUndo() {
  const [undoAction, setUndoAction] = useState<UndoAction | null>(null);

  const runWithUndo = useCallback(
    (opts: {
      mutate: () => void;
      persist: () => Promise<void>;
      rollback: () => void;
      message: string;
      duration?: number;
    }) => {
      opts.mutate();
      const duration = opts.duration ?? 3000;

      const timerId = setTimeout(async () => {
        try {
          await opts.persist();
        } catch {
          opts.rollback();
        }
        setUndoAction(null);
      }, duration);

      setUndoAction({
        message: opts.message,
        duration,
        timerId,
        onUndo: () => {
          clearTimeout(timerId);
          opts.rollback();
          setUndoAction(null);
        },
      });
    },
    [],
  );

  return { undoAction, setUndoAction, runWithUndo };
}