/**
 * TB-2319 — Alerts inbox ≠ Findings queue vocabulary rail.
 *
 * Why two surfaces exist:
 * - Alerts inbox (`/governance/alerts`) is the operational triage launcher for
 *   *raised notifications* (rule hits that need acknowledge / resolve).
 * - Findings queue (`/governance/findings`) is the cross-review *risk register*
 *   for disposition, ownership, and exception work on the underlying findings.
 *
 * They stay separate because acknowledging an alert does not dispose the finding,
 * and closing a finding does not auto-clear every related alert row. Operators need
 * both surfaces with deep links so they do not treat one list as the other.
 *
 * Promotes TB-2221 dual-inbox teaching into the shared VocabularyRail SoT layout.
 */

import {
  GOVERNANCE_ALERTS_PATH,
  GOVERNANCE_FINDINGS_PATH,
} from "@/lib/governance/governance-route-paths";

export type AlertsFindingsSurfaceId = "alerts-inbox" | "findings-queue";

export type AlertsFindingsLink = {
  readonly id: AlertsFindingsSurfaceId;
  readonly label: string;
  readonly href: string;
  readonly whenToUse: string;
};

export type AlertsFindingsVocabularyModel = {
  readonly heading: string;
  readonly whyTwo: string;
  readonly compactLine: string;
  readonly alertsLink: AlertsFindingsLink;
  readonly findingsLink: AlertsFindingsLink;
};

export const ALERTS_FINDINGS_HEADING = "Alerts and findings stay separate" as const;

export const ALERTS_FINDINGS_WHY_TWO =
  "Alerts are raised notifications from rules; the findings queue is the risk-register for disposition. Acknowledge an alert without disposing the finding — or dispose a finding without clearing every related alert. Use both inboxes when triage and disposition both apply." as const;

export const ALERTS_FINDINGS_COMPACT_LINE =
  "Alerts triage notifications; findings dispose risks — open the other inbox when you need both." as const;

export const ALERTS_FINDINGS_ALERTS_LINK: AlertsFindingsLink = {
  id: "alerts-inbox",
  label: "Alerts inbox",
  href: GOVERNANCE_ALERTS_PATH,
  whenToUse: "Acknowledge or resolve raised governance notifications.",
};

export const ALERTS_FINDINGS_FINDINGS_LINK: AlertsFindingsLink = {
  id: "findings-queue",
  label: "Findings queue",
  href: GOVERNANCE_FINDINGS_PATH,
  whenToUse: "Disposition risks, assign owners, and clear open governance items.",
};

/** Full vocabulary model (heading, why-two copy, and deep links). */
export function buildAlertsFindingsVocabulary(): AlertsFindingsVocabularyModel {
  return {
    heading: ALERTS_FINDINGS_HEADING,
    whyTwo: ALERTS_FINDINGS_WHY_TWO,
    compactLine: ALERTS_FINDINGS_COMPACT_LINE,
    alertsLink: ALERTS_FINDINGS_ALERTS_LINK,
    findingsLink: ALERTS_FINDINGS_FINDINGS_LINK,
  };
}

/** Peer deep-link for the surface you are not currently on. */
export function resolveAlertsFindingsPeerLink(
  currentSurfaceId: AlertsFindingsSurfaceId,
): AlertsFindingsLink {
  if (currentSurfaceId === "alerts-inbox") {
    return ALERTS_FINDINGS_FINDINGS_LINK;
  }

  return ALERTS_FINDINGS_ALERTS_LINK;
}
