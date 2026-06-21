import { describe, expect, it } from "vitest";

import { OPERATOR_NAV_LINK_LABELS } from "@/lib/i18n";
import { BUYER_TERMINOLOGY } from "@/lib/buyer-surface-vocabulary";

describe("buyer terminology vocabulary", () => {
  it("maps nav labels to evaluation-first buyer copy", () => {
    expect(OPERATOR_NAV_LINK_LABELS.pilotFeedback).toBe(BUYER_TERMINOLOGY.evaluationFeedback);
    expect(OPERATOR_NAV_LINK_LABELS.pilotValueReport).toBe(BUYER_TERMINOLOGY.evaluationValueReport);
    expect(OPERATOR_NAV_LINK_LABELS.scorecard).toBe(BUYER_TERMINOLOGY.reviewScorecard);
    expect(OPERATOR_NAV_LINK_LABELS.portfolioOverview).toBe(BUYER_TERMINOLOGY.portfolioOverview);
  });
});
