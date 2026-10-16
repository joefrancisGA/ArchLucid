import type { HelpMarkdownHeading } from "@/lib/help/help-markdown-headings";
import { HELP_HUB_CANONICAL_PATH, HELP_TOPIC_BREADCRUMB_HUB_LABEL } from "@/lib/help/help-hub-evidence-copy";
import { inAppHelpHref } from "@/lib/product-documentation-registry";
import {
  GOVERNANCE_INFRASTRUCTURE_TERRAFORM_ADVISORY_RECONSTRUCTED_TAG,
  GOVERNANCE_INFRASTRUCTURE_TERRAFORM_APPLY_SAFETY_WARNING,
  GOVERNANCE_INFRASTRUCTURE_TERRAFORM_PAGE_LEAD,
  GOVERNANCE_INFRASTRUCTURE_TERRAFORM_PAGE_TITLE,
  GOVERNANCE_INFRASTRUCTURE_TERRAFORM_UNSCOPED_BODY,
} from "@/lib/governance/governance-infrastructure-copy";
import {
  GOVERNANCE_INFRASTRUCTURE_TERRAFORM_HELP_CLAIM_DISCIPLINE_HEADING,
  GOVERNANCE_INFRASTRUCTURE_TERRAFORM_HELP_TOPIC_LABEL,
} from "@/lib/governance/governance-infrastructure-terraform-help-evidence-copy";
import {
  infrastructureDriftPathForProductLine,
  infrastructureTerraformPathForProductLine,
} from "@/lib/product-line/securenow-infrastructure-routes";
import { infrastructureResourcesPathForProductLine } from "@/lib/product-line/securenow-infrastructure-resources-route";
import type { ProductLineId } from "@/lib/product-line/product-line-id";

export const GOVERNANCE_INFRASTRUCTURE_TERRAFORM_HELP_PAGE_EYEBROW = "Help topic" as const;

export const GOVERNANCE_INFRASTRUCTURE_TERRAFORM_HELP_PAGE_TITLE = GOVERNANCE_INFRASTRUCTURE_TERRAFORM_PAGE_TITLE;

export const GOVERNANCE_INFRASTRUCTURE_TERRAFORM_HELP_BREADCRUMB_TOPIC_TITLE = "Advisory Terraform";

export const GOVERNANCE_INFRASTRUCTURE_TERRAFORM_HELP_PAGE_SUBTITLE = GOVERNANCE_INFRASTRUCTURE_TERRAFORM_PAGE_LEAD;

export const GOVERNANCE_INFRASTRUCTURE_TERRAFORM_HELP_PRIMARY_CONTENT_ID =
  "help-governance-infrastructure-terraform-primary-content" as const;

export const GOVERNANCE_INFRASTRUCTURE_TERRAFORM_HELP_SKIP_LINK_LABEL = "Skip to advisory Terraform guide" as const;

export const GOVERNANCE_INFRASTRUCTURE_TERRAFORM_HELP_OVERVIEW =
  "The Terraform mapping workbench shows advisory Terraform addresses reconstructed from inventory snapshots for a scoped cloud resource. It is not original Terraform from your repository and must not be applied to the cloud without human review.";

export const GOVERNANCE_INFRASTRUCTURE_TERRAFORM_HELP_SCOPE_BODY = GOVERNANCE_INFRASTRUCTURE_TERRAFORM_UNSCOPED_BODY;

export const GOVERNANCE_INFRASTRUCTURE_TERRAFORM_HELP_EXPORT_BODY =
  `${GOVERNANCE_INFRASTRUCTURE_TERRAFORM_ADVISORY_RECONSTRUCTED_TAG}. ${GOVERNANCE_INFRASTRUCTURE_TERRAFORM_APPLY_SAFETY_WARNING}`;

export const GOVERNANCE_INFRASTRUCTURE_TERRAFORM_HELP_HOW_IT_WORKS_STEPS = [
  "Connect Azure or upload inventory so snapshots exist for your scope.",
  "Open Terraform mapping from a resource hub or pick a cloud resource in the workbench.",
  "Inspect advisory addresses, then export only after human review — use drift compare when property-level changes need context.",
] as const;

export const GOVERNANCE_INFRASTRUCTURE_TERRAFORM_HELP_CLAIM_HEADING_ID =
  "help-governance-infrastructure-terraform-claim-discipline-heading" as const;

export type GovernanceInfrastructureTerraformHelpRelatedLink = {
  readonly label: string;
  readonly href: string;
};

export const GOVERNANCE_INFRASTRUCTURE_TERRAFORM_HELP_RELATED_TOPICS_HEADING_ID =
  "help-governance-infrastructure-terraform-related-topics" as const;

export const GOVERNANCE_INFRASTRUCTURE_TERRAFORM_HELP_RELATED_TOPICS_HEADING = "Related topics" as const;

export const GOVERNANCE_INFRASTRUCTURE_TERRAFORM_HELP_RELATED_LINKS: readonly GovernanceInfrastructureTerraformHelpRelatedLink[] =
  [
    { label: "Drift and snapshots", href: inAppHelpHref("governance-infrastructure-drift") },
    { label: "Resource explorer", href: inAppHelpHref("governance-infrastructure-resources") },
  ] as const;

export const GOVERNANCE_INFRASTRUCTURE_TERRAFORM_HELP_HELP_RETURN = {
  label: HELP_TOPIC_BREADCRUMB_HUB_LABEL,
  href: HELP_HUB_CANONICAL_PATH,
} as const;

export const GOVERNANCE_INFRASTRUCTURE_TERRAFORM_HELP_GUIDE_HEADINGS: readonly HelpMarkdownHeading[] = [
  { level: 2, id: "what-advisory-terraform-shows", title: "What advisory Terraform shows" },
  { level: 2, id: "resource-scope", title: "Resource scope" },
  { level: 2, id: "export-and-apply-honesty", title: "Export and apply honesty" },
  { level: 2, id: "how-advisory-terraform-works", title: GOVERNANCE_INFRASTRUCTURE_TERRAFORM_HELP_TOPIC_LABEL },
  {
    level: 2,
    id: GOVERNANCE_INFRASTRUCTURE_TERRAFORM_HELP_CLAIM_HEADING_ID,
    title: GOVERNANCE_INFRASTRUCTURE_TERRAFORM_HELP_CLAIM_DISCIPLINE_HEADING,
  },
  { level: 2, id: "where-to-go-next", title: "Where to go next" },
  {
    level: 2,
    id: GOVERNANCE_INFRASTRUCTURE_TERRAFORM_HELP_RELATED_TOPICS_HEADING_ID,
    title: GOVERNANCE_INFRASTRUCTURE_TERRAFORM_HELP_RELATED_TOPICS_HEADING,
  },
];

export function governanceInfrastructureTerraformHelpPrimaryAction(productLineId: ProductLineId = "architecture") {
  return {
    label: "Open Terraform mapping",
    href: infrastructureTerraformPathForProductLine(productLineId),
  };
}

export function governanceInfrastructureTerraformHelpDriftAction(productLineId: ProductLineId = "architecture") {
  return {
    label: "Open drift workbench",
    href: infrastructureDriftPathForProductLine(productLineId),
  };
}

export function governanceInfrastructureTerraformHelpResourcesAction(productLineId: ProductLineId = "architecture") {
  return {
    label: "Open resource explorer",
    href: infrastructureResourcesPathForProductLine(productLineId),
  };
}
