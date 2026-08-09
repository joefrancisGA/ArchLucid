import { describe, expect, it } from "vitest";

import {
  BUILTIN_ROLE_ORDER,
  CUSTOM_ROLE_START_FROM_OPTIONS,
  hasHighRiskPermissions,
  highRiskPermissionLabels,
  sortMatrixRoles,
  unsavedRoleEditsNotice,
} from "./roles-matrix-constants";

describe("roles-matrix-constants", () => {
  it("labels the Operator start-from option as Architect while keeping the API role id as its value", () => {
    expect(CUSTOM_ROLE_START_FROM_OPTIONS.map((option) => option.label)).toEqual([
      "Admin",
      "Auditor",
      "Architect",
      "Reader",
      "Empty (no permissions)",
    ]);
    expect(CUSTOM_ROLE_START_FROM_OPTIONS.find((option) => option.label === "Architect")?.value).toBe("Operator");
  });

  it("keeps every start-from value seedable against API role names", () => {
    const seedableValues = CUSTOM_ROLE_START_FROM_OPTIONS.filter((option) => option.value !== "Empty").map(
      (option) => option.value,
    );

    // Permission seeding matches these values against role names from GET /v1/admin/roles; a display
    // label leaking into the value would silently seed an empty permission set.
    expect(seedableValues.every((value) => BUILTIN_ROLE_ORDER.includes(value as never))).toBe(true);
  });

  it("names the columns holding unsaved edits", () => {
    expect(unsavedRoleEditsNotice([], 0)).toBe("");
    expect(unsavedRoleEditsNotice(["Reviewer plus"], 1)).toContain("Reviewer plus");
    expect(unsavedRoleEditsNotice(["Reviewer plus", "Release manager"], 3)).toContain("Reviewer plus, Release manager");
    expect(unsavedRoleEditsNotice(["Reviewer plus"], 2)).toContain("2 unsaved permission changes");
  });

  it("sorts built-in roles before custom roles in canonical order", () => {
    const sorted = sortMatrixRoles([
      { name: "Operator (custom)", isSystem: false },
      { name: "Reader", isSystem: true },
      { name: "Admin", isSystem: true },
      { name: "Auditor", isSystem: true },
    ]);

    expect(sorted.map((role) => role.name)).toEqual(["Admin", "Auditor", "Reader", "Operator (custom)"]);
  });

  it("detects high-risk permissions", () => {
    expect(hasHighRiskPermissions(new Set(["Runs.Read"]))).toBe(false);
    expect(hasHighRiskPermissions(new Set(["Billing.Manage"]))).toBe(true);
  });

  it("maps high-risk permission labels", () => {
    const labels = highRiskPermissionLabels(new Set(["Billing.Manage", "Runs.Read"]), new Map([["Billing.Manage", "Manage billing"]]));

    expect(labels).toEqual(["Manage billing"]);
  });
});
