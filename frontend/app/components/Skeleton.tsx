export default function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse bg-white/10 rounded ${className}`} />;
}

export function TableSkeleton({
  columns = 4,
  rows = 12,
}: {
  columns?: number;
  rows?: number;
}) {
  return (
    <>
      {Array.from({ length: rows }).map((_, rowIdx) => (
        <tr key={rowIdx} className="border-b border-white/5">
          {Array.from({ length: columns }).map((_, colIdx) => (
            <td key={colIdx} className="px-3 py-3">
              <div
                className={`animate-pulse bg-white/5 rounded h-6 ${
                  colIdx === 0
                    ? "w-3/4"
                    : colIdx === columns - 1
                      ? "w-1/2 ml-auto"
                      : "w-full"
                }`}
              />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}