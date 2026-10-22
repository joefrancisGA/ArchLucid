"use client";

import type { JSX } from "react";

import { PairwiseVocabularyRailFromModel } from "@/components/vocabulary/PairwiseVocabularyRailFromModel";
import {
  buildPlanningReviewsPairwiseRail,
  type PlanningReviewsSurfaceId,
  type PlanningReviewsVocabularyModel,
} from "@/lib/vocabulary/planning-reviews-vocabulary";

export type PlanningReviewsVocabularyRailProps = {
  readonly currentSurfaceId: PlanningReviewsSurfaceId;
  readonly variant?: "compact" | "full";
  readonly className?: string;
  readonly model?: PlanningReviewsVocabularyModel;
};

/**
 * TB-2238 — Compact vocabulary rail between Improvement planning and Architecture reviews.
 * Mount on both hubs so operators do not conflate derived plans with review inventory.
 */
export function PlanningReviewsVocabularyRail(
  props: PlanningReviewsVocabularyRailProps,
): JSX.Element {
  const pairwiseModel =
    props.model !== undefined
      ? {
          heading: props.model.heading,
          whyTwo: props.model.whyTwo,
          compactLine: props.model.compactLine,
          currentLink: props.model.planningLink,
          peerLink: props.model.reviewsLink,
        }
      : buildPlanningReviewsPairwiseRail();

  return (
    <PairwiseVocabularyRailFromModel
      testIdPrefix="planning-reviews-vocabulary"
      currentSurfaceId={props.currentSurfaceId}
      variant={props.variant}
      className={props.className}
      compactLinkPlacement="inline"
      model={pairwiseModel}
    />
  );
}
