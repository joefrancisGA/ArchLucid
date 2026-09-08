import { GOVERNANCE_POLICY_PACKS_PATH } from "@/lib/governance/governance-route-paths";
import { inAppHelpHref } from "@/lib/product-documentation-registry";
import { CUSTOMER_INTAKE_SAMPLE_RUN_ID } from "@/lib/samples/customer-intake-modernization/definition";

import type { HelpSearchPanelGroup, HelpSearchPanelTopic } from "@/lib/help/help-search-panel-catalog";

const HELP_SEARCH_PANEL_SUPPORT_FOOTER_LABEL = "Contact support" as const;

export const START_HERE_TOPICS: readonly HelpSearchPanelTopic[] = [
  {
    id: "getting-started-help",
    title: "Getting started",
    description: "Learn how ArchLucid turns architecture evidence into review findings and export-ready outputs.",
    keywords: ["getting started", "concepts", "overview", "introduction"],
    action: { kind: "route", href: "/help/getting-started", helpSlug: "getting-started" },
  },
  {
    id: "authentication-sign-in",
    title: "Authentication and sign-in",
    description: "Work or school accounts, email one-time codes, invitations, SSO, and account recovery.",
    keywords: ["sign in", "authentication", "email code", "sso", "invitation", "recovery", "passwordless"],
    action: { kind: "route", href: "/help/authentication-sign-in", helpSlug: "authentication-sign-in" },
  },
  {
    id: "how-archlucid-works",
    title: "How ArchLucid works",
    description: "Product workflow from architecture evidence through findings, decisions, approval, and exports.",
    keywords: ["how it works", "workflow", "review flow", "evidence", "exports", "approval"],
    action: { kind: "route", href: "/help/getting-started#how-archlucid-works", helpSlug: "getting-started" },
  },
  {
    id: "choose-your-next-step",
    title: "Choose your next step",
    description: "Map your goal — evaluate, pilot, procurement, sponsor output, or engineering support — to one primary action.",
    keywords: ["path chooser", "next step", "evaluate", "pilot", "procurement", "sponsor", "engineering support"],
    action: { kind: "route", href: "/help/choose-your-next-step", helpSlug: "choose-your-next-step" },
  },
  {
    id: "first-review-guide",
    // TB-1047 / TB-1374 / TB-1377: one canonical first-review guide; wizard reference stays on review-guide.
    title: "Your first architecture review",
    description: "Step-by-step: start a review, add evidence, complete the architecture review, finalize outputs, and share results.",
    keywords: ["first review", "review guide", "new review", "architecture context", "getting started"],
    action: {
      kind: "route",
      href: "/help/first-architecture-review",
      helpSlug: "first-architecture-review",
    },
  },
  {
    id: "review-guide",
    // TB-1047: disambiguate from "First-hour review path" (first-review-guide).
    title: "Review wizard reference",
    description: "Wizard field reference: scope, evidence upload, review settings, and finalize options.",
    keywords: ["review guide", "wizard", "review fields", "scope", "evidence upload", "finalize"],
    action: { kind: "route", href: "/help/review-guide", helpSlug: "review-guide" },
  },
  {
    id: "product-faq",
    title: "Product FAQ",
    description: "Evaluation, pricing, evidence, approval, and security answers for architects and sponsors.",
    keywords: ["faq", "evaluation", "pricing", "trial", "architect license", "security", "azure", "aws", "gcp"],
    action: { kind: "route", href: "/faq", helpSlug: null },
  },
  {
    id: "glossary",
    title: "Glossary",
    description: "Definitions for review, evidence, approval, and organization terms used in ArchLucid.",
    keywords: ["glossary", "terms", "definitions", "finding", "risk", "control", "review", "evidence trail"],
    action: { kind: "route", href: "/help/glossary", helpSlug: "glossary" },
  },
  {
    id: "create-first-review",
    title: "Create your first review",
    description: "Start with a brief, diagram, IaC file, or evidence ZIP.",
    keywords: ["create", "new review", "wizard", "intake", "first review"],
    action: { kind: "route", href: "/architecture/reviews/new", helpSlug: null },
  },
  {
    id: "sample-review",
    title: "Run a sample review",
    description: "See how ArchLucid turns evidence into findings and review artifacts.",
    keywords: ["sample", "example", "customer intake", "enterprise intake", "demo review", "walkthrough"],
    action: {
      kind: "route",
      href: `/architecture/reviews/${CUSTOMER_INTAKE_SAMPLE_RUN_ID}`,
      helpSlug: null,
    },
  },
];

