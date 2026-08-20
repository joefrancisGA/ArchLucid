"use client";

import type { JSX } from "react";

import {
  buildRiskExceptionsFindingsVocabulary,
  resolveRiskExceptionsFindingsPeerLink,
  type RiskExceptionsFindingsSurfaceId,
  type RiskExceptionsFindingsVocabularyModel,
} from "@/lib/vocabulary/risk-exceptions-findings-vocabulary";
import { VocabularyRail } from "@/components/vocabulary/VocabularyRail";

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
  const model = props.model ?? buildRiskExceptionsFindingsVocabulary();
  const peer = resolveRiskExceptionsFindingsPeerLink(props.currentSurfaceId);
  const currentLink =
    props.currentSurfaceId === "risk-exceptions"
      ? model.riskExceptionsLink
      : model.findingsLink;

  return (
    <VocabularyRail
      testIdPrefix="risk-exceptions-findings-vocabulary"
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
