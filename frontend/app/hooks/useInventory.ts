import { useCallback, useEffect, useMemo, useState } from "react";
import { objectService } from "../services/objectService";
import { typeService } from "../services/typeService";
import { UndoAction } from "./useUndo";
import {
  ObjectType,
  InventoryObject,
  CreateObjectPayload,
  UpdateObjectPayload,
} from "../types/models";

export function useInventory() {
  const [types, setTypes] = useState<ObjectType[]>([]);
  const [objects, setObjects] = useState<InventoryObject[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [undoAction, setUndoAction] = useState<UndoAction | null>(null);

  const load = useCallback(async () => {
    try {
      const [typeRes, objectRes] = await Promise.all([
        typeService.getAll(),
        objectService.getAll(),
      ]);
      setTypes(typeRes);
      setObjects(objectRes);
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur de chargement");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const objectsByType = useMemo(() => {
    const map: Record<number, InventoryObject[]> = {};
    for (const obj of objects) {
      if (!map[obj.object_type_id]) map[obj.object_type_id] = [];
      map[obj.object_type_id].push(obj);
    }
    for (const key of Object.keys(map)) {
      map[Number(key)].sort((a, b) =>
        b.created_at.localeCompare(a.created_at),
      );
    }
    return map;
  }, [objects]);

  const addObject = useCallback(
    async (payload: CreateObjectPayload) => {
      try {
        const res = await objectService.create(payload);
        await load();
        return { success: true, count: res.count };
      } catch (err) {
        return {
          success: false,
          error: err instanceof Error ? err.message : "Erreur de création",
        };
      }
    },
    [load],
  );

  const updateObject = useCallback(
    async (id: number, payload: UpdateObjectPayload) => {
      try {
        await objectService.update(id, payload);
        await load();
        return { success: true };
      } catch (err) {
        return {
          success: false,
          error: err instanceof Error ? err.message : "Erreur de modification",
        };
      }
    },
    [load],
  );

  const deleteObject = useCallback(
    async (id: number) => {
      try {
        await objectService.remove(id);
        await load();
        return { success: true };
      } catch (err) {
        return {
          success: false,
          error: err instanceof Error ? err.message : "Erreur de suppression",
        };
      }
    },
    [load],
  );

  const updateObjectWithUndo = useCallback(
    (id: number, payload: UpdateObjectPayload, duration = 3000) => {
      const previousData = objects;
      setObjects((prev) =>
        prev.map((obj) =>
          obj.id === id
            ? {
                ...obj,
                name: payload.name ?? obj.name,
                data: { ...(obj.data || {}), ...(payload.data || {}) },
              }
            : obj,
        ),
      );

      const timerId = setTimeout(async () => {
        try {
          await objectService.update(id, payload);
          await load();
        } catch {
          setObjects(previousData);
        }
        setUndoAction(null);
      }, duration);

      setUndoAction({
        message: "Modification effectuée. Annulation possible pendant 3s.",
        duration,
        timerId,
        onUndo: () => {
          clearTimeout(timerId);
          setObjects(previousData);
          setUndoAction(null);
        },
      });
    },
    [objects, load],
  );

  const deleteObjectWithUndo = useCallback(
    (id: number, duration = 3000) => {
      const previousData = objects;
      setObjects((prev) => prev.filter((obj) => obj.id !== id));

      const timerId = setTimeout(async () => {
        try {
          await objectService.remove(id);
          await load();
        } catch {
          setObjects(previousData);
        }
        setUndoAction(null);
      }, duration);

      setUndoAction({
        message: "Suppression effectuée. Annulation possible pendant 3s.",
        duration,
        timerId,
        onUndo: () => {
          clearTimeout(timerId);
          setObjects(previousData);
          setUndoAction(null);
        },
      });
    },
    [objects, load],
  );

  return {
    types,
    objects,
    objectsByType,
    isLoading,
    error,
    setError,
    load,
    addObject,
    updateObject,
    deleteObject,
    updateObjectWithUndo,
    deleteObjectWithUndo,
    undoAction,
    setUndoAction,
  };
}