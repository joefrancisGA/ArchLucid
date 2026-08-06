import { describe, expect, it } from "vitest";

import {
  hasHighRiskPermissions,
  highRiskPermissionLabels,
  sortMatrixRoles,
} from "./roles-matrix-constants";

describe("roles-matrix-constants", () => {
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
