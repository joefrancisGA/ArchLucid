"use client";

import type { JSX } from "react";

import {
  buildAlertRulesAlertsInboxVocabulary,
  resolveAlertRulesAlertsInboxPeerLink,
  type AlertRulesAlertsInboxSurfaceId,
  type AlertRulesAlertsInboxVocabularyModel,
} from "@/lib/vocabulary/alert-rules-alerts-inbox-vocabulary";
import { VocabularyRail } from "@/components/vocabulary/VocabularyRail";

export type AlertRulesAlertsInboxVocabularyRailProps = {
  /** Surface hosting the strip — marks the current job and links to the peer. */
  readonly currentSurfaceId: AlertRulesAlertsInboxSurfaceId;
  /** Compact one-line strip (default) vs fuller why-two explanation. */
  readonly variant?: "compact" | "full";
  readonly className?: string;
  /** Optional override for tests; defaults to {@link buildAlertRulesAlertsInboxVocabulary}. */
  readonly model?: AlertRulesAlertsInboxVocabularyModel;
};

/**
 * TB-2289 — Compact vocabulary rail between Alert rules config and Alerts inbox triage.
 * Mount on Alert rules hub and Alerts inbox.
 */
export function AlertRulesAlertsInboxVocabularyRail(
  props: AlertRulesAlertsInboxVocabularyRailProps,
): JSX.Element {
  const model = props.model ?? buildAlertRulesAlertsInboxVocabulary();
  const peer = resolveAlertRulesAlertsInboxPeerLink(props.currentSurfaceId);
  const currentLink =
    props.currentSurfaceId === "alert-rules" ? model.alertRulesLink : model.alertsInboxLink;

  return (
    <VocabularyRail
      testIdPrefix="alert-rules-alerts-inbox-vocabulary"
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
