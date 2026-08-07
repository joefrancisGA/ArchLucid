import { describe, expect, it } from "vitest";

import { resolveReviewPackageSummaryMode } from "./resolve-review-package-summary-mode";

describe("resolveReviewPackageSummaryMode", () => {
  it("returns finalized when a manifest id is present", () => {
    expect(resolveReviewPackageSummaryMode("claims-intake-run-v1")).toBe("finalized");
  });

  it("returns draft when manifest id is absent", () => {
    expect(resolveReviewPackageSummaryMode(null)).toBe("draft");
    expect(resolveReviewPackageSummaryMode(undefined)).toBe("draft");
    expect(resolveReviewPackageSummaryMode("")).toBe("draft");
  });
});