export const REVIEW_WORK_TOPICS: readonly HelpSearchPanelTopic[] = [
  {
    id: "upload-evidence",
    title: "Upload architecture evidence",
    description: "Attach diagrams, IaC, cloud exports, screenshots, and scope notes.",
    keywords: ["evidence", "upload", "zip", "azure", "intake", "diagram", "iac"],
    action: { kind: "route", href: "/help/evidence-intake", helpSlug: "evidence-intake" },
  },
  {
    id: "review-findings",
    title: "Review findings and evidence trail",
    description: "Trace findings to evidence, rationale, and source artifacts.",
    keywords: ["findings", "evidence trail", "provenance", "graph", "trace"],
    action: { kind: "route", href: "/help/evidence-trail", helpSlug: "evidence-trail" },
  },
  {
    id: "finalize-review",
    title: "Finalize a review",
    description: "Create the finalized review record and export deliverables.",
    keywords: ["finalize", "commit", "signed", "export", "deliverables"],
    action: { kind: "route", href: "/help/governance-approval", helpSlug: "governance-approval" },
  },
  {
    id: "review-artifacts",
    title: "Review artifacts and proof packet",
    description: "Download outputs for sponsors, procurement, or audit.",
    keywords: ["proof packet", "artifacts", "bundle", "audit", "sponsor export", "deliverables"],
    action: { kind: "route", href: "/help/review-packages", helpSlug: "review-packages" },
  },
];

export const INSIGHTS_TOPICS: readonly HelpSearchPanelTopic[] = [
  {
    id: "improvement-planning-help",
    title: "Improvement planning",
    description: "Convert review feedback into recurring themes, prioritized plans, and exportable summaries.",
    keywords: ["improvement planning", "themes", "plans", "pilot feedback", "product triage", "export"],
    action: { kind: "route", href: "/help/improvement-planning", helpSlug: "improvement-planning" },
  },
];

export const GOVERNANCE_TOPICS: readonly HelpSearchPanelTopic[] = [
  {
    id: "governance-workflow",
    title: "Approval workflow",
    description: "Approve, reject, promote, or monitor reviews.",
    keywords: ["governance", "approval", "promote", "workflow", "disposition"],
    action: { kind: "route", href: "/help/governance-approval", helpSlug: "governance-approval" },
  },
  {
    id: "risk-register",
    title: "Findings",
    description: "Track accepted risks, owners, exceptions, and follow-up.",
    keywords: ["risk", "register", "exceptions", "accepted risk", "findings queue"],
    action: { kind: "route", href: "/governance/findings", helpSlug: null },
  },
  {
    id: "policy-packs",
    title: "Policy packs",
    description: "Understand which standards and rules were applied.",
    keywords: ["policy", "packs", "compliance", "rules", "standards"],
    action: { kind: "route", href: GOVERNANCE_POLICY_PACKS_PATH, helpSlug: null },
  },
];

