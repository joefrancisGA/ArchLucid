/**
 * TB-2221 — Alerts ↔ findings dual-inbox reconciler.
 *
 * Why two inboxes exist:
 * - Alerts inbox (`/governance/alerts`) is the operational triage launcher for
 *   *raised notifications* (rule hits that need acknowledge / resolve).
 * - Findings queue (`/governance/findings`) is the cross-review *risk register*
 *   for disposition, ownership, and exception work on the underlying findings.
 *
 * They stay separate because acknowledging an alert does not dispose the finding,
 * and closing a finding does not auto-clear every related alert row. Operators need
 * both surfaces with deep links so they do not treat one list as the other.
 */

import {
  GOVERNANCE_ALERTS_PATH,
  GOVERNANCE_FINDINGS_PATH,
} from "@/lib/governance-route-paths";

export type AlertsFindingsDualInboxSurfaceId = "alerts-inbox" | "findings-queue";

export type AlertsFindingsDualInboxLink = {
  readonly id: AlertsFindingsDualInboxSurfaceId;
  readonly label: string;
  readonly href: string;
  readonly whenToUse: string;
};

export type AlertsFindingsDualInboxReconcilerModel = {
  readonly heading: string;
  readonly whyTwoInboxes: string;
  readonly compactLine: string;
  readonly alertsLink: AlertsFindingsDualInboxLink;
  readonly findingsLink: AlertsFindingsDualInboxLink;
};

export const ALERTS_FINDINGS_DUAL_INBOX_HEADING = "Alerts and findings stay separate" as const;

export const ALERTS_FINDINGS_DUAL_INBOX_WHY_TWO =
  "Alerts are raised notifications from rules; the findings queue is the risk-register for disposition. Acknowledge an alert without disposing the finding — or dispose a finding without clearing every related alert. Use both inboxes when triage and disposition both apply." as const;

export const ALERTS_FINDINGS_DUAL_INBOX_COMPACT_LINE =
  "Alerts triage notifications; findings dispose risks — open the other inbox when you need both." as const;

export const ALERTS_FINDINGS_DUAL_INBOX_ALERTS_LINK: AlertsFindingsDualInboxLink = {
  id: "alerts-inbox",
  label: "Alerts inbox",
  href: GOVERNANCE_ALERTS_PATH,
  whenToUse: "Acknowledge or resolve raised governance notifications.",
};

export const ALERTS_FINDINGS_DUAL_INBOX_FINDINGS_LINK: AlertsFindingsDualInboxLink = {
  id: "findings-queue",
  label: "Findings queue",
  href: GOVERNANCE_FINDINGS_PATH,
  whenToUse: "Disposition risks, assign owners, and clear open governance items.",
};

/** Full reconciler model (heading, why-two copy, and deep links). */
export function buildAlertsFindingsDualInboxReconciler(): AlertsFindingsDualInboxReconcilerModel {
  return {
    heading: ALERTS_FINDINGS_DUAL_INBOX_HEADING,
    whyTwoInboxes: ALERTS_FINDINGS_DUAL_INBOX_WHY_TWO,
    compactLine: ALERTS_FINDINGS_DUAL_INBOX_COMPACT_LINE,
    alertsLink: ALERTS_FINDINGS_DUAL_INBOX_ALERTS_LINK,
    findingsLink: ALERTS_FINDINGS_DUAL_INBOX_FINDINGS_LINK,
  };
}

/** Peer deep-link for the surface you are not currently on. */
export function resolveAlertsFindingsDualInboxPeerLink(
  currentSurfaceId: AlertsFindingsDualInboxSurfaceId,
): AlertsFindingsDualInboxLink {
  if (currentSurfaceId === "alerts-inbox") {
    return ALERTS_FINDINGS_DUAL_INBOX_FINDINGS_LINK;
  }

  return ALERTS_FINDINGS_DUAL_INBOX_ALERTS_LINK;
}
