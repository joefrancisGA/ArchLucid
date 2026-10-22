"use client";

import type { JSX } from "react";

import { PairwiseVocabularyRailFromModel } from "@/components/vocabulary/PairwiseVocabularyRailFromModel";
import {
  buildAdvisoryResultsSchedulesPairwiseRail,
  type AdvisoryResultsSchedulesSurfaceId,
  type AdvisoryResultsSchedulesVocabularyModel,
} from "@/lib/vocabulary/advisory-results-schedules-vocabulary";

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
  const pairwiseModel =
    props.model !== undefined
      ? {
          heading: props.model.heading,
          whyTwo: props.model.whyTwo,
          compactLine: props.model.compactLine,
          currentLink: props.model.resultsLink,
          peerLink: props.model.schedulesLink,
        }
      : buildAdvisoryResultsSchedulesPairwiseRail();

  return (
    <PairwiseVocabularyRailFromModel
      testIdPrefix="advisory-results-schedules-vocabulary"
      currentSurfaceId={props.currentSurfaceId}
      variant={props.variant}
      className={props.className}
      compactLinkPlacement="inline"
      model={pairwiseModel}
    />
  );
}
