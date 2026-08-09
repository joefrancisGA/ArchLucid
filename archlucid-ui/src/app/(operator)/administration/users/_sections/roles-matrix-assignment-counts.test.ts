import { describe, expect, it } from "vitest";

import { assignmentCountsByRoleName, formatRoleAssignmentCount } from "./roles-matrix-assignment-counts";

describe("roles-matrix-assignment-counts", () => {
  it("counts principals by role name", () => {
    const counts = assignmentCountsByRoleName([
      { id: "1", kind: "user", name: "Ada", detail: "ada@example.com", role: "Admin" },
      { id: "2", kind: "user", name: "Ben", detail: "ben@example.com", role: "Reader" },
      { id: "3", kind: "api_key", name: "ci", detail: "…ab", role: "Reader" },
    ]);

    expect(counts.get("Admin")).toBe(1);
    expect(counts.get("Reader")).toBe(2);
    expect(formatRoleAssignmentCount(0)).toBe("No assignments");
    expect(formatRoleAssignmentCount(1)).toBe("1 assignment");
    expect(formatRoleAssignmentCount(3)).toBe("3 assignments");
  });
});
