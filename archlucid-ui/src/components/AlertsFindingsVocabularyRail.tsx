"use client";

import type { JSX } from "react";

import { PairwiseVocabularyRailFromModel } from "@/components/vocabulary/PairwiseVocabularyRailFromModel";
import {
  buildAlertsFindingsPairwiseRail,
  type AlertsFindingsSurfaceId,
  type AlertsFindingsVocabularyModel,
} from "@/lib/vocabulary/alerts-findings-vocabulary";

export type AlertsFindingsVocabularyRailProps = {
  readonly currentSurfaceId: AlertsFindingsSurfaceId;
  readonly variant?: "compact" | "full";
  readonly className?: string;
  readonly model?: AlertsFindingsVocabularyModel;
};

/**
 * TB-2319 — Compact vocabulary rail between Alerts inbox triage and Findings disposition.
 * Mount on Alerts inbox and Findings queue.
 */
export function AlertsFindingsVocabularyRail(props: AlertsFindingsVocabularyRailProps): JSX.Element {
  const pairwiseModel =
    props.model !== undefined
      ? {
          heading: props.model.heading,
          whyTwo: props.model.whyTwo,
          compactLine: props.model.compactLine,
          currentLink: props.model.alertsLink,
          peerLink: props.model.findingsLink,
        }
      : buildAlertsFindingsPairwiseRail();

  return (
    <PairwiseVocabularyRailFromModel
      testIdPrefix="alerts-findings-vocabulary"
      currentSurfaceId={props.currentSurfaceId}
      variant={props.variant}
      className={props.className}
      compactLinkPlacement="inline"
      model={pairwiseModel}
    />
  );
}
