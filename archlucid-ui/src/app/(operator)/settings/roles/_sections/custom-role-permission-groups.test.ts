import { describe, expect, it } from "vitest";

import { CUSTOM_ROLE_PERMISSION_GROUPS } from "./custom-role-permission-groups";

describe("custom-role-permission-groups", () => {
  it("labels Runs.Commit as Finalize reviews for admin role matrix copy", () => {
    const reviewsGroup = CUSTOM_ROLE_PERMISSION_GROUPS.find((group) => group.area === "Reviews");
    const commitPermission = reviewsGroup?.permissions.find((permission) => permission.id === "Runs.Commit");

    expect(commitPermission?.label).toBe("Finalize reviews");
    expect(commitPermission?.label.toLowerCase()).not.toContain("commit");
  });
});
