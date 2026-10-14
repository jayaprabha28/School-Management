import { Pencil, Trash2 } from "lucide-react";
import type { FieldDef } from "../lib/types";
import { Badge, EmptyState, Spinner } from "./ui";
import { cn, formatCurrency, formatDate } from "../lib/utils";

interface Row {
  id: string;
  data: Record<string, unknown>;
  createdAt?: string;
}

interface Props {
  fields: FieldDef[];
  items: Row[];
  loading?: boolean;
  canEdit?: boolean;
  canDelete?: boolean;
  onEdit?: (row: Row) => void;
  onDelete?: (row: Row) => void;
  maxColumns?: number;
}

function statusTone(value: string): "green" | "red" | "amber" | "slate" | "indigo" {
  const v = value.toLowerCase();
  if (["active", "present", "approved", "paid", "sent", "resolved", "returned", "completed", "converted", "done"].some((k) => v.includes(k))) return "green";
  if (["inactive", "absent", "rejected", "overdue", "failed", "disabled", "closed", "dropout"].some((k) => v.includes(k))) return "red";
  if (["pending", "late", "follow", "progress", "scheduled", "issued"].some((k) => v.includes(k))) return "amber";
  return "indigo";
}

function CellValue({ field, value }: { field: FieldDef; value: unknown }) {
  if (value === null || value === undefined || value === "") return <span className="text-slate-300">-</span>;
  if (field.type === "checkbox") return value ? <Badge tone="green">Yes</Badge> : <Badge tone="slate">No</Badge>;
  if (field.type === "currency") return <span className="font-medium text-slate-700">{formatCurrency(value)}</span>;
  if (field.type === "date") return <span>{formatDate(value)}</span>;
  if (field.name === "status" || field.type === "select") {
    const text = String(value);
    return field.name === "status" || field.name === "severity" ? <Badge tone={statusTone(text)}>{text}</Badge> : <span>{text}</span>;
  }
  return <span className="line-clamp-2">{String(value)}</span>;
}

export function DataTable({ fields, items, loading, canEdit, canDelete, onEdit, onDelete, maxColumns = 7 }: Props) {
  const columns = fields.slice(0, maxColumns);
  const showActions = canEdit || canDelete;

  if (loading) return <Spinner />;
  if (!items.length) {
    return <EmptyState title="No records yet" description="Create the first record to see it listed here." />;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[640px] border-collapse text-sm">
        <thead>
          <tr className="border-b border-slate-200 bg-slate-50/80 text-left">
            {columns.map((field) => (
              <th key={field.name} className="whitespace-nowrap px-4 py-2.5 text-xs font-semibold uppercase tracking-wide text-slate-500">
                {field.label}
              </th>
            ))}
            {showActions ? <th className="px-4 py-2.5 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">Actions</th> : null}
          </tr>
        </thead>
        <tbody>
          {items.map((row) => (
            <tr key={row.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/60">
              {columns.map((field) => (
                <td key={field.name} className={cn("max-w-[260px] px-4 py-2.5 align-top text-slate-700")}>
                  <CellValue field={field} value={row.data[field.name]} />
                </td>
              ))}
              {showActions ? (
                <td className="px-4 py-2.5 text-right">
                  <div className="flex justify-end gap-1">
                    {canEdit ? (
                      <button onClick={() => onEdit?.(row)} className="rounded-md p-1.5 text-slate-400 hover:bg-indigo-50 hover:text-indigo-600" aria-label="Edit">
                        <Pencil className="h-4 w-4" />
                      </button>
                    ) : null}
                    {canDelete ? (
                      <button onClick={() => onDelete?.(row)} className="rounded-md p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600" aria-label="Delete">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    ) : null}
                  </div>
                </td>
              ) : null}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
