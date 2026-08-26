import { describe, expect, it } from "vitest";

import { resolveAuditSearchEmphasizedStepId, resolveAuditSearchSteps } from "./audit-search-checklist";

describe("audit-search-checklist", () => {
  it("emphasizes filters when review is picked but filters are empty", () => {
    expect(
      resolveAuditSearchEmphasizedStepId({
        reviewPicked: true,
        filtersConfigured: false,
        searchComplete: false,
      }),
    ).toBe("filters");
  });

  it("marks search complete after a successful query", () => {
    const steps = resolveAuditSearchSteps({
      reviewPicked: true,
      filtersConfigured: true,
      searchComplete: true,
    });

    expect(steps.every((step) => step.complete)).toBe(true);
  });
});
