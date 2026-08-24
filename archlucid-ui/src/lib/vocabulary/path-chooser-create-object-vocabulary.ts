/**
 * TB-2260 — Path-chooser ≠ architecture drafts ≠ Start a review vocabulary triad.
 *
 * Three related create / choose surfaces:
 * - Path chooser help (`/help/choose-your-next-step`) orients procurement and
 *   evaluators on which product area to open next.
 * - Architecture drafts (`/architecture/architectures`) is the draft registry
 *   before a review starts.
 * - Start a review (`/architecture/reviews/new`) creates a new architecture
 *   review that becomes an architecture package.
 *
 * They stay separate because choosing a next step is not saving a draft, and
 * drafts are not the same task as starting a review.
 */

import {
  ARCHITECTURES_LIST_PATH,
  REVIEWS_NEW_PATH,
} from "@/lib/architecture/architecture-routes";
import { START_REVIEW_LABEL } from "@/lib/architecture/architecture-workflow-labels";
import { PATH_CHOOSER_HELP_PATH } from "@/lib/path-chooser-help-route";
import type { VocabularyRailLink } from "@/components/vocabulary/vocabulary-rail-types";

export type PathChooserCreateObjectSurfaceId =
  | "path-chooser"
  | "architecture-drafts"
  | "reviews-new";

export type PathChooserCreateObjectLink = {
  readonly id: PathChooserCreateObjectSurfaceId;
  readonly label: string;
  readonly href: string;
  readonly whenToUse: string;
};

export type PathChooserCreateObjectVocabularyModel = {
  readonly heading: string;
  readonly whyThree: string;
  readonly compactLine: string;
  readonly pathChooserLink: PathChooserCreateObjectLink;
  readonly draftsLink: PathChooserCreateObjectLink;
  readonly reviewsNewLink: PathChooserCreateObjectLink;
};

export const PATH_CHOOSER_CREATE_OBJECT_HEADING =
  "Path chooser, drafts, and Start review serve three different purposes" as const;

export const PATH_CHOOSER_CREATE_OBJECT_WHY_THREE =
  "Choose your next step orients which product area to open. Architecture drafts save work before a review starts. Start review creates a new architecture review that becomes an architecture package. Choosing a path is not saving a draft — and a draft is not the same as starting a review." as const;

export const PATH_CHOOSER_CREATE_OBJECT_COMPACT_LINE =
  "Path chooser orients next steps; drafts save pre-review work; Start review creates a review." as const;

/** Inline compact-line anchor for the path-chooser help deep link. */
export const PATH_CHOOSER_CREATE_OBJECT_PATH_CHOOSER_COMPACT_ANCHOR = "Path chooser" as const;

/** Inline compact-line anchor for the architecture drafts list. */
export const PATH_CHOOSER_CREATE_OBJECT_DRAFTS_COMPACT_ANCHOR = "drafts" as const;

/** Inline compact-line anchor for the Start review hub. */
export const PATH_CHOOSER_CREATE_OBJECT_REVIEWS_NEW_COMPACT_ANCHOR = "Start review" as const;

/** Short tooltip shown when hovering the Path chooser inline link. */
export const PATH_CHOOSER_CREATE_OBJECT_PATH_CHOOSER_TOOLTIP =
  "Pick which product area to open next — evaluation, pilot recovery, procurement, sponsor output, or engineering support." as const;

export const PATH_CHOOSER_CREATE_OBJECT_PATH_CHOOSER_LINK: PathChooserCreateObjectLink = {
  id: "path-chooser",
  label: "Choose your next step",
  href: PATH_CHOOSER_HELP_PATH,
  whenToUse: "Pick which product area to open next (procurement and evaluator orientation).",
};

export const PATH_CHOOSER_CREATE_OBJECT_DRAFTS_LINK: PathChooserCreateObjectLink = {
  id: "architecture-drafts",
  label: "Architecture drafts",
  href: ARCHITECTURES_LIST_PATH,
  whenToUse: "Open or create architecture drafts before starting a review.",
};

