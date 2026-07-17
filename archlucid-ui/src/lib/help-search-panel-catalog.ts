import type { HelpTabId } from "@/components/HelpPanel";
import { REVIEW_TERMINOLOGY_BANNED_OPERATOR_PATTERNS } from "@/lib/review-terminology-surfaces";

export const HELP_SEARCH_PANEL_SUBTITLE =
  "Search guides, troubleshooting, and keyboard shortcuts." as const;

export const HELP_SEARCH_PANEL_SEARCHING_SUBTITLE = "Showing matching guides and topics." as const;

export const HELP_SEARCH_PANEL_SEARCH_PLACEHOLDER = "Search guides, topics, or shortcuts…" as const;

export const HELP_SEARCH_PANEL_EMPTY_TITLE = "No help topics found" as const;

export const HELP_SEARCH_PANEL_EMPTY_HINT =
  "Try searching for review, evidence, findings, governance, SSO, or export." as const;

export const HELP_SEARCH_PANEL_KEYBOARD_HINT = "↑↓ Navigate · Enter Open · Esc Close" as const;

export type HelpSearchPanelAction =
  | { readonly kind: "route"; readonly href: string; readonly helpSlug: string | null }
  | { readonly kind: "guides-panel"; readonly tab: HelpTabId }
  | { readonly kind: "concepts-dialog" }
  | { readonly kind: "feedback-dialog" };

export type HelpSearchPanelTopic = {
  readonly id: string;
  readonly title: string;
  readonly description: string;
  readonly keywords: readonly string[];
  readonly action: HelpSearchPanelAction;
  readonly adminOnly?: boolean;
};

export type HelpSearchPanelGroup = {
  readonly id: string;
  readonly heading: string;
  readonly topics: readonly HelpSearchPanelTopic[];
};

const START_HERE_TOPICS: readonly HelpSearchPanelTopic[] = [
  {
    id: "getting-started-help",
    title: "Getting started",
    description: "Learn how ArchLucid turns architecture evidence into review findings and governance-ready outputs.",
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
    description: "Product workflow from architecture evidence through findings, decisions, governance, and exports.",
    keywords: ["how it works", "workflow", "review flow", "evidence", "exports", "governance"],
    action: { kind: "route", href: "/help/how-it-works", helpSlug: "how-it-works" },
  },
  {
    id: "path-chooser",
    title: "Choose your next step",
    description: "Map your goal — evaluate, pilot, procurement, sponsor output, or engineering support — to one primary action.",
    keywords: ["path chooser", "next step", "evaluate", "pilot", "procurement", "sponsor", "engineering support"],
    action: { kind: "route", href: "/help/path-chooser", helpSlug: "path-chooser" },
  },
  {
    id: "first-review-guide",
    title: "First review guide",
    description: "Step-by-step: name the review, upload evidence, add context, and finalize the review.",
    keywords: ["first review", "review guide", "new review", "architecture context", "getting started"],
    action: { kind: "route", href: "/help/first-hour-operator-path", helpSlug: "first-hour-operator-path" },
  },
  {
    id: "review-guide",
    title: "Review guide",
    description: "Wizard field reference: scope, evidence upload, review settings, and finalize options.",
    keywords: ["review guide", "wizard", "review fields", "scope", "evidence upload", "finalize"],
    action: { kind: "route", href: "/help/review-guide", helpSlug: "review-guide" },
  },
  {
    id: "product-faq",
    title: "Product FAQ",
    description: "Evaluation, pricing, evidence, governance, and security answers for architects and sponsors.",
    keywords: ["faq", "evaluation", "pricing", "trial", "architect license", "security", "azure", "aws", "gcp"],
    action: { kind: "route", href: "/faq", helpSlug: null },
  },
  {
    id: "glossary",
    title: "Glossary",
    description: "Definitions for review, evidence, governance, and organization terms used in ArchLucid.",
    keywords: ["glossary", "terms", "definitions", "finding", "risk", "control", "review", "evidence trail"],
    action: { kind: "route", href: "/help/glossary", helpSlug: "glossary" },
  },
  {
    id: "create-first-review",
    title: "Create your first review",
    description: "Start with a brief, diagram, IaC file, or evidence ZIP.",
    keywords: ["create", "new review", "wizard", "intake", "first review"],
    action: { kind: "route", href: "/reviews/new", helpSlug: null },
  },
  {
    id: "sample-review",
    title: "Run a sample review",
    description: "See how ArchLucid turns evidence into findings and review artifacts.",
    keywords: ["sample", "example", "claims intake", "demo review", "walkthrough"],
    action: { kind: "route", href: "/reviews/claims-intake-modernization", helpSlug: null },
  },
];

const REVIEW_WORK_TOPICS: readonly HelpSearchPanelTopic[] = [
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
    description: "Create the signed review record and export deliverables.",
    keywords: ["finalize", "commit", "signed", "export", "deliverables"],
    action: { kind: "route", href: "/help/governance-approval", helpSlug: "governance-approval" },
  },
  {
    id: "review-artifacts",
    title: "Review artifacts and proof packet",
    description: "Download outputs for sponsors, governance, procurement, or audit.",
    keywords: ["proof packet", "artifacts", "bundle", "audit", "sponsor export", "deliverables"],
    action: { kind: "route", href: "/help/review-packages", helpSlug: "review-packages" },
  },
];

