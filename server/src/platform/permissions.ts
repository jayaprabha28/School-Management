import { CORE_MODULES, ADDON_MODULES, STUDENT_PANEL_MODULE, PERMISSION_ACTIONS, type PermissionAction } from "./catalog.js";

export interface PermissionGroupSeed {
  shortCode: string;
  label: string;
  actions: PermissionAction[];
  isStudentPanel?: boolean;
}

/** One permission group per module (permission_group.short_code). */
export const PERMISSION_GROUPS: PermissionGroupSeed[] = [
  ...CORE_MODULES.map((m) => ({ shortCode: m.shortCode, label: m.label, actions: [...PERMISSION_ACTIONS] })),
  ...ADDON_MODULES.map((m) => ({ shortCode: m.shortCode, label: m.label, actions: [...PERMISSION_ACTIONS] })),
  { shortCode: "reports", label: "Reports", actions: ["view", "export"] as PermissionAction[] },
];

/** Student panel permission codes (permission_student). */
export const STUDENT_PANEL_CODES = STUDENT_PANEL_MODULE.sections.map((s) => s.shortCode);

export interface RoleSeed {
  name: string;
  description: string;
  isAdmin?: boolean;
  /** Module short_code -> allowed actions. */
  groups: Record<string, PermissionAction[]>;
  /** Allowed student panel submenu codes. */
  studentPanel?: string[];
}

const ALL_ACTIONS: PermissionAction[] = [...PERMISSION_ACTIONS];

function groupsFor(codes: string[], actions: PermissionAction[] = ["view"]): Record<string, PermissionAction[]> {
  return Object.fromEntries(codes.map((c) => [c, [...actions]]));
}

const ALL_MODULE_CODES = [...CORE_MODULES, ...ADDON_MODULES].map((m) => m.shortCode);

export const DEFAULT_ROLES: RoleSeed[] = [
  {
    name: "Administrator",
    description: "Full access to every module and setting.",
    isAdmin: true,
    groups: groupsFor(ALL_MODULE_CODES, ALL_ACTIONS),
    studentPanel: STUDENT_PANEL_CODES,
  },
  {
    name: "Principal",
    description: "Full access except destructive system settings.",
    groups: groupsFor(ALL_MODULE_CODES, ALL_ACTIONS),
    studentPanel: STUDENT_PANEL_CODES,
  },
  {
    name: "Accountant",
    description: "Fees, income, expense and finance reports.",
    groups: {
      ...groupsFor(["fees_collection", "income", "expense", "reports"], ["view", "create", "edit", "export"]),
      ...groupsFor(["student_information"], ["view"]),
    },
  },
  {
    name: "Librarian",
    description: "Library management and student lookup.",
    groups: {
      ...groupsFor(["library"], ALL_ACTIONS),
      ...groupsFor(["student_information"], ["view"]),
    },
  },
  {
    name: "Teacher",
    description: "Academics, attendance, exams, homework and lesson plans.",
    groups: {
      ...groupsFor(["academics", "lesson_plan", "homework", "examination", "online_examination"], ["view", "create", "edit", "export"]),
      ...groupsFor(["student_attendance", "student_information"], ["view", "create", "edit"]),
      ...groupsFor(["communicate"], ["view"]),
    },
    studentPanel: STUDENT_PANEL_CODES,
  },
  {
    name: "Staff",
    description: "Read-only access to most modules.",
    groups: groupsFor(
      ["student_information", "student_attendance", "academics", "examination", "library", "transport", "communicate", "reports", "front_office"],
      ["view"],
    ),
  },
  {
    name: "Student",
    description: "Student panel only.",
    groups: {},
    studentPanel: STUDENT_PANEL_CODES,
  },
  {
    name: "Parent",
    description: "Student panel only.",
    groups: {},
    studentPanel: STUDENT_PANEL_CODES,
  },
];
