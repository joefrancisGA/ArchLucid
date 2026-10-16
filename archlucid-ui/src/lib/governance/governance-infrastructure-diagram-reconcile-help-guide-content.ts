import type { HelpMarkdownHeading } from "@/lib/help/help-markdown-headings";
import { HELP_HUB_CANONICAL_PATH, HELP_TOPIC_BREADCRUMB_HUB_LABEL } from "@/lib/help/help-hub-evidence-copy";
import { inAppHelpHref } from "@/lib/product-documentation-registry";
import {
  GOVERNANCE_INFRASTRUCTURE_DIAGRAM_RECONCILE_CLAIM_DISCIPLINE,
  GOVERNANCE_INFRASTRUCTURE_DIAGRAM_RECONCILE_NO_SAVED_RECONCILIATION_DESCRIPTION,
  GOVERNANCE_INFRASTRUCTURE_DIAGRAM_RECONCILE_PAGE_LEAD,
  GOVERNANCE_INFRASTRUCTURE_DIAGRAM_RECONCILE_PAGE_TITLE,
} from "@/lib/governance/governance-infrastructure-copy";
import {
  GOVERNANCE_INFRASTRUCTURE_DIAGRAM_RECONCILE_HELP_CLAIM_DISCIPLINE_HEADING,
  GOVERNANCE_INFRASTRUCTURE_DIAGRAM_RECONCILE_HELP_TOPIC_LABEL,
} from "@/lib/governance/governance-infrastructure-diagram-reconcile-help-evidence-copy";
import { DIAGRAM_RECONCILE_NOTES_DO_NOT_RAISE_BAND_LINE } from "@/lib/infra-evidence/infra-evidence-diagram-reconcile-explanation";
import { infrastructureDiagramReconcilePathForProductLine } from "@/lib/product-line/securenow-infrastructure-routes";
import { infrastructureDiagramsPathForProductLine } from "@/lib/product-line/securenow-infrastructure-diagrams-route";
import { infrastructureResourcesPathForProductLine } from "@/lib/product-line/securenow-infrastructure-resources-route";
import type { ProductLineId } from "@/lib/product-line/product-line-id";

export const GOVERNANCE_INFRASTRUCTURE_DIAGRAM_RECONCILE_HELP_PAGE_EYEBROW = "Help topic" as const;

export const GOVERNANCE_INFRASTRUCTURE_DIAGRAM_RECONCILE_HELP_PAGE_TITLE =
  GOVERNANCE_INFRASTRUCTURE_DIAGRAM_RECONCILE_PAGE_TITLE;

export const GOVERNANCE_INFRASTRUCTURE_DIAGRAM_RECONCILE_HELP_BREADCRUMB_TOPIC_TITLE = "Diagram reconciliation";

export const GOVERNANCE_INFRASTRUCTURE_DIAGRAM_RECONCILE_HELP_PAGE_SUBTITLE =
  GOVERNANCE_INFRASTRUCTURE_DIAGRAM_RECONCILE_PAGE_LEAD;

export const GOVERNANCE_INFRASTRUCTURE_DIAGRAM_RECONCILE_HELP_PRIMARY_CONTENT_ID =
  "help-governance-infrastructure-diagram-reconcile-primary-content" as const;

export const GOVERNANCE_INFRASTRUCTURE_DIAGRAM_RECONCILE_HELP_SKIP_LINK_LABEL =
  "Skip to diagram reconciliation guide" as const;

export const GOVERNANCE_INFRASTRUCTURE_DIAGRAM_RECONCILE_HELP_OVERVIEW =
  "Diagram reconciliation compares an ingested Mermaid diagram model against an Azure inventory snapshot and lists explainable correspondence rows. Use it when buyers need to see what matches, conflicts, or is missing — not when starting architecture-review evidence intake.";

export const GOVERNANCE_INFRASTRUCTURE_DIAGRAM_RECONCILE_HELP_EMPTY_BODY =
  GOVERNANCE_INFRASTRUCTURE_DIAGRAM_RECONCILE_NO_SAVED_RECONCILIATION_DESCRIPTION;

export const GOVERNANCE_INFRASTRUCTURE_DIAGRAM_RECONCILE_HELP_CORRESPONDENCE_BODY =
  `${GOVERNANCE_INFRASTRUCTURE_DIAGRAM_RECONCILE_CLAIM_DISCIPLINE} ${DIAGRAM_RECONCILE_NOTES_DO_NOT_RAISE_BAND_LINE}`;

