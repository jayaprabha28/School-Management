import { useQuery } from "@tanstack/react-query";
import { api } from "../../lib/api";
import { formatDate } from "../../lib/utils";
import { Badge, Card, Spinner } from "../../components/ui";

interface AuditRow {
  _id: string;
  userName: string;
  action: string;
  resource: string;
  resourceId: string;
  createdAt: string;
}

export default function AuditPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["settings", "audit"],
    queryFn: async () => (await api.get<{ items: AuditRow[] }>("/settings/audit")).data,
  });

  if (isLoading) return <Spinner />;

  return (
    <Card className="overflow-hidden">
      <div className="border-b border-slate-100 px-4 py-3">
        <h3 className="text-sm font-semibold text-slate-800">Audit trail</h3>
        <p className="text-xs text-slate-500">Most recent 100 actions across the platform.</p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50/80 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
              <th className="px-4 py-2.5">Time</th>
              <th className="px-4 py-2.5">User</th>
              <th className="px-4 py-2.5">Action</th>
              <th className="px-4 py-2.5">Resource</th>
            </tr>
          </thead>
          <tbody>
            {data?.items.map((row) => (
              <tr key={row._id} className="border-b border-slate-100 last:border-0">
                <td className="whitespace-nowrap px-4 py-2.5 text-slate-500">{formatDate(row.createdAt)}</td>
                <td className="px-4 py-2.5 text-slate-700">{row.userName || "-"}</td>
                <td className="px-4 py-2.5">
                  <Badge tone="indigo">{row.action}</Badge>
                </td>
                <td className="px-4 py-2.5 font-mono text-xs text-slate-500">{row.resource}</td>
              </tr>
            ))}
            {data?.items.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-slate-400">
                  No audit events yet
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
