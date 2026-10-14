import { Navigate, Route, Routes, useParams } from "react-router-dom";
import Layout from "./components/Layout";
import { ProtectedRoute } from "./components/ProtectedRoute";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import ModulePage from "./pages/ModulePage";
import TimetablePage from "./pages/TimetablePage";
import Settings from "./pages/Settings";
import ModulesPage from "./pages/settings/ModulesPage";
import SidebarMenuPage from "./pages/settings/SidebarMenuPage";
import RolesPage from "./pages/settings/RolesPage";
import UsersPage from "./pages/settings/UsersPage";
import AuditPage from "./pages/settings/AuditPage";
import NotFound from "./pages/NotFound";
import { useNavigation } from "./lib/useNavigation";
import { Spinner } from "./components/ui";

function ModuleRedirect() {
  const { module = "" } = useParams();
  const { data, isLoading } = useNavigation();
  if (isLoading) return <Spinner />;
  const found = data?.modules.find((m) => m.shortCode === module);
  const first = found?.sections[0];
  if (!found || !first) return <NotFound />;
  return <Navigate to={`/m/${module}/${first.shortCode}`} replace />;
}

function SubmenuRoute() {
  const { submenu } = useParams();
  if (submenu === "class_timetable") return <TimetablePage />;
  return <ModulePage />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="m/:module" element={<ModuleRedirect />} />
        <Route path="m/:module/:submenu" element={<SubmenuRoute />} />
        <Route path="settings" element={<Settings />}>
          <Route index element={<Navigate to="modules" replace />} />
          <Route path="modules" element={<ModulesPage />} />
          <Route path="sidebar" element={<SidebarMenuPage />} />
          <Route path="roles" element={<RolesPage />} />
          <Route path="users" element={<UsersPage />} />
          <Route path="audit" element={<AuditPage />} />
        </Route>
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}
