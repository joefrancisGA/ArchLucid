import { describe, expect, it } from "vitest";
import { EXTRACT_UPLOAD_EVALUATION_PENDING_NOT_LOAD_FAILURE_LINE } from "@/lib/extract-upload/extract-upload-evaluation-pending-not-load-failure-copy";
import { GOVERNANCE_FINDINGS_EMPTY_COLLECTION_BLOCKER_NOT_LOAD_FAILURE_LINE } from "@/lib/governance/governance-findings-empty-collection-blocker-not-load-failure-copy";
import { RESOURCE_HUB_FINDINGS_STORED_EMPTY_NOT_LOAD_FAILURE_LINE } from "@/lib/governance/resource-hub-findings-stored-empty-not-load-failure-copy";
import { REVIEWS_HUB_OPEN_GATE_COLLECTION_BLOCKER_NOT_LOAD_FAILURE_LINE } from "@/lib/reviews/reviews-hub-open-gate-collection-blocker-not-load-failure-copy";

describe("score-lift round103 batch honesty", () => {
  it("resource hub, extract pending, reviews hub blocker, governance collection", () => {
    expect(RESOURCE_HUB_FINDINGS_STORED_EMPTY_NOT_LOAD_FAILURE_LINE).toContain("not a failed");
    expect(EXTRACT_UPLOAD_EVALUATION_PENDING_NOT_LOAD_FAILURE_LINE).toContain("not a failed");
    expect(REVIEWS_HUB_OPEN_GATE_COLLECTION_BLOCKER_NOT_LOAD_FAILURE_LINE).toContain("not a failed");
    expect(GOVERNANCE_FINDINGS_EMPTY_COLLECTION_BLOCKER_NOT_LOAD_FAILURE_LINE).toContain("not a failed");
  });
});
