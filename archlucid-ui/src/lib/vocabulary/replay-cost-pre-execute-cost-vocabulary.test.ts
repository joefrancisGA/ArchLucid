import { describe, expect, it } from "vitest";

import { REVIEWS_NEW_PATH } from "@/lib/architecture-routes";
import { COMPARE_TWO_REVIEWS_PATH } from "@/lib/compare-two-reviews-route";
import {
  REPLAY_COST_PRE_EXECUTE_COST_COMPACT_LINE,
  REPLAY_COST_PRE_EXECUTE_COST_ESTIMATES_HONESTY,
  REPLAY_COST_PRE_EXECUTE_COST_HEADING,
  REPLAY_COST_PRE_EXECUTE_COST_PRE_EXECUTE_LINK,
  REPLAY_COST_PRE_EXECUTE_COST_REPLAY_LINK,
  REPLAY_COST_PRE_EXECUTE_COST_WHY_TWO,
  buildReplayCostPreExecuteCostVocabulary,
  resolveReplayCostPreExecuteCostPeerLink,
} from "@/lib/vocabulary/replay-cost-pre-execute-cost-vocabulary";

describe("replay-cost-pre-execute-cost-vocabulary (TB-2284)", () => {
  it("explains why replay cost and pre-execute cost stay separate and deep-links both", () => {
    const model = buildReplayCostPreExecuteCostVocabulary();

    expect(model.heading).toBe(REPLAY_COST_PRE_EXECUTE_COST_HEADING);
    expect(model.whyTwo).toBe(REPLAY_COST_PRE_EXECUTE_COST_WHY_TWO);
    expect(model.whyTwo.toLowerCase()).toContain("comparison");
    expect(model.whyTwo.toLowerCase()).toContain("allotment");
    expect(model.compactLine).toBe(REPLAY_COST_PRE_EXECUTE_COST_COMPACT_LINE);
    expect(model.estimatesHonesty).toBe(REPLAY_COST_PRE_EXECUTE_COST_ESTIMATES_HONESTY);
    expect(model.estimatesHonesty.toLowerCase()).toContain("estimate");
    expect(model.estimatesHonesty.toLowerCase()).not.toContain("invoice equals");

    expect(model.replayCostLink).toEqual(REPLAY_COST_PRE_EXECUTE_COST_REPLAY_LINK);
    expect(model.replayCostLink.href).toBe(COMPARE_TWO_REVIEWS_PATH);
    expect(model.replayCostLink.href).toBe("/insights/compare-two-reviews");

    expect(model.preExecuteCostLink).toEqual(REPLAY_COST_PRE_EXECUTE_COST_PRE_EXECUTE_LINK);
    expect(model.preExecuteCostLink.href).toBe(REVIEWS_NEW_PATH);
    expect(model.preExecuteCostLink.href).toBe("/architecture/reviews/new");
  });

  it("resolves the peer deep link from each surface", () => {
    expect(resolveReplayCostPreExecuteCostPeerLink("replay-cost")).toEqual(
      REPLAY_COST_PRE_EXECUTE_COST_PRE_EXECUTE_LINK,
    );
    expect(resolveReplayCostPreExecuteCostPeerLink("pre-execute-cost")).toEqual(
      REPLAY_COST_PRE_EXECUTE_COST_REPLAY_LINK,
    );
  });
});
