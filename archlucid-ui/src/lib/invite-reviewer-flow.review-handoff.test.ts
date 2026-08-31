import { describe, expect, it } from "vitest";

import {
  buildInviteReviewerHref,
  buildInviteReviewerPrefillMessage,
  INVITE_REVIEWER_PATH,
  INVITE_REVIEWER_REVIEW_ID_QUERY_PARAM,
} from "@/lib/invite-reviewer-flow";

describe("invite-reviewer-flow review handoff", () => {
  it("builds invite href with reviewId query param", () => {
    expect(buildInviteReviewerHref("run-abc")).toBe(
      `${INVITE_REVIEWER_PATH}?${INVITE_REVIEWER_REVIEW_ID_QUERY_PARAM}=run-abc`,
    );
    expect(buildInviteReviewerHref()).toBe(INVITE_REVIEWER_PATH);
  });

  it("builds prefill message for architecture package handoff", () => {
    expect(buildInviteReviewerPrefillMessage("run-abc")).toBe(
      "Please review the finalized architecture package (review ID run-abc).",
    );
  });
});
