import { describe, expect, it } from "vitest";

import { COMPARE_FINALIZE_DECISION_LEAD } from "@/lib/reviews/compare-finalize-decision-velocity-copy";
import { REVIEWS_HUB_DECISION_BLOCKER_QUEUE_HELPER } from "@/lib/reviews/reviews-hub-decision-blocker-queue";
import { REVIEW_WORKSPACE_UNIFIED_SEARCH_HELPER } from "@/lib/reviews/review-workspace-unified-search-honesty-copy";

describe("score lift round144 wave C honesty", () => {
  it("does not imply compare works on unsealed reviews or compliance scoring", () => {
    expect(COMPARE_FINALIZE_DECISION_LEAD).toContain("finalized (sealed)");
    expect(REVIEWS_HUB_DECISION_BLOCKER_QUEUE_HELPER).toContain("not a compliance score");
    expect(REVIEW_WORKSPACE_UNIFIED_SEARCH_HELPER).toContain("does not replace findings search");
  });
});
