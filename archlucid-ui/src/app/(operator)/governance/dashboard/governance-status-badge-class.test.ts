import { describe, expect, it } from "vitest";

import { governanceStatusBadgeClass } from "./governance-status-badge-class";

/** Same status strings as StatusPill with domain "governance" (see status-pill-domain-classes). */
describe("governanceStatusBadgeClass", () => {
  it("maps known statuses to colored badge classes", () => {
    expect(governanceStatusBadgeClass("Submitted")).toContain("bg-al-surface-raised");
    expect(governanceStatusBadgeClass("Submitted")).toContain("border-blue-700/40");
    expect(governanceStatusBadgeClass("Approved")).toContain("--al-status-approved-bg");
    expect(governanceStatusBadgeClass("Rejected")).toContain("--al-status-blocked-bg");
    expect(governanceStatusBadgeClass("Promoted")).toContain("bg-violet-50/80");
    expect(governanceStatusBadgeClass("Activated")).toContain("bg-teal-50/80");
  });

  it("uses neutral styling for Draft and unknown statuses", () => {
    expect(governanceStatusBadgeClass("Draft")).toContain("bg-al-surface-raised");
    expect(governanceStatusBadgeClass("Unknown")).toContain("bg-al-surface-raised");
  });
});
