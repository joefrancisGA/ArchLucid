/**
 * TB-2226 — Digest ≠ recurrence schedule vocabulary rail.
 *
 * Why two “schedule” surfaces exist:
 * - Digests executive schedule (`/architecture/digests?tab=schedule`) is the
 *   *sponsor email cadence* for architecture digest delivery.
 * - Recurrence schedules (`/governance/recurrence-schedules`) automate
 *   *re-review of architecture reviews* on a repeating cadence.
 *
 * They stay separate because email cadence is not the same as automated
 * follow-up review. Operators need both surfaces with deep links so they do
 * not treat one “schedule” as the other.
 */

import { DIGESTS_SCHEDULE_TAB_PATH } from "@/lib/digests-route-paths";
import { RECURRENCE_SCHEDULES_MANAGE_PATH } from "@/lib/recurrence-schedules-copy";

export type DigestRecurrenceScheduleSurfaceId =
  | "digest-executive-schedule"
  | "recurrence-schedules";

export type DigestRecurrenceScheduleLink = {
  readonly id: DigestRecurrenceScheduleSurfaceId;
  readonly label: string;
  readonly href: string;
  readonly whenToUse: string;
};

export type DigestRecurrenceScheduleVocabularyModel = {
  readonly heading: string;
  readonly whyTwo: string;
  readonly compactLine: string;
  readonly digestLink: DigestRecurrenceScheduleLink;
  readonly recurrenceLink: DigestRecurrenceScheduleLink;
};

export const DIGEST_RECURRENCE_SCHEDULE_HEADING = "Two different kinds of schedule" as const;

export const DIGEST_RECURRENCE_SCHEDULE_WHY_TWO =
  "Executive digests are the sponsor email cadence for architecture review summaries. Recurrence schedules automate re-review of architecture reviews on a repeating cadence. Both use the word “schedule,” but one sends email and the other starts follow-up reviews — open the peer link when you need the other kind." as const;

export const DIGEST_RECURRENCE_SCHEDULE_COMPACT_LINE =
  "Digest schedule emails sponsors; recurrence schedules re-review architecture reviews — open the other when you need both." as const;

export const DIGEST_RECURRENCE_SCHEDULE_DIGEST_LINK: DigestRecurrenceScheduleLink = {
  id: "digest-executive-schedule",
  label: "Executive digest schedule",
  href: DIGESTS_SCHEDULE_TAB_PATH,
  whenToUse: "Set sponsor email cadence for architecture digests.",
};

export const DIGEST_RECURRENCE_SCHEDULE_RECURRENCE_LINK: DigestRecurrenceScheduleLink = {
  id: "recurrence-schedules",
  label: "Recurrence schedules",
  href: RECURRENCE_SCHEDULES_MANAGE_PATH,
  whenToUse: "Automate repeating re-review of architecture reviews.",
};

/** Full vocabulary model (heading, why-two copy, and deep links). */
export function buildDigestRecurrenceScheduleVocabulary(): DigestRecurrenceScheduleVocabularyModel {
  return {
    heading: DIGEST_RECURRENCE_SCHEDULE_HEADING,
    whyTwo: DIGEST_RECURRENCE_SCHEDULE_WHY_TWO,
    compactLine: DIGEST_RECURRENCE_SCHEDULE_COMPACT_LINE,
    digestLink: DIGEST_RECURRENCE_SCHEDULE_DIGEST_LINK,
    recurrenceLink: DIGEST_RECURRENCE_SCHEDULE_RECURRENCE_LINK,
  };
}

/** Peer deep-link for the surface you are not currently on. */
export function resolveDigestRecurrenceSchedulePeerLink(
  currentSurfaceId: DigestRecurrenceScheduleSurfaceId,
): DigestRecurrenceScheduleLink {
  if (currentSurfaceId === "digest-executive-schedule") {
    return DIGEST_RECURRENCE_SCHEDULE_RECURRENCE_LINK;
  }

  return DIGEST_RECURRENCE_SCHEDULE_DIGEST_LINK;
}
