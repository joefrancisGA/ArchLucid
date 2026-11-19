import { describe, expect, it } from "vitest";

import { GOVERNANCE_FINDINGS_EMPTY_COLLECTION_BLOCKER_PREFACE_LINE } from "@/lib/governance/governance-findings-empty-collection-blocker-preface-copy";
import { GOVERNANCE_FINDINGS_COMBINED_FILTER_MODE_TRIPLE_LINE } from "@/lib/governance/governance-findings-combined-filter-mode-legend-copy";
import { REVIEWS_HUB_LIST_CONTEXT_AND_PACKAGE_SCOPE_FILTER_EMPTY_NOT_LOAD_FAILURE_LINE } from "@/lib/reviews/reviews-hub-list-context-and-package-scope-filter-empty-not-load-failure-copy";
import { REVIEWS_HUB_ORPHAN_CANDIDATES_AND_SEARCH_FILTER_EMPTY_NOT_LOAD_FAILURE_LINE } from "@/lib/reviews/reviews-hub-orphan-candidates-and-search-filter-empty-not-load-failure-copy";

describe("score-lift round82 batch honesty", () => {
  it("list context plus package scope, orphan plus search, findings empty preface, combined filter legend", () => {
    expect(REVIEWS_HUB_LIST_CONTEXT_AND_PACKAGE_SCOPE_FILTER_EMPTY_NOT_LOAD_FAILURE_LINE).toContain("package scope");
    expect(REVIEWS_HUB_ORPHAN_CANDIDATES_AND_SEARCH_FILTER_EMPTY_NOT_LOAD_FAILURE_LINE).toContain("search");
    expect(GOVERNANCE_FINDINGS_EMPTY_COLLECTION_BLOCKER_PREFACE_LINE).toContain("collection");
    expect(GOVERNANCE_FINDINGS_COMBINED_FILTER_MODE_TRIPLE_LINE).toContain("job view");
  });
});
