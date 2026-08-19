"use client";

import type { JSX } from "react";

import {
  buildPlanningReviewsVocabulary,
  resolvePlanningReviewsPeerLink,
  type PlanningReviewsSurfaceId,
  type PlanningReviewsVocabularyModel,
} from "@/lib/vocabulary/planning-reviews-vocabulary";
import { VocabularyRail } from "@/components/vocabulary/VocabularyRail";

export type PlanningReviewsVocabularyRailProps = {
  /** Surface hosting the strip — marks the current job and links to the peer. */
  readonly currentSurfaceId: PlanningReviewsSurfaceId;
  /** Compact one-line strip (default) vs fuller why-two explanation. */
  readonly variant?: "compact" | "full";
  readonly className?: string;
  /** Optional override for tests; defaults to {@link buildPlanningReviewsVocabulary}. */
  readonly model?: PlanningReviewsVocabularyModel;
};

/**
 * TB-2238 — Compact vocabulary rail between Improvement planning and Architecture reviews.
 * Mount on both hubs so operators do not conflate derived plans with review inventory.
 */
export function PlanningReviewsVocabularyRail(
  props: PlanningReviewsVocabularyRailProps,
): JSX.Element {
  const model = props.model ?? buildPlanningReviewsVocabulary();
  const peer = resolvePlanningReviewsPeerLink(props.currentSurfaceId);
  const currentLink =
    props.currentSurfaceId === "improvement-planning"
      ? model.planningLink
      : model.reviewsLink;

  return (
    <VocabularyRail
      testIdPrefix="planning-reviews-vocabulary"
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
