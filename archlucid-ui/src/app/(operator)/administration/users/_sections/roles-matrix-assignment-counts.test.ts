import { describe, expect, it } from "vitest";

import { assignmentCountsByRoleName, formatRoleAssignmentCount, formatRoleAssignmentDisplay } from "./roles-matrix-assignment-counts";

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

  it("counts custom role names from directory rows", () => {
    const counts = assignmentCountsByRoleName([
      { id: "1", kind: "user", name: "Ada", detail: "ada@example.com", role: "Reviewer plus" as never },
    ]);

    expect(counts.get("Reviewer plus")).toBe(1);
  });

  it("returns unavailable copy when assignment counts are unreliable", () => {
    expect(formatRoleAssignmentDisplay(2, false)).toEqual({ text: "Assignments unavailable", linkable: false });
    expect(formatRoleAssignmentDisplay(2, true)).toEqual({ text: "2 assignments", linkable: true });
  });
});
