import { useState } from "react";
import { Outlet } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";
import { cn } from "../lib/utils";

export default function Layout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="min-h-screen bg-slate-100">
      <Sidebar
        mobileOpen={mobileOpen}
        collapsed={collapsed}
        onCloseMobile={() => setMobileOpen(false)}
        onToggleCollapse={() => setCollapsed((v) => !v)}
      />
      <div className={cn("flex min-h-screen flex-col transition-all duration-200", collapsed ? "lg:pl-16" : "lg:pl-64")}>
        <Topbar onOpenMobile={() => setMobileOpen(true)} onToggleCollapse={() => setCollapsed((v) => !v)} collapsed={collapsed} />
        <main className="flex-1 px-3 py-4 sm:px-5 sm:py-6">
          <div className="mx-auto w-full max-w-7xl">
            <Outlet />
          </div>
        </main>
        <footer className="px-5 pb-4 text-center text-xs text-slate-400">
          SVConnect &copy; {new Date().getFullYear()} &middot; Database-driven school management
        </footer>
      </div>
    </div>
  );
}
