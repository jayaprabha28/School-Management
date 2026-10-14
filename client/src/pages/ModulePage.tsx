import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useParams } from "react-router-dom";
import { Download, Plus, Search } from "lucide-react";
import { api, apiErrorMessage } from "../lib/api";
import { useNavigation } from "../lib/useNavigation";
import type { FieldDef, ListResponse } from "../lib/types";
import { DataTable } from "../components/DataTable";
import { DynamicForm } from "../components/DynamicForm";
import { Button, Card, Input, Modal, PageHeader, Select, Spinner } from "../components/ui";

interface Row {
  id: string;
  data: Record<string, unknown>;
  createdAt?: string;
}

export default function ModulePage() {
  const { module: moduleCode = "", submenu = "" } = useParams();
  const queryClient = useQueryClient();
  const { data: nav } = useNavigation();

  const navModule = nav?.modules.find((m) => m.shortCode === moduleCode);
  const section = navModule?.sections.find((s) => s.shortCode === submenu);

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [query, setQuery] = useState("");
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Row | null>(null);
  const [formError, setFormError] = useState("");

  const can = (action: string) => {
    if (!nav) return false;
    if (nav.isAdmin) return true;
    if (navModule?.isStudentPanel) return true;
    return nav.permissions[moduleCode]?.includes(action) ?? false;
  };

  const listQuery = useQuery({
    queryKey: ["entities", submenu, page, limit, search, filters],
    queryFn: async () =>
      (
        await api.get<ListResponse>(`/entities/${submenu}`, {
          params: { page, limit, q: search || undefined, ...filters },
        })
      ).data,
    enabled: Boolean(submenu) && Boolean(section),
    placeholderData: (prev) => prev,
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["entities", submenu] });
    queryClient.invalidateQueries({ queryKey: ["dashboard"] });
  };

  const createMutation = useMutation({
    mutationFn: async (values: Record<string, unknown>) => (await api.post(`/entities/${submenu}`, values)).data,
    onSuccess: () => {
      invalidate();
      closeModal();
    },
    onError: (err) => setFormError(apiErrorMessage(err)),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, values }: { id: string; values: Record<string, unknown> }) =>
      (await api.patch(`/entities/${submenu}/${id}`, values)).data,
    onSuccess: () => {
      invalidate();
      closeModal();
    },
    onError: (err) => setFormError(apiErrorMessage(err)),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => (await api.delete(`/entities/${submenu}/${id}`)).data,
    onSuccess: invalidate,
  });

  const openCreate = () => {
    setEditing(null);
    setFormError("");
    setModalOpen(true);
  };
  const openEdit = (row: Row) => {
    setEditing(row);
    setFormError("");
    setModalOpen(true);
  };
  const closeModal = () => {
    setModalOpen(false);
    setEditing(null);
    setFormError("");
  };

  const submit = (values: Record<string, unknown>) => {
    setFormError("");
    if (editing) updateMutation.mutate({ id: editing.id, values });
    else createMutation.mutate(values);
  };

  const fields: FieldDef[] = section?.fields ?? listQuery.data?.fields ?? [];
  const rows: Row[] = listQuery.data?.items ?? [];
  const filterFields = useMemo(
    () => (section?.fields ?? []).filter((f) => f.type === "select" && (f.options?.length ?? 0) > 0 && (f.options?.length ?? 0) <= 20),
    [section],
  );

  const exportCsv = useMemo(
    () => () => {
      const header = fields.map((f) => f.label).join(",");
      const lines = rows.map((r) =>
        fields
          .map((f) => {
            const v = r.data[f.name];
            const text = v === null || v === undefined ? "" : String(v);
            return `"${text.replace(/"/g, '""')}"`;
          })
          .join(","),
      );
      const csv = [header, ...lines].join("\n");
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${submenu}-page${page}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    },
    [fields, rows, submenu, page],
  );

  if (section === undefined && nav) {
    return (
      <Card className="p-8 text-center">
        <p className="text-sm font-semibold text-slate-700">Module topic not available</p>
        <p className="mt-1 text-xs text-slate-500">You may not have permission to view this topic, or it is disabled.</p>
      </Card>
    );
  }

  const pages = listQuery.data?.pages ?? 1;

  return (
    <div>
      <PageHeader
        title={section?.label ?? listQuery.data?.label ?? "Module"}
        subtitle={navModule?.label ?? ""}
        actions={
          <>
            <Button variant="secondary" icon={<Download className="h-4 w-4" />} onClick={exportCsv} disabled={!rows.length}>
              Export
            </Button>
            {can("create") ? (
              <Button icon={<Plus className="h-4 w-4" />} onClick={openCreate}>
                Add
              </Button>
            ) : null}
          </>
        }
      />

      <Card>
        <div className="flex flex-wrap items-center gap-2 border-b border-slate-100 px-3 py-3">
          <div className="relative flex-1 sm:max-w-xs">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              className="pl-9"
              placeholder={`Search ${section?.label ?? "records"}...`}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  setSearch(query);
                  setPage(1);
                }
              }}
            />
          </div>
          {filterFields.map((f) => (
            <Select
              key={f.name}
              aria-label={f.label}
              className="w-auto min-w-36"
              value={filters[f.name] ?? ""}
              onChange={(e) => {
                const value = e.target.value;
                setFilters((prev) => {
                  const next = { ...prev };
                  if (value) next[f.name] = value;
                  else delete next[f.name];
                  return next;
                });
                setPage(1);
              }}
            >
              <option value="">All {f.label}</option>
              {(f.options ?? []).map((o) => (
                <option key={o} value={o}>
                  {o}
                </option>
              ))}
            </Select>
          ))}
          <Button
            variant="secondary"
            onClick={() => {
              setSearch(query);
              setPage(1);
            }}
          >
            Search
          </Button>
          {search || Object.keys(filters).length ? (
            <Button
              variant="ghost"
              onClick={() => {
                setQuery("");
                setSearch("");
                setFilters({});
                setPage(1);
              }}
            >
              Clear
            </Button>
          ) : null}
        </div>

        {listQuery.isLoading ? (
          <Spinner />
        ) : (
          <DataTable
            fields={fields}
            items={rows}
            canEdit={can("edit")}
            canDelete={can("delete")}
            onEdit={openEdit}
            onDelete={(row) => {
              if (window.confirm("Delete this record? This cannot be undone.")) deleteMutation.mutate(row.id);
            }}
          />
        )}

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 px-4 py-3 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <span>
              {listQuery.data?.total ?? 0} records &middot; page {page} of {pages}
            </span>
            <label className="flex items-center gap-1">
              <span>Rows</span>
              <Select
                aria-label="Rows per page"
                className="w-auto py-1"
                value={limit}
                onChange={(e) => {
                  setLimit(Number(e.target.value));
                  setPage(1);
                }}
              >
                {[10, 20, 50, 100].map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </Select>
            </label>
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>
              Previous
            </Button>
            <Button variant="secondary" disabled={page >= pages} onClick={() => setPage((p) => p + 1)}>
              Next
            </Button>
          </div>
        </div>
      </Card>

      <Modal
        open={modalOpen}
        title={`${editing ? "Edit" : "Add"} ${section?.label ?? "record"}`}
        onClose={closeModal}
        footer={
          <>
            <Button variant="secondary" onClick={closeModal}>
              Cancel
            </Button>
            <Button type="submit" form="record-form" loading={createMutation.isPending || updateMutation.isPending}>
              {editing ? "Save changes" : "Create"}
            </Button>
          </>
        }
      >
        {formError ? <p className="mb-3 rounded-lg bg-rose-50 px-3 py-2 text-xs text-rose-600">{formError}</p> : null}
        <DynamicForm key={editing?.id ?? "new"} fields={fields} defaultValues={editing?.data} onSubmit={submit} />
      </Modal>
    </div>
  );
}
