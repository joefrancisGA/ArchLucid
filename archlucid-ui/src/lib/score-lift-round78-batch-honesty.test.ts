import { describe, expect, it } from "vitest";

import { REVIEWS_HUB_SEARCH_FILTER_EMPTY_NOT_LOAD_FAILURE_LINE } from "@/lib/reviews/reviews-hub-search-filter-empty-not-load-failure-copy";
import { GOVERNANCE_FINDINGS_REGISTER_FILTER_EMPTY_NOT_LOAD_FAILURE_LINE } from "@/lib/governance/governance-findings-register-filter-empty-not-load-failure-copy";
import { GRAPH_EVIDENCE_TRAIL_LOAD_FAILURE_PARTIAL_CAPTURE_LINE } from "@/lib/insights/graph-evidence-trail-load-failure-partial-capture-copy";
import { POLICY_PACK_DETAIL_LOAD_FAILURE_PARTIAL_CAPTURE_LINE } from "@/lib/policy/policy-pack-detail-load-failure-partial-capture-copy";

describe("score-lift round78 batch honesty", () => {
  it("reviews search, findings register, graph load, policy pack detail", () => {
    expect(REVIEWS_HUB_SEARCH_FILTER_EMPTY_NOT_LOAD_FAILURE_LINE).toContain("search");
    expect(GOVERNANCE_FINDINGS_REGISTER_FILTER_EMPTY_NOT_LOAD_FAILURE_LINE).toContain("register");
    expect(GRAPH_EVIDENCE_TRAIL_LOAD_FAILURE_PARTIAL_CAPTURE_LINE).toContain("topology");
    expect(POLICY_PACK_DETAIL_LOAD_FAILURE_PARTIAL_CAPTURE_LINE).toContain("hub");
  });
});
