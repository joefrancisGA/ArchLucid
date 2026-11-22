import { describe, expect, it } from "vitest";

import { OPERATOR_HOME_OPEN_GATE_COLLECTION_BLOCKER_PREFACE_LINE } from "@/lib/operator/operator-home-open-gate-collection-blocker-copy";
import { GOVERNANCE_FINDINGS_JOB_VIEW_AND_NL_FACET_COMBINED_FILTER_EMPTY_NOT_LOAD_FAILURE_LINE } from "@/lib/governance/governance-findings-job-view-and-nl-facet-combined-filter-empty-not-load-failure-copy";
import { REVIEWS_HUB_LIST_CONTEXT_FILTER_EMPTY_NOT_LOAD_FAILURE_LINE } from "@/lib/reviews/reviews-hub-list-context-filter-empty-not-load-failure-copy";
import { WORKSPACE_HEALTH_PAGE_REFRESH_DISCIPLINE_LINE } from "@/lib/insights/workspace-health-page-refresh-discipline-copy";
import { POLICY_PACK_HUB_WORKSPACE_ASSIGNMENTS_EMPTY_NOT_LOAD_FAILURE_LINE } from "@/lib/policy/policy-pack-hub-workspace-assignments-empty-not-load-failure-copy";

describe("score-lift round80 batch honesty", () => {
  it("operator home collection, findings job plus NL, reviews list context, workspace health, policy assignments", () => {
    expect(OPERATOR_HOME_OPEN_GATE_COLLECTION_BLOCKER_PREFACE_LINE).toContain("collection");
    expect(GOVERNANCE_FINDINGS_JOB_VIEW_AND_NL_FACET_COMBINED_FILTER_EMPTY_NOT_LOAD_FAILURE_LINE).toContain("job view");
    expect(REVIEWS_HUB_LIST_CONTEXT_FILTER_EMPTY_NOT_LOAD_FAILURE_LINE).toContain("context");
    expect(WORKSPACE_HEALTH_PAGE_REFRESH_DISCIPLINE_LINE).toContain("Retry");
    expect(POLICY_PACK_HUB_WORKSPACE_ASSIGNMENTS_EMPTY_NOT_LOAD_FAILURE_LINE).toContain("assignments");
  });
});
