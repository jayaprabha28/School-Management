import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../../lib/api";
import { getIcon } from "../../lib/icons";
import { Badge, Card, CardHeader, Spinner } from "../../components/ui";

interface SubMenu {
  _id: string;
  shortCode: string;
  label: string;
  permissionGroup: string;
  enabled: boolean;
}
interface Menu extends SubMenu {
  icon: string;
  isAddon: boolean;
  isStudentPanel: boolean;
  submenus: SubMenu[];
}

export default function SidebarMenuPage() {
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["settings", "menus"],
    queryFn: async () => (await api.get<{ menus: Menu[] }>("/settings/menus")).data,
  });

  const toggleMenu = useMutation({
    mutationFn: async ({ shortCode, enabled }: { shortCode: string; enabled: boolean }) =>
      (await api.patch(`/settings/modules/${shortCode}`, { enabled })).data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["settings", "menus"] });
      queryClient.invalidateQueries({ queryKey: ["navigation"] });
    },
  });

  const toggleSub = useMutation({
    mutationFn: async ({ shortCode, enabled }: { shortCode: string; enabled: boolean }) =>
      (await api.patch(`/settings/submenus/${shortCode}`, { enabled })).data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["settings", "menus"] });
      queryClient.invalidateQueries({ queryKey: ["navigation"] });
    },
  });

  if (isLoading) return <Spinner />;

  return (
    <div className="grid gap-3 xl:grid-cols-2">
      {data?.menus.map((menu) => {
        const Icon = getIcon(menu.icon);
        return (
          <Card key={menu._id}>
            <CardHeader
              title={`${menu.label}`}
              subtitle={`permission_group: ${menu.permissionGroup}`}
              action={
                <div className="flex items-center gap-2">
                  {menu.isAddon ? <Badge tone="amber">Add-on</Badge> : null}
                  {menu.isStudentPanel ? <Badge tone="indigo">Student Panel</Badge> : null}
                  <label className="flex cursor-pointer items-center gap-2">
                    <input
                      type="checkbox"
                      checked={menu.enabled}
                      onChange={(e) => toggleMenu.mutate({ shortCode: menu.shortCode, enabled: e.target.checked })}
                      className="peer sr-only"
                    />
                    <span className="relative h-5 w-9 rounded-full bg-slate-300 transition peer-checked:bg-indigo-600 after:absolute after:left-0.5 after:top-0.5 after:h-4 after:w-4 after:rounded-full after:bg-white after:transition after:content-[''] peer-checked:after:translate-x-4" />
                  </label>
                </div>
              }
            />
            <div className="flex items-center gap-2 px-4 pt-3 text-xs text-slate-400">
              <Icon className="h-3.5 w-3.5" /> {menu.submenus.length} topics
            </div>
            <ul className="flex flex-wrap gap-1.5 px-4 py-3">
              {menu.submenus.map((sub) => (
                <li key={sub._id}>
                  <button
                    onClick={() => toggleSub.mutate({ shortCode: sub.shortCode, enabled: !sub.enabled })}
                    className={`rounded-full border px-2.5 py-1 text-xs transition ${
                      sub.enabled
                        ? "border-indigo-200 bg-indigo-50 text-indigo-700 hover:bg-indigo-100"
                        : "border-slate-200 bg-slate-50 text-slate-400 line-through"
                    }`}
                    title={`permission_group: ${sub.permissionGroup}`}
                  >
                    {sub.label}
                  </button>
                </li>
              ))}
            </ul>
          </Card>
        );
      })}
    </div>
  );
}
