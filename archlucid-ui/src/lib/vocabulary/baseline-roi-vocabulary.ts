/**
 * TB-2275 — Baseline settings ≠ ROI summary vocabulary rail.
 *
 * Why two surfaces exist:
 * - Baseline settings (`/administration/baseline`) capture *measurement inputs* —
 *   review-cycle hours, people, and prep effort used as the ROI cost basis.
 * - ROI summary (`/insights/roi-summary`) is the *portfolio KPI* view for
 *   review-cycle reduction, effort saved, and export-ready artifacts.
 *
 * They stay separate because configuring the cost baseline is not the same task
 * as reading portfolio ROI framing. Distinct from TB-2265 (scorecard ≠ ROI) and
 * TB-2258 (ROI summary ≠ sponsor export).
 */

import { BASELINE_SETTINGS_CANONICAL_PATH } from "@/lib/baseline-settings-evidence-copy";
import { SPONSOR_REPORT_ROI_SUMMARY_PATH } from "@/lib/sponsor-report-navigation";
import type { PairwiseVocabularyRailModel } from "@/lib/vocabulary/create-pairwise-vocabulary-rail";

export type BaselineRoiSurfaceId = "baseline" | "roi-summary";

export type BaselineRoiLink = {
  readonly id: BaselineRoiSurfaceId;
  readonly label: string;
  readonly href: string;
  readonly whenToUse: string;
};

export type BaselineRoiVocabularyModel = {
  readonly heading: string;
  readonly whyTwo: string;
  readonly compactLine: string;
  readonly baselineLink: BaselineRoiLink;
  readonly roiSummaryLink: BaselineRoiLink;
};

export const BASELINE_ROI_HEADING =
  "Baseline settings and ROI summary serve different purposes" as const;

export const BASELINE_ROI_WHY_TWO =
  "Baseline settings capture measurement inputs — review-cycle hours, people, and prep effort that form the ROI cost basis. ROI summary shows portfolio KPIs — review-cycle reduction, estimated effort saved, and export-ready artifacts across the reporting window. Configuring the cost baseline is not the same as reading portfolio ROI framing." as const;

export const BASELINE_ROI_COMPACT_LINE =
  "Baseline settings capture cost inputs; ROI summary shows portfolio framing — open the other when you need both." as const;

export const BASELINE_ROI_BASELINE_LINK: BaselineRoiLink = {
  id: "baseline",
  label: "Baseline settings",
  href: BASELINE_SETTINGS_CANONICAL_PATH,
  whenToUse: "Configure review-cycle hours, people, and prep effort for ROI measurement.",
};

export const BASELINE_ROI_ROI_SUMMARY_LINK: BaselineRoiLink = {
  id: "roi-summary",
  label: "ROI summary",
  href: SPONSOR_REPORT_ROI_SUMMARY_PATH,
  whenToUse: "Review portfolio KPIs for the reporting window.",
};

/** Pairwise model for Baseline settings ↔ ROI summary (fixed routes). */
export function buildBaselineRoiPairwiseRail(): PairwiseVocabularyRailModel<BaselineRoiSurfaceId> {
  return {
    heading: BASELINE_ROI_HEADING,
    whyTwo: BASELINE_ROI_WHY_TWO,
    compactLine: BASELINE_ROI_COMPACT_LINE,
    currentLink: BASELINE_ROI_BASELINE_LINK,
    peerLink: BASELINE_ROI_ROI_SUMMARY_LINK,
  };
}

/** Full vocabulary model (heading, why-two copy, and deep links). */
export function buildBaselineRoiVocabulary(): BaselineRoiVocabularyModel {
  const rail = buildBaselineRoiPairwiseRail();

  return {
    heading: rail.heading,
    whyTwo: rail.whyTwo,
    compactLine: rail.compactLine,
    baselineLink: rail.currentLink,
    roiSummaryLink: rail.peerLink,
  };
}

/** Peer deep-link for the surface you are not currently on. */
export function resolveBaselineRoiPeerLink(
  currentSurfaceId: BaselineRoiSurfaceId,
): BaselineRoiLink {
  if (currentSurfaceId === "baseline") {
    return BASELINE_ROI_ROI_SUMMARY_LINK;
  }

  return BASELINE_ROI_BASELINE_LINK;
}
