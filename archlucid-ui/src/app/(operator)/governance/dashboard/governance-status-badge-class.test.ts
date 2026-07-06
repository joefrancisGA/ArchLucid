import { describe, expect, it } from "vitest";

import { governanceStatusBadgeClass } from "./governance-status-badge-class";

/** Same status strings as StatusPill with domain "governance" (see status-pill-domain-classes). */
describe("governanceStatusBadgeClass", () => {
  it("maps known statuses to colored badge classes", () => {
    expect(governanceStatusBadgeClass("Submitted")).toContain("bg-blue-500/10");
    expect(governanceStatusBadgeClass("Submitted")).toContain("text-blue-900");
    expect(governanceStatusBadgeClass("Approved")).toContain("--al-status-approved-bg");
    expect(governanceStatusBadgeClass("Rejected")).toContain("--al-status-blocked-bg");
    expect(governanceStatusBadgeClass("Promoted")).toContain("bg-violet-500/12");
    expect(governanceStatusBadgeClass("Activated")).toContain("bg-teal-500/12");
  });

  it("uses neutral styling for Draft and unknown statuses", () => {
    expect(governanceStatusBadgeClass("Draft")).toContain("bg-neutral-500/10");
    expect(governanceStatusBadgeClass("Unknown")).toContain("bg-neutral-500/10");
  });
});
