import { describe, expect, it } from "vitest";
import { formatCurrency, initials, titleCase, formatDate } from "./utils";

describe("utils", () => {
  it("formats currency", () => {
    expect(formatCurrency(1500)).toContain("1,500");
    expect(formatCurrency(null)).toBe("-");
  });

  it("builds initials", () => {
    expect(initials("Aarav Kumar")).toBe("AK");
    expect(initials("System Administrator")).toBe("SA");
  });

  it("title-cases snake codes", () => {
    expect(titleCase("collect_fees")).toBe("Collect Fees");
  });

  it("formats dates", () => {
    expect(formatDate("")).toBe("-");
    expect(formatDate("2025-06-14")).toMatch(/2025/);
  });
});
