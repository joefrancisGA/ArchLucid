import { describe, expect, it } from "vitest";

import { GOVERNANCE_FINDINGS_BULK_DISP_CONFIRM_PARAM } from "./governance-findings-bulk-disposition-confirm-url";
import { GOVERNANCE_FINDINGS_BULK_PARAM } from "./governance-findings-bulk-selection-url";
import { governanceFindingsClearReviewScopeHref } from "./governance-findings-clear-review-scope-url";

describe("governanceFindingsClearReviewScopeHref", () => {
  it("removes runId while preserving register and facet filters", () => {
    const href = governanceFindingsClearReviewScopeHref(
      "runId=run-1&filter=open&q=phi&findingJobView=ready-for-sponsor-packet&severity=high&groupBy=resource",
      "/governance/findings",
    );

    expect(href).toBe(
      "/governance/findings?filter=open&q=phi&findingJobView=ready-for-sponsor-packet&severity=high&groupBy=resource",
    );
    expect(href).not.toContain("runId=");
  });

  it("preserves architecture scope while clearing review scope", () => {
    const href = governanceFindingsClearReviewScopeHref(
      "runId=run-1&architectureId=arch-1&filter=expiring-soon",
      "/governance/findings",
    );

    expect(href).toBe("/governance/findings?architectureId=arch-1&filter=expiring-soon");
  });

  it("clears stale bulk selection params tied to the scoped review", () => {
    const href = governanceFindingsClearReviewScopeHref(
      `runId=run-1&${GOVERNANCE_FINDINGS_BULK_PARAM}=f1,f2&${GOVERNANCE_FINDINGS_BULK_DISP_CONFIRM_PARAM}=accepted`,
      "/governance/findings",
    );

    expect(href).toBe("/governance/findings");
  });
});
