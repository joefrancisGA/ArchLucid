/**
 * TB-2280 — Advisory results ≠ Advisory schedules vocabulary rail.
 *
 * Why two advisory surfaces exist on the same hub:
 * - Advisory scans (`/governance/advisory-scans?tab=scans`) generate and
 *   browse advisory scan recommendations for architecture packages.
 * - Advisory schedules (`/governance/advisory-scans?tab=schedules`) automate
 *   recurring advisory scans on a cadence.
 *
 * They stay separate because producing results is not scheduling scans.
 * Distinct from Advisory schedules ≠ Recurrence schedules (TB-2246), which
 * reconciles advisory cadence with package re-review — do not conflate those rails.
 */

import {
  ADVISORY_SCANS_SCANS_HREF,
  ADVISORY_SCANS_SCHEDULES_HREF,
} from "@/lib/advisory-scans-route";
import type { PairwiseVocabularyRailModel } from "@/lib/vocabulary/create-pairwise-vocabulary-rail";

export type AdvisoryResultsSchedulesSurfaceId =
  | "advisory-results"
  | "advisory-schedules";

export type AdvisoryResultsSchedulesLink = {
  readonly id: AdvisoryResultsSchedulesSurfaceId;
  readonly label: string;
  readonly href: string;
  readonly whenToUse: string;
};

export type AdvisoryResultsSchedulesVocabularyModel = {
  readonly heading: string;
  readonly whyTwo: string;
  readonly compactLine: string;
  readonly resultsLink: AdvisoryResultsSchedulesLink;
  readonly schedulesLink: AdvisoryResultsSchedulesLink;
};

export const ADVISORY_RESULTS_SCHEDULES_HEADING =
  "Advisory scans and Advisory schedules serve different purposes" as const;

export const ADVISORY_RESULTS_SCHEDULES_WHY_TWO =
  "Advisory scans generate and browse prioritized recommendations from finalized reviews. Advisory schedules automate recurring advisory scans on a cadence. Running a scan is not the same as scheduling scans." as const;

export const ADVISORY_RESULTS_SCHEDULES_COMPACT_LINE =
  "Advisory scans browse recommendations; Advisory schedules automate recurring scans — open the other when you need both." as const;

export const ADVISORY_RESULTS_SCHEDULES_RESULTS_LINK: AdvisoryResultsSchedulesLink = {
  id: "advisory-results",
  label: "Advisory scans",
  href: ADVISORY_SCANS_SCANS_HREF,
  whenToUse: "Generate and browse advisory scan recommendations for architecture packages.",
};

export const ADVISORY_RESULTS_SCHEDULES_SCHEDULES_LINK: AdvisoryResultsSchedulesLink = {
  id: "advisory-schedules",
  label: "Advisory schedules",
  href: ADVISORY_SCANS_SCHEDULES_HREF,
  whenToUse: "Automate recurring advisory scans on a cadence.",
};

/** Pairwise model for Advisory scans ↔ Advisory schedules (fixed routes). */
export function buildAdvisoryResultsSchedulesPairwiseRail(): PairwiseVocabularyRailModel<AdvisoryResultsSchedulesSurfaceId> {
  return {
    heading: ADVISORY_RESULTS_SCHEDULES_HEADING,
    whyTwo: ADVISORY_RESULTS_SCHEDULES_WHY_TWO,
    compactLine: ADVISORY_RESULTS_SCHEDULES_COMPACT_LINE,
    currentLink: ADVISORY_RESULTS_SCHEDULES_RESULTS_LINK,
    peerLink: ADVISORY_RESULTS_SCHEDULES_SCHEDULES_LINK,
  };
}

/** Full vocabulary model (heading, why-two copy, and deep links). */
export function buildAdvisoryResultsSchedulesVocabulary(): AdvisoryResultsSchedulesVocabularyModel {
  const rail = buildAdvisoryResultsSchedulesPairwiseRail();

  return {
    heading: rail.heading,
    whyTwo: rail.whyTwo,
    compactLine: rail.compactLine,
    resultsLink: rail.currentLink,
    schedulesLink: rail.peerLink,
  };
}

/** Peer deep-link for the surface you are not currently on. */
export function resolveAdvisoryResultsSchedulesPeerLink(
  currentSurfaceId: AdvisoryResultsSchedulesSurfaceId,
): AdvisoryResultsSchedulesLink {
  if (currentSurfaceId === "advisory-results") {
    return ADVISORY_RESULTS_SCHEDULES_SCHEDULES_LINK;
  }

  return ADVISORY_RESULTS_SCHEDULES_RESULTS_LINK;
}
