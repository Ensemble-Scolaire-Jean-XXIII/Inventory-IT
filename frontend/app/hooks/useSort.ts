import { useState } from "react";

export function useSort(
  initialField: string,
  initialDirection: "asc" | "desc" = "asc",
) {
  const [sortField, setSortField] = useState<string>(initialField);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">(
    initialDirection,
  );

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  return { sortField, sortDirection, handleSort };
}