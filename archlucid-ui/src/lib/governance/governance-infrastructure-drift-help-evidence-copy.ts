import type { EvidenceSourceLinkWithWhen } from "@/lib/evidence-surface-copy";
import { CLOUD_CONNECTIONS_HELP_PATH } from "@/lib/cloud-connections-help-guide-content";
import { GOVERNANCE_INFRASTRUCTURE_DRIFT_CLAIM_DISCIPLINE } from "@/lib/governance/governance-infrastructure-copy";
import {
  GOVERNANCE_INFRASTRUCTURE_DRIFT_SOURCES,
  GOVERNANCE_INFRASTRUCTURE_DRIFT_SOURCES_INTRO,
} from "@/lib/governance/governance-infrastructure-evidence-copy";
import { GOVERNANCE_INFRASTRUCTURE_TERRAFORM_PATH } from "@/lib/governance/governance-infrastructure-route-paths";

export const GOVERNANCE_INFRASTRUCTURE_DRIFT_HELP_CANONICAL_PATH = "/help/governance-infrastructure-drift" as const;

export const GOVERNANCE_INFRASTRUCTURE_DRIFT_HELP_TOPIC_LABEL = "How drift and snapshots work" as const;

export const GOVERNANCE_INFRASTRUCTURE_DRIFT_HELP_CLAIM_DISCIPLINE_HEADING = "What this guide does not cover";

export const GOVERNANCE_INFRASTRUCTURE_DRIFT_HELP_CLAIM_DISCIPLINE =
  "This guide explains inventory snapshot comparison and advisory Terraform exports — not sealed review records, original Terraform, or safe-to-apply infrastructure changes. Confirm cloud connections and snapshot capture before trusting drift rows or exports.";

/** Operator-surface claim — drift workbench orientation band. */
export const GOVERNANCE_INFRASTRUCTURE_DRIFT_HELP_OPERATOR_CLAIM = GOVERNANCE_INFRASTRUCTURE_DRIFT_CLAIM_DISCIPLINE;

export const GOVERNANCE_INFRASTRUCTURE_DRIFT_HELP_FOLLOW_UPS_TITLE = "Where to go next";

export const GOVERNANCE_INFRASTRUCTURE_DRIFT_HELP_SOURCES_INTRO = GOVERNANCE_INFRASTRUCTURE_DRIFT_SOURCES_INTRO;

/** Help follow-ups — no self-href to drift workbench or this help topic. */
export const GOVERNANCE_INFRASTRUCTURE_DRIFT_HELP_SOURCES: readonly EvidenceSourceLinkWithWhen[] = [
  ...GOVERNANCE_INFRASTRUCTURE_DRIFT_SOURCES,
  {
    label: "Cloud connections help",
    href: CLOUD_CONNECTIONS_HELP_PATH,
    when: "Confirm inventory connectors and snapshot capture before comparing drift",
  },
  {
    label: "Advisory Terraform workbench",
    href: GOVERNANCE_INFRASTRUCTURE_TERRAFORM_PATH,
    when: "Review reconstructed Terraform mapping for a scoped resource before exporting from drift",
  },
];
