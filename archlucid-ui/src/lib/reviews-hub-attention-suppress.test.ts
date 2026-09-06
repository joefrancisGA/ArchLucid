import { describe, expect, it } from "vitest";

import { resolveReviewsHubAttentionSuppressKinds } from "@/lib/reviews-hub-attention-suppress";

describe("resolveReviewsHubAttentionSuppressKinds", () => {
  it("suppresses unfinished-work when the continue strip is visible", () => {
    expect(
      resolveReviewsHubAttentionSuppressKinds({
        hasContinueStrip: true,
        hasInProgressInventory: false,
        readyForGovernanceCount: 0,
      }),
    ).toEqual(["unfinished-work"]);
  });

  it("suppresses unfinished-work when in-progress inventory is visible", () => {
    expect(
      resolveReviewsHubAttentionSuppressKinds({
        hasContinueStrip: false,
        hasInProgressInventory: true,
        readyForGovernanceCount: 0,
      }),
    ).toEqual(["unfinished-work"]);
  });

  it("also suppresses awaiting-approval when the summary row deep-links that queue", () => {
    expect(
      resolveReviewsHubAttentionSuppressKinds({
        hasContinueStrip: true,
        hasInProgressInventory: true,
        readyForGovernanceCount: 2,
      }),
    ).toEqual(["unfinished-work", "awaiting-approval"]);
  });

  it("returns no suppressions when the hub has no competing primary zones", () => {
    expect(
      resolveReviewsHubAttentionSuppressKinds({
        hasContinueStrip: false,
        hasInProgressInventory: false,
        readyForGovernanceCount: 0,
      }),
    ).toEqual([]);
  });
});
