import { describe, expect, it } from "vitest";

import type { DraftRole } from "./custom-role-draft-state";
import { filterPermissionGroupsForMatrix } from "./roles-matrix-permission-filter";
import { CUSTOM_ROLE_PERMISSION_GROUPS } from "./custom-role-permission-groups";

const roles: DraftRole[] = [
  { name: "Auditor", isSystem: true, permissions: new Set(["Audit.Export"]) },
  { name: "Reader", isSystem: true, permissions: new Set(["Audit.Read"]) },
];

describe("roles-matrix-permission-filter", () => {
  it("filters by search text", () => {
    const groups = filterPermissionGroupsForMatrix(CUSTOM_ROLE_PERMISSION_GROUPS, roles, {
      searchQuery: "billing",
      highRiskOnly: false,
      differencesOnly: false,
    });

    expect(groups.flatMap((group) => group.permissions.map((permission) => permission.id))).toEqual([
      "Billing.Read",
      "Billing.Manage",
    ]);
  });

  it("filters to permissions that differ across roles", () => {
    const groups = filterPermissionGroupsForMatrix(CUSTOM_ROLE_PERMISSION_GROUPS, roles, {
      searchQuery: "",
      highRiskOnly: false,
      differencesOnly: true,
    });

    expect(groups.flatMap((group) => group.permissions.map((permission) => permission.id))).toEqual([
      "Audit.Read",
      "Audit.Export",
    ]);
  });
});
