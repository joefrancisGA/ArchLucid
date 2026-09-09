import { describe, expect, it } from "vitest";

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
});
