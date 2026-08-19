import { describe, expect, it } from "vitest";

import { OPERATOR_NAV_LINK_LABELS } from "@/lib/i18n";
import {
  BUYER_SPONSOR_SUMMARY_VOCABULARY,
  BUYER_TERMINOLOGY,
} from "@/lib/vocabulary/buyer-surface-vocabulary";

describe("buyer terminology vocabulary", () => {
  it("uses finalized-review vocabulary in sponsor dashboard empty states", () => {
    const vocabulary = BUYER_SPONSOR_SUMMARY_VOCABULARY;

    expect(vocabulary.emptyStateDescription).toMatch(/finalize/i);
    expect(vocabulary.emptyStatePrimaryAction).toBe("Start an architecture review");
    expect(vocabulary.emptyStateSecondaryAction).toBe("Load sample dashboard");
    expect(vocabulary.portfolioMetricsUnavailableDescription).toContain("Finalize");
    expect(vocabulary.metricsPreviewUnavailableFootnote).toBe("Available after first finalized review");
  });

  it("maps nav labels to evaluation-first buyer copy", () => {
    expect(OPERATOR_NAV_LINK_LABELS.pilotFeedback).toBe(BUYER_TERMINOLOGY.evaluationFeedback);
    expect(OPERATOR_NAV_LINK_LABELS.pilotValueReport).toBe(BUYER_TERMINOLOGY.evaluationValueReport);
    expect(OPERATOR_NAV_LINK_LABELS.scorecard).toBe(BUYER_TERMINOLOGY.reviewScorecard);
    expect(OPERATOR_NAV_LINK_LABELS.portfolioOverview).toBe(BUYER_TERMINOLOGY.portfolioOverview);
  });

  it("aligns sponsor dashboard and sponsor scorecard customer nouns (IA-010)", () => {
    const vocabulary = BUYER_SPONSOR_SUMMARY_VOCABULARY;

    expect(vocabulary.pageTitle).toBe("Sponsor dashboard");
    expect(vocabulary.portfolioPageTitle).toBe(vocabulary.pageTitle);
    expect(vocabulary.pageTitle).toBe(BUYER_TERMINOLOGY.portfolioOverview);
    expect(vocabulary.scorecardPageTitle).toBe("Sponsor scorecard");
    expect(vocabulary.sponsorExportsScorecardTitle).toBe(vocabulary.scorecardPageTitle);
    expect(vocabulary.reviewSponsorReportLabel).toBe("Sponsor report");
  });
});
