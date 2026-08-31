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

  it("builds prefill message for review package handoff", () => {
    expect(
      buildInviteReviewerPrefillMessage({
        reviewLabel: "Retail API platform",
        reviewHref: "https://app.example.com/architecture/reviews/run-abc",
      }),
    ).toBe(
      "Please review the finalized architecture review [Retail API platform](https://app.example.com/architecture/reviews/run-abc).",
    );
    expect(buildInviteReviewerPrefillMessage({ reviewLabel: "Retail API platform", reviewHref: "" })).toBe(
      "Please review the finalized architecture review for Retail API platform.",
    );
    expect(buildInviteReviewerPrefillMessage({ reviewLabel: "", reviewHref: "" })).toBe(
      "Please review the finalized architecture review.",
    );
  });
});
