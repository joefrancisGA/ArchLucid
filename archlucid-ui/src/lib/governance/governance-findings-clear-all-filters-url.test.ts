import { describe, expect, it } from "vitest";

import { GOVERNANCE_FINDINGS_BULK_DISP_CONFIRM_PARAM } from "./governance-findings-bulk-disposition-confirm-url";
import { GOVERNANCE_FINDINGS_BULK_PARAM } from "./governance-findings-bulk-selection-url";
import { governanceFindingsClearAllFiltersHref } from "./governance-findings-clear-all-filters-url";

describe("governanceFindingsClearAllFiltersHref", () => {
  it("clears register, facet, and search params but preserves review and architecture scope", () => {
    const href = governanceFindingsClearAllFiltersHref(
      "runId=run-1&architectureId=arch-1&filter=open&q=phi&findingJobView=ready-for-sponsor-packet&severity=high&groupBy=resource",
      "/governance/findings",
    );

    expect(href).toBe("/governance/findings?runId=run-1&architectureId=arch-1");
  });

  it("does not restore stale filter params when clearing search only", () => {
    const href = governanceFindingsClearAllFiltersHref(
      "runId=run-1&filter=expiring-soon&q=test",
      "/governance/findings",
    );

    expect(href).toBe("/governance/findings?runId=run-1");
    expect(href).not.toContain("filter=");
    expect(href).not.toContain("q=");
  });

  it("clears stale bulk selection and confirm params while preserving review scope", () => {
    const href = governanceFindingsClearAllFiltersHref(
      `runId=run-1&filter=open&${GOVERNANCE_FINDINGS_BULK_PARAM}=f1,f2&${GOVERNANCE_FINDINGS_BULK_DISP_CONFIRM_PARAM}=accepted`,
      "/governance/findings",
    );

    expect(href).toBe("/governance/findings?runId=run-1");
    expect(href).not.toContain(`${GOVERNANCE_FINDINGS_BULK_PARAM}=`);
    expect(href).not.toContain(`${GOVERNANCE_FINDINGS_BULK_DISP_CONFIRM_PARAM}=`);
  });
});
