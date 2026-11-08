import { describe, expect, it } from "vitest";

import { resolveLibOpenReviewHref } from "@/lib/architecture/lib-open-review-href";

describe("resolveLibOpenReviewHref", () => {
  it("opens decisions-remediation with explicit architecture id", () => {
    expect(
      resolveLibOpenReviewHref("run-abc", {
        architectureId: "architecture-identity-001",
        tab: "decisions-remediation",
      }),
    ).toBe(
      "/architecture/architectures/architecture-identity-001/reviews/run-abc?reviewTab=decisions-remediation",
    );
  });

  it("appends sponsor-handoff hash on desk-aware base", () => {
    expect(
      resolveLibOpenReviewHref("run-abc", {
        architectureId: "architecture-identity-001",
        hash: "sponsor-handoff",
      }),
    ).toBe(
      "/architecture/architectures/architecture-identity-001/reviews/run-abc#sponsor-handoff",
    );
  });
});