const GOVERNANCE_TOPICS: readonly HelpSearchPanelTopic[] = [
  {
    id: "governance-workflow",
    title: "Governance workflow",
    description: "Approve, reject, promote, or monitor reviews.",
    keywords: ["governance", "approval", "promote", "workflow", "disposition"],
    action: { kind: "route", href: "/help/governance-approval", helpSlug: "governance-approval" },
  },
  {
    id: "risk-register",
    title: "Risk register",
    description: "Track accepted risks, owners, exceptions, and follow-up.",
    keywords: ["risk", "register", "exceptions", "accepted risk", "findings queue"],
    action: { kind: "route", href: "/governance/findings", helpSlug: null },
  },
  {
    id: "policy-packs",
    title: "Policy packs",
    description: "Understand which standards and rules were applied.",
    keywords: ["policy", "packs", "compliance", "rules", "standards"],
    action: { kind: "route", href: "/policy-packs", helpSlug: null },
  },
];

const SETUP_TOPICS: readonly HelpSearchPanelTopic[] = [
  {
    id: "integration-readiness",
    title: "Integration readiness",
    description: "See which notification, ticketing, publishing, and delivery integrations are ready or optional.",
    keywords: ["integration", "readiness", "teams", "slack", "jira", "servicenow", "webhooks", "setup"],
    action: { kind: "route", href: "/integrations/readiness", helpSlug: "integration-readiness" },
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
    action: { kind: "route", href: "/help/cloud-connections-azure", helpSlug: "cloud-connections-azure" },
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
    action: { kind: "route", href: "/help/cloud-connections-aws", helpSlug: "cloud-connections-aws" },
  },
  {
    id: "connect-gcp",
    title: "Connect GCP securely",
    description: "Workload Identity Federation, Cloud Asset Viewer, and connection validation.",
    keywords: ["gcp", "google cloud", "workload identity", "cloud asset"],
    action: { kind: "route", href: "/help/cloud-connections-gcp", helpSlug: "cloud-connections-gcp" },
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
    title: "What ArchLucid does with your data",
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

const TROUBLESHOOTING_TOPICS: readonly HelpSearchPanelTopic[] = [
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
    id: "contact-support",
    title: "Contact support",
    description: "Send support or download a diagnostic bundle.",
    keywords: ["support", "contact", "bundle", "diagnostics", "ticket"],
    action: { kind: "guides-panel", tab: "troubleshooting" },
  },
];

const ADVANCED_ADMIN_TOPICS: readonly HelpSearchPanelTopic[] = [
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
    action: { kind: "route", href: "/help/developer-troubleshooting", helpSlug: "developer-troubleshooting" },
    adminOnly: true,
  },
];

export const HELP_SEARCH_PANEL_GROUPS: readonly HelpSearchPanelGroup[] = [
  { id: "start-here", heading: "Start here", topics: START_HERE_TOPICS },
  { id: "review-work", heading: "Review work", topics: REVIEW_WORK_TOPICS },
  { id: "governance", heading: "Governance", topics: GOVERNANCE_TOPICS },
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
  evaluation: ["product-faq", "first-review-guide", "path-chooser"],
  pricing: ["product-faq"],
  procurement: ["path-chooser", "security-trust-help"],
  pilot: ["path-chooser", "first-review-guide", "create-first-review"],
  "next step": ["path-chooser"],
  shortcuts: ["keyboard-shortcuts"],
  isolation: ["data-handling-help"],
  "data handling": ["data-handling-help", "security-trust-help"],
  privacy: ["data-handling-help", "security-trust-help"],
};

const ROUTE_RECOMMENDED_TOPIC_IDS: readonly { readonly prefix: string; readonly topicIds: readonly string[] }[] = [
  { prefix: "/", topicIds: ["getting-started-help", "how-archlucid-works", "first-review-guide", "product-faq", "create-first-review"] },
  { prefix: "/onboarding", topicIds: ["how-archlucid-works", "first-review-guide", "product-faq", "create-first-review", "sample-review"] },
  { prefix: "/help", topicIds: ["getting-started-help", "how-archlucid-works", "path-chooser", "first-review-guide", "product-faq", "cloud-connections", "data-handling-help", "security-trust-help", "troubleshoot"] },
  { prefix: "/pricing", topicIds: ["product-faq", "first-review-guide"] },
  { prefix: "/signup", topicIds: ["authentication-sign-in", "product-faq", "first-review-guide"] },
  { prefix: "/auth/signin", topicIds: ["authentication-sign-in"] },
  {
    prefix: "/integrations/cloud-connections",
    topicIds: ["cloud-connections", "connect-azure", "azure-permissions", "connect-aws", "connect-gcp", "troubleshoot"],
  },
  {
    prefix: "/integrations/readiness",
    topicIds: ["integration-readiness", "cloud-connections", "troubleshoot"],
  },
  {
    prefix: "/integrations/operations",
    topicIds: ["integration-readiness", "cloud-connections", "troubleshoot"],
  },
  {
    prefix: "/settings/cloud-connections",
    topicIds: ["cloud-connections", "connect-azure", "azure-permissions", "connect-aws", "connect-gcp", "troubleshoot"],
  },
  { prefix: "/governance", topicIds: ["governance-workflow", "risk-register", "policy-packs"] },
  { prefix: "/policy-packs", topicIds: ["policy-packs", "governance-workflow"] },
  { prefix: "/reviews/new", topicIds: ["create-first-review", "upload-evidence", "first-review-guide"] },
  { prefix: "/reviews", topicIds: ["review-findings", "finalize-review", "review-artifacts"] },
  { prefix: "/settings/users", topicIds: ["users-and-roles", "sso-identity"] },
  { prefix: "/settings/roles", topicIds: ["users-and-roles", "sso-identity"] },
  { prefix: "/settings/identity", topicIds: ["sso-identity", "users-and-roles"] },
];

