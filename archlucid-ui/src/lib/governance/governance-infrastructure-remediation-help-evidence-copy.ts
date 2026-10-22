import type { EvidenceSourceLinkWithWhen } from "@/lib/evidence-surface-copy";
import {
  GOVERNANCE_INFRASTRUCTURE_REMEDIATION_CLAIM_DISCIPLINE,
  GOVERNANCE_INFRASTRUCTURE_REMEDIATION_PAGE_LEAD,
} from "@/lib/governance/governance-infrastructure-copy";
import {
  GOVERNANCE_INFRASTRUCTURE_REMEDIATION_SOURCES,
  GOVERNANCE_INFRASTRUCTURE_REMEDIATION_SOURCES_INTRO,
} from "@/lib/governance/governance-infrastructure-evidence-copy";
import { inAppHelpHref } from "@/lib/product-documentation-registry";

export const GOVERNANCE_INFRASTRUCTURE_REMEDIATION_HELP_CANONICAL_PATH =
  "/help/governance-infrastructure-remediation" as const;

export const GOVERNANCE_INFRASTRUCTURE_REMEDIATION_HELP_TOPIC_LABEL =
  "How remediation instances and waves work" as const;

export const GOVERNANCE_INFRASTRUCTURE_REMEDIATION_HELP_CLAIM_DISCIPLINE_HEADING =
  "What this guide does not cover" as const;

export const GOVERNANCE_INFRASTRUCTURE_REMEDIATION_HELP_CLAIM_DISCIPLINE =
  `${GOVERNANCE_INFRASTRUCTURE_REMEDIATION_PAGE_LEAD} ${GOVERNANCE_INFRASTRUCTURE_REMEDIATION_CLAIM_DISCIPLINE} This workbench tracks instances and waves — not the remediation factory executive metrics dashboard or the pattern registry approval queue. Verify against inventory snapshots after execute; do not treat advisory guidance as a successful cloud apply.`;

export const GOVERNANCE_INFRASTRUCTURE_REMEDIATION_HELP_FOLLOW_UPS_TITLE = "Where to go next" as const;

export const GOVERNANCE_INFRASTRUCTURE_REMEDIATION_HELP_SOURCES_INTRO =
  GOVERNANCE_INFRASTRUCTURE_REMEDIATION_SOURCES_INTRO;

/** Help follow-ups — no self-href to the instances workbench or this help topic. */
export const GOVERNANCE_INFRASTRUCTURE_REMEDIATION_HELP_SOURCES: readonly EvidenceSourceLinkWithWhen[] = [
  ...GOVERNANCE_INFRASTRUCTURE_REMEDIATION_SOURCES,
  {
    label: "Resource explorer help",
    href: inAppHelpHref("governance-infrastructure-resources"),
    when: "Scope remediation to one cloud resource from a resource hub",
  },
];
