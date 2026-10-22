"use client";

import type { JSX } from "react";

import { PairwiseVocabularyRailFromModel } from "@/components/vocabulary/PairwiseVocabularyRailFromModel";
import {
  buildGettingStartedFirstArchitectureReviewPairwiseRail,
  type GettingStartedFirstArchitectureReviewSurfaceId,
  type GettingStartedFirstArchitectureReviewVocabularyModel,
} from "@/lib/vocabulary/getting-started-first-architecture-review-vocabulary";

export type GettingStartedFirstArchitectureReviewVocabularyRailProps = {
  readonly currentSurfaceId: GettingStartedFirstArchitectureReviewSurfaceId;
  readonly variant?: "compact" | "full";
  readonly className?: string;
  readonly model?: GettingStartedFirstArchitectureReviewVocabularyModel;
};

/** TB-2312 — Getting started orientation vs first architecture review guided path. */
export function GettingStartedFirstArchitectureReviewVocabularyRail(
  props: GettingStartedFirstArchitectureReviewVocabularyRailProps,
): JSX.Element {
  const pairwiseModel =
    props.model !== undefined
      ? {
          heading: props.model.heading,
          whyTwo: props.model.whyTwo,
          compactLine: props.model.compactLine,
          currentLink: props.model.gettingStartedLink,
          peerLink: props.model.firstArchitectureReviewLink,
        }
      : buildGettingStartedFirstArchitectureReviewPairwiseRail();

  return (
    <PairwiseVocabularyRailFromModel
      testIdPrefix="getting-started-first-architecture-review-vocabulary"
      currentSurfaceId={props.currentSurfaceId}
      variant={props.variant}
      className={props.className}
      compactLinkPlacement="inline"
      model={pairwiseModel}
    />
  );
}
