import { describe, expect, it } from "vitest";
import { CORE_MODULES, ADDON_MODULES, STUDENT_PANEL_MODULE, findSubmenu, ALL_MODULES } from "./catalog.js";
import { DEFAULT_ROLES, STUDENT_PANEL_CODES } from "./permissions.js";

describe("catalog", () => {
  it("defines 23 core modules", () => {
    expect(CORE_MODULES).toHaveLength(23);
  });

  it("defines add-on modules", () => {
    expect(ADDON_MODULES.length).toBeGreaterThanOrEqual(10);
  });

  it("gives every module a unique short_code", () => {
    const codes = ALL_MODULES.map((m) => m.shortCode);
    expect(new Set(codes).size).toBe(codes.length);
  });

  it("gives every topic a unique short_code and at least one field", () => {
    const codes: string[] = [];
    for (const module of ALL_MODULES) {
      for (const section of module.sections) {
        codes.push(section.shortCode);
        expect(section.fields.length).toBeGreaterThan(0);
      }
    }
    expect(new Set(codes).size).toBe(codes.length);
  });

  it("resolves a submenu with its module", () => {
    const found = findSubmenu("collect_fees");
    expect(found?.module.shortCode).toBe("fees_collection");
  });

  it("marks add-ons and student panel topics", () => {
    expect(ADDON_MODULES.every((m) => m.isAddon)).toBe(true);
    expect(STUDENT_PANEL_MODULE.sections).toHaveLength(STUDENT_PANEL_CODES.length);
  });
});

describe("roles", () => {
  it("administrator has admin flag", () => {
    const admin = DEFAULT_ROLES.find((r) => r.name === "Administrator");
    expect(admin?.isAdmin).toBe(true);
  });

  it("every non-empty group references a known module", () => {
    const known = new Set(ALL_MODULES.map((m) => m.shortCode));
    for (const role of DEFAULT_ROLES) {
      for (const code of Object.keys(role.groups)) {
        expect(known.has(code)).toBe(true);
      }
    }
  });

  it("teacher can grade but cannot delete students", () => {
    const teacher = DEFAULT_ROLES.find((r) => r.name === "Teacher")!;
    expect(teacher.groups.exam_group ?? teacher.groups.examination).toContain("edit");
    expect((teacher.groups.student_information ?? []).includes("delete")).toBe(false);
  });
});
