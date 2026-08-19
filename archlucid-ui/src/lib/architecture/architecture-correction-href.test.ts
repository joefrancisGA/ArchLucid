import { describe, expect, it } from "vitest";

import { buildArchitectureCorrectionHref } from "@/lib/architecture/architecture-correction-href";

describe("buildArchitectureCorrectionHref", () => {
  it("prefers an explicit correction href when provided", () => {
    expect(
      buildArchitectureCorrectionHref(
        "run-abc",
        "/architecture/reviews/new?path=guided-intake&rerun=run-abc",
      ),
    ).toBe("/architecture/reviews/new?path=guided-intake&rerun=run-abc");
  });

  it("builds a run-scoped rerun href when correction href is absent", () => {
    expect(buildArchitectureCorrectionHref("run-abc", null)).toContain("rerun=run-abc");
    expect(buildArchitectureCorrectionHref("run-abc", "")).toContain("rerun=run-abc");
  });
});