export const SETUP_TOPICS: readonly HelpSearchPanelTopic[] = [
  {
    id: "integration-readiness",
    title: "Integration readiness",
    description: "See which notification, ticketing, publishing, and delivery integrations are ready or optional.",
    keywords: ["integration", "readiness", "teams", "slack", "jira", "servicenow", "webhooks", "setup"],
    action: { kind: "route", href: "/administration/connection-status", helpSlug: "integration-readiness" },
  },
  {
    id: "cloud-connections",
    title: "Cloud connections",
    description: "Connect Azure, AWS, or GCP for scheduled read-only evidence collection.",
    keywords: ["cloud", "azure", "aws", "gcp", "connection", "evidence collection"],
    action: { kind: "route", href: "/integrations/cloud-connections", helpSlug: "cloud-connections" },
  },
  {
    id: "connect-azure",
    title: "Connect Azure securely",
    description: "Workload identity federation, read-only roles, and connection validation.",
    keywords: ["azure", "federation", "workload identity", "permissions"],
    action: { kind: "route", href: inAppHelpHref("cloud-connections-azure"), helpSlug: "cloud-connections-azure" },
  },
  {
    id: "azure-permissions",
    title: "Azure permissions for cloud connections",
    description: "Required Reader role, optional cost access, scopes, setup, and verification.",
    keywords: ["azure", "permissions", "reader", "cost management", "iam", "roles", "scope"],
    action: { kind: "route", href: "/help/azure-permissions", helpSlug: "azure-permissions" },
  },
  {
    id: "connect-aws",
    title: "Connect AWS securely",
    description: "OIDC-federated read-only IAM role, Resource Explorer inventory, and validation.",
    keywords: ["aws", "iam", "oidc", "resource explorer", "federation"],
    action: { kind: "route", href: inAppHelpHref("cloud-connections-aws"), helpSlug: "cloud-connections-aws" },
  },
  {
    id: "connect-gcp",
    title: "Connect GCP securely",
    description: "Workload Identity Federation, Cloud Asset Viewer, and connection validation.",
    keywords: ["gcp", "google cloud", "workload identity", "cloud asset"],
    action: { kind: "route", href: inAppHelpHref("cloud-connections-gcp"), helpSlug: "cloud-connections-gcp" },
  },
  {
    id: "security-trust-help",
    title: "Security and trust",
    description: "Assurance materials, diligence support, and links to data-handling posture.",
    keywords: ["security", "trust", "soc", "assurance", "compliance", "privacy"],
    action: { kind: "route", href: "/help/security-trust", helpSlug: "security-trust" },
  },
  {
    id: "data-handling-help",
    title: "Data handling and tenant isolation",
    description: "Data flow, tenant isolation, audit trail, AI provider handling, and portability.",
    keywords: ["data handling", "privacy", "isolation", "tenant", "ai provider", "portability", "deletion"],
    action: { kind: "route", href: "/help/data-handling", helpSlug: "data-handling" },
  },
  {
    id: "users-and-roles",
    title: "Users and roles",
    description: "Invite reviewers, approvers, and administrators.",
    keywords: ["users", "roles", "invite", "admin", "reader", "auditor"],
    action: { kind: "route", href: "/help/users-and-roles", helpSlug: "users-and-roles" },
  },
  {
    id: "sso-identity",
    title: "SSO and identity",
    description: "Optional or enforced organizational SSO, SCIM provisioning, and enterprise onboarding.",
    keywords: ["sso", "saml", "scim", "identity", "idp", "enforcement"],
    action: { kind: "route", href: "/help/enterprise-onboarding", helpSlug: "enterprise-onboarding" },
  },
];

export const TROUBLESHOOTING_TOPICS: readonly HelpSearchPanelTopic[] = [
  {
    id: "troubleshoot",
    title: "Troubleshoot common issues",
    description: "Fix loading, review, evidence, and export problems.",
    keywords: ["troubleshoot", "error", "fix", "loading", "export", "support"],
    action: { kind: "route", href: "/help/troubleshooting", helpSlug: "troubleshooting" },
  },
  {
    id: "keyboard-shortcuts",
    title: "Keyboard shortcuts",
    description: "Navigate faster using search and shortcut keys.",
    keywords: ["keyboard", "shortcuts", "hotkeys", "shift+?"],
    action: { kind: "guides-panel", tab: "shortcuts" },
  },
  {
    id: "report-a-problem",
    title: "Report a problem",
    description: "What to include so support can reproduce and trace the problem.",
    keywords: ["report", "problem", "bug", "defect", "support", "ticket"],
    action: { kind: "route", href: "/help/report-a-problem", helpSlug: "report-a-problem" },
  },
  {
    id: "contact-support",
    title: HELP_SEARCH_PANEL_SUPPORT_FOOTER_LABEL,
    description: "Troubleshooting guides, support email, and a downloadable diagnostic bundle.",
    keywords: ["support", "contact", "bundle", "diagnostics", "ticket"],
    action: { kind: "route", href: "/help/contact-support", helpSlug: "contact-support" },
  },
];

/**
 * Situation-only topics: resolvable and searchable, but kept out of the browse groups so
 * the drawer surfaces them when a page publishes matching review state.
 */
export const SITUATION_TOPICS: readonly HelpSearchPanelTopic[] = [
  {
    id: "resolve-blocking-findings",
    title: "Resolve findings that block approval",
    description: "Work each blocking finding, record its decision, then return to approval.",
    keywords: ["blocked", "blocking", "approval", "findings", "disposition", "remediation"],
    action: { kind: "route", href: "/help/findings", helpSlug: "findings" },
  },
  {
    id: "close-evidence-gaps",
    title: "Close evidence gaps before approval",
    description: "Add the missing evidence so findings trace back to source artifacts.",
    keywords: ["evidence gap", "incomplete", "missing evidence", "trace", "coverage"],
    action: { kind: "route", href: "/help/evidence-intake", helpSlug: "evidence-intake" },
  },
];

