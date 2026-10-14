import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { GraduationCap, Lock, Mail } from "lucide-react";
import { useAuth } from "../lib/auth";
import { apiErrorMessage } from "../lib/api";
import { Button, Input } from "../components/ui";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState("admin@svconnect.test");
  const [password, setPassword] = useState("Admin@123");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const from = (location.state as { from?: string } | null)?.from || "/";

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(email, password);
      navigate(from, { replace: true });
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="relative hidden flex-col justify-between bg-slate-900 p-10 text-white lg:flex">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500 font-bold">SV</div>
          <div>
            <div className="text-lg font-semibold">SVConnect</div>
            <div className="text-xs text-slate-400">School Management System</div>
          </div>
        </div>
        <div className="max-w-md">
          <h1 className="text-3xl font-semibold leading-tight">Everything your school needs, in one connected workspace.</h1>
          <p className="mt-4 text-sm text-slate-400">
            23 core modules, add-on modules, and a student/parent panel. Sidebar menus, roles and permissions are all database-driven.
          </p>
          <div className="mt-8 grid grid-cols-3 gap-3 text-center">
            {[
              ["23+", "Modules"],
              ["70+", "Topics"],
              ["RBAC", "Permissions"],
            ].map(([n, l]) => (
              <div key={l} className="rounded-xl border border-slate-800 bg-slate-800/40 p-3">
                <div className="text-lg font-semibold text-indigo-300">{n}</div>
                <div className="text-[11px] uppercase tracking-wide text-slate-500">{l}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="text-xs text-slate-500">Demo: admin@svconnect.test / Admin@123</div>
      </div>

      <div className="flex items-center justify-center bg-slate-50 p-6">
        <form onSubmit={submit} className="w-full max-w-sm">
          <div className="mb-6 flex items-center gap-2 lg:hidden">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-600 font-bold text-white">SV</div>
            <span className="text-lg font-semibold text-slate-800">SVConnect</span>
          </div>
          <h2 className="text-xl font-semibold text-slate-900">Sign in</h2>
          <p className="mt-1 text-sm text-slate-500">Use your school account credentials.</p>

          <div className="mt-6 space-y-4">
            <div>
              <label htmlFor="email" className="mb-1 block text-xs font-medium text-slate-600">Email</label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input id="email" className="pl-9" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
              </div>
            </div>
            <div>
              <label htmlFor="password" className="mb-1 block text-xs font-medium text-slate-600">Password</label>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input id="password" className="pl-9" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
              </div>
            </div>
          </div>

          {error ? <p className="mt-3 rounded-lg bg-rose-50 px-3 py-2 text-xs text-rose-600">{error}</p> : null}

          <Button type="submit" loading={loading} className="mt-5 w-full" icon={<GraduationCap className="h-4 w-4" />}>
            Sign in
          </Button>

          <div className="mt-5 rounded-lg border border-slate-200 bg-white p-3 text-xs text-slate-500">
            <div className="font-medium text-slate-600">Demo accounts</div>
            <div className="mt-1 grid gap-0.5">
              <span>Admin &middot; admin@svconnect.test / Admin@123</span>
              <span>Teacher &middot; teacher@svconnect.test / Teacher@123</span>
              <span>Student &middot; student@svconnect.test / Student@123</span>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
