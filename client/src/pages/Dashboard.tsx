import { useQuery } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { Bar, BarChart, CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ArrowUpRight, CalendarCheck, CreditCard, GraduationCap, TrendingUp, Users, Wallet, AlertTriangle } from "lucide-react";
import { Link } from "react-router-dom";
import { api } from "../lib/api";
import type { DashboardResponse } from "../lib/types";
import { Card, CardHeader, PageHeader, Spinner } from "../components/ui";
import { formatCurrency } from "../lib/utils";

function StatCard({ label, value, icon, tone, hint }: { label: string; value: string; icon: ReactNode; tone: string; hint?: string }) {
  return (
    <Card className="p-4">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
          <p className="mt-1 text-xl font-semibold text-slate-900">{value}</p>
          {hint ? <p className="mt-0.5 text-xs text-slate-400">{hint}</p> : null}
        </div>
        <span className={`flex h-9 w-9 items-center justify-center rounded-lg ${tone}`}>{icon}</span>
      </div>
    </Card>
  );
}

export default function Dashboard() {
  const { data, isLoading } = useQuery({
    queryKey: ["dashboard"],
    queryFn: async () => (await api.get<DashboardResponse>("/dashboard")).data,
  });

  if (isLoading || !data) return <Spinner label="Loading dashboard..." />;

  const c = data.cards;
  const present = c.attendanceToday.Present || 0;
  const absent = c.attendanceToday.Absent || 0;
  const late = c.attendanceToday.Late || 0;
  const totalAtt = present + absent + late;
  const attendanceRate = totalAtt ? Math.round((present / totalAtt) * 100) : 0;

  const byDate = new Map<string, { date: string; Present: number; Absent: number; Late: number }>();
  for (const row of data.attendanceTrend) {
    const entry = byDate.get(row.date) ?? { date: row.date, Present: 0, Absent: 0, Late: 0 };
    if (row.status === "Present") entry.Present += row.count;
    else if (row.status === "Absent") entry.Absent += row.count;
    else if (row.status === "Late") entry.Late += row.count;
    byDate.set(row.date, entry);
  }
  const attendanceData = [...byDate.values()].slice(-7);

  return (
    <div>
      <PageHeader title="Dashboard" subtitle="School analytics, collections and recent activity at a glance." />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Students" value={c.students.toLocaleString()} icon={<GraduationCap className="h-4 w-4 text-indigo-600" />} tone="bg-indigo-50" hint={`${c.onlineAdmissions} new online admissions`} />
        <StatCard label="Staff" value={c.staff.toLocaleString()} icon={<Users className="h-4 w-4 text-sky-600" />} tone="bg-sky-50" hint={`${c.enquiries} admission enquiries`} />
        <StatCard label="Fees Collected" value={formatCurrency(c.feesCollected)} icon={<Wallet className="h-4 w-4 text-emerald-600" />} tone="bg-emerald-50" hint="All time" />
        <StatCard label="Pending Dues" value={formatCurrency(c.pendingDues)} icon={<AlertTriangle className="h-4 w-4 text-rose-600" />} tone="bg-rose-50" hint="Outstanding balance" />
        <StatCard label="Income" value={formatCurrency(c.income)} icon={<TrendingUp className="h-4 w-4 text-teal-600" />} tone="bg-teal-50" />
        <StatCard label="Expenses" value={formatCurrency(c.expenses)} icon={<CreditCard className="h-4 w-4 text-orange-600" />} tone="bg-orange-50" />
        <StatCard label="Attendance Today" value={`${attendanceRate}%`} icon={<CalendarCheck className="h-4 w-4 text-violet-600" />} tone="bg-violet-50" hint={`${present} present / ${absent} absent`} />
        <StatCard label="Net" value={formatCurrency(c.income - c.expenses)} icon={<ArrowUpRight className="h-4 w-4 text-slate-600" />} tone="bg-slate-100" />
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader title="Fees collection" subtitle="Monthly collected amount" />
          <div className="h-64 px-2 py-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.monthlyFees}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} stroke="#94a3b8" />
                <YAxis tick={{ fontSize: 11 }} stroke="#94a3b8" width={60} tickFormatter={(v) => `₹${Math.round(Number(v) / 1000)}k`} />
                <Tooltip formatter={(v) => formatCurrency(v)} />
                <Bar dataKey="total" fill="#6366f1" radius={[6, 6, 0, 0]} name="Collected" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card>
          <CardHeader title="Attendance trend" subtitle="Last 7 recorded days" />
          <div className="h-64 px-2 py-4">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={attendanceData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="#94a3b8" />
                <YAxis tick={{ fontSize: 11 }} stroke="#94a3b8" width={40} />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Line type="monotone" dataKey="Present" stroke="#10b981" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="Absent" stroke="#f43f5e" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="Late" stroke="#f59e0b" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      <Card className="mt-4">
        <CardHeader title="Recent activity" subtitle="Latest records created across modules" />
        <ul className="divide-y divide-slate-100">
          {data.recentActivity.map((item) => (
            <li key={item.id} className="flex items-center justify-between gap-3 px-4 py-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-slate-700">{item.label}</p>
                <p className="truncate text-xs text-slate-400">{item.section}</p>
              </div>
              <Link to={`/m/${item.module}/${item.submenu}`} className="flex-none text-xs font-medium text-indigo-600 hover:underline">
                Open
              </Link>
            </li>
          ))}
          {data.recentActivity.length === 0 ? <li className="px-4 py-6 text-center text-sm text-slate-400">No activity yet</li> : null}
        </ul>
      </Card>
    </div>
  );
}
