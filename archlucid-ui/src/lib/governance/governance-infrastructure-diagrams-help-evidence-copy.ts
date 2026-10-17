import type { EvidenceSourceLinkWithWhen } from "@/lib/evidence-surface-copy";
import {
  GOVERNANCE_INFRASTRUCTURE_DIAGRAMS_PAGE_LEAD,
  GOVERNANCE_INFRASTRUCTURE_DIAGRAMS_PNG_BROWSER_FALLBACK_NOTE,
} from "@/lib/governance/governance-infrastructure-copy";
import {
  GOVERNANCE_INFRASTRUCTURE_DIAGRAMS_SOURCES,
  GOVERNANCE_INFRASTRUCTURE_DIAGRAMS_SOURCES_INTRO,
} from "@/lib/governance/governance-infrastructure-evidence-copy";
import { inAppHelpHref } from "@/lib/product-documentation-registry";

export const GOVERNANCE_INFRASTRUCTURE_DIAGRAMS_HELP_CANONICAL_PATH =
  "/help/governance-infrastructure-diagrams" as const;

export const GOVERNANCE_INFRASTRUCTURE_DIAGRAMS_HELP_TOPIC_LABEL = "How inventory diagrams work" as const;

export const GOVERNANCE_INFRASTRUCTURE_DIAGRAMS_HELP_CLAIM_DISCIPLINE_HEADING =
  "What this guide does not cover" as const;

export const GOVERNANCE_INFRASTRUCTURE_DIAGRAMS_HELP_CLAIM_DISCIPLINE =
  `${GOVERNANCE_INFRASTRUCTURE_DIAGRAMS_PAGE_LEAD} ${GOVERNANCE_INFRASTRUCTURE_DIAGRAMS_PNG_BROWSER_FALLBACK_NOTE} These renders are inventory evidence — not sealed architecture packages.`;

export const GOVERNANCE_INFRASTRUCTURE_DIAGRAMS_HELP_FOLLOW_UPS_TITLE = "Where to go next" as const;

export const GOVERNANCE_INFRASTRUCTURE_DIAGRAMS_HELP_SOURCES_INTRO =
  GOVERNANCE_INFRASTRUCTURE_DIAGRAMS_SOURCES_INTRO;

/** Help follow-ups — no self-href to the diagrams workbench or this help topic. */
export const GOVERNANCE_INFRASTRUCTURE_DIAGRAMS_HELP_SOURCES: readonly EvidenceSourceLinkWithWhen[] = [
  ...GOVERNANCE_INFRASTRUCTURE_DIAGRAMS_SOURCES,
  {
    label: "Resource explorer help",
    href: inAppHelpHref("governance-infrastructure-resources"),
    when: "Open Focus neighborhood from a resource hub or explorer row",
  },
];
