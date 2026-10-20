import type { EvidenceSourceLinkWithWhen } from "@/lib/evidence-surface-copy";
import {
  GOVERNANCE_INFRASTRUCTURE_DIAGRAM_RECONCILE_CLAIM_DISCIPLINE,
  GOVERNANCE_INFRASTRUCTURE_DIAGRAM_RECONCILE_PAGE_LEAD,
} from "@/lib/governance/governance-infrastructure-copy";
import {
  GOVERNANCE_INFRASTRUCTURE_DIAGRAM_RECONCILE_SOURCES,
  GOVERNANCE_INFRASTRUCTURE_DIAGRAM_RECONCILE_SOURCES_INTRO,
} from "@/lib/governance/governance-infrastructure-evidence-copy";
import { DIAGRAM_RECONCILE_NOTES_DO_NOT_RAISE_BAND_LINE } from "@/lib/infra-evidence/infra-evidence-diagram-reconcile-explanation";
import { inAppHelpHref } from "@/lib/product-documentation-registry";

export const GOVERNANCE_INFRASTRUCTURE_DIAGRAM_RECONCILE_HELP_CANONICAL_PATH =
  "/help/governance-infrastructure-diagram-reconcile" as const;

export const GOVERNANCE_INFRASTRUCTURE_DIAGRAM_RECONCILE_HELP_TOPIC_LABEL =
  "How diagram reconciliation works" as const;

export const GOVERNANCE_INFRASTRUCTURE_DIAGRAM_RECONCILE_HELP_CLAIM_DISCIPLINE_HEADING =
  "What this guide does not cover" as const;

export const GOVERNANCE_INFRASTRUCTURE_DIAGRAM_RECONCILE_HELP_CLAIM_DISCIPLINE =
  `${GOVERNANCE_INFRASTRUCTURE_DIAGRAM_RECONCILE_PAGE_LEAD} ${GOVERNANCE_INFRASTRUCTURE_DIAGRAM_RECONCILE_CLAIM_DISCIPLINE} ${DIAGRAM_RECONCILE_NOTES_DO_NOT_RAISE_BAND_LINE} Correspondence is operational infrastructure evidence — not architecture-review diagram intake, and reconciling or ingesting Mermaid does not seal an approved architecture package.`;

export const GOVERNANCE_INFRASTRUCTURE_DIAGRAM_RECONCILE_HELP_FOLLOW_UPS_TITLE = "Where to go next" as const;

export const GOVERNANCE_INFRASTRUCTURE_DIAGRAM_RECONCILE_HELP_SOURCES_INTRO =
  GOVERNANCE_INFRASTRUCTURE_DIAGRAM_RECONCILE_SOURCES_INTRO;

/** Help follow-ups — no self-href to the reconcile workbench or this help topic. */
export const GOVERNANCE_INFRASTRUCTURE_DIAGRAM_RECONCILE_HELP_SOURCES: readonly EvidenceSourceLinkWithWhen[] = [
  ...GOVERNANCE_INFRASTRUCTURE_DIAGRAM_RECONCILE_SOURCES,
  {
    label: "Inventory diagrams help",
    href: inAppHelpHref("governance-infrastructure-diagrams"),
    when: "Export or inspect inventory diagram views before uploading Mermaid",
  },
  {
    label: "Resource explorer help",
    href: inAppHelpHref("governance-infrastructure-resources"),
    when: "Scope reconciliation to one cloud resource from a resource hub",
  },
];
