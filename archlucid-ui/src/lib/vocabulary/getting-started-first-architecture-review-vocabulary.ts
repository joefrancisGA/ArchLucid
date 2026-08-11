/**
 * TB-2312 — Getting started ≠ First architecture review vocabulary rail.
 *
 * Why two surfaces exist:
 * - Getting started (`/help/getting-started`) orients architects and sponsors on
 *   how ArchLucid turns evidence into findings and governance-ready outputs.
 * - Your first architecture review (`/help/first-architecture-review`) is the
 *   action-oriented guided path for completing a first review end-to-end.
 *
 * They stay separate because product orientation is not the same job as walking
 * the first-review checklist and stepper.
 */

import { FIRST_ARCHITECTURE_REVIEW_HELP_PATH } from "@/lib/first-architecture-review-help-route";
import { GETTING_STARTED_HELP_PATH } from "@/lib/getting-started-help-guide-content";

export type GettingStartedFirstArchitectureReviewSurfaceId =
  | "getting-started"
  | "first-architecture-review";

export type GettingStartedFirstArchitectureReviewLink = {
  readonly id: GettingStartedFirstArchitectureReviewSurfaceId;
  readonly label: string;
  readonly href: string;
  readonly whenToUse: string;
};

export type GettingStartedFirstArchitectureReviewVocabularyModel = {
  readonly heading: string;
  readonly whyTwo: string;
  readonly compactLine: string;
  readonly gettingStartedLink: GettingStartedFirstArchitectureReviewLink;
  readonly firstArchitectureReviewLink: GettingStartedFirstArchitectureReviewLink;
};

export const GETTING_STARTED_FIRST_ARCHITECTURE_REVIEW_HEADING =
  "Getting started and Your first architecture review do different jobs" as const;

export const GETTING_STARTED_FIRST_ARCHITECTURE_REVIEW_WHY_TWO =
  "Getting started orients you on how ArchLucid turns architecture evidence into findings, decisions, and governance-ready outputs. Your first architecture review is the guided, action-oriented path for completing a first review end-to-end. Reading product orientation is not the same as walking the first-review checklist." as const;

export const GETTING_STARTED_FIRST_ARCHITECTURE_REVIEW_COMPACT_LINE =
  "Getting started is product orientation; Your first architecture review is the guided first-review path — open the other when you need that job." as const;

export const GETTING_STARTED_FIRST_ARCHITECTURE_REVIEW_GETTING_STARTED_LINK: GettingStartedFirstArchitectureReviewLink =
  {
    id: "getting-started",
    label: "Getting started",
    href: GETTING_STARTED_HELP_PATH,
    whenToUse: "Learn how ArchLucid reviews work before you start.",
  };

export const GETTING_STARTED_FIRST_ARCHITECTURE_REVIEW_FIRST_REVIEW_LINK: GettingStartedFirstArchitectureReviewLink =
  {
    id: "first-architecture-review",
    label: "Your first architecture review",
    href: FIRST_ARCHITECTURE_REVIEW_HELP_PATH,
    whenToUse: "Follow the guided path to complete your first review.",
  };

/** Full vocabulary model (heading, why-two copy, and deep links). */
export function buildGettingStartedFirstArchitectureReviewVocabulary(): GettingStartedFirstArchitectureReviewVocabularyModel {
  return {
    heading: GETTING_STARTED_FIRST_ARCHITECTURE_REVIEW_HEADING,
    whyTwo: GETTING_STARTED_FIRST_ARCHITECTURE_REVIEW_WHY_TWO,
    compactLine: GETTING_STARTED_FIRST_ARCHITECTURE_REVIEW_COMPACT_LINE,
    gettingStartedLink: GETTING_STARTED_FIRST_ARCHITECTURE_REVIEW_GETTING_STARTED_LINK,
    firstArchitectureReviewLink: GETTING_STARTED_FIRST_ARCHITECTURE_REVIEW_FIRST_REVIEW_LINK,
  };
}

/** Peer deep-link for the surface you are not currently on. */
export function resolveGettingStartedFirstArchitectureReviewPeerLink(
  currentSurfaceId: GettingStartedFirstArchitectureReviewSurfaceId,
): GettingStartedFirstArchitectureReviewLink {
  if (currentSurfaceId === "getting-started") {
    return GETTING_STARTED_FIRST_ARCHITECTURE_REVIEW_FIRST_REVIEW_LINK;
  }

  return GETTING_STARTED_FIRST_ARCHITECTURE_REVIEW_GETTING_STARTED_LINK;
}
