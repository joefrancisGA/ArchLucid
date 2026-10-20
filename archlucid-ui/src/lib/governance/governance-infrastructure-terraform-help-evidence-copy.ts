import type { EvidenceSourceLinkWithWhen } from "@/lib/evidence-surface-copy";
import { GOVERNANCE_INFRASTRUCTURE_TERRAFORM_CLAIM_DISCIPLINE } from "@/lib/governance/governance-infrastructure-copy";
import {
  GOVERNANCE_INFRASTRUCTURE_TERRAFORM_SOURCES,
  GOVERNANCE_INFRASTRUCTURE_TERRAFORM_SOURCES_INTRO,
} from "@/lib/governance/governance-infrastructure-evidence-copy";
import { inAppHelpHref } from "@/lib/product-documentation-registry";

export const GOVERNANCE_INFRASTRUCTURE_TERRAFORM_HELP_CANONICAL_PATH =
  "/help/governance-infrastructure-terraform" as const;

export const GOVERNANCE_INFRASTRUCTURE_TERRAFORM_HELP_TOPIC_LABEL = "How advisory Terraform mapping works" as const;

export const GOVERNANCE_INFRASTRUCTURE_TERRAFORM_HELP_CLAIM_DISCIPLINE_HEADING =
  "What this guide does not cover" as const;

export const GOVERNANCE_INFRASTRUCTURE_TERRAFORM_HELP_CLAIM_DISCIPLINE =
  GOVERNANCE_INFRASTRUCTURE_TERRAFORM_CLAIM_DISCIPLINE;

export const GOVERNANCE_INFRASTRUCTURE_TERRAFORM_HELP_FOLLOW_UPS_TITLE = "Where to go next" as const;

export const GOVERNANCE_INFRASTRUCTURE_TERRAFORM_HELP_SOURCES_INTRO =
  GOVERNANCE_INFRASTRUCTURE_TERRAFORM_SOURCES_INTRO;

/** Help follow-ups — no self-href to the Terraform workbench or this help topic. */
export const GOVERNANCE_INFRASTRUCTURE_TERRAFORM_HELP_SOURCES: readonly EvidenceSourceLinkWithWhen[] = [
  ...GOVERNANCE_INFRASTRUCTURE_TERRAFORM_SOURCES,
  {
    label: "Resource explorer help",
    href: inAppHelpHref("governance-infrastructure-resources"),
    when: "Open a resource hub Terraform tab when mapping is resource-specific",
  },
  {
    label: "Drift and snapshots help",
    href: inAppHelpHref("governance-infrastructure-drift"),
    when: "Compare snapshots and export advisory Terraform after reviewing property drift",
  },
];
