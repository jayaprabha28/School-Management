import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, ChevronRight, LogOut, Menu, PanelLeftClose, PanelLeftOpen, Search, UserCircle } from "lucide-react";
import { useAuth } from "../lib/auth";
import { useNavigation } from "../lib/useNavigation";
import { getIcon } from "../lib/icons";
import { cn, initials } from "../lib/utils";
import { Badge } from "./ui";

interface TopbarProps {
  onOpenMobile: () => void;
  onToggleCollapse: () => void;
  collapsed: boolean;
}

export function Topbar({ onOpenMobile, onToggleCollapse, collapsed }: TopbarProps) {
  const { user, logout } = useAuth();
  const { data } = useNavigation();
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen(true);
        document.getElementById("global-search")?.focus();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const results = useMemo(() => {
    if (!query.trim() || !data) return [];
    const q = query.toLowerCase();
    const out: { module: string; moduleLabel: string; label: string; to: string; icon: string }[] = [];
    for (const module of data.modules) {
      for (const section of module.sections) {
        if (section.label.toLowerCase().includes(q) || module.label.toLowerCase().includes(q)) {
          out.push({
            module: module.shortCode,
            moduleLabel: module.label,
            label: section.label,
            to: `/m/${module.shortCode}/${section.shortCode}`,
            icon: module.icon,
          });
        }
      }
    }
    return out.slice(0, 8);
  }, [query, data]);

  const signOut = () => {
    logout();
    navigate("/login", { replace: true });
  };

  return (
    <header className="sticky top-0 z-20 flex h-14 items-center gap-2 border-b border-slate-200 bg-white/90 px-3 backdrop-blur sm:px-4">
      <button className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 lg:hidden" onClick={onOpenMobile} aria-label="Open navigation">
        <Menu className="h-5 w-5" />
      </button>
      <button className="hidden rounded-lg p-2 text-slate-500 hover:bg-slate-100 lg:inline-flex" onClick={onToggleCollapse} aria-label="Toggle sidebar">
        {collapsed ? <PanelLeftOpen className="h-5 w-5" /> : <PanelLeftClose className="h-5 w-5" />}
      </button>

      <div className="relative mx-auto w-full max-w-md" ref={boxRef}>
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          id="global-search"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          placeholder="Search modules, students, fees... (Ctrl+K)"
          className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-sm outline-none transition focus:border-indigo-400 focus:bg-white"
        />
        {open && results.length > 0 ? (
          <div className="absolute left-0 right-0 top-12 z-30 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg">
            {results.map((r) => {
              const Icon = getIcon(r.icon);
              return (
                <button
                  key={r.to}
                  className="flex w-full items-center gap-3 px-3 py-2 text-left text-sm hover:bg-slate-50"
                  onMouseDown={() => {
                    navigate(r.to);
                    setQuery("");
                    setOpen(false);
                  }}
                >
                  <Icon className="h-4 w-4 text-slate-400" />
                  <span className="flex-1">
                    <span className="text-slate-700">{r.label}</span>
                    <span className="ml-2 text-xs text-slate-400">{r.moduleLabel}</span>
                  </span>
                  <ChevronRight className="h-3.5 w-3.5 text-slate-300" />
                </button>
              );
            })}
          </div>
        ) : null}
      </div>

      <button className="hidden rounded-lg p-2 text-slate-500 hover:bg-slate-100 sm:inline-flex" aria-label="Notifications">
        <Bell className="h-5 w-5" />
      </button>

      <div className="relative">
        <button
          onClick={() => setMenuOpen((v) => !v)}
          className="flex items-center gap-2 rounded-full py-1 pl-1 pr-2 hover:bg-slate-100"
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-100 text-xs font-semibold text-indigo-700">
            {initials(user?.name || "User")}
          </span>
        </button>
        {menuOpen ? (
          <div
            className="absolute right-0 top-12 z-30 w-60 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg"
            onMouseLeave={() => setMenuOpen(false)}
          >
            <div className="flex items-center gap-3 border-b border-slate-100 px-4 py-3">
              <UserCircle className="h-9 w-9 text-slate-300" />
              <div className="min-w-0">
                <div className="truncate text-sm font-semibold text-slate-800">{user?.name}</div>
                <div className="truncate text-xs text-slate-500">{user?.email}</div>
              </div>
            </div>
            <div className="flex items-center justify-between px-4 py-2">
              <span className="text-xs text-slate-500">Signed in as</span>
              <Badge tone="indigo">{user?.role}</Badge>
            </div>
            <button
              onClick={signOut}
              className={cn("flex w-full items-center gap-2 border-t border-slate-100 px-4 py-3 text-sm text-rose-600 hover:bg-rose-50")}
            >
              <LogOut className="h-4 w-4" /> Sign out
            </button>
          </div>
        ) : null}
      </div>
    </header>
  );
}
