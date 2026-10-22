"use client";

import type { JSX } from "react";

import { PairwiseVocabularyRailFromModel } from "@/components/vocabulary/PairwiseVocabularyRailFromModel";
import {
  buildDecisionRegisterFindingsPairwiseRail,
  type DecisionRegisterFindingsSurfaceId,
  type DecisionRegisterFindingsVocabularyModel,
} from "@/lib/vocabulary/decision-register-findings-vocabulary";

export type DecisionRegisterFindingsVocabularyRailProps = {
  readonly currentSurfaceId: DecisionRegisterFindingsSurfaceId;
  readonly variant?: "compact" | "full";
  readonly className?: string;
  readonly model?: DecisionRegisterFindingsVocabularyModel;
};

/**
 * TB-2291 — Compact vocabulary rail between Decision register and Findings queue.
 * Always-on peer rail (distinct from empty-state teaching TB-2263).
 */
export function DecisionRegisterFindingsVocabularyRail(
  props: DecisionRegisterFindingsVocabularyRailProps,
): JSX.Element {
  const pairwiseModel =
    props.model !== undefined
      ? {
          heading: props.model.heading,
          whyTwo: props.model.whyTwo,
          compactLine: props.model.compactLine,
          currentLink: props.model.decisionRegisterLink,
          peerLink: props.model.findingsQueueLink,
        }
      : buildDecisionRegisterFindingsPairwiseRail();

  return (
    <PairwiseVocabularyRailFromModel
      testIdPrefix="decision-register-findings-vocabulary"
      currentSurfaceId={props.currentSurfaceId}
      variant={props.variant}
      className={props.className}
      compactLinkPlacement="inline"
      model={pairwiseModel}
    />
  );
}
