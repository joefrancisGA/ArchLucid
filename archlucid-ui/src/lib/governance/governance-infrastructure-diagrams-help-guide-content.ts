import type { HelpMarkdownHeading } from "@/lib/help/help-markdown-headings";
import { HELP_HUB_CANONICAL_PATH, HELP_TOPIC_BREADCRUMB_HUB_LABEL } from "@/lib/help/help-hub-evidence-copy";
import { inAppHelpHref } from "@/lib/product-documentation-registry";
import {
  GOVERNANCE_INFRASTRUCTURE_DIAGRAMS_EMPTY_SNAPSHOTS_BODY,
  GOVERNANCE_INFRASTRUCTURE_DIAGRAMS_NODES_SEED_HINT,
  GOVERNANCE_INFRASTRUCTURE_DIAGRAMS_PAGE_LEAD,
  GOVERNANCE_INFRASTRUCTURE_DIAGRAMS_PAGE_TITLE,
  GOVERNANCE_INFRASTRUCTURE_DIAGRAMS_PNG_BROWSER_FALLBACK_NOTE,
  GOVERNANCE_INFRASTRUCTURE_DIAGRAMS_PNG_EXPORT_ERROR_RECOVERY,
} from "@/lib/governance/governance-infrastructure-copy";
import {
  GOVERNANCE_INFRASTRUCTURE_DIAGRAMS_HELP_CLAIM_DISCIPLINE_HEADING,
  GOVERNANCE_INFRASTRUCTURE_DIAGRAMS_HELP_TOPIC_LABEL,
} from "@/lib/governance/governance-infrastructure-diagrams-help-evidence-copy";
import { infrastructureDiagramReconcilePathForProductLine } from "@/lib/product-line/securenow-infrastructure-routes";
import { infrastructureDiagramsPathForProductLine } from "@/lib/product-line/securenow-infrastructure-diagrams-route";
import { infrastructureResourcesPathForProductLine } from "@/lib/product-line/securenow-infrastructure-resources-route";
import type { ProductLineId } from "@/lib/product-line/product-line-id";

export const GOVERNANCE_INFRASTRUCTURE_DIAGRAMS_HELP_PAGE_EYEBROW = "Help topic" as const;

export const GOVERNANCE_INFRASTRUCTURE_DIAGRAMS_HELP_PAGE_TITLE = GOVERNANCE_INFRASTRUCTURE_DIAGRAMS_PAGE_TITLE;

export const GOVERNANCE_INFRASTRUCTURE_DIAGRAMS_HELP_BREADCRUMB_TOPIC_TITLE = "Inventory diagrams";

export const GOVERNANCE_INFRASTRUCTURE_DIAGRAMS_HELP_PAGE_SUBTITLE = GOVERNANCE_INFRASTRUCTURE_DIAGRAMS_PAGE_LEAD;

export const GOVERNANCE_INFRASTRUCTURE_DIAGRAMS_HELP_PRIMARY_CONTENT_ID =
  "help-governance-infrastructure-diagrams-primary-content" as const;

export const GOVERNANCE_INFRASTRUCTURE_DIAGRAMS_HELP_SKIP_LINK_LABEL = "Skip to inventory diagrams guide" as const;

export const GOVERNANCE_INFRASTRUCTURE_DIAGRAMS_HELP_OVERVIEW =
  "Inventory diagrams render Mermaid views from captured inventory snapshots. When the full leaf graph is too large, partitioned fallback views keep backbone resources visible. Export server PNG when procurement needs a shareable image — browser fallback is honest when server rasterization is unavailable.";

export const GOVERNANCE_INFRASTRUCTURE_DIAGRAMS_HELP_PARTITIONED_BODY = GOVERNANCE_INFRASTRUCTURE_DIAGRAMS_PAGE_LEAD;

export const GOVERNANCE_INFRASTRUCTURE_DIAGRAMS_HELP_PNG_BODY =
  `${GOVERNANCE_INFRASTRUCTURE_DIAGRAMS_PNG_BROWSER_FALLBACK_NOTE} ${GOVERNANCE_INFRASTRUCTURE_DIAGRAMS_PNG_EXPORT_ERROR_RECOVERY.nextStep}`;

