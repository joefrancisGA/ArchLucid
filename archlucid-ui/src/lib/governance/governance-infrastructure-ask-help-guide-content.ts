import type { HelpMarkdownHeading } from "@/lib/help/help-markdown-headings";
import { HELP_HUB_CANONICAL_PATH, HELP_TOPIC_BREADCRUMB_HUB_LABEL } from "@/lib/help/help-hub-evidence-copy";
import { inAppHelpHref } from "@/lib/product-documentation-registry";
import {
  GOVERNANCE_INFRASTRUCTURE_ASK_PAGE_LEAD,
  GOVERNANCE_INFRASTRUCTURE_ASK_PAGE_TITLE,
  GOVERNANCE_INFRASTRUCTURE_ASK_SIMULATOR_STATUS_LABEL,
  GOVERNANCE_INFRASTRUCTURE_ASK_UNSCOPED_BODY,
  GOVERNANCE_INFRASTRUCTURE_ASK_UNSCOPED_TITLE,
} from "@/lib/governance/governance-infrastructure-copy";
import {
  GOVERNANCE_INFRASTRUCTURE_ASK_HELP_CLAIM_DISCIPLINE_HEADING,
  GOVERNANCE_INFRASTRUCTURE_ASK_HELP_TOPIC_LABEL,
} from "@/lib/governance/governance-infrastructure-ask-help-evidence-copy";
import { infrastructureAskPathForProductLine } from "@/lib/product-line/securenow-infrastructure-routes";
import { infrastructureResourcesPathForProductLine } from "@/lib/product-line/securenow-infrastructure-resources-route";
import type { ProductLineId } from "@/lib/product-line/product-line-id";

export const GOVERNANCE_INFRASTRUCTURE_ASK_HELP_PAGE_EYEBROW = "Help topic" as const;

export const GOVERNANCE_INFRASTRUCTURE_ASK_HELP_PAGE_TITLE = GOVERNANCE_INFRASTRUCTURE_ASK_PAGE_TITLE;

export const GOVERNANCE_INFRASTRUCTURE_ASK_HELP_BREADCRUMB_TOPIC_TITLE = "Infrastructure Ask";

export const GOVERNANCE_INFRASTRUCTURE_ASK_HELP_PAGE_SUBTITLE = GOVERNANCE_INFRASTRUCTURE_ASK_PAGE_LEAD;

export const GOVERNANCE_INFRASTRUCTURE_ASK_HELP_PRIMARY_CONTENT_ID =
  "help-governance-infrastructure-ask-primary-content" as const;

export const GOVERNANCE_INFRASTRUCTURE_ASK_HELP_SKIP_LINK_LABEL = "Skip to infrastructure Ask guide" as const;

export const GOVERNANCE_INFRASTRUCTURE_ASK_HELP_OVERVIEW =
  "Infrastructure Ask answers grounded questions about structured inventory rows in scope. Follow citation links in each answer; insufficient-evidence outcomes are honest when rows cannot support a claim.";

export const GOVERNANCE_INFRASTRUCTURE_ASK_HELP_CITATIONS_BODY = GOVERNANCE_INFRASTRUCTURE_ASK_PAGE_LEAD;

export const GOVERNANCE_INFRASTRUCTURE_ASK_HELP_UNSCOPED_BODY =
  `${GOVERNANCE_INFRASTRUCTURE_ASK_UNSCOPED_TITLE}. ${GOVERNANCE_INFRASTRUCTURE_ASK_UNSCOPED_BODY}`;

export const GOVERNANCE_INFRASTRUCTURE_ASK_HELP_SIMULATOR_BODY =
  `When ${GOVERNANCE_INFRASTRUCTURE_ASK_SIMULATOR_STATUS_LABEL} appears on the workbench, the answer used a deterministic demo template grounded on cited structured rows — not live production intelligence.`;

export const GOVERNANCE_INFRASTRUCTURE_ASK_HELP_HOW_IT_WORKS_STEPS = [
  "Connect Azure or upload inventory so snapshots exist for your scope.",
  "Open Ask from a resource hub or a scoped link that includes a cloud resource id.",
  "Ask a question, follow citations, and accept insufficient-evidence outcomes when inventory rows cannot support an answer.",
] as const;

export const GOVERNANCE_INFRASTRUCTURE_ASK_HELP_CLAIM_HEADING_ID =
  "help-governance-infrastructure-ask-claim-discipline-heading" as const;

export type GovernanceInfrastructureAskHelpRelatedLink = {
  readonly label: string;
  readonly href: string;
};

export const GOVERNANCE_INFRASTRUCTURE_ASK_HELP_RELATED_TOPICS_HEADING_ID =
  "help-governance-infrastructure-ask-related-topics" as const;

export const GOVERNANCE_INFRASTRUCTURE_ASK_HELP_RELATED_TOPICS_HEADING = "Related topics" as const;

export const GOVERNANCE_INFRASTRUCTURE_ASK_HELP_RELATED_LINKS: readonly GovernanceInfrastructureAskHelpRelatedLink[] = [
  { label: "Resource explorer", href: inAppHelpHref("governance-infrastructure-resources") },
  { label: "Drift and snapshots", href: inAppHelpHref("governance-infrastructure-drift") },
] as const;

export const GOVERNANCE_INFRASTRUCTURE_ASK_HELP_HELP_RETURN = {
  label: HELP_TOPIC_BREADCRUMB_HUB_LABEL,
  href: HELP_HUB_CANONICAL_PATH,
} as const;

export const GOVERNANCE_INFRASTRUCTURE_ASK_HELP_GUIDE_HEADINGS: readonly HelpMarkdownHeading[] = [
  { level: 2, id: "what-infrastructure-ask-shows", title: "What infrastructure Ask shows" },
  { level: 2, id: "citations-and-insufficient-evidence", title: "Citations and insufficient evidence" },
  { level: 2, id: "unscoped-empty", title: "Unscoped empty state" },
  { level: 2, id: "simulator-honesty", title: "Simulator honesty" },
  { level: 2, id: "how-infrastructure-ask-works", title: GOVERNANCE_INFRASTRUCTURE_ASK_HELP_TOPIC_LABEL },
  {
    level: 2,
    id: GOVERNANCE_INFRASTRUCTURE_ASK_HELP_CLAIM_HEADING_ID,
    title: GOVERNANCE_INFRASTRUCTURE_ASK_HELP_CLAIM_DISCIPLINE_HEADING,
  },
  { level: 2, id: "where-to-go-next", title: "Where to go next" },
  {
    level: 2,
    id: GOVERNANCE_INFRASTRUCTURE_ASK_HELP_RELATED_TOPICS_HEADING_ID,
    title: GOVERNANCE_INFRASTRUCTURE_ASK_HELP_RELATED_TOPICS_HEADING,
  },
];

export function governanceInfrastructureAskHelpPrimaryAction(productLineId: ProductLineId = "architecture") {
  return {
    label: "Open infrastructure Ask",
    href: infrastructureAskPathForProductLine(productLineId),
  };
}

export function governanceInfrastructureAskHelpResourcesAction(productLineId: ProductLineId = "architecture") {
  return {
    label: "Open resource explorer",
    href: infrastructureResourcesPathForProductLine(productLineId),
  };
}
