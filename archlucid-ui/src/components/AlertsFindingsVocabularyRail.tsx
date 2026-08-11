"use client";

import type { JSX } from "react";

import {
  buildAlertsFindingsVocabulary,
  resolveAlertsFindingsPeerLink,
  type AlertsFindingsSurfaceId,
  type AlertsFindingsVocabularyModel,
} from "@/lib/vocabulary/alerts-findings-vocabulary";
import { VocabularyRail } from "@/components/vocabulary/VocabularyRail";

export type AlertsFindingsVocabularyRailProps = {
  /** Surface hosting the strip — marks the current inbox and links to the peer. */
  readonly currentSurfaceId: AlertsFindingsSurfaceId;
  /** Compact one-line strip (default) vs fuller why-two explanation. */
  readonly variant?: "compact" | "full";
  readonly className?: string;
  /** Optional override for tests; defaults to {@link buildAlertsFindingsVocabulary}. */
  readonly model?: AlertsFindingsVocabularyModel;
};

/**
 * TB-2319 — Compact vocabulary rail between Alerts inbox triage and Findings disposition.
 * Mount on Alerts inbox and Findings queue.
 */
export function AlertsFindingsVocabularyRail(
  props: AlertsFindingsVocabularyRailProps,
): JSX.Element {
  const model = props.model ?? buildAlertsFindingsVocabulary();
  const peer = resolveAlertsFindingsPeerLink(props.currentSurfaceId);
  const currentLink =
    props.currentSurfaceId === "alerts-inbox" ? model.alertsLink : model.findingsLink;

  return (
    <VocabularyRail
      testIdPrefix="alerts-findings-vocabulary"
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
