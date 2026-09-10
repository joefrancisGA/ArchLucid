import { describe, expect, it } from "vitest";

import { GOVERNANCE_FINDINGS_BULK_DISP_CONFIRM_PARAM } from "./governance-findings-bulk-disposition-confirm-url";
import { GOVERNANCE_FINDINGS_BULK_PARAM } from "./governance-findings-bulk-selection-url";
import { governanceFindingsPickReviewForTriageHref } from "./governance-findings-pick-review-url";

describe("governanceFindingsPickReviewForTriageHref", () => {
  it("clears stale architecture scope and register filters when picking a review for triage", () => {
    const href = governanceFindingsPickReviewForTriageHref(
      "architectureId=arch-1&filter=open",
      "/governance/findings",
      "run-2",
    );

    expect(href).toBe("/governance/findings?runId=run-2");
    expect(href).not.toContain("architectureId=");
    expect(href).not.toContain("filter=");
  });

  it("clears architecture-scoped facet params when picking a review for triage", () => {
    const href = governanceFindingsPickReviewForTriageHref(
      "architectureId=arch-1&filter=expiring-soon&findingJobView=ready-for-sponsor-packet&severity=high&groupBy=resource&q=phi",
      "/governance/findings",
      "run-2",
    );

    expect(href).toBe("/governance/findings?runId=run-2");
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

  it("clears stale bulk selection when picking a review for triage", () => {
    const href = governanceFindingsPickReviewForTriageHref(
      `filter=open&${GOVERNANCE_FINDINGS_BULK_PARAM}=f1,f2&${GOVERNANCE_FINDINGS_BULK_DISP_CONFIRM_PARAM}=accepted`,
      "/governance/findings",
      "run-9",
    );

    expect(href).toBe("/governance/findings?filter=open&runId=run-9");
    expect(href).not.toContain(`${GOVERNANCE_FINDINGS_BULK_PARAM}=`);
    expect(href).not.toContain(`${GOVERNANCE_FINDINGS_BULK_DISP_CONFIRM_PARAM}=`);
  });
});
