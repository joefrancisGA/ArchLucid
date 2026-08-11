/**
 * TB-2246 — Advisory schedules ≠ Recurrence schedules vocabulary rail.
 *
 * Why two “schedule” surfaces exist:
 * - Advisory schedules (`/governance/advisory-scans?tab=schedules`) automate
 *   recurring advisory scans for governance findings on architecture packages.
 * - Recurrence schedules (`/governance/recurrence-schedules`) automate
 *   re-review of architecture packages on a repeating cadence.
 *
 * They stay separate because advisory scan cadence is not package re-review
 * automation. Distinct from Digest ≠ Recurrence (TB-2226), which reconciles
 * sponsor email cadence with re-review — do not conflate those rails.
 */

import { ADVISORY_SCANS_SCHEDULES_HREF } from "@/lib/advisory-scans-route";
import { RECURRENCE_SCHEDULES_MANAGE_PATH } from "@/lib/recurrence-schedules-copy";

export type AdvisoryRecurrenceScheduleSurfaceId =
  | "advisory-schedules"
  | "recurrence-schedules";

export type AdvisoryRecurrenceScheduleLink = {
  readonly id: AdvisoryRecurrenceScheduleSurfaceId;
  readonly label: string;
  readonly href: string;
  readonly whenToUse: string;
};

export type AdvisoryRecurrenceScheduleVocabularyModel = {
  readonly heading: string;
  readonly whyTwo: string;
  readonly compactLine: string;
  readonly advisoryLink: AdvisoryRecurrenceScheduleLink;
  readonly recurrenceLink: AdvisoryRecurrenceScheduleLink;
};

export const ADVISORY_RECURRENCE_SCHEDULE_HEADING =
  "Advisory and recurrence schedules do different jobs" as const;

export const ADVISORY_RECURRENCE_SCHEDULE_WHY_TWO =
  "Advisory schedules automate recurring advisory scans that surface governance findings on architecture packages. Recurrence schedules automate re-review of architecture packages on a repeating cadence. Both are schedules, but one runs advisory scans and the other starts follow-up reviews — open the peer link when you need the other kind." as const;

export const ADVISORY_RECURRENCE_SCHEDULE_COMPACT_LINE =
  "Advisory schedules run scans; recurrence schedules re-review architecture packages — open the other when you need both." as const;

export const ADVISORY_RECURRENCE_SCHEDULE_ADVISORY_LINK: AdvisoryRecurrenceScheduleLink = {
  id: "advisory-schedules",
  label: "Advisory schedules",
  href: ADVISORY_SCANS_SCHEDULES_HREF,
  whenToUse: "Automate recurring advisory scans for governance findings.",
};

export const ADVISORY_RECURRENCE_SCHEDULE_RECURRENCE_LINK: AdvisoryRecurrenceScheduleLink = {
  id: "recurrence-schedules",
  label: "Recurrence schedules",
  href: RECURRENCE_SCHEDULES_MANAGE_PATH,
  whenToUse: "Automate repeating re-review of architecture packages.",
};

/** Full vocabulary model (heading, why-two copy, and deep links). */
export function buildAdvisoryRecurrenceScheduleVocabulary(): AdvisoryRecurrenceScheduleVocabularyModel {
  return {
    heading: ADVISORY_RECURRENCE_SCHEDULE_HEADING,
    whyTwo: ADVISORY_RECURRENCE_SCHEDULE_WHY_TWO,
    compactLine: ADVISORY_RECURRENCE_SCHEDULE_COMPACT_LINE,
    advisoryLink: ADVISORY_RECURRENCE_SCHEDULE_ADVISORY_LINK,
    recurrenceLink: ADVISORY_RECURRENCE_SCHEDULE_RECURRENCE_LINK,
  };
}

/** Peer deep-link for the surface you are not currently on. */
export function resolveAdvisoryRecurrenceSchedulePeerLink(
  currentSurfaceId: AdvisoryRecurrenceScheduleSurfaceId,
): AdvisoryRecurrenceScheduleLink {
  if (currentSurfaceId === "advisory-schedules") {
    return ADVISORY_RECURRENCE_SCHEDULE_RECURRENCE_LINK;
  }

  return ADVISORY_RECURRENCE_SCHEDULE_ADVISORY_LINK;
}
