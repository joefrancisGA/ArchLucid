/**
 * TB-2265 — Architecture scorecard ≠ ROI summary vocabulary rail.
 *
 * Why two surfaces exist:
 * - Architecture scorecard (`/insights/architecture-scorecard`) is the
 *   *pilot scorecard* — operational KPIs and directional savings tiles for the
 *   current workspace / pilot window.
 * - ROI summary (`/insights/roi-summary`) is the *portfolio KPI* view for
 *   review-cycle reduction, effort saved, and governance-ready artifacts across
 *   the reporting window.
 *
 * They stay separate because scorecard tiles for one pilot are not the same job
 * as portfolio ROI framing. Distinct from TB-2258 (ROI summary ≠ sponsor export).
 */

import { ARCHITECTURE_SCORECARD_PATH } from "@/lib/architecture/architecture-scorecard-route";
import { SPONSOR_REPORT_ROI_SUMMARY_PATH } from "@/lib/sponsor-report-navigation";

export type ScorecardRoiSurfaceId = "scorecard" | "roi-summary";

export type ScorecardRoiLink = {
  readonly id: ScorecardRoiSurfaceId;
  readonly label: string;
  readonly href: string;
  readonly whenToUse: string;
};

export type ScorecardRoiVocabularyModel = {
  readonly heading: string;
  readonly whyTwo: string;
  readonly compactLine: string;
  readonly scorecardLink: ScorecardRoiLink;
  readonly roiSummaryLink: ScorecardRoiLink;
};

export const SCORECARD_ROI_HEADING =
  "Architecture scorecard and ROI summary do different jobs" as const;

export const SCORECARD_ROI_WHY_TWO =
  "Architecture scorecard shows pilot operational KPIs and directional savings tiles for the current workspace window. ROI summary shows portfolio KPIs — review-cycle reduction, estimated effort saved, and governance-ready artifacts across the reporting window. Pilot scorecard tiles are not the same as portfolio ROI framing." as const;

export const SCORECARD_ROI_COMPACT_LINE =
  "Scorecard is pilot operational KPIs; ROI summary is portfolio framing — open the other when you need both." as const;

export const SCORECARD_ROI_SCORECARD_LINK: ScorecardRoiLink = {
  id: "scorecard",
  label: "Architecture scorecard",
  href: ARCHITECTURE_SCORECARD_PATH,
  whenToUse: "Review pilot operational KPIs and directional savings tiles.",
};

export const SCORECARD_ROI_ROI_SUMMARY_LINK: ScorecardRoiLink = {
  id: "roi-summary",
  label: "ROI summary",
  href: SPONSOR_REPORT_ROI_SUMMARY_PATH,
  whenToUse: "Review portfolio KPIs for the reporting window.",
};

/** Full vocabulary model (heading, why-two copy, and deep links). */
export function buildScorecardRoiVocabulary(): ScorecardRoiVocabularyModel {
  return {
    heading: SCORECARD_ROI_HEADING,
    whyTwo: SCORECARD_ROI_WHY_TWO,
    compactLine: SCORECARD_ROI_COMPACT_LINE,
    scorecardLink: SCORECARD_ROI_SCORECARD_LINK,
    roiSummaryLink: SCORECARD_ROI_ROI_SUMMARY_LINK,
  };
}

/** Peer deep-link for the surface you are not currently on. */
export function resolveScorecardRoiPeerLink(
  currentSurfaceId: ScorecardRoiSurfaceId,
): ScorecardRoiLink {
  if (currentSurfaceId === "scorecard") {
    return SCORECARD_ROI_ROI_SUMMARY_LINK;
  }

  return SCORECARD_ROI_SCORECARD_LINK;
}
