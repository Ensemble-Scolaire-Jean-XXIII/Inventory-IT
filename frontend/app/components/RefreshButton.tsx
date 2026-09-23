"use client";

import { useRef, useState } from "react";
import Image from "next/image";

export default function RefreshButton({
  onRefresh,
  title = "Actualiser",
}: {
  onRefresh: () => Promise<void> | void;
  title?: string;
}) {
  const [isRotating, setIsRotating] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleClick = async () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setIsRotating(true);
    try {
      await onRefresh();
    } finally {
      timeoutRef.current = setTimeout(() => setIsRotating(false), 600);
    }
  };

  return (
    <button
      onClick={handleClick}
      className="crm-btn-ghost text-xs h-9 w-9 p-0 shrink-0"
      title={title}
    >
      <Image
        src="/icons/refresh.webp"
        alt={title}
        width={14}
        height={14}
        className={`object-contain brightness-0 invert shrink-0 transition-transform duration-500 ${
          isRotating ? "rotate-360" : ""
        }`}
        unoptimized
      />
    </button>
  );
}