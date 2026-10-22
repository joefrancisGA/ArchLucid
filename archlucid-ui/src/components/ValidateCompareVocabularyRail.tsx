"use client";

import type { JSX } from "react";

import { PairwiseVocabularyRailFromModel } from "@/components/vocabulary/PairwiseVocabularyRailFromModel";
import {
  buildValidateComparePairwiseRail,
  type ValidateCompareSurfaceId,
  type ValidateCompareVocabularyModel,
} from "@/lib/vocabulary/validate-compare-vocabulary";

export type ValidateCompareVocabularyRailProps = {
  readonly currentSurfaceId: ValidateCompareSurfaceId;
  readonly variant?: "compact" | "full";
  readonly className?: string;
  readonly model?: ValidateCompareVocabularyModel;
};

/**
 * TB-2240 — Compact vocabulary rail between Validate review and Compare two reviews.
 * Mount on both hubs so operators do not conflate single-package validation with pairwise diff.
 */
export function ValidateCompareVocabularyRail(props: ValidateCompareVocabularyRailProps): JSX.Element {
  const pairwiseModel =
    props.model !== undefined
      ? {
          heading: props.model.heading,
          whyTwo: props.model.whyTwo,
          compactLine: props.model.compactLine,
          currentLink: props.model.validateLink,
          peerLink: props.model.compareLink,
        }
      : buildValidateComparePairwiseRail();

  return (
    <PairwiseVocabularyRailFromModel
      testIdPrefix="validate-compare-vocabulary"
      currentSurfaceId={props.currentSurfaceId}
      variant={props.variant}
      className={props.className}
      compactLinkPlacement="inline"
      model={pairwiseModel}
    />
  );
}
