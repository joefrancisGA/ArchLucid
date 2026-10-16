import type { HelpMarkdownHeading } from "@/lib/help/help-markdown-headings";
import { HELP_HUB_CANONICAL_PATH, HELP_TOPIC_BREADCRUMB_HUB_LABEL } from "@/lib/help/help-hub-evidence-copy";
import { inAppHelpHref } from "@/lib/product-documentation-registry";
import {
  GOVERNANCE_INFRASTRUCTURE_RESOURCE_HUB_PAGE_LEAD,
  GOVERNANCE_INFRASTRUCTURE_RESOURCES_NAME_PREFIX_LABEL,
  GOVERNANCE_INFRASTRUCTURE_RESOURCES_PAGE_LEAD,
  GOVERNANCE_INFRASTRUCTURE_RESOURCES_PAGE_TITLE,
  GOVERNANCE_INFRASTRUCTURE_RESOURCES_RESOURCE_GROUP_LABEL,
  GOVERNANCE_INFRASTRUCTURE_RESOURCES_RESOURCE_TYPE_LABEL,
  GOVERNANCE_INFRASTRUCTURE_RESOURCES_SORT_PAGE_LOCAL_DISCLOSURE,
} from "@/lib/governance/governance-infrastructure-copy";
import {
  GOVERNANCE_INFRASTRUCTURE_RESOURCES_HELP_CLAIM_DISCIPLINE_HEADING,
  GOVERNANCE_INFRASTRUCTURE_RESOURCES_HELP_TOPIC_LABEL,
} from "@/lib/governance/governance-infrastructure-resources-help-evidence-copy";
import { GOVERNANCE_INFRASTRUCTURE_DRIFT_PATH } from "@/lib/governance/governance-infrastructure-route-paths";
import { infrastructureExtractUploadPathForProductLine } from "@/lib/product-line/securenow-infrastructure-routes";
import { infrastructureResourcesPathForProductLine } from "@/lib/product-line/securenow-infrastructure-resources-route";
import type { ProductLineId } from "@/lib/product-line/product-line-id";

export const GOVERNANCE_INFRASTRUCTURE_RESOURCES_HELP_PAGE_EYEBROW = "Help topic" as const;

export const GOVERNANCE_INFRASTRUCTURE_RESOURCES_HELP_PAGE_TITLE = GOVERNANCE_INFRASTRUCTURE_RESOURCES_PAGE_TITLE;

export const GOVERNANCE_INFRASTRUCTURE_RESOURCES_HELP_BREADCRUMB_TOPIC_TITLE = "Resource explorer";

export const GOVERNANCE_INFRASTRUCTURE_RESOURCES_HELP_PAGE_SUBTITLE = GOVERNANCE_INFRASTRUCTURE_RESOURCES_PAGE_LEAD;

export const GOVERNANCE_INFRASTRUCTURE_RESOURCES_HELP_PRIMARY_CONTENT_ID =
  "help-governance-infrastructure-resources-primary-content" as const;

export const GOVERNANCE_INFRASTRUCTURE_RESOURCES_HELP_SKIP_LINK_LABEL = "Skip to resource explorer guide" as const;

export const GOVERNANCE_INFRASTRUCTURE_RESOURCES_HELP_OVERVIEW =
  "Resource explorer lists cloud resources from captured inventory. Filter by name prefix, resource type, or resource group, then open a resource evidence hub for drift, findings, remediation, diagram correspondence, Terraform mapping, and audit lineage scoped to one resource.";

export const GOVERNANCE_INFRASTRUCTURE_RESOURCES_HELP_HUB_SECTION_BODY = GOVERNANCE_INFRASTRUCTURE_RESOURCE_HUB_PAGE_LEAD;

