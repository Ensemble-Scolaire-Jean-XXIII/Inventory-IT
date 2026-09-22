"use client";

import { useMemo } from "react";

export const CHART_COLORS = [
  "#e84e1b",
  "#38bdf8",
  "#34d399",
  "#fbbf24",
  "#a78bfa",
  "#fb7185",
  "#2dd4bf",
  "#f97316",
  "#22d3ee",
  "#facc15",
];

const polar = (
  cx: number,
  cy: number,
  r: number,
  angleDeg: number,
): { x: number; y: number } => {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
};

const arcPath = (
  cx: number,
  cy: number,
  rOuter: number,
  rInner: number,
  startAngle: number,
  endAngle: number,
): string => {
  const startOuter = polar(cx, cy, rOuter, startAngle);
  const endOuter = polar(cx, cy, rOuter, endAngle);
  const startInner = polar(cx, cy, rInner, startAngle);
  const endInner = polar(cx, cy, rInner, endAngle);
  const largeArc = endAngle - startAngle > 180 ? 1 : 0;
  return [
    `M ${startOuter.x.toFixed(2)} ${startOuter.y.toFixed(2)}`,
    `A ${rOuter} ${rOuter} 0 ${largeArc} 1 ${endOuter.x.toFixed(2)} ${endOuter.y.toFixed(2)}`,
    `L ${endInner.x.toFixed(2)} ${endInner.y.toFixed(2)}`,
    `A ${rInner} ${rInner} 0 ${largeArc} 0 ${startInner.x.toFixed(2)} ${startInner.y.toFixed(2)}`,
    "Z",
  ].join(" ");
};

export interface DoughnutSlice {
  label: string;
  value: number;
}

export function DoughnutChart({ data }: { data: DoughnutSlice[] }) {
  const total = useMemo(
    () => data.reduce((sum, d) => sum + d.value, 0),
    [data],
  );

  const segments = useMemo(() => {
    let angle = 0;
    return data.map((d, i) => {
      const sweep = total > 0 ? (d.value / total) * 360 : 0;
      const seg = {
        color: CHART_COLORS[i % CHART_COLORS.length],
        path: arcPath(60, 60, 46, 30, angle, angle + sweep),
        ...d,
        percent: total > 0 ? Math.round((d.value / total) * 100) : 0,
      };
      angle += sweep;
      return seg;
    });
  }, [data, total]);

  if (total === 0) {
    return (
      <div className="flex items-center justify-center h-36 text-xs text-(--text-muted)">
        Aucune donnée à afficher.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="relative mx-auto">
        <svg viewBox="0 0 120 120" className="h-36 w-36">
          {segments.map((seg, i) => (
            <path key={i} d={seg.path} fill={seg.color} />
          ))}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-xl font-bold">{total}</span>
          <span className="text-[10px] uppercase tracking-wider text-(--text-muted)">
            objets
          </span>
        </div>
      </div>
      <ul className="space-y-1.5">
        {segments.map((seg, i) => (
          <li
            key={i}
            className="flex items-center gap-2 text-xs text-(--text-main)"
          >
            <span
              className="w-2.5 h-2.5 rounded-full shrink-0"
              style={{ backgroundColor: seg.color }}
            />
            <span className="truncate flex-1">{seg.label}</span>
            <span className="text-(--text-muted)">
              {seg.value} ({seg.percent}%)
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function BarsChart({
  data,
}: {
  data: { label: string; value: number }[];
}) {
  const max = Math.max(...data.map((d) => d.value), 1);
  const width = 320;
  const height = 140;
  const slot = 300 / Math.max(data.length, 1);
  const barWidth = Math.min(slot * 0.55, 26);

  return (
    <div className="w-full overflow-x-auto">
      {data.length === 0 ? (
        <div className="flex items-center justify-center h-36 text-xs text-(--text-muted)">
          Aucune donnée à afficher.
        </div>
      ) : (
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full min-w-56"
          style={{ height: 140 }}
        >
          {data.map((d, i) => {
            const barH = (d.value / max) * (height - 34);
            const x = 10 + i * slot + (slot - barWidth) / 2;
            const y = height - 26 - barH;
            return (
              <g key={i}>
                <rect
                  x={x}
                  y={y}
                  width={barWidth}
                  height={barH}
                  rx={3}
                  fill={CHART_COLORS[i % CHART_COLORS.length]}
                  opacity={0.9}
                />
                <text
                  x={x + barWidth / 2}
                  y={y - 4}
                  textAnchor="middle"
                  fontSize="9"
                  fill="currentColor"
                  opacity="0.8"
                >
                  {d.value}
                </text>
                <text
                  x={x + barWidth / 2}
                  y={height - 10}
                  textAnchor="middle"
                  fontSize="8"
                  fill="var(--text-muted)"
                  transform={
                    slot < 34
                      ? `rotate(-35 ${x + barWidth / 2} ${height - 10})`
                      : undefined
                  }
                >
                  {d.label}
                </text>
              </g>
            );
          })}
        </svg>
      )}
    </div>
  );
}