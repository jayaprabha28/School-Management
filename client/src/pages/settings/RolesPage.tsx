import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../../lib/api";
import { Button, Card, Spinner } from "../../components/ui";

interface Role {
  _id: string;
  name: string;
  description: string;
  isAdmin: boolean;
  groups: { shortCode: string; actions: string[] }[];
  studentPanel: string[];
}
interface Group {
  _id: string;
  shortCode: string;
  label: string;
  actions: string[];
}

const ACTIONS = ["view", "create", "edit", "delete", "approve", "export"];

export default function RolesPage() {
  const queryClient = useQueryClient();
  const rolesQuery = useQuery({
    queryKey: ["settings", "roles"],
    queryFn: async () => (await api.get<{ items: Role[] }>("/settings/roles")).data,
  });
  const groupsQuery = useQuery({
    queryKey: ["settings", "permission-groups"],
    queryFn: async () => (await api.get<{ items: Group[] }>("/settings/permission-groups")).data,
  });

  const [selectedId, setSelectedId] = useState<string>("");
  const [draft, setDraft] = useState<Record<string, string[]>>({});

  const selected = rolesQuery.data?.items.find((r) => r._id === selectedId);

  useEffect(() => {
    if (!selectedId && rolesQuery.data?.items.length) setSelectedId(rolesQuery.data.items[0]._id);
  }, [rolesQuery.data, selectedId]);

  useEffect(() => {
    if (!selected) return;
    const map: Record<string, string[]> = {};
    for (const g of selected.groups) map[g.shortCode] = [...g.actions];
    setDraft(map);
  }, [selectedId, selected]);

  const save = useMutation({
    mutationFn: async () => {
      const groups = Object.entries(draft).map(([shortCode, actions]) => ({ shortCode, actions }));
      return (await api.patch(`/settings/roles/${selectedId}`, { groups })).data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["settings", "roles"] });
      queryClient.invalidateQueries({ queryKey: ["navigation"] });
    },
  });

  const toggle = (group: string, action: string) => {
    setDraft((prev) => {
      const current = new Set(prev[group] ?? []);
      if (current.has(action)) current.delete(action);
      else current.add(action);
      return { ...prev, [group]: [...current] };
    });
  };

  if (rolesQuery.isLoading || groupsQuery.isLoading) return <Spinner />;

  return (
    <div className="grid gap-4 lg:grid-cols-[240px_1fr]">
      <Card className="p-2">
        <ul className="space-y-1">
          {rolesQuery.data?.items.map((role) => (
            <li key={role._id}>
              <button
                onClick={() => setSelectedId(role._id)}
                className={`w-full rounded-lg px-3 py-2 text-left text-sm transition ${
                  selectedId === role._id ? "bg-indigo-50 font-medium text-indigo-700" : "text-slate-600 hover:bg-slate-50"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span>{role.name}</span>
                  {role.isAdmin ? <span className="text-[10px] font-semibold uppercase text-emerald-600">Admin</span> : null}
                </div>
              </button>
            </li>
          ))}
        </ul>
      </Card>

      <Card className="overflow-hidden">
        <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
          <div>
            <h3 className="text-sm font-semibold text-slate-800">{selected?.name}</h3>
            <p className="text-xs text-slate-500">{selected?.description}</p>
          </div>
          <Button onClick={() => save.mutate()} loading={save.isPending} disabled={selected?.isAdmin}>
            {selected?.isAdmin ? "Full access" : "Save permissions"}
          </Button>
        </div>
        <div className="max-h-[60vh] overflow-auto">
          <table className="w-full min-w-[720px] text-sm">
            <thead className="sticky top-0 bg-slate-50">
              <tr className="border-b border-slate-200 text-left">
                <th className="px-4 py-2 text-xs font-semibold uppercase text-slate-500">Module / Group</th>
                {ACTIONS.map((a) => (
                  <th key={a} className="px-3 py-2 text-center text-xs font-semibold uppercase text-slate-500">
                    {a}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {groupsQuery.data?.items.map((group) => {
                const actions = new Set(draft[group.shortCode] ?? []);
                return (
                  <tr key={group._id} className="border-b border-slate-100">
                    <td className="px-4 py-2">
                      <div className="text-slate-700">{group.label}</div>
                      <div className="font-mono text-[11px] text-slate-400">{group.shortCode}</div>
                    </td>
                    {ACTIONS.map((action) => (
                      <td key={action} className="px-3 py-2 text-center">
                        <input
                          type="checkbox"
                          disabled={selected?.isAdmin}
                          checked={actions.has(action)}
                          onChange={() => toggle(group.shortCode, action)}
                          className="h-4 w-4 rounded border-slate-300 text-indigo-600 disabled:opacity-40"
                        />
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
