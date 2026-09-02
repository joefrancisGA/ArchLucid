import { describe, expect, it } from "vitest";

import { EMPTY_FINDINGS_NATURAL_LANGUAGE_FACETS } from "@/lib/findings/findings-natural-language-filter";

import { governanceFindingsQueueActiveFilterChips } from "./governance-findings-queue-active-filters";

describe("governanceFindingsQueueActiveFilterChips", () => {
  it("includes text search in active filter chips", () => {
    const chips = governanceFindingsQueueActiveFilterChips({
      registerFilter: "all",
      jobView: "all",
      nlFacets: EMPTY_FINDINGS_NATURAL_LANGUAGE_FACETS,
      jobViewFilterActive: false,
      searchQuery: "payments",
    });

    expect(chips).toEqual([{ id: "search-query", label: 'Search "payments"' }]);
  });
});
