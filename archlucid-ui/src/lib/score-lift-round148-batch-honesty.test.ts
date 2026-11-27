import { describe, expect, it } from "vitest";

import { REVIEW_WORKSPACE_DECISION_VELOCITY_HELPER } from "@/lib/reviews/review-workspace-decision-velocity-copy";
import { REVIEW_WORKSPACE_OPEN_GATE_RETURN_BROWSER_LOCAL } from "@/lib/reviews/review-workspace-open-gate-return-strip-copy";
import { REVIEWS_HUB_DECISION_BLOCKER_QUEUE_HELPER } from "@/lib/reviews/reviews-hub-decision-blocker-queue";

describe("score lift round148 wave G honesty", () => {
  it("does not imply compliance scoring or duplicate hub queue claims", () => {
    expect(REVIEW_WORKSPACE_DECISION_VELOCITY_HELPER).toContain("not a compliance score");
    expect(REVIEW_WORKSPACE_DECISION_VELOCITY_HELPER).toContain("hub queue");
    expect(REVIEW_WORKSPACE_OPEN_GATE_RETURN_BROWSER_LOCAL).toContain("not a usage score");
    expect(REVIEWS_HUB_DECISION_BLOCKER_QUEUE_HELPER).toContain("not a compliance score");
  });
});
