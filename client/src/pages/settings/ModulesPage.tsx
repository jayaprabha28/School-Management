import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Boxes } from "lucide-react";
import { api } from "../../lib/api";
import { getIcon } from "../../lib/icons";
import { Badge, Card, CardHeader, Spinner } from "../../components/ui";

interface ModuleItem {
  _id: string;
  shortCode: string;
  label: string;
  icon: string;
  isAddon: boolean;
  isStudentPanel: boolean;
  enabled: boolean;
}

export default function ModulesPage() {
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["settings", "modules"],
    queryFn: async () => (await api.get<{ items: ModuleItem[] }>("/settings/modules")).data,
  });

  const toggle = useMutation({
    mutationFn: async ({ shortCode, enabled }: { shortCode: string; enabled: boolean }) =>
      (await api.patch(`/settings/modules/${shortCode}`, { enabled })).data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["settings", "modules"] });
      queryClient.invalidateQueries({ queryKey: ["navigation"] });
    },
  });

  if (isLoading) return <Spinner />;

  const core = data?.items.filter((m) => !m.isAddon && !m.isStudentPanel) ?? [];
  const addons = data?.items.filter((m) => m.isAddon) ?? [];

  const renderGroup = (title: string, subtitle: string, list: ModuleItem[]) => (
    <Card>
      <CardHeader title={title} subtitle={subtitle} />
      <ul className="divide-y divide-slate-100">
        {list.map((module) => {
          const Icon = getIcon(module.icon);
          return (
            <li key={module._id} className="flex items-center justify-between gap-3 px-4 py-3">
              <div className="flex min-w-0 items-center gap-3">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
                  <Icon className="h-4 w-4" />
                </span>
                <div className="min-w-0">
                  <div className="truncate text-sm font-medium text-slate-700">{module.label}</div>
                  <div className="font-mono text-[11px] text-slate-400">{module.shortCode}</div>
                </div>
              </div>
              <label className="flex cursor-pointer items-center gap-2">
                <span className="text-xs text-slate-400">{module.enabled ? "Enabled" : "Disabled"}</span>
                <input
                  type="checkbox"
                  checked={module.enabled}
                  onChange={(e) => toggle.mutate({ shortCode: module.shortCode, enabled: e.target.checked })}
                  className="peer sr-only"
                />
                <span className="relative h-5 w-9 rounded-full bg-slate-300 transition peer-checked:bg-indigo-600 after:absolute after:left-0.5 after:top-0.5 after:h-4 after:w-4 after:rounded-full after:bg-white after:transition after:content-[''] peer-checked:after:translate-x-4" />
              </label>
            </li>
          );
        })}
      </ul>
    </Card>
  );

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {renderGroup("Core & Student Panel", "Core modules are always available; student panel shows for student/parent accounts.", core)}
      <div>
        <div className="mb-3 flex items-center gap-2">
          <Boxes className="h-4 w-4 text-indigo-500" />
          <span className="text-sm font-medium text-slate-600">Add-on modules</span>
          <Badge tone="indigo">{addons.filter((a) => a.enabled).length} enabled</Badge>
        </div>
        {addons.length ? renderGroup("Add-on Modules", "Add-ons appear in the sidebar only when enabled and permission is granted.", addons) : <Card className="p-6 text-sm text-slate-400">No add-on modules</Card>}
      </div>
    </div>
  );
}
