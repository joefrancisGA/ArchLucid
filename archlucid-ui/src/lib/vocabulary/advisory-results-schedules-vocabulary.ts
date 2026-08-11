/**
 * TB-2280 — Advisory results ≠ Advisory schedules vocabulary rail.
 *
 * Why two advisory surfaces exist on the same hub:
 * - Advisory results (`/governance/advisory-scans?tab=scans`) generate and
 *   browse advisory findings and recommendations for architecture packages.
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
  "Advisory results and Advisory schedules do different jobs" as const;

export const ADVISORY_RESULTS_SCHEDULES_WHY_TWO =
  "Advisory results generate and browse advisory findings and recommendations for architecture packages. Advisory schedules automate recurring advisory scans on a cadence. Producing results is not the same as scheduling scans — open the peer when you need the other job." as const;

export const ADVISORY_RESULTS_SCHEDULES_COMPACT_LINE =
  "Advisory results browse findings; Advisory schedules automate recurring scans — open the other when you need both." as const;

export const ADVISORY_RESULTS_SCHEDULES_RESULTS_LINK: AdvisoryResultsSchedulesLink = {
  id: "advisory-results",
  label: "Advisory results",
  href: ADVISORY_SCANS_SCANS_HREF,
  whenToUse: "Generate and browse advisory findings for architecture packages.",
};

export const ADVISORY_RESULTS_SCHEDULES_SCHEDULES_LINK: AdvisoryResultsSchedulesLink = {
  id: "advisory-schedules",
  label: "Advisory schedules",
  href: ADVISORY_SCANS_SCHEDULES_HREF,
  whenToUse: "Automate recurring advisory scans on a cadence.",
};

/** Full vocabulary model (heading, why-two copy, and deep links). */
export function buildAdvisoryResultsSchedulesVocabulary(): AdvisoryResultsSchedulesVocabularyModel {
  return {
    heading: ADVISORY_RESULTS_SCHEDULES_HEADING,
    whyTwo: ADVISORY_RESULTS_SCHEDULES_WHY_TWO,
    compactLine: ADVISORY_RESULTS_SCHEDULES_COMPACT_LINE,
    resultsLink: ADVISORY_RESULTS_SCHEDULES_RESULTS_LINK,
    schedulesLink: ADVISORY_RESULTS_SCHEDULES_SCHEDULES_LINK,
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
