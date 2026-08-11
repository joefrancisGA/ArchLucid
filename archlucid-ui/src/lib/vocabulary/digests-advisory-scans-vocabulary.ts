/**
 * TB-2314 — Digests ≠ Advisory scans vocabulary rail.
 *
 * Why two surfaces exist:
 * - Digests (`/architecture/digests`) are the content cadence for architecture
 *   summary emails, browse, subscriptions, and executive schedule.
 * - Advisory scans (`/governance/advisory-scans`) generate advisory findings and
 *   schedule recurring advisory scans for architecture packages.
 *
 * They stay separate because digest content cadence is not advisory scan
 * production. Distinct from Digests browse/schedule/subscriptions triad
 * (TB-225x family) and Advisory results ≠ schedules (TB-2280).
 */

import { ADVISORY_SCANS_HREF } from "@/lib/advisory-scans-route";
import { DIGESTS_HUB_PATH } from "@/lib/digests-route-paths";

export type DigestsAdvisoryScansSurfaceId = "digests" | "advisory-scans";

export type DigestsAdvisoryScansLink = {
  readonly id: DigestsAdvisoryScansSurfaceId;
  readonly label: string;
  readonly href: string;
  readonly whenToUse: string;
};

export type DigestsAdvisoryScansVocabularyModel = {
  readonly heading: string;
  readonly whyTwo: string;
  readonly compactLine: string;
  readonly digestsLink: DigestsAdvisoryScansLink;
  readonly advisoryScansLink: DigestsAdvisoryScansLink;
};

export const DIGESTS_ADVISORY_SCANS_HEADING =
  "Digests and Advisory scans do different jobs" as const;

export const DIGESTS_ADVISORY_SCANS_WHY_TWO =
  "Digests are the content cadence for architecture summary emails, browse, subscriptions, and executive schedule. Advisory scans generate advisory findings and schedule recurring scans for architecture packages. Browsing digest cadence is not the same as running advisory scans." as const;

export const DIGESTS_ADVISORY_SCANS_COMPACT_LINE =
  "Digests are summary content cadence; Advisory scans produce advisory findings — open the other when you need that job." as const;

export const DIGESTS_ADVISORY_SCANS_DIGESTS_LINK: DigestsAdvisoryScansLink = {
  id: "digests",
  label: "Digests",
  href: DIGESTS_HUB_PATH,
  whenToUse: "Browse, subscribe, and schedule architecture digest content cadence.",
};

export const DIGESTS_ADVISORY_SCANS_ADVISORY_LINK: DigestsAdvisoryScansLink = {
  id: "advisory-scans",
  label: "Advisory scans",
  href: ADVISORY_SCANS_HREF,
  whenToUse: "Generate advisory findings and schedule recurring advisory scans.",
};

/** Full vocabulary model (heading, why-two copy, and deep links). */
export function buildDigestsAdvisoryScansVocabulary(): DigestsAdvisoryScansVocabularyModel {
  return {
    heading: DIGESTS_ADVISORY_SCANS_HEADING,
    whyTwo: DIGESTS_ADVISORY_SCANS_WHY_TWO,
    compactLine: DIGESTS_ADVISORY_SCANS_COMPACT_LINE,
    digestsLink: DIGESTS_ADVISORY_SCANS_DIGESTS_LINK,
    advisoryScansLink: DIGESTS_ADVISORY_SCANS_ADVISORY_LINK,
  };
}

/** Peer deep-link for the surface you are not currently on. */
export function resolveDigestsAdvisoryScansPeerLink(
  currentSurfaceId: DigestsAdvisoryScansSurfaceId,
): DigestsAdvisoryScansLink {
  if (currentSurfaceId === "digests") {
    return DIGESTS_ADVISORY_SCANS_ADVISORY_LINK;
  }

  return DIGESTS_ADVISORY_SCANS_DIGESTS_LINK;
}
