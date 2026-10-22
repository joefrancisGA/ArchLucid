import { describe, expect, it } from "vitest";

import { resolveFindingDetailBreadcrumbTitle } from "./FindingDetailBreadcrumb";

describe("FindingDetailBreadcrumb", () => {
  it("uses omission copy when finding title is blank (P-19)", () => {
    expect(resolveFindingDetailBreadcrumbTitle("   ")).toBe("Finding title was not stored.");
  });
});
