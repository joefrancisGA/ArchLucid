"use client";

import type { JSX } from "react";

import { VocabularyRail } from "@/components/vocabulary/VocabularyRail";
import {
  buildDigestsRelatedSurfaceLinks,
  DIGESTS_RELATED_SURFACES_COMPACT_LINE,
  DIGESTS_RELATED_SURFACES_HEADING,
  DIGESTS_RELATED_SURFACES_WHY,
  type DigestsRelatedSurfaceLink,
} from "@/lib/vocabulary/digests-related-surfaces-vocabulary";

export type DigestsRelatedSurfacesRailProps = {
  /** Compact one-line strip (default) vs the fuller explanation. */
  readonly variant?: "compact" | "full";
  readonly className?: string;
  /** Optional override for tests; defaults to {@link buildDigestsRelatedSurfaceLinks}. */
  readonly links?: readonly DigestsRelatedSurfaceLink[];
};

/**
 * Single way-out line for the Digests hub, replacing the four stacked vocabulary rails the
 * Get started tab used to mount. See `digests-related-surfaces-vocabulary` for why.
 */
export function DigestsRelatedSurfacesRail(props: DigestsRelatedSurfacesRailProps): JSX.Element {
  const links: readonly DigestsRelatedSurfaceLink[] = props.links ?? buildDigestsRelatedSurfaceLinks();

  return (
    <VocabularyRail
      testIdPrefix="digests-related-surfaces"
      currentSurfaceId="digests"
      variant={props.variant}
      className={props.className}
      compactLine={DIGESTS_RELATED_SURFACES_COMPACT_LINE}
      compactLinkPlacement="trailing"
      heading={DIGESTS_RELATED_SURFACES_HEADING}
      whyTwo={DIGESTS_RELATED_SURFACES_WHY}
      currentLabel={null}
      links={links.map((link) => ({
        href: link.href,
        label: link.label,
        testIdSuffix: `peer-${link.id}`,
      }))}
    />
  );
}
