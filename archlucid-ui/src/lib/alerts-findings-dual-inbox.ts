/**
 * TB-2221 / TB-2319 — Alerts ↔ findings dual-inbox reconciler.
 *
 * Canonical vocabulary SoT lives in `@/lib/vocabulary/alerts-findings-vocabulary`
 * (TB-2319 VocabularyRail). This module keeps the TB-2221 import surface.
 */

import {
  ALERTS_FINDINGS_ALERTS_LINK,
  ALERTS_FINDINGS_COMPACT_LINE,
  ALERTS_FINDINGS_FINDINGS_LINK,
  ALERTS_FINDINGS_HEADING,
  ALERTS_FINDINGS_WHY_TWO,
  buildAlertsFindingsVocabulary,
  resolveAlertsFindingsPeerLink,
  type AlertsFindingsLink,
  type AlertsFindingsSurfaceId,
  type AlertsFindingsVocabularyModel,
} from "@/lib/vocabulary/alerts-findings-vocabulary";

export type AlertsFindingsDualInboxSurfaceId = AlertsFindingsSurfaceId;

export type AlertsFindingsDualInboxLink = AlertsFindingsLink;

export type AlertsFindingsDualInboxReconcilerModel = {
  readonly heading: string;
  readonly whyTwoInboxes: string;
  readonly compactLine: string;
  readonly alertsLink: AlertsFindingsDualInboxLink;
  readonly findingsLink: AlertsFindingsDualInboxLink;
};

export const ALERTS_FINDINGS_DUAL_INBOX_HEADING = ALERTS_FINDINGS_HEADING;

export const ALERTS_FINDINGS_DUAL_INBOX_WHY_TWO = ALERTS_FINDINGS_WHY_TWO;

export const ALERTS_FINDINGS_DUAL_INBOX_COMPACT_LINE = ALERTS_FINDINGS_COMPACT_LINE;

export const ALERTS_FINDINGS_DUAL_INBOX_ALERTS_LINK = ALERTS_FINDINGS_ALERTS_LINK;

export const ALERTS_FINDINGS_DUAL_INBOX_FINDINGS_LINK = ALERTS_FINDINGS_FINDINGS_LINK;

/** Full reconciler model (heading, why-two copy, and deep links). */
export function buildAlertsFindingsDualInboxReconciler(): AlertsFindingsDualInboxReconcilerModel {
  const model: AlertsFindingsVocabularyModel = buildAlertsFindingsVocabulary();

  return {
    heading: model.heading,
    whyTwoInboxes: model.whyTwo,
    compactLine: model.compactLine,
    alertsLink: model.alertsLink,
    findingsLink: model.findingsLink,
  };
}

/** Peer deep-link for the surface you are not currently on. */
export function resolveAlertsFindingsDualInboxPeerLink(
  currentSurfaceId: AlertsFindingsDualInboxSurfaceId,
): AlertsFindingsDualInboxLink {
  return resolveAlertsFindingsPeerLink(currentSurfaceId);
}
