import { describe, expect, it } from "vitest";
import { hasPermission, canAccessSubmenu } from "./permission.js";
import type { AuthContext } from "./auth.js";

function auth(partial: Partial<AuthContext>): AuthContext {
  return {
    id: "u1",
    name: "Test",
    email: "t@test",
    type: "staff",
    role: "Staff",
    isAdmin: false,
    groups: new Map(),
    studentPanel: new Set(),
    ...partial,
  };
}

describe("hasPermission", () => {
  it("admins pass everything", () => {
    expect(hasPermission(auth({ isAdmin: true }), "fees_collection", "delete")).toBe(true);
  });

  it("grants only listed actions", () => {
    const a = auth({ groups: new Map([["library", new Set(["view", "create"])]]) });
    expect(hasPermission(a, "library", "view")).toBe(true);
    expect(hasPermission(a, "library", "create")).toBe(true);
    expect(hasPermission(a, "library", "delete")).toBe(false);
  });

  it("denies unknown groups", () => {
    expect(hasPermission(auth({}), "transport", "view")).toBe(false);
  });
});

describe("canAccessSubmenu", () => {
  it("maps a topic to its module permission group", () => {
    const a = auth({ groups: new Map([["fees_collection", new Set(["view", "create"])]]) });
    expect(canAccessSubmenu(a, "collect_fees", "view")).toBe(true);
    expect(canAccessSubmenu(a, "collect_fees", "delete")).toBe(false);
  });

  it("uses student panel permissions for panel topics", () => {
    const a = auth({ type: "student", studentPanel: new Set(["sp_fees", "sp_homework"]) });
    expect(canAccessSubmenu(a, "sp_fees", "view")).toBe(true);
    expect(canAccessSubmenu(a, "sp_attendance", "view")).toBe(false);
  });
});
