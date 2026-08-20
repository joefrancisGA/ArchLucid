"use client";

import type { JSX } from "react";

import {
  buildDecisionRegisterFindingsVocabulary,
  resolveDecisionRegisterFindingsPeerLink,
  type DecisionRegisterFindingsSurfaceId,
  type DecisionRegisterFindingsVocabularyModel,
} from "@/lib/vocabulary/decision-register-findings-vocabulary";
import { VocabularyRail } from "@/components/vocabulary/VocabularyRail";

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
  const model = props.model ?? buildDecisionRegisterFindingsVocabulary();
  const peer = resolveDecisionRegisterFindingsPeerLink(props.currentSurfaceId);
  const currentLink =
    props.currentSurfaceId === "decision-register"
      ? model.decisionRegisterLink
      : model.findingsQueueLink;

  return (
    <VocabularyRail
      testIdPrefix="decision-register-findings-vocabulary"
      currentSurfaceId={props.currentSurfaceId}
      variant={props.variant}
      className={props.className}
      compactLine={model.compactLine}
      compactLinkPlacement="inline"
      heading={model.heading}
      whyTwo={model.whyTwo}
      currentLabel={currentLink.label}
      links={[{ ...peer, testIdSuffix: "peer-link" }]}
    />
  );
}
