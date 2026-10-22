"use client";

import type { JSX } from "react";

import { PairwiseVocabularyRailFromModel } from "@/components/vocabulary/PairwiseVocabularyRailFromModel";
import {
  buildRiskExceptionsFindingsPairwiseRail,
  type RiskExceptionsFindingsSurfaceId,
  type RiskExceptionsFindingsVocabularyModel,
} from "@/lib/vocabulary/risk-exceptions-findings-vocabulary";

export type RiskExceptionsFindingsVocabularyRailProps = {
  /** Surface hosting the strip — marks the current register and links to the peer. */
  readonly currentSurfaceId: RiskExceptionsFindingsSurfaceId;
  /** Compact one-line strip (default) vs fuller why-two explanation. */
  readonly variant?: "compact" | "full";
  readonly className?: string;
  /** Optional override for tests; defaults to {@link buildRiskExceptionsFindingsVocabulary}. */
  readonly model?: RiskExceptionsFindingsVocabularyModel;
};

/**
 * TB-2249 — Compact vocabulary rail between risk exceptions and findings queue.
 * Mount on both hubs so operators do not conflate waivers with disposition.
 */
export function RiskExceptionsFindingsVocabularyRail(
  props: RiskExceptionsFindingsVocabularyRailProps,
): JSX.Element {
  const pairwiseModel =
    props.model !== undefined
      ? {
          heading: props.model.heading,
          whyTwo: props.model.whyTwo,
          compactLine: props.model.compactLine,
          currentLink: props.model.riskExceptionsLink,
          peerLink: props.model.findingsLink,
        }
      : buildRiskExceptionsFindingsPairwiseRail();

  return (
    <PairwiseVocabularyRailFromModel
      testIdPrefix="risk-exceptions-findings-vocabulary"
      currentSurfaceId={props.currentSurfaceId}
      variant={props.variant}
      className={props.className}
      compactLinkPlacement="inline"
      model={pairwiseModel}
    />
  );
}
