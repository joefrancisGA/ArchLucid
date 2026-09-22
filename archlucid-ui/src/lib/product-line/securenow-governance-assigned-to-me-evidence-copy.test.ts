import { describe, expect, it } from "vitest";

import {
  governanceAssignedToMeOrientationSourcesForProductLine,
  SECURENOW_GOVERNANCE_ASSIGNED_TO_ME_ORIENTATION_SOURCES,
} from "@/lib/product-line/securenow-governance-assigned-to-me-evidence-copy";

describe("securenow-governance-assigned-to-me-evidence-copy", () => {
  it("keeps SecureNow orientation links inside the Security shell", () => {
    const hrefs = SECURENOW_GOVERNANCE_ASSIGNED_TO_ME_ORIENTATION_SOURCES.map((source) => source.href);

    expect(hrefs).toContain("/compliance/findings");
    expect(hrefs).not.toContain("/architecture/reviews");
    expect(hrefs).not.toContain("/pricing");
    expect(hrefs.every((href) => !href.startsWith("/architecture/"))).toBe(true);
  });

  it("returns SecureNow sources only for the security product line", () => {
    expect(governanceAssignedToMeOrientationSourcesForProductLine("security").length).toBeGreaterThan(0);
    expect(governanceAssignedToMeOrientationSourcesForProductLine("architecture")).toEqual([]);
  });
});
