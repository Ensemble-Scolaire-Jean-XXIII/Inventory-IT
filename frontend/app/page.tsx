"use client";

import { useEffect, useRef, useState } from "react";
import { CreateObjectPayload } from "./types/models";
import { useInventory } from "./hooks/useInventory";
import { useToast } from "./contexts/ToastContext";
import TypePanel from "./components/TypePanel";
import RefreshButton from "./components/RefreshButton";
import Skeleton, { TableSkeleton } from "./components/Skeleton";

export default function HomePage() {
  const inventory = useInventory();
  const { showToast } = useToast();
  const [activeTypeId, setActiveTypeId] = useState<number | null>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const scrollAreaRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const onFocus = () => {
      inventory.load();
    };
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [inventory.load]);

  useEffect(() => {
    if (inventory.error) {
      showToast(inventory.error, "error");
      inventory.setError("");
    }
  }, [inventory.error, inventory.setError, showToast]);

  useEffect(() => {
    if (inventory.undoAction) {
      showToast(
        inventory.undoAction.message,
        "undo",
        inventory.undoAction.duration,
        inventory.undoAction.onUndo,
      );
      inventory.setUndoAction(null);
    }
  }, [inventory.undoAction, inventory.setUndoAction, showToast]);

  useEffect(() => {
    if (inventory.types.length === 0 || !scrollAreaRef.current) return;

    if (observerRef.current) observerRef.current.disconnect();
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort(
            (a, b) =>
              a.boundingClientRect.top - b.boundingClientRect.top,
          )[0] as IntersectionObserverEntry | undefined;
        if (visible) {
          const id = Number((visible.target as HTMLElement).dataset.typeId);
          if (!Number.isNaN(id)) setActiveTypeId(id);
        }
      },
      { root: scrollAreaRef.current, threshold: [0.15, 0.4, 0.7] },
    );
    observerRef.current = observer;
    inventory.types.forEach((type) => {
      const el = document.getElementById(`panel-${type.id}`);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, [inventory.types]);

  const scrollToPanel = (id: number) => {
    setActiveTypeId(id);
    document
      .getElementById(`panel-${id}`)
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const handleAdd = async (payload: CreateObjectPayload) => {
    const res = await inventory.addObject(payload);
    if (res.success) {
      const count = res.count || 1;
      showToast(
        count > 1 ? `${count} objets ajoutés.` : "Objet ajouté.",
        "success",
      );
      return true;
    }
    showToast(res.error || "Erreur à l'ajout.", "error");
    return false;
  };

  const handleUpdate = async (
    id: number,
    payload: { name?: string; data?: Record<string, unknown> },
  ) => {
    inventory.updateObjectWithUndo(id, payload);
    return true;
  };

  const handleDelete = async (id: number) => {
    inventory.deleteObjectWithUndo(id);
    return true;
  };

  if (inventory.isLoading && inventory.types.length === 0) {
    return <InventorySkeleton />;
  }

  if (inventory.types.length === 0 && !inventory.isLoading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-3 text-center">
        <p className="text-(--text-muted)">
          Aucun type d'objet défini. Crée un gabarit pour commencer.
        </p>
        <a href="/gabarits" className="crm-btn-primary text-sm">
          Aller aux gabarits
        </a>
      </div>
    );
  }

  return (
    <div className="flex flex-col flex-1 min-h-0">
      <div className="shrink-0 bg-[rgba(9,9,11,0.9)] backdrop-blur-xl border-b border-(--border-color) px-4 py-2">
        <div className="flex items-center gap-2 overflow-x-auto custom-scrollbar">
          {inventory.types.map((type) => {
            const count = (inventory.objectsByType[type.id] || []).length;
            const isActive = activeTypeId === type.id;
            const isFirst =
              activeTypeId === null &&
              type.id === inventory.types[0].id;
            return (
              <button
                key={type.id}
                onClick={() => scrollToPanel(type.id)}
                className={`shrink-0 px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors cursor-pointer ${
                  isActive || isFirst
                    ? "bg-accent/20 text-white border-accent/40"
                    : "bg-white/5 text-(--text-muted) border-(--border-color) hover:bg-white/10 hover:text-(--text-main)"
                }`}
              >
                <span className="whitespace-nowrap">{type.name}</span>
                <span className="ml-1.5 text-xs opacity-70">{count}</span>
              </button>
            );
          })}

          <div className="ml-auto shrink-0 flex items-center gap-2">
            <span className="text-xs text-(--text-muted) whitespace-nowrap">
              {inventory.objects.length} objets au total
            </span>
            <RefreshButton onRefresh={() => inventory.load()} />
          </div>
        </div>
      </div>

      <div
        ref={scrollAreaRef}
        className="flex-1 min-h-0 overflow-y-auto custom-scrollbar flex flex-col gap-8 py-4 px-4"
      >
        {inventory.types.map((type) => (
          <TypePanel
            key={type.id}
            type={type}
            rows={inventory.objectsByType[type.id] || []}
            isLoading={inventory.isLoading}
            onAdd={handleAdd}
            onUpdate={handleUpdate}
            onDelete={handleDelete}
          />
        ))}
      </div>
    </div>
  );
}

function PanelSkeleton() {
  return (
    <div className="flex flex-col gap-3 shrink-0">
      <div className="flex items-center gap-3 flex-wrap">
        <Skeleton className="h-6 w-44" />
        <Skeleton className="h-5 w-16 rounded-full" />
        <div className="ml-auto flex items-center gap-2">
          <Skeleton className="h-8 w-56 rounded-lg" />
          <Skeleton className="h-9 w-28 rounded-lg" />
        </div>
      </div>
      <div className="crm-card p-0 overflow-hidden">
        <table className="w-full text-left border-separate border-spacing-0 text-sm table-fixed">
          <tbody>
            <TableSkeleton columns={5} rows={8} />
          </tbody>
        </table>
      </div>
    </div>
  );
}

function InventorySkeleton() {
  return (
    <div className="flex flex-col flex-1 min-h-0">
      <div className="shrink-0 border-b border-(--border-color) px-4 py-2">
        <div className="flex items-center gap-2">
          <Skeleton className="h-9 w-32 rounded-lg" />
          <Skeleton className="h-9 w-24 rounded-lg" />
          <Skeleton className="h-9 w-28 rounded-lg" />
          <div className="ml-auto">
            <Skeleton className="h-9 w-9 rounded-lg" />
          </div>
        </div>
      </div>
      <div className="flex-1 min-h-0 overflow-hidden flex flex-col gap-8 py-4 px-4">
        <PanelSkeleton />
        <PanelSkeleton />
      </div>
    </div>
  );
}