"use client";

import type { JSX } from "react";

import { PairwiseVocabularyRailFromModel } from "@/components/vocabulary/PairwiseVocabularyRailFromModel";
import {
  buildPatternLibraryPolicyPacksPairwiseRail,
  type PatternLibraryPolicyPacksSurfaceId,
  type PatternLibraryPolicyPacksVocabularyModel,
} from "@/lib/vocabulary/pattern-library-policy-packs-vocabulary";

export type PatternLibraryPolicyPacksVocabularyRailProps = {
  readonly currentSurfaceId: PatternLibraryPolicyPacksSurfaceId;
  readonly variant?: "compact" | "full";
  readonly className?: string;
  readonly model?: PatternLibraryPolicyPacksVocabularyModel;
};

/** TB-2292 — Pattern library catalog vs enforceable Policy packs. */
export function PatternLibraryPolicyPacksVocabularyRail(
  props: PatternLibraryPolicyPacksVocabularyRailProps,
): JSX.Element {
  const pairwiseModel =
    props.model !== undefined
      ? {
          heading: props.model.heading,
          whyTwo: props.model.whyTwo,
          compactLine: props.model.compactLine,
          currentLink: props.model.patternLibraryLink,
          peerLink: props.model.policyPacksLink,
        }
      : buildPatternLibraryPolicyPacksPairwiseRail();

  return (
    <PairwiseVocabularyRailFromModel
      testIdPrefix="pattern-library-policy-packs-vocabulary"
      currentSurfaceId={props.currentSurfaceId}
      variant={props.variant}
      className={props.className}
      compactLinkPlacement="inline"
      model={pairwiseModel}
    />
  );
}
