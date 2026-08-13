/**
 * TB-2297 — Governance setup guide ≠ live config hubs vocabulary rail.
 *
 * Why the guide and hubs stay separate:
 * - Governance setup (`/governance/setup`) is a readiness checklist that deep-links
 *   configuration areas.
 * - Alert rules, Policy packs, and Standards & rules are the *live* configuration
 *   hubs where changes are made and audited.
 *
 * Completing the guide is not the same task as editing live rules, packs, or standards.
 */

import {
  GOVERNANCE_ALERT_RULES_PATH,
  GOVERNANCE_POLICY_PACKS_PATH,
  GOVERNANCE_STANDARDS_AND_RULES_PATH,
} from "@/lib/governance/governance-route-paths";
import { GOVERNANCE_SETUP_HREF } from "@/lib/governance/governance-setup-route";

export type GovernanceSetupConfigHubsSurfaceId =
  | "setup"
  | "alert-rules"
  | "policy-packs"
  | "standards";

export type GovernanceSetupConfigHubsLink = {
  readonly id: GovernanceSetupConfigHubsSurfaceId;
  readonly label: string;
  readonly href: string;
  readonly whenToUse: string;
};

export type GovernanceSetupConfigHubsVocabularyModel = {
  readonly heading: string;
  readonly whySeparate: string;
  readonly compactLine: string;
  readonly setupLink: GovernanceSetupConfigHubsLink;
  readonly alertRulesLink: GovernanceSetupConfigHubsLink;
  readonly policyPacksLink: GovernanceSetupConfigHubsLink;
  readonly standardsLink: GovernanceSetupConfigHubsLink;
};

export const GOVERNANCE_SETUP_CONFIG_HUBS_HEADING =
  "Governance setup is a guide; Alert rules, Policy packs, and Standards are live config" as const;

export const GOVERNANCE_SETUP_CONFIG_HUBS_WHY_SEPARATE =
  "Governance setup is a readiness checklist that deep-links configuration areas. Alert rules, Policy packs, and Standards & rules are the live hubs where changes are made and audited. Finishing the guide does not edit live configuration — open the hub when you need to change rules, packs, or standards." as const;

export const GOVERNANCE_SETUP_CONFIG_HUBS_COMPACT_LINE =
  "Setup is a readiness guide; Alert rules, Policy packs, and Standards are live config." as const;

export const GOVERNANCE_SETUP_CONFIG_HUBS_SETUP_LINK: GovernanceSetupConfigHubsLink = {
  id: "setup",
  label: "Governance setup",
  href: GOVERNANCE_SETUP_HREF,
  whenToUse: "Follow the readiness checklist that links to configuration areas.",
};

export const GOVERNANCE_SETUP_CONFIG_HUBS_ALERT_RULES_LINK: GovernanceSetupConfigHubsLink = {
  id: "alert-rules",
  label: "Alert rules",
  href: GOVERNANCE_ALERT_RULES_PATH,
  whenToUse: "Configure when and how governance alerts fire.",
};

export const GOVERNANCE_SETUP_CONFIG_HUBS_POLICY_PACKS_LINK: GovernanceSetupConfigHubsLink = {
  id: "policy-packs",
  label: "Policy packs",
  href: GOVERNANCE_POLICY_PACKS_PATH,
  whenToUse: "Author and activate enforceable governance rule sets.",
};

export const GOVERNANCE_SETUP_CONFIG_HUBS_STANDARDS_LINK: GovernanceSetupConfigHubsLink = {
  id: "standards",
  label: "Standards & rules",
  href: GOVERNANCE_STANDARDS_AND_RULES_PATH,
  whenToUse: "Configure standards and resolution rules applied to reviews.",
};

const ALL_LINKS: readonly GovernanceSetupConfigHubsLink[] = [
  GOVERNANCE_SETUP_CONFIG_HUBS_SETUP_LINK,
  GOVERNANCE_SETUP_CONFIG_HUBS_ALERT_RULES_LINK,
  GOVERNANCE_SETUP_CONFIG_HUBS_POLICY_PACKS_LINK,
  GOVERNANCE_SETUP_CONFIG_HUBS_STANDARDS_LINK,
];

/** Full vocabulary model. */
export function buildGovernanceSetupConfigHubsVocabulary(): GovernanceSetupConfigHubsVocabularyModel {
  return {
    heading: GOVERNANCE_SETUP_CONFIG_HUBS_HEADING,
    whySeparate: GOVERNANCE_SETUP_CONFIG_HUBS_WHY_SEPARATE,
    compactLine: GOVERNANCE_SETUP_CONFIG_HUBS_COMPACT_LINE,
    setupLink: GOVERNANCE_SETUP_CONFIG_HUBS_SETUP_LINK,
    alertRulesLink: GOVERNANCE_SETUP_CONFIG_HUBS_ALERT_RULES_LINK,
    policyPacksLink: GOVERNANCE_SETUP_CONFIG_HUBS_POLICY_PACKS_LINK,
    standardsLink: GOVERNANCE_SETUP_CONFIG_HUBS_STANDARDS_LINK,
  };
}

/** Resolve the link for the current surface. */
export function resolveGovernanceSetupConfigHubsLink(
  surfaceId: GovernanceSetupConfigHubsSurfaceId,
): GovernanceSetupConfigHubsLink | null {
  const match = ALL_LINKS.find((link) => link.id === surfaceId);

  if (match === undefined) {
    return null;
  }

  return match;
}

/**
 * Peer links for the surfaces you are not on.
 * On live hubs, prefer Setup first so the guide↔config distinction is one click away.
 */
export function resolveGovernanceSetupConfigHubsPeerLinks(
  currentSurfaceId: GovernanceSetupConfigHubsSurfaceId,
): readonly GovernanceSetupConfigHubsLink[] {
  const peers = ALL_LINKS.filter((link) => link.id !== currentSurfaceId);

  if (currentSurfaceId === "setup") {
    return peers;
  }

  return [
    GOVERNANCE_SETUP_CONFIG_HUBS_SETUP_LINK,
    ...peers.filter((link) => link.id !== "setup"),
  ];
}
