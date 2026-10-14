export type FieldType =
  | "text"
  | "textarea"
  | "number"
  | "currency"
  | "date"
  | "time"
  | "select"
  | "email"
  | "phone"
  | "checkbox";

export interface FieldDef {
  name: string;
  label: string;
  type: FieldType;
  required?: boolean;
  options?: string[];
  placeholder?: string;
}

export interface NavSection {
  shortCode: string;
  label: string;
  fields: FieldDef[];
}

export interface NavModule {
  shortCode: string;
  label: string;
  icon: string;
  isAddon: boolean;
  isStudentPanel: boolean;
  enabled: boolean;
  sections: NavSection[];
}

export interface NavigationResponse {
  modules: NavModule[];
  permissions: Record<string, string[]>;
  studentPanel: string[];
  isAdmin: boolean;
}

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: string;
  type: "staff" | "student" | "parent";
  isAdmin: boolean;
}

export interface ListResponse {
  items: { id: string; data: Record<string, unknown>; createdAt?: string; updatedAt?: string }[];
  total: number;
  page: number;
  limit: number;
  pages: number;
  fields: FieldDef[];
  label: string;
  module: string;
}

export interface DashboardResponse {
  cards: {
    students: number;
    staff: number;
    enquiries: number;
    onlineAdmissions: number;
    feesCollected: number;
    pendingDues: number;
    expenses: number;
    income: number;
    attendanceToday: Record<string, number>;
  };
  monthlyFees: { month: string; total: number }[];
  attendanceTrend: { date: string; status: string; count: number }[];
  recentActivity: { id: string; module: string; submenu: string; section: string; label: string; at: string }[];
}
