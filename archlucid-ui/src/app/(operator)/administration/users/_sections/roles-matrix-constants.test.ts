import { describe, expect, it } from "vitest";

import {
  BUILTIN_ROLE_ORDER,
  BUILTIN_ROLE_SUMMARIES,
  CUSTOM_ROLE_START_FROM_OPTIONS,
  hasHighRiskPermissions,
  highRiskPermissionLabels,
  sortMatrixRoles,
  unsavedRoleEditsNotice,
} from "./roles-matrix-constants";
import { roleDisplayLabel } from "@/lib/role-display-labels";

describe("roles-matrix-constants", () => {
  it("uses start-from labels that match built-in summary display labels", () => {
    const summaryLabels = BUILTIN_ROLE_SUMMARIES.map((summary) => roleDisplayLabel(summary.name));
    const startFromLabels = CUSTOM_ROLE_START_FROM_OPTIONS.filter((option) => option.value !== "Empty").map(
      (option) => option.label,
    );

    expect(startFromLabels).toEqual(summaryLabels);
    expect(startFromLabels).toEqual(["Admin", "Auditor", "Operator", "Reader"]);
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
    expect(unsavedRoleEditsNotice([])).toBe("");
    expect(unsavedRoleEditsNotice(["Reviewer plus"])).toContain("Reviewer plus");
    expect(unsavedRoleEditsNotice(["Reviewer plus", "Release manager"])).toContain("Reviewer plus, Release manager");
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