export const PATH_CHOOSER_CREATE_OBJECT_REVIEWS_NEW_LINK: PathChooserCreateObjectLink = {
  id: "reviews-new",
  label: START_REVIEW_LABEL,
  href: REVIEWS_NEW_PATH,
  whenToUse: "Create a new architecture review that becomes an architecture package.",
};

const ALL_LINKS: readonly PathChooserCreateObjectLink[] = [
  PATH_CHOOSER_CREATE_OBJECT_PATH_CHOOSER_LINK,
  PATH_CHOOSER_CREATE_OBJECT_DRAFTS_LINK,
  PATH_CHOOSER_CREATE_OBJECT_REVIEWS_NEW_LINK,
];

/** Full triad vocabulary model (heading, why-three, and deep links). */
export function buildPathChooserCreateObjectVocabulary(): PathChooserCreateObjectVocabularyModel {
  return {
    heading: PATH_CHOOSER_CREATE_OBJECT_HEADING,
    whyThree: PATH_CHOOSER_CREATE_OBJECT_WHY_THREE,
    compactLine: PATH_CHOOSER_CREATE_OBJECT_COMPACT_LINE,
    pathChooserLink: PATH_CHOOSER_CREATE_OBJECT_PATH_CHOOSER_LINK,
    draftsLink: PATH_CHOOSER_CREATE_OBJECT_DRAFTS_LINK,
    reviewsNewLink: PATH_CHOOSER_CREATE_OBJECT_REVIEWS_NEW_LINK,
  };
}

/** Resolve the link for the current surface (null when unknown). */
export function resolvePathChooserCreateObjectLink(
  surfaceId: PathChooserCreateObjectSurfaceId,
): PathChooserCreateObjectLink | null {
  const match = ALL_LINKS.find((link) => link.id === surfaceId);

  if (match === undefined) {
    return null;
  }

  return match;
}

/** Peer deep-links for the surfaces you are not currently on. */
export function resolvePathChooserCreateObjectPeerLinks(
  currentSurfaceId: PathChooserCreateObjectSurfaceId,
): readonly PathChooserCreateObjectLink[] {
  return ALL_LINKS.filter((link) => link.id !== currentSurfaceId);
}

function resolvePathChooserCreateObjectCompactAnchor(
  surfaceId: PathChooserCreateObjectSurfaceId,
): string | undefined {
  switch (surfaceId) {
    case "path-chooser":
      return PATH_CHOOSER_CREATE_OBJECT_PATH_CHOOSER_COMPACT_ANCHOR;
    case "architecture-drafts":
      return PATH_CHOOSER_CREATE_OBJECT_DRAFTS_COMPACT_ANCHOR;
    case "reviews-new":
      return PATH_CHOOSER_CREATE_OBJECT_REVIEWS_NEW_COMPACT_ANCHOR;
    default: {
      const exhaustive: never = surfaceId;
      throw new Error(`Unhandled path-chooser create-object surface: ${String(exhaustive)}`);
    }
  }
}

/** Compact {@link VocabularyRail} peer links with inline anchors and a path-chooser tooltip. */
export function buildPathChooserCreateObjectVocabularyRailLinks(
  currentSurfaceId: PathChooserCreateObjectSurfaceId,
): readonly VocabularyRailLink[] {
  return resolvePathChooserCreateObjectPeerLinks(currentSurfaceId).map((peer) => ({
    href: peer.href,
    label: peer.label,
    testIdSuffix: `peer-${peer.id}`,
    compactLineAnchor: resolvePathChooserCreateObjectCompactAnchor(peer.id),
    tooltip:
      peer.id === "path-chooser" ? PATH_CHOOSER_CREATE_OBJECT_PATH_CHOOSER_TOOLTIP : undefined,
    tooltipTitle:
      peer.id === "path-chooser" ? PATH_CHOOSER_CREATE_OBJECT_PATH_CHOOSER_COMPACT_ANCHOR : undefined,
  }));
}
