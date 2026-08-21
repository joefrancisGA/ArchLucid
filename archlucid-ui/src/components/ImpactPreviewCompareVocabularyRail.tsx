"use client";

import type { JSX } from "react";

import { PairwiseVocabularyRailFromModel } from "@/components/vocabulary/PairwiseVocabularyRailFromModel";
import {
  buildImpactPreviewComparePairwiseRail,
  type ImpactPreviewCompareSurfaceId,
  type ImpactPreviewCompareVocabularyModel,
} from "@/lib/vocabulary/impact-preview-compare-vocabulary";

export type ImpactPreviewCompareVocabularyRailProps = {
  readonly currentSurfaceId: ImpactPreviewCompareSurfaceId;
  readonly variant?: "compact" | "full";
  readonly className?: string;
  readonly model?: ImpactPreviewCompareVocabularyModel;
};

/**
 * TB-2250 — Compact vocabulary rail between Impact preview and Compare two reviews.
 * Mount on both hubs so operators do not conflate change simulation with pairwise diff.
 * Distinct from ValidateCompareVocabularyRail (TB-2240).
 */
export function ImpactPreviewCompareVocabularyRail(
  props: ImpactPreviewCompareVocabularyRailProps,
): JSX.Element {
  const pairwiseModel =
    props.model !== undefined
      ? {
          heading: props.model.heading,
          whyTwo: props.model.whyTwo,
          compactLine: props.model.compactLine,
          currentLink: props.model.impactPreviewLink,
          peerLink: props.model.compareLink,
        }
      : buildImpactPreviewComparePairwiseRail();

  return (
    <PairwiseVocabularyRailFromModel
      testIdPrefix="impact-preview-compare-vocabulary"
      currentSurfaceId={props.currentSurfaceId}
      variant={props.variant}
      className={props.className}
      compactLinkPlacement="inline"
      model={pairwiseModel}
    />
  );
}
