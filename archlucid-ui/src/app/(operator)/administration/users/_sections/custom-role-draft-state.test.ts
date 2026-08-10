import { describe, expect, it } from "vitest";

import {
  baselinePermissionsByKey,
  clonedRoleName,
  type DraftRole,
  dirtyRoleDisplayNames,
  hasUnsavedRoleEdits,
  isRoleDirty,
  mergeUnsavedRoleEdits,
  newlyGrantedHighRiskPermissionIds,
  permissionChangesForRole,
  restoreRoleToBaseline,
  roleMatrixKey,
  toggleRolePermission,
} from "./custom-role-draft-state";

function builtinOperator(): DraftRole {
  return { id: "role-operator", name: "Operator", isSystem: true, permissions: new Set(["Runs.Read", "Runs.Create"]) };
}

function customRole(permissions: readonly string[]): DraftRole {
  return { id: "role-custom", name: "Reviewer plus", isSystem: false, permissions: new Set(permissions) };
}

describe("custom-role-draft-state", () => {
  it("keys columns by id and falls back to name", () => {
    expect(roleMatrixKey(customRole(["Runs.Read"]))).toBe("role-custom");
    expect(roleMatrixKey({ name: "Unsaved draft", isSystem: false, permissions: new Set() })).toBe("Unsaved draft");
  });

  it("reports no unsaved edits immediately after load", () => {
    const roles = [builtinOperator(), customRole(["Runs.Read"])];
    const baseline = baselinePermissionsByKey(roles);

    expect(hasUnsavedRoleEdits(roles, baseline)).toBe(false);
    expect(dirtyRoleDisplayNames(roles, baseline)).toEqual([]);
  });

  it("marks a custom column dirty after a permission toggle", () => {
    const roles = [builtinOperator(), customRole(["Runs.Read"])];
    const baseline = baselinePermissionsByKey(roles);
    const edited = toggleRolePermission(roles, "role-custom", "Runs.Create");

    expect(hasUnsavedRoleEdits(edited, baseline)).toBe(true);
    expect(dirtyRoleDisplayNames(edited, baseline)).toEqual(["Reviewer plus"]);
  });

  it("treats a toggle back to the saved set as clean", () => {
    const roles = [customRole(["Runs.Read"])];
    const baseline = baselinePermissionsByKey(roles);
    const removed = toggleRolePermission(roles, "role-custom", "Runs.Read");
    const restored = toggleRolePermission(removed, "role-custom", "Runs.Read");

    expect(hasUnsavedRoleEdits(removed, baseline)).toBe(true);
    expect(hasUnsavedRoleEdits(restored, baseline)).toBe(false);
  });

  it("never mutates or dirties built-in columns", () => {
    const roles = [builtinOperator()];
    const baseline = baselinePermissionsByKey(roles);
    const attempted = toggleRolePermission(roles, "role-operator", "Billing.Manage");

    expect(attempted[0]?.permissions.has("Billing.Manage")).toBe(false);
    expect(isRoleDirty(attempted[0] as DraftRole, baseline)).toBe(false);
  });

  it("discards one column back to its saved permissions", () => {
    const roles = [customRole(["Runs.Read"])];
    const baseline = baselinePermissionsByKey(roles);
    const edited = toggleRolePermission(roles, "role-custom", "Billing.Manage");
    const discarded = restoreRoleToBaseline(edited, "role-custom", baseline);

    expect(discarded[0]?.permissions.has("Billing.Manage")).toBe(false);
    expect(hasUnsavedRoleEdits(discarded, baseline)).toBe(false);
  });

  it("carries unsaved edits across a reload triggered by another role change", () => {
    const roles = [customRole(["Runs.Read"])];
    const baseline = baselinePermissionsByKey(roles);
    const edited = toggleRolePermission(roles, "role-custom", "Billing.Manage");
    const reloaded: DraftRole[] = [
      customRole(["Runs.Read"]),
      { id: "role-new", name: "Just created", isSystem: false, permissions: new Set(["Runs.Read"]) },
    ];

    const merged = mergeUnsavedRoleEdits(reloaded, edited, baseline);

    expect(merged[0]?.permissions.has("Billing.Manage")).toBe(true);
    expect(merged[1]?.name).toBe("Just created");
    expect(hasUnsavedRoleEdits(merged, baselinePermissionsByKey(reloaded))).toBe(true);
  });

  it("takes server permissions on reload for columns without unsaved edits", () => {
    const roles = [customRole(["Runs.Read"])];
    const baseline = baselinePermissionsByKey(roles);
    const reloaded = [customRole(["Runs.Read", "Runs.Create"])];

    expect(mergeUnsavedRoleEdits(reloaded, roles, baseline)[0]?.permissions.has("Runs.Create")).toBe(true);
  });

  it("names clones from the buyer-facing label of the source role", () => {
    expect(clonedRoleName(builtinOperator())).toBe("Architect (custom)");
  });

  it("reports permission deltas and newly granted high-risk ids", () => {
    const roles = [customRole(["Runs.Read"])];
    const baseline = baselinePermissionsByKey(roles);
    const withBilling = toggleRolePermission(roles, "role-custom", "Billing.Manage");
    const edited = toggleRolePermission(withBilling, "role-custom", "Runs.Create");

    expect(permissionChangesForRole(edited[0] as DraftRole, baseline)).toEqual({
      added: ["Runs.Create", "Billing.Manage"],
      removed: [],
    });
    expect(newlyGrantedHighRiskPermissionIds(edited[0] as DraftRole, baseline)).toEqual(["Billing.Manage"]);
  });
});
