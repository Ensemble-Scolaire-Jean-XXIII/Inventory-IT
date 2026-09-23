export const formatDate = (iso: string | undefined): string => {
  if (!iso) return "—";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

export const displayValue = (value: unknown): string => {
  if (value === null || value === undefined) return "—";
  if (typeof value === "boolean") return value ? "Oui" : "Non";
  return String(value);
};

export const slugifyKey = (label: string): string => {
  const base = label
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 50);
  return base || "champ";
};

export const uniqueKey = (label: string, taken: string[]): string => {
  const base = slugifyKey(label);
  let candidate = base;
  let i = 2;
  while (taken.includes(candidate)) {
    candidate = `${base}_${i}`;
    i++;
  }
  return candidate;
};

export const monthKey = (iso: string): string => {
  const date = new Date(iso);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
};

export const monthLabel = (iso: string): string => {
  const date = new Date(iso);
  return date.toLocaleDateString("fr-FR", {
    month: "short",
    year: "2-digit",
  });
};