"use client";

import type { JSX } from "react";

import {
  buildPlanningPlanDetailHubVocabulary,
  resolvePlanningPlanDetailHubPeerLink,
  type PlanningPlanDetailHubSurfaceId,
  type PlanningPlanDetailHubVocabularyModel,
} from "@/lib/vocabulary/planning-plan-detail-hub-vocabulary";
import { VocabularyRail } from "@/components/vocabulary/VocabularyRail";

export type PlanningPlanDetailHubVocabularyRailProps = {
  /** Surface hosting the strip — marks hub vs plan detail and links to the peer. */
  readonly currentSurfaceId: PlanningPlanDetailHubSurfaceId;
  /** Compact one-line strip (default) vs fuller why-two explanation. */
  readonly variant?: "compact" | "full";
  readonly className?: string;
  /** Optional override for tests; defaults to {@link buildPlanningPlanDetailHubVocabulary}. */
  readonly model?: PlanningPlanDetailHubVocabularyModel;
};

/**
 * TB-2282 — Compact vocabulary rail between Improvement planning hub and Plan detail.
 * Mount on both surfaces so operators do not conflate the hub with one plan.
 * Distinct from Planning ≠ reviews (TB-2238).
 */
export function PlanningPlanDetailHubVocabularyRail(
  props: PlanningPlanDetailHubVocabularyRailProps,
): JSX.Element {
  const model = props.model ?? buildPlanningPlanDetailHubVocabulary();
  const peer = resolvePlanningPlanDetailHubPeerLink(props.currentSurfaceId);
  const currentLink =
    props.currentSurfaceId === "improvement-planning"
      ? model.planningHubLink
      : model.planDetailLink;

  return (
    <VocabularyRail
      testIdPrefix="planning-plan-detail-hub-vocabulary"
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
