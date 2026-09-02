import { describe, expect, it } from "vitest";

import {
  REVIEWS_HUB_SUMMARY_ACTIVE_HREF,
  REVIEWS_HUB_SUMMARY_AWAITING_APPROVAL_HREF,
  REVIEWS_HUB_SUMMARY_FINALIZED_HREF,
  REVIEWS_HUB_SUMMARY_FINDINGS_HREF,
  REVIEWS_HUB_SUMMARY_OPEN_RISKS_HREF,
} from "./reviews-hub-summary-destinations";

describe("reviews hub summary destinations", () => {
  it("sends posture counts to the matching queue or inventory filter", () => {
    expect(REVIEWS_HUB_SUMMARY_ACTIVE_HREF).toBe("/architecture/reviews?filter=Active");
    expect(REVIEWS_HUB_SUMMARY_FINALIZED_HREF).toBe("/architecture/reviews?filter=finalized");
    expect(REVIEWS_HUB_SUMMARY_FINDINGS_HREF).toBe("/governance/findings");
    expect(REVIEWS_HUB_SUMMARY_OPEN_RISKS_HREF).toBe("/governance/findings?filter=open");
    expect(REVIEWS_HUB_SUMMARY_AWAITING_APPROVAL_HREF).toBe("/governance/approval-queue");
  });
});
