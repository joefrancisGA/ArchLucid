"use client";

import type { JSX } from "react";

import {
  buildAdvisoryResultsSchedulesVocabulary,
  resolveAdvisoryResultsSchedulesPeerLink,
  type AdvisoryResultsSchedulesSurfaceId,
  type AdvisoryResultsSchedulesVocabularyModel,
} from "@/lib/vocabulary/advisory-results-schedules-vocabulary";
import { VocabularyRail } from "@/components/vocabulary/VocabularyRail";

export type AdvisoryResultsSchedulesVocabularyRailProps = {
  /** Surface hosting the strip — marks the current advisory job and links to the peer. */
  readonly currentSurfaceId: AdvisoryResultsSchedulesSurfaceId;
  /** Compact one-line strip (default) vs fuller why-two explanation. */
  readonly variant?: "compact" | "full";
  readonly className?: string;
  /** Optional override for tests; defaults to {@link buildAdvisoryResultsSchedulesVocabulary}. */
  readonly model?: AdvisoryResultsSchedulesVocabularyModel;
};

/**
 * TB-2280 — Compact vocabulary rail between Advisory results and Advisory schedules.
 * Mount on both advisory hub tabs so operators do not conflate results with schedules.
 * Distinct from Advisory ≠ Recurrence (TB-2246).
 */
export function AdvisoryResultsSchedulesVocabularyRail(
  props: AdvisoryResultsSchedulesVocabularyRailProps,
): JSX.Element {
  const model = props.model ?? buildAdvisoryResultsSchedulesVocabulary();
  const peer = resolveAdvisoryResultsSchedulesPeerLink(props.currentSurfaceId);
  const currentLink =
    props.currentSurfaceId === "advisory-results" ? model.resultsLink : model.schedulesLink;

  return (
    <VocabularyRail
      testIdPrefix="advisory-results-schedules-vocabulary"
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
