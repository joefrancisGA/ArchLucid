import { describe, expect, it } from "vitest";

import { governanceFindingsPickReviewForTriageHref } from "./governance-findings-pick-review-url";

describe("governanceFindingsPickReviewForTriageHref", () => {
  it("clears stale architecture scope when picking a review for triage", () => {
    const href = governanceFindingsPickReviewForTriageHref(
      "architectureId=arch-1&filter=open",
      "/governance/findings",
      "run-2",
    );

    expect(href).toBe("/governance/findings?filter=open&runId=run-2");
    expect(href).not.toContain("architectureId=");
  });

  it("preserves register and facet params while setting runId", () => {
    const href = governanceFindingsPickReviewForTriageHref(
      "filter=expiring-soon&findingJobView=ready-for-sponsor-packet&severity=high",
      "/governance/findings",
      "run-9",
    );

    expect(href).toBe(
      "/governance/findings?filter=expiring-soon&findingJobView=ready-for-sponsor-packet&severity=high&runId=run-9",
    );
  });
});
