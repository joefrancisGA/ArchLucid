"use client";

import type { JSX } from "react";

import {
  buildFirstReviewGuideFirstArchitectureReviewVocabulary,
  resolveFirstReviewGuideFirstArchitectureReviewPeerLink,
  type FirstReviewGuideFirstArchitectureReviewSurfaceId,
  type FirstReviewGuideFirstArchitectureReviewVocabularyModel,
} from "@/lib/vocabulary/first-review-guide-first-architecture-review-vocabulary";
import { VocabularyRail } from "@/components/vocabulary/VocabularyRail";

export type FirstReviewGuideFirstArchitectureReviewVocabularyRailProps = {
  /** Surface hosting the strip — marks the current job and links to the peer. */
  readonly currentSurfaceId: FirstReviewGuideFirstArchitectureReviewSurfaceId;
  /** Compact one-line strip (default) vs fuller why-two explanation. */
  readonly variant?: "compact" | "full";
  readonly className?: string;
  /** Optional override for tests; defaults to {@link buildFirstReviewGuideFirstArchitectureReviewVocabulary}. */
  readonly model?: FirstReviewGuideFirstArchitectureReviewVocabularyModel;
};

/**
 * TB-2323 — Compact vocabulary rail between First review guide hub and first architecture review help.
 * Mount on FirstReviewGuidePageClient and HelpCorePilotGuideView.
 */
export function FirstReviewGuideFirstArchitectureReviewVocabularyRail(
  props: FirstReviewGuideFirstArchitectureReviewVocabularyRailProps,
): JSX.Element {
  const model = props.model ?? buildFirstReviewGuideFirstArchitectureReviewVocabulary();
  const peer = resolveFirstReviewGuideFirstArchitectureReviewPeerLink(props.currentSurfaceId);
  const currentLink =
    props.currentSurfaceId === "first-review-guide"
      ? model.firstReviewGuideLink
      : model.firstArchitectureReviewLink;

  return (
    <VocabularyRail
      testIdPrefix="first-review-guide-first-architecture-review-vocabulary"
      currentSurfaceId={props.currentSurfaceId}
      variant={props.variant}
      className={props.className}
      compactLine={model.compactLine}
      heading={model.heading}
      whyTwo={model.whyTwo}
      currentLabel={currentLink.label}
      links={[{ ...peer, testIdSuffix: "peer-link" }]}
    />
  );
}
