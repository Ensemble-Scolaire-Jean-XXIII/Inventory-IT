"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { CreateObjectPayload } from "./types/models";
import { useInventory } from "./hooks/useInventory";
import { useToast } from "./contexts/ToastContext";
import TypePanel from "./components/TypePanel";

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
    if (inventory.types.length === 0 || !scrollAreaRef.current) return;

    if (observerRef.current) observerRef.current.disconnect();
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0] as
          | IntersectionObserverEntry
          | undefined;
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
    document
      .getElementById(`panel-${id}`)
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const handleAdd = async (payload: CreateObjectPayload) => {
    const res = await inventory.addObject(payload);
    if (res.success) {
      showToast("Objet ajouté.", "success");
      return true;
    }
    showToast(res.error || "Erreur à l'ajout.", "error");
    return false;
  };

  const handleUpdate = async (
    id: number,
    payload: { name?: string; data?: Record<string, unknown> },
  ) => {
    const res = await inventory.updateObject(id, payload);
    if (res.success) {
      showToast("Objet mis à jour.", "success");
      return true;
    }
    showToast(res.error || "Erreur de modification.", "error");
    return false;
  };

  const handleDelete = async (id: number) => {
    const res = await inventory.deleteObject(id);
    if (res.success) {
      showToast("Objet supprimé.", "success");
      return true;
    }
    showToast(res.error || "Erreur de suppression.", "error");
    return false;
  };

  if (inventory.isLoading && inventory.types.length === 0) {
    return (
      <div className="flex-1 grid place-items-center text-(--text-muted)">
        Chargement de l'inventaire…
      </div>
    );
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
            <button
              onClick={() => inventory.load()}
              className="crm-btn-ghost text-xs h-9 w-9 p-0"
              title="Actualiser"
            >
              <Image
                src="/icons/refresh.webp"
                alt="Actualiser"
                width={14}
                height={14}
                className="object-contain brightness-0 invert shrink-0"
                unoptimized
              />
            </button>
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
            onAdd={handleAdd}
            onUpdate={handleUpdate}
            onDelete={handleDelete}
          />
        ))}
      </div>
    </div>
  );
}