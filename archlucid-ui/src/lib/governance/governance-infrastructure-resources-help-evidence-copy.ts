import type { EvidenceSourceLinkWithWhen } from "@/lib/evidence-surface-copy";
import { AUDIT_EVIDENCE_LINEAGE_LOOKUP_PATH } from "@/lib/audit-evidence-lineage-route";
import { CLOUD_CONNECTIONS_HELP_PATH } from "@/lib/cloud-connections-help-guide-content";
import { GOVERNANCE_INFRASTRUCTURE_RESOURCES_CLAIM_DISCIPLINE } from "@/lib/governance/governance-infrastructure-copy";
import {
  GOVERNANCE_INFRASTRUCTURE_RESOURCES_SOURCES,
  GOVERNANCE_INFRASTRUCTURE_RESOURCES_SOURCES_INTRO,
} from "@/lib/governance/governance-infrastructure-evidence-copy";
import { inAppHelpHref } from "@/lib/product-documentation-registry";

export const GOVERNANCE_INFRASTRUCTURE_RESOURCES_HELP_CANONICAL_PATH =
  "/help/governance-infrastructure-resources" as const;

export const GOVERNANCE_INFRASTRUCTURE_RESOURCES_HELP_TOPIC_LABEL = "How resource explorer works" as const;

export const GOVERNANCE_INFRASTRUCTURE_RESOURCES_HELP_CLAIM_DISCIPLINE_HEADING =
  "What this guide does not cover" as const;

export const GOVERNANCE_INFRASTRUCTURE_RESOURCES_HELP_CLAIM_DISCIPLINE =
  GOVERNANCE_INFRASTRUCTURE_RESOURCES_CLAIM_DISCIPLINE;

export const GOVERNANCE_INFRASTRUCTURE_RESOURCES_HELP_FOLLOW_UPS_TITLE = "Where to go next" as const;

export const GOVERNANCE_INFRASTRUCTURE_RESOURCES_HELP_SOURCES_INTRO =
  GOVERNANCE_INFRASTRUCTURE_RESOURCES_SOURCES_INTRO;

/** Help follow-ups — no self-href to resource explorer or this help topic. */
export const GOVERNANCE_INFRASTRUCTURE_RESOURCES_HELP_SOURCES: readonly EvidenceSourceLinkWithWhen[] = [
  ...GOVERNANCE_INFRASTRUCTURE_RESOURCES_SOURCES,
  {
    label: "Audit evidence lineage",
    href: AUDIT_EVIDENCE_LINEAGE_LOOKUP_PATH,
    when: "Copy assessment, snapshot, and control IDs after opening a resource hub",
  },
  {
    label: "Drift and snapshots help",
    href: inAppHelpHref("governance-infrastructure-drift"),
    when: "Compare inventory snapshots after scoping drift from a hub tab",
  },
  {
    label: "Cloud connections help",
    href: CLOUD_CONNECTIONS_HELP_PATH,
    when: "Confirm Azure connectors or extract and upload before the explorer lists resources",
  },
];
