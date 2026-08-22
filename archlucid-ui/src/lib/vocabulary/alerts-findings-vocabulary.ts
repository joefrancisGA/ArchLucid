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
import type { PairwiseVocabularyRailModel } from "@/lib/vocabulary/create-pairwise-vocabulary-rail";

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
  "Alerts are raised notifications from rules. The findings queue is where you resolve underlying risks. You can acknowledge an alert without resolving the finding — use both when triage and resolution both apply." as const;

export const ALERTS_FINDINGS_COMPACT_LINE =
  "Alerts triage notifications; findings resolve risks — open the other inbox when you need both." as const;

export const ALERTS_FINDINGS_ALERTS_LINK: AlertsFindingsLink = {
  id: "alerts-inbox",
  label: "Alerts inbox",
  href: GOVERNANCE_ALERTS_PATH,
  whenToUse: "Acknowledge or resolve raised alerts.",
};

export const ALERTS_FINDINGS_FINDINGS_LINK: AlertsFindingsLink = {
  id: "findings-queue",
  label: "Findings queue",
  href: GOVERNANCE_FINDINGS_PATH,
  whenToUse: "Disposition risks, assign owners, and clear open approval items.",
};

/** Pairwise model for Alerts inbox ↔ Findings queue (fixed governance routes). */
export function buildAlertsFindingsPairwiseRail(): PairwiseVocabularyRailModel<AlertsFindingsSurfaceId> {
  return {
    heading: ALERTS_FINDINGS_HEADING,
    whyTwo: ALERTS_FINDINGS_WHY_TWO,
    compactLine: ALERTS_FINDINGS_COMPACT_LINE,
    currentLink: ALERTS_FINDINGS_ALERTS_LINK,
    peerLink: ALERTS_FINDINGS_FINDINGS_LINK,
  };
}

/** Full vocabulary model (heading, why-two copy, and deep links). */
export function buildAlertsFindingsVocabulary(): AlertsFindingsVocabularyModel {
  const rail = buildAlertsFindingsPairwiseRail();

  return {
    heading: rail.heading,
    whyTwo: rail.whyTwo,
    compactLine: rail.compactLine,
    alertsLink: rail.currentLink,
    findingsLink: rail.peerLink,
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
