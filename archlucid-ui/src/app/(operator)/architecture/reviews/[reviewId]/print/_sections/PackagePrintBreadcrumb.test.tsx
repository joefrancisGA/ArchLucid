import { describe, expect, it } from "vitest";

import { resolvePackagePrintBreadcrumbReviewTitle } from "./PackagePrintBreadcrumb";

describe("PackagePrintBreadcrumb", () => {
  it("uses omission copy when review title is blank (P-20)", () => {
    expect(resolvePackagePrintBreadcrumbReviewTitle("")).toBe("Review title was not stored.");
  });
});
