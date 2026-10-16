import type { HelpMarkdownHeading } from "@/lib/help/help-markdown-headings";
import { HELP_HUB_CANONICAL_PATH, HELP_TOPIC_BREADCRUMB_HUB_LABEL } from "@/lib/help/help-hub-evidence-copy";
import { inAppHelpHref } from "@/lib/product-documentation-registry";
import {
  GOVERNANCE_INFRASTRUCTURE_REMEDIATION_CLAIM_DISCIPLINE,
  GOVERNANCE_INFRASTRUCTURE_REMEDIATION_PAGE_LEAD,
  GOVERNANCE_INFRASTRUCTURE_REMEDIATION_PAGE_TITLE,
} from "@/lib/governance/governance-infrastructure-copy";
import {
  GOVERNANCE_INFRASTRUCTURE_REMEDIATION_HELP_CLAIM_DISCIPLINE_HEADING,
  GOVERNANCE_INFRASTRUCTURE_REMEDIATION_HELP_TOPIC_LABEL,
} from "@/lib/governance/governance-infrastructure-remediation-help-evidence-copy";
import { remediationInstancesPathForProductLine } from "@/lib/product-line/securenow-remediation-instances-route";
import { remediationFactoryPathForProductLine } from "@/lib/product-line/securenow-remediation-factory-route";
import { remediationPatternsPathForProductLine } from "@/lib/product-line/securenow-remediation-patterns-route";
import { infrastructureResourcesPathForProductLine } from "@/lib/product-line/securenow-infrastructure-resources-route";
import type { ProductLineId } from "@/lib/product-line/product-line-id";

export const GOVERNANCE_INFRASTRUCTURE_REMEDIATION_HELP_PAGE_EYEBROW = "Help topic" as const;

export const GOVERNANCE_INFRASTRUCTURE_REMEDIATION_HELP_PAGE_TITLE = GOVERNANCE_INFRASTRUCTURE_REMEDIATION_PAGE_TITLE;

export const GOVERNANCE_INFRASTRUCTURE_REMEDIATION_HELP_BREADCRUMB_TOPIC_TITLE = "Remediation instances";

export const GOVERNANCE_INFRASTRUCTURE_REMEDIATION_HELP_PAGE_SUBTITLE = GOVERNANCE_INFRASTRUCTURE_REMEDIATION_PAGE_LEAD;

export const GOVERNANCE_INFRASTRUCTURE_REMEDIATION_HELP_PRIMARY_CONTENT_ID =
  "help-governance-infrastructure-remediation-primary-content" as const;

export const GOVERNANCE_INFRASTRUCTURE_REMEDIATION_HELP_SKIP_LINK_LABEL =
  "Skip to remediation instances guide" as const;

export const GOVERNANCE_INFRASTRUCTURE_REMEDIATION_HELP_OVERVIEW =
  "The remediation instances workbench tracks waves and instances with advisory-only execute honesty. Use preflight and approval before execute, then verify outcomes against inventory snapshots — the on-page skip link may say “factory” for chrome history, but this route’s job is instance and wave tracking.";

export const GOVERNANCE_INFRASTRUCTURE_REMEDIATION_HELP_EXECUTE_BODY = GOVERNANCE_INFRASTRUCTURE_REMEDIATION_CLAIM_DISCIPLINE;

export const GOVERNANCE_INFRASTRUCTURE_REMEDIATION_HELP_EMPTY_BODY =
  "Remediation instances appear after operational findings and approved patterns exist for your scope. Open remediation factory for ranked findings or remediation patterns when prerequisites are missing.";

export const GOVERNANCE_INFRASTRUCTURE_REMEDIATION_HELP_HOW_IT_WORKS_STEPS = [
  "Filter remediation instances and waves for your scope.",
  "Run preflight and obtain approval before execute.",
  "Follow verify against inventory snapshots after execute — advisory guidance is not a cloud apply.",
] as const;

export const GOVERNANCE_INFRASTRUCTURE_REMEDIATION_HELP_CLAIM_HEADING_ID =
  "help-governance-infrastructure-remediation-claim-discipline-heading" as const;

export type GovernanceInfrastructureRemediationHelpRelatedLink = {
  readonly label: string;
  readonly href: string;
};

export const GOVERNANCE_INFRASTRUCTURE_REMEDIATION_HELP_RELATED_TOPICS_HEADING_ID =
  "help-governance-infrastructure-remediation-related-topics" as const;

export const GOVERNANCE_INFRASTRUCTURE_REMEDIATION_HELP_RELATED_TOPICS_HEADING = "Related topics" as const;

export const GOVERNANCE_INFRASTRUCTURE_REMEDIATION_HELP_RELATED_LINKS: readonly GovernanceInfrastructureRemediationHelpRelatedLink[] =
  [
    { label: "Resource explorer", href: inAppHelpHref("governance-infrastructure-resources") },
    { label: "Drift and snapshots", href: inAppHelpHref("governance-infrastructure-drift") },
  ] as const;

export const GOVERNANCE_INFRASTRUCTURE_REMEDIATION_HELP_HELP_RETURN = {
  label: HELP_TOPIC_BREADCRUMB_HUB_LABEL,
  href: HELP_HUB_CANONICAL_PATH,
} as const;

export const GOVERNANCE_INFRASTRUCTURE_REMEDIATION_HELP_GUIDE_HEADINGS: readonly HelpMarkdownHeading[] = [
  { level: 2, id: "what-remediation-instances-track", title: "What remediation instances track" },
  { level: 2, id: "advisory-execute-honesty", title: "Advisory execute honesty" },
  { level: 2, id: "empty-and-prerequisites", title: "Empty and prerequisites" },
  {
    level: 2,
    id: "how-remediation-instances-work",
    title: GOVERNANCE_INFRASTRUCTURE_REMEDIATION_HELP_TOPIC_LABEL,
  },
  {
    level: 2,
    id: GOVERNANCE_INFRASTRUCTURE_REMEDIATION_HELP_CLAIM_HEADING_ID,
    title: GOVERNANCE_INFRASTRUCTURE_REMEDIATION_HELP_CLAIM_DISCIPLINE_HEADING,
  },
  { level: 2, id: "where-to-go-next", title: "Where to go next" },
  {
    level: 2,
    id: GOVERNANCE_INFRASTRUCTURE_REMEDIATION_HELP_RELATED_TOPICS_HEADING_ID,
    title: GOVERNANCE_INFRASTRUCTURE_REMEDIATION_HELP_RELATED_TOPICS_HEADING,
  },
];

export function governanceInfrastructureRemediationHelpPrimaryAction(productLineId: ProductLineId = "architecture") {
  return {
    label: "Open remediation instances",
    href: remediationInstancesPathForProductLine(productLineId),
  };
}

export function governanceInfrastructureRemediationHelpFactoryAction(productLineId: ProductLineId = "architecture") {
  return {
    label: "Open remediation factory",
    href: remediationFactoryPathForProductLine(productLineId),
  };
}

export function governanceInfrastructureRemediationHelpPatternsAction(productLineId: ProductLineId = "architecture") {
  return {
    label: "Open remediation patterns",
    href: remediationPatternsPathForProductLine(productLineId),
  };
}

export function governanceInfrastructureRemediationHelpResourcesAction(productLineId: ProductLineId = "architecture") {
  return {
    label: "Open resource explorer",
    href: infrastructureResourcesPathForProductLine(productLineId),
  };
}