export const GOVERNANCE_INFRASTRUCTURE_DIAGRAMS_HELP_FOCUS_BODY = GOVERNANCE_INFRASTRUCTURE_DIAGRAMS_NODES_SEED_HINT;

export const GOVERNANCE_INFRASTRUCTURE_DIAGRAMS_HELP_EMPTY_BODY = GOVERNANCE_INFRASTRUCTURE_DIAGRAMS_EMPTY_SNAPSHOTS_BODY;

export const GOVERNANCE_INFRASTRUCTURE_DIAGRAMS_HELP_HOW_IT_WORKS_STEPS = [
  "Connect Azure or upload inventory and wait for snapshots to capture.",
  "Select a subscription, snapshot, and diagram type, then render the view.",
  "Export server PNG when needed, or open diagram reconciliation when uploaded Mermaid must match inventory.",
] as const;

export const GOVERNANCE_INFRASTRUCTURE_DIAGRAMS_HELP_CLAIM_HEADING_ID =
  "help-governance-infrastructure-diagrams-claim-discipline-heading" as const;

export type GovernanceInfrastructureDiagramsHelpRelatedLink = {
  readonly label: string;
  readonly href: string;
};

export const GOVERNANCE_INFRASTRUCTURE_DIAGRAMS_HELP_RELATED_TOPICS_HEADING_ID =
  "help-governance-infrastructure-diagrams-related-topics" as const;

export const GOVERNANCE_INFRASTRUCTURE_DIAGRAMS_HELP_RELATED_TOPICS_HEADING = "Related topics" as const;

export const GOVERNANCE_INFRASTRUCTURE_DIAGRAMS_HELP_RELATED_LINKS: readonly GovernanceInfrastructureDiagramsHelpRelatedLink[] =
  [
    { label: "Resource explorer", href: inAppHelpHref("governance-infrastructure-resources") },
    { label: "Drift and snapshots", href: inAppHelpHref("governance-infrastructure-drift") },
  ] as const;

export const GOVERNANCE_INFRASTRUCTURE_DIAGRAMS_HELP_HELP_RETURN = {
  label: HELP_TOPIC_BREADCRUMB_HUB_LABEL,
  href: HELP_HUB_CANONICAL_PATH,
} as const;

export const GOVERNANCE_INFRASTRUCTURE_DIAGRAMS_HELP_GUIDE_HEADINGS: readonly HelpMarkdownHeading[] = [
  { level: 2, id: "what-inventory-diagrams-show", title: "What inventory diagrams show" },
  { level: 2, id: "partitioned-fallbacks", title: "Partitioned fallbacks" },
  { level: 2, id: "png-export", title: "PNG export" },
  { level: 2, id: "focus-neighborhood", title: "Focus neighborhood" },
  { level: 2, id: "how-inventory-diagrams-work", title: GOVERNANCE_INFRASTRUCTURE_DIAGRAMS_HELP_TOPIC_LABEL },
  {
    level: 2,
    id: GOVERNANCE_INFRASTRUCTURE_DIAGRAMS_HELP_CLAIM_HEADING_ID,
    title: GOVERNANCE_INFRASTRUCTURE_DIAGRAMS_HELP_CLAIM_DISCIPLINE_HEADING,
  },
  { level: 2, id: "where-to-go-next", title: "Where to go next" },
  {
    level: 2,
    id: GOVERNANCE_INFRASTRUCTURE_DIAGRAMS_HELP_RELATED_TOPICS_HEADING_ID,
    title: GOVERNANCE_INFRASTRUCTURE_DIAGRAMS_HELP_RELATED_TOPICS_HEADING,
  },
];

export function governanceInfrastructureDiagramsHelpPrimaryAction(productLineId: ProductLineId = "architecture") {
  return {
    label: "Open inventory diagrams",
    href: infrastructureDiagramsPathForProductLine(productLineId),
  };
}

export function governanceInfrastructureDiagramsHelpReconcileAction(productLineId: ProductLineId = "architecture") {
  return {
    label: "Open diagram reconciliation",
    href: infrastructureDiagramReconcilePathForProductLine(productLineId),
  };
}

export function governanceInfrastructureDiagramsHelpResourcesAction(productLineId: ProductLineId = "architecture") {
  return {
    label: "Open resource explorer",
    href: infrastructureResourcesPathForProductLine(productLineId),
  };
}
