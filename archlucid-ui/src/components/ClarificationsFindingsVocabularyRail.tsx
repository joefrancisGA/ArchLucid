"use client";

import type { JSX } from "react";

import { PairwiseVocabularyRailFromModel } from "@/components/vocabulary/PairwiseVocabularyRailFromModel";
import {
  buildClarificationsFindingsPairwiseRail,
  type ClarificationsFindingsSurfaceId,
  type ClarificationsFindingsVocabularyModel,
} from "@/lib/vocabulary/clarifications-findings-vocabulary";

export type ClarificationsFindingsVocabularyRailProps = {
  readonly runId: string;
  readonly currentSurfaceId: ClarificationsFindingsSurfaceId;
  readonly variant?: "compact" | "full";
  readonly className?: string;
  readonly model?: ClarificationsFindingsVocabularyModel;
};

/** TB-2298 — Create-home Clarifications gaps vs Findings triage. */
export function ClarificationsFindingsVocabularyRail(
  props: ClarificationsFindingsVocabularyRailProps,
): JSX.Element {
  const pairwiseModel =
    props.model !== undefined
      ? {
          heading: props.model.heading,
          whyTwo: props.model.whyTwo,
          compactLine: props.model.compactLine,
          currentLink: props.model.clarificationsLink,
          peerLink: props.model.findingsLink,
        }
      : buildClarificationsFindingsPairwiseRail(props.runId);

  return (
    <PairwiseVocabularyRailFromModel
      testIdPrefix="clarifications-findings-vocabulary"
      currentSurfaceId={props.currentSurfaceId}
      variant={props.variant}
      className={props.className}
      compactLinkPlacement="inline"
      model={pairwiseModel}
    />
  );
}
