import { describe, expect, it } from "vitest";

import { isOperatorAttentionKindDestinationActive } from "./operator-attention-kind-chip-selected";
import { REVIEWS_HUB_UNFINISHED_WORK_HREF } from "@/lib/reviews-hub-unfinished-work-href";
import { GOVERNANCE_ASSIGNED_TO_ME_FINDINGS_PATH } from "@/lib/governance/governance-route-paths";

describe("isOperatorAttentionKindDestinationActive", () => {
  it("matches pathname and query for unfinished-work destination", () => {
    const params = new URLSearchParams("filter=needs-attention");

    expect(
      isOperatorAttentionKindDestinationActive(
        "/architecture/reviews",
        params,
        REVIEWS_HUB_UNFINISHED_WORK_HREF,
      ),
    ).toBe(true);
  });

  it("returns false when filter query does not match", () => {
    const params = new URLSearchParams("filter=Active");

    expect(
      isOperatorAttentionKindDestinationActive(
        "/architecture/reviews",
        params,
        REVIEWS_HUB_UNFINISHED_WORK_HREF,
      ),
    ).toBe(false);
  });

  it("matches assigned-to-me findings path without query params", () => {
    expect(
      isOperatorAttentionKindDestinationActive(
        GOVERNANCE_ASSIGNED_TO_ME_FINDINGS_PATH,
        new URLSearchParams(),
        GOVERNANCE_ASSIGNED_TO_ME_FINDINGS_PATH,
      ),
    ).toBe(true);
  });
});
