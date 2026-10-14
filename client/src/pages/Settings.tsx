import { NavLink, Outlet } from "react-router-dom";
import { PageHeader } from "../components/ui";
import { cn } from "../lib/utils";

const tabs = [
  { to: "/settings/modules", label: "Modules" },
  { to: "/settings/sidebar", label: "Sidebar Menu" },
  { to: "/settings/roles", label: "Roles & Permissions" },
  { to: "/settings/users", label: "Users" },
  { to: "/settings/audit", label: "Audit Trail" },
];

export default function Settings() {
  return (
    <div>
      <PageHeader title="System Settings" subtitle="Manage modules, sidebar menus, roles, users and audit trail." />
      <div className="mb-4 flex gap-1 overflow-x-auto border-b border-slate-200">
        {tabs.map((tab) => (
          <NavLink
            key={tab.to}
            to={tab.to}
            className={({ isActive }) =>
              cn(
                "whitespace-nowrap border-b-2 px-3 py-2 text-sm font-medium transition-colors",
                isActive ? "border-indigo-600 text-indigo-700" : "border-transparent text-slate-500 hover:text-slate-700",
              )
            }
          >
            {tab.label}
          </NavLink>
        ))}
      </div>
      <Outlet />
    </div>
  );
}
