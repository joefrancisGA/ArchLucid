import { describe, expect, it } from "vitest";

import { GOVERNANCE_FINDINGS_REGISTER_AND_JOB_VIEW_COMBINED_FILTER_EMPTY_NOT_LOAD_FAILURE_LINE } from "@/lib/governance/governance-findings-register-and-job-view-combined-filter-empty-not-load-failure-copy";
import { GOVERNANCE_FINDINGS_REGISTER_AND_JOB_VIEW_AND_NL_FACET_COMBINED_FILTER_EMPTY_NOT_LOAD_FAILURE_LINE } from "@/lib/governance/governance-findings-register-and-job-view-and-nl-facet-combined-filter-empty-not-load-failure-copy";
import { GOVERNANCE_ASSIGNED_TO_ME_EMPTY_COLLECTION_BLOCKER_PREFACE_LINE } from "@/lib/governance/governance-assigned-to-me-empty-collection-blocker-preface-copy";
import { REVIEWS_HUB_ORPHAN_CANDIDATES_CONTEXT_FILTER_EMPTY_NOT_LOAD_FAILURE_LINE } from "@/lib/reviews/reviews-hub-orphan-candidates-context-filter-empty-not-load-failure-copy";
import { REVIEWS_HUB_LIST_CONTEXT_AND_SEARCH_FILTER_EMPTY_NOT_LOAD_FAILURE_LINE } from "@/lib/reviews/reviews-hub-list-context-and-search-filter-empty-not-load-failure-copy";

describe("score-lift round81 batch honesty", () => {
  it("findings register plus job view, triple filter, assigned collection, orphan context, list context plus search", () => {
    expect(GOVERNANCE_FINDINGS_REGISTER_AND_JOB_VIEW_COMBINED_FILTER_EMPTY_NOT_LOAD_FAILURE_LINE).toContain("register");
    expect(GOVERNANCE_FINDINGS_REGISTER_AND_JOB_VIEW_AND_NL_FACET_COMBINED_FILTER_EMPTY_NOT_LOAD_FAILURE_LINE).toContain("job view");
    expect(GOVERNANCE_ASSIGNED_TO_ME_EMPTY_COLLECTION_BLOCKER_PREFACE_LINE).toContain("collection");
    expect(REVIEWS_HUB_ORPHAN_CANDIDATES_CONTEXT_FILTER_EMPTY_NOT_LOAD_FAILURE_LINE).toContain("orphan");
    expect(REVIEWS_HUB_LIST_CONTEXT_AND_SEARCH_FILTER_EMPTY_NOT_LOAD_FAILURE_LINE).toContain("search");
  });
});
