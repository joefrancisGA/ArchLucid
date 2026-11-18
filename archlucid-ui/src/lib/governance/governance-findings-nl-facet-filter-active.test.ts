import { describe, expect, it } from "vitest";

import { EMPTY_FINDINGS_NATURAL_LANGUAGE_FACETS } from "@/lib/findings/findings-natural-language-filter";

import { hasGovernanceFindingsNlFacetFilterActive } from "./governance-findings-nl-facet-filter-active";

describe("hasGovernanceFindingsNlFacetFilterActive", () => {
  it("detects severity, status, and title keyword facets", () => {
    expect(hasGovernanceFindingsNlFacetFilterActive(EMPTY_FINDINGS_NATURAL_LANGUAGE_FACETS)).toBe(false);
    expect(hasGovernanceFindingsNlFacetFilterActive({ ...EMPTY_FINDINGS_NATURAL_LANGUAGE_FACETS, severity: "high" })).toBe(true);
    expect(hasGovernanceFindingsNlFacetFilterActive({ ...EMPTY_FINDINGS_NATURAL_LANGUAGE_FACETS, status: "open" })).toBe(true);
    expect(
      hasGovernanceFindingsNlFacetFilterActive({
        ...EMPTY_FINDINGS_NATURAL_LANGUAGE_FACETS,
        titleKeywords: ["subnet"],
      }),
    ).toBe(true);
  });
});