export const GOVERNANCE_INFRASTRUCTURE_RESOURCES_HELP_FILTERS_BODY =
  `Use ${GOVERNANCE_INFRASTRUCTURE_RESOURCES_NAME_PREFIX_LABEL}, ${GOVERNANCE_INFRASTRUCTURE_RESOURCES_RESOURCE_TYPE_LABEL}, and ${GOVERNANCE_INFRASTRUCTURE_RESOURCES_RESOURCE_GROUP_LABEL} filters to narrow large inventories. ${GOVERNANCE_INFRASTRUCTURE_RESOURCES_SORT_PAGE_LOCAL_DISCLOSURE} Snapshot context appears on scoped links only — confirm inventory as-of labels before citing evidence.`;

export const GOVERNANCE_INFRASTRUCTURE_RESOURCES_HELP_HOW_IT_WORKS_STEPS = [
  "Connect Azure or upload inventory with extract and upload so snapshots exist.",
  "Filter the resource list, then open a row to load the evidence hub for that cloud resource.",
  "Use hub tabs and audit lineage lookup when buyers need assessment, snapshot, and control IDs.",
] as const;

export const GOVERNANCE_INFRASTRUCTURE_RESOURCES_HELP_CLAIM_HEADING_ID =
  "help-governance-infrastructure-resources-claim-discipline-heading" as const;

export type GovernanceInfrastructureResourcesHelpRelatedLink = {
  readonly label: string;
  readonly href: string;
};

export const GOVERNANCE_INFRASTRUCTURE_RESOURCES_HELP_RELATED_TOPICS_HEADING_ID =
  "help-governance-infrastructure-resources-related-topics" as const;

export const GOVERNANCE_INFRASTRUCTURE_RESOURCES_HELP_RELATED_TOPICS_HEADING = "Related topics" as const;

export const GOVERNANCE_INFRASTRUCTURE_RESOURCES_HELP_RELATED_LINKS: readonly GovernanceInfrastructureResourcesHelpRelatedLink[] =
  [
    { label: "Drift and snapshots", href: inAppHelpHref("governance-infrastructure-drift") },
    { label: "Connect Azure securely", href: inAppHelpHref("cloud-connections-azure") },
    { label: "Drift workbench", href: GOVERNANCE_INFRASTRUCTURE_DRIFT_PATH },
  ] as const;

export const GOVERNANCE_INFRASTRUCTURE_RESOURCES_HELP_HELP_RETURN = {
  label: HELP_TOPIC_BREADCRUMB_HUB_LABEL,
  href: HELP_HUB_CANONICAL_PATH,
} as const;

export const GOVERNANCE_INFRASTRUCTURE_RESOURCES_HELP_GUIDE_HEADINGS: readonly HelpMarkdownHeading[] = [
  { level: 2, id: "what-resource-explorer-shows", title: "What resource explorer shows" },
  { level: 2, id: "resource-evidence-hub", title: "Resource evidence hub" },
  { level: 2, id: "using-filters", title: "Using filters" },
  { level: 2, id: "how-resource-explorer-works", title: GOVERNANCE_INFRASTRUCTURE_RESOURCES_HELP_TOPIC_LABEL },
  {
    level: 2,
    id: GOVERNANCE_INFRASTRUCTURE_RESOURCES_HELP_CLAIM_HEADING_ID,
    title: GOVERNANCE_INFRASTRUCTURE_RESOURCES_HELP_CLAIM_DISCIPLINE_HEADING,
  },
  { level: 2, id: "where-to-go-next", title: "Where to go next" },
  {
    level: 2,
    id: GOVERNANCE_INFRASTRUCTURE_RESOURCES_HELP_RELATED_TOPICS_HEADING_ID,
    title: GOVERNANCE_INFRASTRUCTURE_RESOURCES_HELP_RELATED_TOPICS_HEADING,
  },
];

export function governanceInfrastructureResourcesHelpPrimaryAction(productLineId: ProductLineId = "architecture") {
  return {
    label: "Open resource explorer",
    href: infrastructureResourcesPathForProductLine(productLineId),
  };
}

export function governanceInfrastructureResourcesHelpInventoryAction(productLineId: ProductLineId = "architecture") {
  return {
    label: "Extract and upload",
    href: infrastructureExtractUploadPathForProductLine(productLineId),
  };
}
