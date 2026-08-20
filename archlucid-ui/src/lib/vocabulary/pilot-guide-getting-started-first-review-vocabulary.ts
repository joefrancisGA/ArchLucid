/**
 * TB-2322 — Pilot guide ≠ Getting started ≠ Your first architecture review triad.
 *
 * Why three help surfaces exist:
 * - Pilot guide (`/help/pilot-guide`) prepares an evaluation pilot (workspace
 *   navigation, pilot cadence, how to interpret pilot outputs).
 * - Getting started (`/help/getting-started`) orients on how ArchLucid turns
 *   evidence into findings and governance-ready outputs.
 * - Your first architecture review (`/help/first-architecture-review`) is the
 *   guided path for completing a first review end-to-end.
 *
 * They stay separate because pilot prep is not product orientation, and
 * orientation is not the same task as walking the first-review checklist.
 * Distinct from Getting started ≠ First architecture review pair (TB-2312).
 */

import { FIRST_ARCHITECTURE_REVIEW_HELP_PATH } from "@/lib/first-architecture-review-help-route";
import type { VocabularyPeerLinkFields } from "@/lib/vocabulary/vocabulary-peer-link-fields";
import { GETTING_STARTED_HELP_PATH } from "@/lib/getting-started-help-guide-content";
import { PILOT_GUIDE_HELP_PATH } from "@/lib/pilot-guide-help-guide-content";
import type { VocabularyPeerLinkFields } from "@/lib/vocabulary/vocabulary-peer-link-fields";

export type PilotGuideGettingStartedFirstReviewSurfaceId =
  | "pilot-guide"
  | "getting-started"
  | "first-architecture-review";

export type PilotGuideGettingStartedFirstReviewLink = VocabularyPeerLinkFields & {
  readonly id: PilotGuideGettingStartedFirstReviewSurfaceId;
  readonly label: string;
  readonly href: string;
  readonly whenToUse: string;
};

export type PilotGuideGettingStartedFirstReviewVocabularyModel = {
  readonly heading: string;
  readonly whyThree: string;
  readonly compactLine: string;
  readonly pilotGuideLink: PilotGuideGettingStartedFirstReviewLink;
  readonly gettingStartedLink: PilotGuideGettingStartedFirstReviewLink;
  readonly firstArchitectureReviewLink: PilotGuideGettingStartedFirstReviewLink;
};

export const PILOT_GUIDE_GETTING_STARTED_FIRST_REVIEW_HEADING =
  "Pilot guide, Getting started, and Your first architecture review serve different purposes" as const;

export const PILOT_GUIDE_GETTING_STARTED_FIRST_REVIEW_WHY_THREE =
  "Pilot guide prepares an evaluation pilot — navigation, cadence, and how to interpret pilot outputs. Getting started orients you on how ArchLucid turns evidence into findings and governance-ready outputs. Your first architecture review is the guided path for completing a first review end-to-end. Pilot prep is not product orientation, and orientation is not the first-review checklist." as const;

export const PILOT_GUIDE_GETTING_STARTED_FIRST_REVIEW_COMPACT_LINE =
  "Pilot guide is pilot prep; Getting started is product orientation; Your first architecture review is the guided first-review path." as const;

export const PILOT_GUIDE_GETTING_STARTED_FIRST_REVIEW_PILOT_GUIDE_LINK: PilotGuideGettingStartedFirstReviewLink =
  {
    id: "pilot-guide",
    label: "Pilot guide",
    href: PILOT_GUIDE_HELP_PATH,
    whenToUse: "Prepare an evaluation pilot and interpret pilot outputs.",
  };

export const PILOT_GUIDE_GETTING_STARTED_FIRST_REVIEW_GETTING_STARTED_LINK: PilotGuideGettingStartedFirstReviewLink =
  {
    id: "getting-started",
    label: "Getting started",
    href: GETTING_STARTED_HELP_PATH,
    whenToUse: "Learn how ArchLucid reviews work before you start.",
  };

export const PILOT_GUIDE_GETTING_STARTED_FIRST_REVIEW_FIRST_REVIEW_LINK: PilotGuideGettingStartedFirstReviewLink =
  {
    id: "first-architecture-review",
    label: "Your first architecture review",
    href: FIRST_ARCHITECTURE_REVIEW_HELP_PATH,
    whenToUse: "Follow the guided path to complete your first review.",
  };

const ALL_LINKS: readonly PilotGuideGettingStartedFirstReviewLink[] = [
  PILOT_GUIDE_GETTING_STARTED_FIRST_REVIEW_PILOT_GUIDE_LINK,
  PILOT_GUIDE_GETTING_STARTED_FIRST_REVIEW_GETTING_STARTED_LINK,
  PILOT_GUIDE_GETTING_STARTED_FIRST_REVIEW_FIRST_REVIEW_LINK,
];

/** Full triad vocabulary model (heading, why-three, and deep links). */
export function buildPilotGuideGettingStartedFirstReviewVocabulary(): PilotGuideGettingStartedFirstReviewVocabularyModel {
  return {
    heading: PILOT_GUIDE_GETTING_STARTED_FIRST_REVIEW_HEADING,
    whyThree: PILOT_GUIDE_GETTING_STARTED_FIRST_REVIEW_WHY_THREE,
    compactLine: PILOT_GUIDE_GETTING_STARTED_FIRST_REVIEW_COMPACT_LINE,
    pilotGuideLink: PILOT_GUIDE_GETTING_STARTED_FIRST_REVIEW_PILOT_GUIDE_LINK,
    gettingStartedLink: PILOT_GUIDE_GETTING_STARTED_FIRST_REVIEW_GETTING_STARTED_LINK,
    firstArchitectureReviewLink: PILOT_GUIDE_GETTING_STARTED_FIRST_REVIEW_FIRST_REVIEW_LINK,
  };
}

/** Resolve the link for the current surface (null when unknown). */
export function resolvePilotGuideGettingStartedFirstReviewLink(
  surfaceId: PilotGuideGettingStartedFirstReviewSurfaceId,
): PilotGuideGettingStartedFirstReviewLink | null {
  const match = ALL_LINKS.find((link) => link.id === surfaceId);

  if (match === undefined) {
    return null;
  }

  return match;
}

/** Peer deep-links for the help topics you are not currently on. */
export function resolvePilotGuideGettingStartedFirstReviewPeerLinks(
  currentSurfaceId: PilotGuideGettingStartedFirstReviewSurfaceId,
): readonly PilotGuideGettingStartedFirstReviewLink[] {
  return ALL_LINKS.filter((link) => link.id !== currentSurfaceId);
}
