import { useState, useMemo } from "react";

export function useSearch<T>(
  data: T[],
  filterFn: (item: T, query: string) => boolean,
) {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredData = useMemo(() => {
    if (!searchQuery.trim()) return data;
    const query = searchQuery.toLowerCase();
    return data.filter((item) => filterFn(item, query));
  }, [data, searchQuery, filterFn]);

  return {
    searchQuery,
    setSearchQuery,
    filteredData,
  };
}