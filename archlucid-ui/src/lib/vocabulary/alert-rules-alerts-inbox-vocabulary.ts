/**
 * TB-2289 — Alert rules ≠ Alerts inbox vocabulary rail.
 *
 * Why two surfaces exist:
 * - Alert rules (`/governance/alert-rules`) configure *when* and *how* governance
 *   alerts fire (conditions, routing, advanced composites, simulation).
 * - Alerts inbox (`/governance/alerts`) is the operational *triage* list for
 *   raised notifications (acknowledge / resolve).
 *
 * They stay separate because editing a rule does not triage inbox rows, and
 * acknowledging an alert does not change the rule that raised it. Distinct from
 * Alerts ↔ findings dual-inbox (TB-2221).
 */

import {
  GOVERNANCE_ALERT_RULES_PATH,
  GOVERNANCE_ALERTS_PATH,
} from "@/lib/governance/governance-route-paths";
import type { PairwiseVocabularyRailModel } from "@/lib/vocabulary/create-pairwise-vocabulary-rail";

export type AlertRulesAlertsInboxSurfaceId = "alert-rules" | "alerts-inbox";

export type AlertRulesAlertsInboxLink = {
  readonly id: AlertRulesAlertsInboxSurfaceId;
  readonly label: string;
  readonly href: string;
  readonly whenToUse: string;
};

export type AlertRulesAlertsInboxVocabularyModel = {
  readonly heading: string;
  readonly whyTwo: string;
  readonly compactLine: string;
  readonly alertRulesLink: AlertRulesAlertsInboxLink;
  readonly alertsInboxLink: AlertRulesAlertsInboxLink;
};

export const ALERT_RULES_ALERTS_INBOX_HEADING =
  "Alert rules and the Alerts inbox serve different purposes" as const;

export const ALERT_RULES_ALERTS_INBOX_WHY_TWO =
  "Alert rules configure when and how governance alerts fire. The Alerts inbox is triage for raised notifications. Changing a rule does not acknowledge inbox rows, and acknowledging an alert does not edit the rule that raised it." as const;

export const ALERT_RULES_ALERTS_INBOX_COMPACT_LINE =
  "Alert rules configure firing; the Alerts inbox triages raised notifications." as const;

export const ALERT_RULES_ALERTS_INBOX_RULES_LINK: AlertRulesAlertsInboxLink = {
  id: "alert-rules",
  label: "Alert rules",
  href: GOVERNANCE_ALERT_RULES_PATH,
  whenToUse: "Configure conditions, routing, and simulation for when alerts fire.",
};

export const ALERT_RULES_ALERTS_INBOX_INBOX_LINK: AlertRulesAlertsInboxLink = {
  id: "alerts-inbox",
  label: "Alerts inbox",
  href: GOVERNANCE_ALERTS_PATH,
  whenToUse: "Acknowledge or resolve raised governance notifications.",
};

/** Pairwise model for Alert rules ↔ Alerts inbox (fixed governance routes). */
export function buildAlertRulesAlertsInboxPairwiseRail(): PairwiseVocabularyRailModel<AlertRulesAlertsInboxSurfaceId> {
  return {
    heading: ALERT_RULES_ALERTS_INBOX_HEADING,
    whyTwo: ALERT_RULES_ALERTS_INBOX_WHY_TWO,
    compactLine: ALERT_RULES_ALERTS_INBOX_COMPACT_LINE,
    currentLink: ALERT_RULES_ALERTS_INBOX_RULES_LINK,
    peerLink: ALERT_RULES_ALERTS_INBOX_INBOX_LINK,
  };
}

/** Full vocabulary model (heading, why-two copy, and deep links). */
export function buildAlertRulesAlertsInboxVocabulary(): AlertRulesAlertsInboxVocabularyModel {
  const rail = buildAlertRulesAlertsInboxPairwiseRail();

  return {
    heading: rail.heading,
    whyTwo: rail.whyTwo,
    compactLine: rail.compactLine,
    alertRulesLink: rail.currentLink,
    alertsInboxLink: rail.peerLink,
  };
}

/** Peer deep-link for the surface you are not currently on. */
export function resolveAlertRulesAlertsInboxPeerLink(
  currentSurfaceId: AlertRulesAlertsInboxSurfaceId,
): AlertRulesAlertsInboxLink {
  if (currentSurfaceId === "alert-rules") {
    return ALERT_RULES_ALERTS_INBOX_INBOX_LINK;
  }

  return ALERT_RULES_ALERTS_INBOX_RULES_LINK;
}
