import { describe, expect, it } from "vitest";

import { OPERATOR_NAV_LINK_LABELS } from "@/lib/i18n";
import {
  BUYER_EXECUTIVE_SUMMARY_VOCABULARY,
  BUYER_TERMINOLOGY,
} from "@/lib/buyer-surface-vocabulary";

describe("buyer terminology vocabulary", () => {
  it("uses finalize vocabulary in executive dashboard empty states", () => {
    const vocabulary = BUYER_EXECUTIVE_SUMMARY_VOCABULARY;

    expect(vocabulary.emptyStateDescription).toMatch(/finalize/i);
    expect(vocabulary.emptyStateDescription).not.toMatch(/\bcommit\b/i);
    expect(vocabulary.portfolioMetricsUnavailableDescription).toContain("Finalize");
    expect(vocabulary.portfolioMetricsUnavailableDescription).not.toMatch(/\bcommit\b/i);
  });

  it("maps nav labels to evaluation-first buyer copy", () => {
    expect(OPERATOR_NAV_LINK_LABELS.pilotFeedback).toBe(BUYER_TERMINOLOGY.evaluationFeedback);
    expect(OPERATOR_NAV_LINK_LABELS.pilotValueReport).toBe(BUYER_TERMINOLOGY.evaluationValueReport);
    expect(OPERATOR_NAV_LINK_LABELS.scorecard).toBe(BUYER_TERMINOLOGY.reviewScorecard);
    expect(OPERATOR_NAV_LINK_LABELS.portfolioOverview).toBe(BUYER_TERMINOLOGY.portfolioOverview);
  });
});