export const GOVERNANCE_INFRASTRUCTURE_DIAGRAM_RECONCILE_HELP_PREREQUISITE_BODY =
  "Correspondence rows appear after both an inventory snapshot and an ingested diagram exist. Connect Azure or upload inventory with extract and upload authority, then ingest Mermaid text to the review record scope you are reconciling.";

export const GOVERNANCE_INFRASTRUCTURE_DIAGRAM_RECONCILE_HELP_HOW_IT_WORKS_STEPS = [
  "Connect Azure or upload inventory so snapshots exist for your scope.",
  "Ingest Mermaid diagram text, then select the sealed run and inventory snapshot to reconcile.",
  "Inspect correspondence rows — AI rationale appears only on Probable or Unknown matches — then open diagrams or resource explorer when scope needs narrowing.",
] as const;

export const GOVERNANCE_INFRASTRUCTURE_DIAGRAM_RECONCILE_HELP_CLAIM_HEADING_ID =
  "help-governance-infrastructure-diagram-reconcile-claim-discipline-heading" as const;

export type GovernanceInfrastructureDiagramReconcileHelpRelatedLink = {
  readonly label: string;
  readonly href: string;
};

export const GOVERNANCE_INFRASTRUCTURE_DIAGRAM_RECONCILE_HELP_RELATED_TOPICS_HEADING_ID =
  "help-governance-infrastructure-diagram-reconcile-related-topics" as const;

export const GOVERNANCE_INFRASTRUCTURE_DIAGRAM_RECONCILE_HELP_RELATED_TOPICS_HEADING = "Related topics" as const;

export const GOVERNANCE_INFRASTRUCTURE_DIAGRAM_RECONCILE_HELP_RELATED_LINKS: readonly GovernanceInfrastructureDiagramReconcileHelpRelatedLink[] =
  [
    { label: "Inventory diagrams", href: inAppHelpHref("governance-infrastructure-diagrams") },
    { label: "Resource explorer", href: inAppHelpHref("governance-infrastructure-resources") },
  ] as const;

export const GOVERNANCE_INFRASTRUCTURE_DIAGRAM_RECONCILE_HELP_HELP_RETURN = {
  label: HELP_TOPIC_BREADCRUMB_HUB_LABEL,
  href: HELP_HUB_CANONICAL_PATH,
} as const;

export const GOVERNANCE_INFRASTRUCTURE_DIAGRAM_RECONCILE_HELP_GUIDE_HEADINGS: readonly HelpMarkdownHeading[] = [
  { level: 2, id: "what-diagram-reconciliation-shows", title: "What diagram reconciliation shows" },
  { level: 2, id: "correspondence-rows", title: "Correspondence rows" },
  { level: 2, id: "empty-and-prerequisites", title: "Empty and prerequisites" },
  { level: 2, id: "how-diagram-reconciliation-works", title: GOVERNANCE_INFRASTRUCTURE_DIAGRAM_RECONCILE_HELP_TOPIC_LABEL },
  {
    level: 2,
    id: GOVERNANCE_INFRASTRUCTURE_DIAGRAM_RECONCILE_HELP_CLAIM_HEADING_ID,
    title: GOVERNANCE_INFRASTRUCTURE_DIAGRAM_RECONCILE_HELP_CLAIM_DISCIPLINE_HEADING,
  },
  { level: 2, id: "where-to-go-next", title: "Where to go next" },
  {
    level: 2,
    id: GOVERNANCE_INFRASTRUCTURE_DIAGRAM_RECONCILE_HELP_RELATED_TOPICS_HEADING_ID,
    title: GOVERNANCE_INFRASTRUCTURE_DIAGRAM_RECONCILE_HELP_RELATED_TOPICS_HEADING,
  },
];

export function governanceInfrastructureDiagramReconcileHelpPrimaryAction(
  productLineId: ProductLineId = "architecture",
) {
  return {
    label: "Open diagram reconciliation",
    href: infrastructureDiagramReconcilePathForProductLine(productLineId),
  };
}

export function governanceInfrastructureDiagramReconcileHelpDiagramsAction(
  productLineId: ProductLineId = "architecture",
) {
  return {
    label: "Open inventory diagrams",
    href: infrastructureDiagramsPathForProductLine(productLineId),
  };
}

export function governanceInfrastructureDiagramReconcileHelpResourcesAction(
  productLineId: ProductLineId = "architecture",
) {
  return {
    label: "Open resource explorer",
    href: infrastructureResourcesPathForProductLine(productLineId),
  };
}
