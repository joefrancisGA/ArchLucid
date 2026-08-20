"use client";

import type { JSX } from "react";

import {
  buildClarificationsFindingsVocabulary,
  resolveClarificationsFindingsPeerLink,
  type ClarificationsFindingsSurfaceId,
  type ClarificationsFindingsVocabularyModel,
} from "@/lib/vocabulary/clarifications-findings-vocabulary";
import { VocabularyRail } from "@/components/vocabulary/VocabularyRail";

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
  const model = props.model ?? buildClarificationsFindingsVocabulary(props.runId);
  const peer = resolveClarificationsFindingsPeerLink(props.currentSurfaceId, model);
  const currentLink =
    props.currentSurfaceId === "clarifications"
      ? model.clarificationsLink
      : model.findingsLink;

  return (
    <VocabularyRail
      testIdPrefix="clarifications-findings-vocabulary"
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