export const ADVANCED_ADMIN_TOPICS: readonly HelpSearchPanelTopic[] = [
  {
    id: "admin-diagnostics",
    title: "Admin diagnostics guide",
    description: "System status, workspace readiness, and platform health signals.",
    keywords: ["admin", "diagnostics", "health", "observability", "status"],
    action: { kind: "route", href: "/help/admin-diagnostics", helpSlug: "admin-diagnostics" },
    adminOnly: true,
  },
  {
    id: "cli-usage",
    title: "CLI usage",
    description: "Non-interactive archlucid commands for proof packets, config lint, and support bundles.",
    keywords: ["cli", "archlucid", "terminal", "dotnet", "doctor", "support bundle", "proof packet"],
    action: { kind: "route", href: "/help/cli-usage", helpSlug: "cli-usage" },
    adminOnly: true,
  },
  {
    id: "advanced-diagnostics",
    title: "Advanced diagnostics",
    description: "CLI commands, logs, and environment variables for engineering support.",
    keywords: ["cli", "logs", "environment", "engineering", "developer"],
    action: { kind: "route", href: "/help/engineering-troubleshooting", helpSlug: "engineering-troubleshooting" },
    adminOnly: true,
  },
];

/** Group id for the onboarding topics collapsed on signed-in product surfaces. */
export const HELP_SEARCH_PANEL_START_HERE_GROUP_ID = "start-here" as const;

export const HELP_SEARCH_PANEL_GROUPS: readonly HelpSearchPanelGroup[] = [
  { id: HELP_SEARCH_PANEL_START_HERE_GROUP_ID, heading: "Start here", topics: START_HERE_TOPICS },
  { id: "review-work", heading: "Review work", topics: REVIEW_WORK_TOPICS },
  { id: "insights", heading: "Insights", topics: INSIGHTS_TOPICS },
  { id: "governance", heading: "Approval", topics: GOVERNANCE_TOPICS },
  { id: "setup", heading: "Setup", topics: SETUP_TOPICS },
  { id: "troubleshooting", heading: "Troubleshooting and support", topics: TROUBLESHOOTING_TOPICS },
];

/** Synonyms expand search queries to curated topic ids. */
export const HELP_DRAWER_SEARCH_ALIASES: Readonly<Record<string, readonly string[]>> = {
  "proof packet": ["review-artifacts"],
  evidence: ["upload-evidence", "review-findings"],
  findings: ["review-findings"],
  finalize: ["finalize-review"],
  export: ["review-artifacts", "finalize-review"],
  governance: ["governance-workflow", "risk-register", "policy-packs"],
  sso: ["sso-identity"],
  azure: ["cloud-connections", "connect-azure", "azure-permissions"],
  aws: ["cloud-connections", "connect-aws"],
  gcp: ["cloud-connections", "connect-gcp"],
  audit: ["review-artifacts", "governance-workflow"],
  scim: ["sso-identity"],
  support: ["contact-support", "troubleshoot"],
  cli: ["cli-usage", "advanced-diagnostics"],
  archlucid: ["cli-usage"],
  faq: ["product-faq"],
  evaluation: ["product-faq", "first-review-guide", "choose-your-next-step"],
  pricing: ["product-faq"],
  procurement: ["choose-your-next-step", "security-trust-help"],
  pilot: ["choose-your-next-step", "first-review-guide", "create-first-review"],
  planning: ["improvement-planning-help", "choose-your-next-step", "first-review-guide", "create-first-review"],
  "next step": ["choose-your-next-step"],
  shortcuts: ["keyboard-shortcuts"],
  isolation: ["data-handling-help"],
  "data handling": ["data-handling-help", "security-trust-help"],
  privacy: ["data-handling-help", "security-trust-help"],
};

export function collectHelpSearchPanelTopics(isAdmin: boolean): HelpSearchPanelTopic[] {
  const topics: HelpSearchPanelTopic[] = [];

  for (const group of HELP_SEARCH_PANEL_GROUPS) {
    for (const topic of group.topics) {
      if (topic.adminOnly === true && !isAdmin) {
        continue;
      }

      topics.push(topic);
    }
  }

  topics.push(...SITUATION_TOPICS);

  if (isAdmin) {
    topics.push(...ADVANCED_ADMIN_TOPICS);
  }

  return topics;
}
