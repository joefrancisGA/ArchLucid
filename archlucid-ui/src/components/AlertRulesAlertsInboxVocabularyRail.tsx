"use client";

import type { JSX } from "react";

import { PairwiseVocabularyRailFromModel } from "@/components/vocabulary/PairwiseVocabularyRailFromModel";
import {
  buildAlertRulesAlertsInboxPairwiseRail,
  type AlertRulesAlertsInboxSurfaceId,
  type AlertRulesAlertsInboxVocabularyModel,
} from "@/lib/vocabulary/alert-rules-alerts-inbox-vocabulary";

export type AlertRulesAlertsInboxVocabularyRailProps = {
  readonly currentSurfaceId: AlertRulesAlertsInboxSurfaceId;
  readonly variant?: "compact" | "full";
  readonly className?: string;
  readonly model?: AlertRulesAlertsInboxVocabularyModel;
};

/**
 * TB-2289 — Compact vocabulary rail between Alert rules config and Alerts inbox triage.
 * Mount on Alert rules hub and Alerts inbox.
 */
export function AlertRulesAlertsInboxVocabularyRail(
  props: AlertRulesAlertsInboxVocabularyRailProps,
): JSX.Element {
  const pairwiseModel =
    props.model !== undefined
      ? {
          heading: props.model.heading,
          whyTwo: props.model.whyTwo,
          compactLine: props.model.compactLine,
          currentLink: props.model.alertRulesLink,
          peerLink: props.model.alertsInboxLink,
        }
      : buildAlertRulesAlertsInboxPairwiseRail();

  return (
    <PairwiseVocabularyRailFromModel
      testIdPrefix="alert-rules-alerts-inbox-vocabulary"
      currentSurfaceId={props.currentSurfaceId}
      variant={props.variant}
      className={props.className}
      compactLinkPlacement="inline"
      model={pairwiseModel}
    />
  );
}
