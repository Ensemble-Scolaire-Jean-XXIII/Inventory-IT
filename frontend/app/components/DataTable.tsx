"use client";

import { useState } from "react";
import Image from "next/image";
import { DataTableProps } from "../types/models";
import { displayValue } from "../lib/format";
import { TableSkeleton } from "./Skeleton";

const Button = ({
  onClick,
  title,
  className,
  icon,
  children,
}: {
  onClick: (e: React.MouseEvent<HTMLButtonElement>) => void;
  title: string;
  className: string;
  icon?: string;
  children?: React.ReactNode;
}) => (
  <button
    onClick={onClick}
    title={title}
    className={`px-2 py-1 rounded-md text-xs font-semibold cursor-pointer transition-all inline-flex items-center justify-center gap-1 h-7.5 w-7.5 ${className}`}
  >
    {icon ? (
      <Image
        src={icon}
        alt={title}
        width={14}
        height={14}
        className="object-contain brightness-0 invert shrink-0"
        unoptimized
      />
    ) : (
      children
    )}
  </button>
);

export default function DataTable<T>({
  data,
  columns,
  keyExtractor,
  editingId,
  editForm,
  setEditForm,
  onEdit,
  onSave,
  onCancel,
  onDelete,
  hideEdit = false,
  isDeletable = () => true,
  actionsHeader,
  rowClassName,
  onRowClick,
  onReorder,
  sortField,
  sortDirection,
  onSort,
  isLoading = false,
  emptyMessage = "Aucun résultat trouvé.",
  className = "",
}: DataTableProps<T>) {
  const [dragId, setDragId] = useState<string | number | null>(null);
  const [dropTarget, setDropTarget] = useState<{
    id: string | number;
    position: "before" | "after";
  } | null>(null);
  const roundedCornerTopLeft =
    "rounded-tl-[calc(var(--radius-box)/1.5)]";
  const roundedCornerTopRight =
    "rounded-tr-[calc(var(--radius-box)/1.5)]";
  const roundedCornerBottomLeft =
    "rounded-bl-[calc(var(--radius-box)/1.5)]";
  const roundedCornerBottomRight =
    "rounded-br-[calc(var(--radius-box)/1.5)]";
  const Actions = ({ id, item }: { id: string | number; item: T }) => {
    if (editingId === id) {
      return (
        <div className="flex gap-1.5 justify-end">
          <Button
            onClick={(e) => {
              e.stopPropagation();
              onSave(id, editForm);
            }}
            title="Enregistrer"
            className="bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/30"
            icon="/icons/approved.webp"
          />
          <Button
            onClick={(e) => {
              e.stopPropagation();
              onCancel();
            }}
            title="Annuler"
            className="bg-white/5 border border-(--border-color) text-(--text-main) hover:bg-white/10"
            icon="/icons/cancel.webp"
          />
        </div>
      );
    }
    return (
      <div className="flex gap-1.5 justify-end opacity-100 [@media(hover:hover)]:opacity-0 [@media(hover:hover)]:group-hover:opacity-100 transition-opacity duration-200">
        {!hideEdit && (
          <Button
            onClick={(e) => {
              e.stopPropagation();
              onEdit(item);
            }}
            title="Modifier"
            className="bg-blue-500/20 border border-blue-500/30 text-blue-400 hover:bg-blue-500/30"
            icon="/icons/edit.webp"
          />
        )}
        {isDeletable(item) && (
          <Button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(id);
            }}
            title="Supprimer"
            className="bg-red-500/20 border border-red-500/30 text-red-400 hover:bg-red-500/30"
            icon="/icons/trash.webp"
          />
        )}
      </div>
    );
  };

  const totalColumns = columns.length + 1;

  return (
    <div
      className={`flex flex-col min-h-0 h-full overflow-y-auto custom-scrollbar ${className}`}
    >
      <table className="w-full text-left border-separate border-spacing-0 text-sm table-fixed">
          <thead>
            <tr>
              {columns.map((col, i) => (
                <th
                  key={i}
                  className={`sticky top-0 z-10 px-3 py-3 font-semibold bg-(--bg-table-header) text-(--text-main) border-b border-(--border-color) ${
                    col.className || ""
                  } ${i === 0 ? roundedCornerTopLeft : ""}`}
                >
                  {col.sortable && onSort ? (
                    <button
                      onClick={() => onSort(col.field)}
                      className="flex items-center gap-1.5 cursor-pointer hover:opacity-80 w-full text-left"
                    >
                      <span>{col.label}</span>
                      <span className="text-xs opacity-60">
                        {sortField === col.field
                          ? sortDirection === "asc"
                            ? "▲"
                            : "▼"
                          : ""}
                      </span>
                    </button>
                  ) : (
                    col.label
                  )}
                </th>
              ))}
<th className={`sticky top-0 z-10 px-3 py-3 font-semibold bg-(--bg-table-header) text-(--text-main) border-b border-(--border-color) ${
                    actionsHeader ? "text-left w-40" : "text-right w-24"
                  } ${roundedCornerTopRight}`}>
                  {actionsHeader ?? "Actions"}
                </th>
            </tr>
          </thead>
          <tbody className="text-(--text-main)">
            {isLoading ? (
              <TableSkeleton columns={totalColumns} rows={10} />
            ) : data.length === 0 ? (
              <tr>
                <td
                  colSpan={totalColumns}
                  className={`p-6 text-center text-(--text-muted)`}
                >
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              data.map((item, rowIndex) => {
                const id = keyExtractor(item);
                const isEditing = editingId === id;
                const draggable = Boolean(onReorder) && !isEditing;
                return (
                  <tr
                    key={id}
                    draggable={draggable}
                    onDragStart={
                      draggable
                        ? (e) => {
                            e.dataTransfer.effectAllowed = "move";
                            setDragId(id);
                            setDropTarget(null);
                          }
                        : undefined
                    }
                    onDragOver={
                      draggable
                        ? (e) => {
                            e.preventDefault();
                            e.dataTransfer.dropEffect = "move";
                            const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
                            setDropTarget({
                              id,
                              position:
                                e.clientY < rect.top + rect.height / 2
                                  ? "before"
                                  : "after",
                            });
                          }
                        : undefined
                    }
                    onDrop={
                      draggable
                        ? (e) => {
                            e.preventDefault();
                            if (onReorder && dragId !== null && dragId !== id) {
                              onReorder(dragId, id);
                            }
                            setDragId(null);
                            setDropTarget(null);
                          }
                        : undefined
                    }
                    onDragEnd={
                      draggable
                        ? () => {
                            setDragId(null);
                            setDropTarget(null);
                          }
                        : undefined
                    }
                    onClick={
                      onRowClick && !isEditing
                        ? (e) => {
                            const target = e.target as HTMLElement;
                            if (target.closest("button, a, input, select, textarea, label")) {
                              return;
                            }
                            onRowClick(item);
                          }
                        : undefined
                    }
                    className={`group border-b border-(--border-color) hover:bg-white/5 transition-colors ${
                      isEditing ? "bg-white/5" : ""
                    } ${
                      draggable
                        ? "cursor-grab active:cursor-grabbing"
                        : onRowClick
                          ? "cursor-pointer"
                          : ""
                    } ${rowClassName ? rowClassName(item) : ""} ${
                      dragId === id ? "opacity-50" : ""
                    }`}
                  >
                    {columns.map((col, i) => (
                      <td
                        key={i}
                        className={`px-3 py-3 truncate ${
                          dropTarget?.id === id
                            ? dropTarget.position === "before"
                              ? "drop-before"
                              : "drop-after"
                            : ""
                        } ${
                          isEditing ? "" : col.className || ""
                        } ${
                          rowIndex === data.length - 1 && i === 0
                            ? roundedCornerBottomLeft
                            : ""
                        } ${
                          rowIndex === data.length - 1 ? "border-b-0" : ""
                        }`}
                      >
                        {isEditing && col.renderEdit
                          ? col.renderEdit(editForm, (val) =>
                              setEditForm((prev) => ({ ...prev, ...val })),
                            )
                          : col.render
                            ? col.render(item)
                            : displayValue((item as any)[col.field])}
                      </td>
                    ))}
                    <td
                      className={`px-3 py-3 text-right ${
                        dropTarget?.id === id
                          ? dropTarget.position === "before"
                            ? "drop-before"
                            : "drop-after"
                          : ""
                      } ${
                        rowIndex === data.length - 1
                          ? roundedCornerBottomRight
                          : ""
                      }`}
                    >
                      <Actions id={id} item={item} />
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
    </div>
  );
}