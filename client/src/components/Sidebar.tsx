import { useEffect, useState, type ReactNode } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { ChevronDown, LayoutDashboard, Settings, X } from "lucide-react";
import { useNavigation } from "../lib/useNavigation";
import { getIcon } from "../lib/icons";
import { cn } from "../lib/utils";
import { Spinner } from "./ui";

interface SidebarProps {
  mobileOpen: boolean;
  collapsed: boolean;
  onCloseMobile: () => void;
  onToggleCollapse: () => void;
}

export function Sidebar({ mobileOpen, collapsed, onCloseMobile }: SidebarProps) {
  const { data, isLoading } = useNavigation();
  const location = useLocation();
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const match = location.pathname.match(/^\/m\/([^/]+)/);
    if (match) setExpanded((prev) => ({ ...prev, [match[1]]: true }));
  }, [location.pathname]);

  const modules = data?.modules ?? [];

  const toggle = (code: string) => setExpanded((prev) => ({ ...prev, [code]: !prev[code] }));

  return (
    <>
      {mobileOpen ? <div className="fixed inset-0 z-30 bg-slate-900/50 lg:hidden" onClick={onCloseMobile} /> : null}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 flex flex-col bg-slate-900 text-slate-300 transition-all duration-200 lg:translate-x-0",
          collapsed ? "w-16" : "w-64",
          mobileOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex h-14 items-center gap-2 border-b border-slate-800 px-4">
          <div className="flex h-8 w-8 flex-none items-center justify-center rounded-lg bg-indigo-500 text-sm font-bold text-white">SV</div>
          {!collapsed ? (
            <div className="min-w-0">
              <div className="truncate text-sm font-semibold text-white">SVConnect</div>
              <div className="truncate text-[10px] uppercase tracking-wider text-slate-500">School workspace</div>
            </div>
          ) : null}
          <button className="ml-auto rounded p-1 text-slate-400 hover:bg-slate-800 lg:hidden" onClick={onCloseMobile} aria-label="Close navigation">
            <X className="h-4 w-4" />
          </button>
        </div>

        <nav className="flex-1 space-y-0.5 overflow-y-auto px-2 py-3">
          <SidebarLink to="/" icon={<LayoutDashboard className="h-4 w-4" />} label="Dashboard" collapsed={collapsed} onNavigate={onCloseMobile} end />

          {isLoading ? <Spinner label="" /> : null}

          {modules.map((module) => {
            const Icon = getIcon(module.icon);
            const isOpen = expanded[module.shortCode];
            const single = module.sections.length === 1;
            if (single) {
              const section = module.sections[0];
              return (
                <SidebarLink
                  key={module.shortCode}
                  to={`/m/${module.shortCode}/${section.shortCode}`}
                  icon={<Icon className="h-4 w-4" />}
                  label={collapsed ? module.label : module.label}
                  collapsed={collapsed}
                  onNavigate={onCloseMobile}
                  title={module.label}
                />
              );
            }
            return (
              <div key={module.shortCode}>
                <button
                  onClick={() => toggle(module.shortCode)}
                  className={cn(
                    "flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-slate-300 transition-colors hover:bg-slate-800 hover:text-white",
                  )}
                  title={module.label}
                >
                  <Icon className="h-4 w-4 flex-none" />
                  {!collapsed ? (
                    <>
                      <span className="flex-1 truncate text-left">{module.label}</span>
                      <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", isOpen && "rotate-180")} />
                    </>
                  ) : null}
                </button>
                {!collapsed && isOpen ? (
                  <div className="mb-1 ml-4 mt-0.5 space-y-0.5 border-l border-slate-800 pl-3">
                    {module.sections.map((section) => (
                      <NavLink
                        key={section.shortCode}
                        to={`/m/${module.shortCode}/${section.shortCode}`}
                        onClick={onCloseMobile}
                        className={({ isActive }) =>
                          cn(
                            "block truncate rounded-md px-2.5 py-1.5 text-[13px] transition-colors",
                            isActive ? "bg-indigo-500/15 font-medium text-indigo-300" : "text-slate-400 hover:bg-slate-800 hover:text-slate-200",
                          )
                        }
                      >
                        {section.label}
                      </NavLink>
                    ))}
                  </div>
                ) : null}
              </div>
            );
          })}
        </nav>

        {data?.permissions?.system_settings || data?.isAdmin ? (
          <div className="border-t border-slate-800 p-2">
            <SidebarLink
              to="/settings/modules"
              icon={<Settings className="h-4 w-4" />}
              label="System Settings"
              collapsed={collapsed}
              onNavigate={onCloseMobile}
            />
          </div>
        ) : null}
      </aside>
    </>
  );
}

function SidebarLink({
  to,
  icon,
  label,
  collapsed,
  onNavigate,
  end,
  title,
}: {
  to: string;
  icon: ReactNode;
  label: string;
  collapsed: boolean;
  onNavigate: () => void;
  end?: boolean;
  title?: string;
}) {
  return (
    <NavLink
      to={to}
      end={end}
      onClick={onNavigate}
      title={title ?? label}
      className={({ isActive }) =>
        cn(
          "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
          isActive ? "bg-indigo-500 text-white" : "text-slate-300 hover:bg-slate-800 hover:text-white",
        )
      }
    >
      <span className="flex-none">{icon}</span>
      {!collapsed ? <span className="truncate">{label}</span> : null}
    </NavLink>
  );
}