function normalizePathname(pathname: string): string {
  return (pathname ?? "").split("?")[0] ?? "";
}

export function listHelpSearchPanelTopics(isAdmin: boolean): HelpSearchPanelTopic[] {
  const topics: HelpSearchPanelTopic[] = [];

  for (const group of HELP_SEARCH_PANEL_GROUPS) {
    for (const topic of group.topics) {
      if (topic.adminOnly === true && !isAdmin) {
        continue;
      }

      topics.push(topic);
    }
  }

  if (isAdmin) {
    topics.push(...ADVANCED_ADMIN_TOPICS);
  }

  return topics;
}

export function listHelpSearchPanelGroups(isAdmin: boolean): HelpSearchPanelGroup[] {
  const groups = HELP_SEARCH_PANEL_GROUPS.map((group) => ({
    ...group,
    topics: group.topics.filter((topic) => topic.adminOnly !== true || isAdmin),
  }));

  if (isAdmin) {
    return [
      ...groups,
      {
        id: "advanced-administration",
        heading: "Advanced administration",
        topics: ADVANCED_ADMIN_TOPICS,
      },
    ];
  }

  return groups;
}

export function recommendedHelpSearchPanelTopicIds(pathname: string): string[] {
  const path = normalizePathname(pathname);

  if (path === "/") {
    return [...(ROUTE_RECOMMENDED_TOPIC_IDS.find((row) => row.prefix === "/")?.topicIds ?? [])];
  }

  const sorted = [...ROUTE_RECOMMENDED_TOPIC_IDS].sort((left, right) => right.prefix.length - left.prefix.length);

  for (const row of sorted) {
    if (row.prefix === "/") {
      continue;
    }

    if (path === row.prefix || path.startsWith(`${row.prefix}/`)) {
      return [...row.topicIds];
    }
  }

  return [];
}

export function recommendedHelpSearchPanelTopics(
  pathname: string,
  isAdmin: boolean,
): HelpSearchPanelTopic[] {
  const byId = new Map(listHelpSearchPanelTopics(isAdmin).map((topic) => [topic.id, topic]));
  const ids = recommendedHelpSearchPanelTopicIds(pathname);

  return ids.map((id) => byId.get(id)).filter((topic): topic is HelpSearchPanelTopic => topic !== undefined);
}

function topicMatchesQuery(topic: HelpSearchPanelTopic, normalizedQuery: string): boolean {
  const haystack = `${topic.title} ${topic.description} ${topic.keywords.join(" ")}`.toLowerCase();

  if (haystack.includes(normalizedQuery)) {
    return true;
  }

  for (const [alias, topicIds] of Object.entries(HELP_DRAWER_SEARCH_ALIASES)) {
    if (!normalizedQuery.includes(alias)) {
      continue;
    }

    if (topicIds.includes(topic.id)) {
      return true;
    }
  }

  return false;
}

export function filterHelpSearchPanelTopics(
  topics: readonly HelpSearchPanelTopic[],
  query: string,
): HelpSearchPanelTopic[] {
  const normalizedQuery = query.trim().toLowerCase();

  if (normalizedQuery.length === 0) {
    return [...topics];
  }

  return topics.filter((topic) => topicMatchesQuery(topic, normalizedQuery));
}

const HELP_SEARCH_PANEL_EXTRA_BANNED_PUBLIC_COPY = [
  "engineering runbook",
  "permission regression",
] as const;

/** Returns true when copy contains banned default user-facing help phrases. */
export function helpSearchPanelTopicHasBannedPublicCopy(topic: HelpSearchPanelTopic): boolean {
  const corpus = `${topic.title} ${topic.description}`.toLowerCase();

  return (
    REVIEW_TERMINOLOGY_BANNED_OPERATOR_PATTERNS.some((pattern) => corpus.includes(pattern))
    || HELP_SEARCH_PANEL_EXTRA_BANNED_PUBLIC_COPY.some((pattern) => corpus.includes(pattern))
  );
}
