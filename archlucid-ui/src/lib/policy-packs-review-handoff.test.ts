import { describe, expect, it } from "vitest";

import {
  GOVERNANCE_POLICY_PACKS_PATH,
  SECURENOW_POLICY_PACKS_PATH,
} from "@/lib/governance/governance-route-paths";
import {
  buildPolicyPacksHrefWithReviewIdForProductLine,
  buildPolicyPacksImpactPreviewHrefForProductLine,
} from "@/lib/policy-packs-review-handoff";

describe("policy-packs-review-handoff product line helpers", () => {
  it("builds SecureNow compliance policy pack handoffs from product line", () => {
    expect(buildPolicyPacksHrefWithReviewIdForProductLine("rev-1", "security")).toBe(
      `${SECURENOW_POLICY_PACKS_PATH}?reviewId=rev-1`,
    );
    expect(
      buildPolicyPacksImpactPreviewHrefForProductLine(
        { reviewId: "rev-1", packAId: "a", packBId: "b" },
        "security",
      ),
    ).toBe(`${SECURENOW_POLICY_PACKS_PATH}?reviewId=rev-1&packAId=a&packBId=b`);
  });

  it("builds architecture governance policy pack handoffs from product line", () => {
    expect(buildPolicyPacksHrefWithReviewIdForProductLine("rev-1", "architecture")).toBe(
      `${GOVERNANCE_POLICY_PACKS_PATH}?reviewId=rev-1`,
    );
  });
});
