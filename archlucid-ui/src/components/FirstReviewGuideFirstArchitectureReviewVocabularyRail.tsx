"use client";

import type { JSX } from "react";

import { PairwiseVocabularyRailFromModel } from "@/components/vocabulary/PairwiseVocabularyRailFromModel";
import {
  buildFirstReviewGuideFirstArchitectureReviewPairwiseRail,
  type FirstReviewGuideFirstArchitectureReviewSurfaceId,
  type FirstReviewGuideFirstArchitectureReviewVocabularyModel,
} from "@/lib/vocabulary/first-review-guide-first-architecture-review-vocabulary";

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
  const pairwiseModel =
    props.model !== undefined
      ? {
          heading: props.model.heading,
          whyTwo: props.model.whyTwo,
          compactLine: props.model.compactLine,
          currentLink: props.model.firstReviewGuideLink,
          peerLink: props.model.firstArchitectureReviewLink,
        }
      : buildFirstReviewGuideFirstArchitectureReviewPairwiseRail();

  return (
    <PairwiseVocabularyRailFromModel
      testIdPrefix="first-review-guide-first-architecture-review-vocabulary"
      currentSurfaceId={props.currentSurfaceId}
      variant={props.variant}
      className={props.className}
      compactLinkPlacement="inline"
      model={pairwiseModel}
    />
  );
}
