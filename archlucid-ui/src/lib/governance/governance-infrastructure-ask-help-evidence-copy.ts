import type { EvidenceSourceLinkWithWhen } from "@/lib/evidence-surface-copy";
import {
  GOVERNANCE_INFRASTRUCTURE_ASK_CLAIM_DISCIPLINE,
  GOVERNANCE_INFRASTRUCTURE_ASK_PAGE_LEAD,
  GOVERNANCE_INFRASTRUCTURE_ASK_SIMULATOR_STATUS_LABEL,
} from "@/lib/governance/governance-infrastructure-copy";
import {
  GOVERNANCE_INFRASTRUCTURE_ASK_SOURCES,
  GOVERNANCE_INFRASTRUCTURE_ASK_SOURCES_INTRO,
} from "@/lib/governance/governance-infrastructure-evidence-copy";
import { inAppHelpHref } from "@/lib/product-documentation-registry";

export const GOVERNANCE_INFRASTRUCTURE_ASK_HELP_CANONICAL_PATH = "/help/governance-infrastructure-ask" as const;

export const GOVERNANCE_INFRASTRUCTURE_ASK_HELP_TOPIC_LABEL = "How infrastructure Ask works" as const;

export const GOVERNANCE_INFRASTRUCTURE_ASK_HELP_CLAIM_DISCIPLINE_HEADING = "What this guide does not cover" as const;

export const GOVERNANCE_INFRASTRUCTURE_ASK_HELP_CLAIM_DISCIPLINE =
  `${GOVERNANCE_INFRASTRUCTURE_ASK_PAGE_LEAD} ${GOVERNANCE_INFRASTRUCTURE_ASK_CLAIM_DISCIPLINE} This is inventory-grounded Ask — not architecture-review “ask review questions” or prior-manifest retrieval. ${GOVERNANCE_INFRASTRUCTURE_ASK_SIMULATOR_STATUS_LABEL} mode uses deterministic demo templates on-page; it is not a production model guarantee.`;

export const GOVERNANCE_INFRASTRUCTURE_ASK_HELP_FOLLOW_UPS_TITLE = "Where to go next" as const;

export const GOVERNANCE_INFRASTRUCTURE_ASK_HELP_SOURCES_INTRO = GOVERNANCE_INFRASTRUCTURE_ASK_SOURCES_INTRO;

/** Help follow-ups — no self-href to the Ask workbench or this help topic. */
export const GOVERNANCE_INFRASTRUCTURE_ASK_HELP_SOURCES: readonly EvidenceSourceLinkWithWhen[] = [
  ...GOVERNANCE_INFRASTRUCTURE_ASK_SOURCES,
  {
    label: "Resource explorer help",
    href: inAppHelpHref("governance-infrastructure-resources"),
    when: "Scope Ask from a resource hub when citations must name one cloud resource",
  },
];
