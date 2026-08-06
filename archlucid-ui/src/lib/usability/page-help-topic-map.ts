/**
 * Maps operator routes to in-app `/help/{slug}` topics for contextual help buttons.
 */

import { ARCHITECTURES_LIST_PATH } from "@/lib/architecture-routes";
import { ALERTS_HOW_ALERTS_WORK_LABEL } from "@/lib/alerts-page-copy";
import { START_REVIEW_LABEL } from "@/lib/architecture-workflow-labels";
import {
  BUYER_ONBOARDING_PAGE_TITLE,
  OPERATOR_HOME_EXPLORE_REVIEW_WALKTHROUGH_HEADING,
} from "@/lib/buyer-polish-copy";
import { EXECUTIVE_DASHBOARD_HREF } from "@/lib/executive-dashboard-route";
import { OPERATOR_NAV_LINK_LABELS } from "@/lib/i18n";
import { PROVENANCE_HELP_TOPIC, pathIsRunProvenance } from "@/lib/provenance-evidence-copy";
import { SIGNED_RECORDS_LIST_PATH } from "@/lib/signed-records-paths";

export type PageHelpTopic = {
  /**
   * In-app `/help/{slug}` target for Learn more.
   * Omit (undefined) when Category-1 should mount without Learn more (TB-2048 / TB-2050).
   */
  readonly slug?: string;
  readonly label: string;
};

/** First-run / onboarding / help-topic paths allowed to keep `getting-started` or `how-it-works` Learn more. */
export const PAGE_HELP_FIRST_RUN_GENERIC_LEARN_MORE_ALLOWLIST_PREFIXES = [
  "/architecture/first-review-guide",
  "/help/getting-started",
  "/help/how-it-works",
  ARCHITECTURES_LIST_PATH,
  "/architectures",
  "/help",
  /** Learning proof page — job is product orientation; how-it-works is honest. */
  "/why-archlucid",
] as const;

const PAGE_HELP_TOPICS: readonly { prefix: string; topic: PageHelpTopic }[] = [
  // Overview hero help — same topic the former "Learn / View workflow" links opened.
  {
    prefix: "/",
    topic: { slug: "first-architecture-review", label: OPERATOR_HOME_EXPLORE_REVIEW_WALKTHROUGH_HEADING },
  },
  { prefix: "/architecture/first-review-guide", topic: { slug: "getting-started", label: BUYER_ONBOARDING_PAGE_TITLE } },
  { prefix: "/help/getting-started", topic: { slug: "getting-started", label: "Getting started" } },
  {
    prefix: "/help/how-it-works",
    topic: { slug: "getting-started", label: "Getting started" },
  },
  {
    prefix: "/help/troubleshooting",
    topic: { slug: "troubleshooting", label: "Troubleshooting" },
  },
  {
    prefix: "/help/alerts",
    topic: { slug: "alerts", label: "How alerts work" },
  },
  {
    prefix: "/help/findings",
    topic: { slug: "findings", label: "Findings" },
  },
  {
    prefix: "/help/governance-approval",
    topic: { slug: "governance-approval", label: "Governance approval" },
  },
  {
    prefix: "/help/review-guide",
    topic: { slug: "review-guide", label: "Review guide" },
  },
  {
    prefix: "/help/pilot-guide",
    topic: { slug: "pilot-guide", label: "Pilot guide" },
  },
  {
    prefix: "/help/first-architecture-review",
    topic: { slug: "first-architecture-review", label: "Your first architecture review" },
  },
  {
    prefix: "/help/core-pilot",
    topic: { slug: "first-architecture-review", label: "Your first architecture review" },
  },
  {
    prefix: "/help/first-pilot-path",
    topic: { slug: "first-architecture-review", label: "Your first architecture review" },
  },
  {
    prefix: "/help/first-hour-operator-path",
    topic: { slug: "first-architecture-review", label: "Your first architecture review" },
  },
  {
    prefix: "/help/cloud-connections/azure",
    topic: { slug: "cloud-connections-azure", label: "Connect Azure securely" },
  },
  {
    prefix: "/help/azure-permissions",
    topic: { slug: "azure-permissions", label: "Azure permissions" },
  },
  {
    prefix: "/help/glossary",
    topic: { slug: "glossary", label: "Glossary" },
  },
  {
    prefix: "/help/cloud-connections",
    topic: { slug: "cloud-connections", label: "Cloud connections" },
  },
  {
    prefix: "/help/operator-auth-roles",
    topic: { slug: "users-and-roles", label: "Users and roles" },
  },
  {
    prefix: "/help/users-and-roles",
    topic: { slug: "users-and-roles", label: "Users and roles" },
  },
  { prefix: ARCHITECTURES_LIST_PATH, topic: { slug: "getting-started", label: "Getting started" } },
  { prefix: "/architectures", topic: { slug: "getting-started", label: "Getting started" } },
  { prefix: "/architecture/reviews/new", topic: { slug: "evidence-intake", label: START_REVIEW_LABEL } },
  { prefix: "/reviews/new", topic: { slug: "evidence-intake", label: START_REVIEW_LABEL } },
  { prefix: "/architecture/reviews", topic: { slug: "review-packages", label: "Reviews" } },
  {
    prefix: SIGNED_RECORDS_LIST_PATH,
    topic: { slug: "review-packages", label: "Signed review records" },
  },
  { prefix: EXECUTIVE_DASHBOARD_HREF, topic: { slug: "executive-summary", label: "Executive dashboard" } },
  {
    prefix: "/executive/scorecard",
    topic: { slug: "executive-summary", label: "Sponsor scorecard" },
  },
  { prefix: "/insights/evidence-graph", topic: { slug: "evidence-trail", label: OPERATOR_NAV_LINK_LABELS.evidenceTrail } },
  {
    prefix: "/insights/search-review-evidence",
    topic: { slug: "evidence-trail", label: OPERATOR_NAV_LINK_LABELS.searchEvidence },
  },
  { prefix: "/insights/compare-two-reviews", topic: { slug: "comparison-replay", label: "Compare and replay" } },
  { prefix: "/replay", topic: { slug: "comparison-replay", label: "Validate review" } },
  { prefix: "/governance/findings", topic: { slug: "governance-approval", label: OPERATOR_NAV_LINK_LABELS.findings } },
  {
    prefix: "/governance/approval-requests",
    topic: { slug: "governance-approval", label: "Approval lineage" },
  },
  { prefix: "/governance/audit", topic: { slug: "audit-trail", label: "Audit trail" } },
  {
    // Secondary hub — no decision-register specialty; omit Learn more (TB-2050).
    prefix: "/governance/decision-register",
    topic: { label: "Decision register" },
  },
  {
    // Secondary hub — no workspace-health specialty; omit Learn more (TB-2050). Do not reopen TB-1668 mount.
    prefix: "/governance/dashboard",
    topic: { label: "Workspace overview" },
  },
  {
    prefix: "/governance/alerts",
    topic: { slug: "alerts", label: ALERTS_HOW_ALERTS_WORK_LABEL },
  },
  {
    prefix: "/governance/alert-rules",
    topic: { slug: "alerts", label: ALERTS_HOW_ALERTS_WORK_LABEL },
  },
  {
    prefix: "/governance/policy-packs",
    topic: { slug: "policy-packs", label: "Policy packs" },
  },
  {
    prefix: "/governance/standards-and-rules",
    topic: { slug: "policy-packs", label: "Policy packs" },
  },
  { prefix: "/governance", topic: { slug: "governance-approval", label: "Governance approval" } },
  { prefix: "/audit", topic: { slug: "audit-trail", label: "Audit trail" } },
  { prefix: "/alerts", topic: { slug: "alerts", label: "Alerts" } },
  { prefix: "/alert-rules", topic: { slug: "alerts", label: "How alerts work" } },
  { prefix: "/policy-packs", topic: { slug: "policy-packs", label: "Policy packs" } },
  {
    prefix: "/sponsor-report/roi-summary",
    topic: { slug: "pilot-roi-model", label: "View ROI methodology" },
  },
  {
    prefix: "/sponsor-report/pilot-outcomes",
    topic: { slug: "executive-summary", label: "Pilot outcomes" },
  },
  {
    prefix: "/insights/architecture-scorecard",
    topic: { slug: "pilot-roi-model", label: "View ROI methodology" },
  },
  { prefix: "/sponsor-report", topic: { slug: "executive-summary", label: "Executive summary" } },
  { prefix: "/sponsor-report", topic: { slug: "executive-summary", label: "Executive summary" } },
  { prefix: "/architecture/digests", topic: { slug: "digests", label: "Architecture digests" } },
  { prefix: "/digests", topic: { slug: "digests", label: "Architecture digests" } },
  { prefix: "/digest-subscriptions", topic: { slug: "digests", label: "Architecture digests" } },
  { prefix: "/help/digests", topic: { slug: "digests", label: "Architecture digests" } },
  {
    // Secondary hub — no planning specialty; omit Learn more (TB-2050).
    prefix: "/insights/planning",
    topic: { label: "Improvement planning" },
  },
  {
    prefix: "/internal/product-learning",
    topic: { slug: "pilot-feedback", label: "Pilot feedback" },
  },
  {
    // Learning / product-orientation allowlist — how-it-works matches the page job (TB-2050).
    prefix: "/why-archlucid",
    topic: { slug: "how-it-works", label: "Why ArchLucid" },
  },
  {
    prefix: "/demo/explain",
    topic: { slug: "evidence-trail", label: "Demo explain" },
  },
  { prefix: "/administration/billing", topic: { slug: "billing-and-plans", label: "Billing and plans" } },
  { prefix: "/administration/ai-usage", topic: { slug: "billing-and-plans", label: "AI usage and cost" } },
  { prefix: "/help/billing-and-plans", topic: { slug: "billing-and-plans", label: "Billing and plans" } },
  {
    prefix: "/help/security-trust",
    topic: { slug: "security-trust", label: "Security and trust" },
  },
  {
    prefix: "/help/procurement",
    topic: { slug: "procurement", label: "Procurement FAQ" },
  },
  {
    prefix: "/help/scope",
    topic: { slug: "scope", label: "Workspace and scope" },
  },
  {
    prefix: "/help/repeat-review-loop",
    topic: { slug: "repeat-review-loop", label: "Repeat-review loop" },
  },
  { prefix: "/help/audit-trail", topic: { slug: "audit-trail", label: "Audit trail" } },
  {
    prefix: "/help/evidence-trail",
    topic: { slug: "evidence-trail", label: "Evidence graph" },
  },
  {
    prefix: "/help/evidence-intake",
    topic: { slug: "evidence-intake", label: "Start a review" },
  },
  {
    prefix: "/help/data-handling-tenant-isolation",
    topic: { slug: "data-handling-tenant-isolation", label: "Data handling and tenant isolation" },
  },
  {
    prefix: "/help/dpa-template",
    topic: { slug: "dpa-template", label: "Data Processing Agreement (template)" },
  },
  {
    prefix: "/help/soc2-self-assessment",
    topic: { slug: "soc2-self-assessment", label: "SOC 2 self-assessment" },
  },
  {
    prefix: "/help/path-chooser",
    topic: { slug: "path-chooser", label: "Choose your next step" },
  },
  {
    prefix: "/help/evaluator-workbook",
    topic: { slug: "path-chooser", label: "Choose your next step" },
  },
  {
    prefix: "/help/enterprise-onboarding",
    topic: { slug: "enterprise-onboarding", label: "Enterprise onboarding checklist" },
  },
  {
    prefix: "/help/pilot-roi-model",
    topic: { slug: "pilot-roi-model", label: "Pilot ROI model" },
  },
  {
    prefix: "/help/policy-pack-delta-demo",
    topic: { slug: "policy-pack-delta-demo", label: "Policy-pack delta demo" },
  },
  {
    prefix: "/help/configuration-reference",
    topic: { slug: "configuration-reference", label: "Configuration reference" },
  },
  {
    prefix: "/help/cli-usage",
    topic: { slug: "cli-usage", label: "CLI usage" },
  },
  {
    prefix: "/help/first-review",
    topic: { slug: "first-review", label: "First-run evidence checklist" },
  },
  {
    prefix: "/help/first-value-20-minutes",
    topic: { slug: "first-value-20-minutes", label: "First value in 20 minutes (Admin runbook)" },
  },
  {
    prefix: "/help/developer-troubleshooting",
    topic: { slug: "developer-troubleshooting", label: "Engineering troubleshooting runbook" },
  },
  {
    prefix: "/help/governance-api-contracts",
    topic: { slug: "governance-api-contracts", label: "API contracts (technical reference)" },
  },
  {
    prefix: "/help/api-contracts",
    topic: { slug: "governance-api-contracts", label: "API contracts (technical reference)" },
  },
  {
    // Secondary hub — no impact-preview specialty; omit Learn more (TB-2050).
    prefix: "/insights/impact-preview",
    topic: { label: "Impact preview" },
  },
  {
    prefix: "/internal-operations/recommendation-learning",
    topic: { slug: "pilot-feedback", label: "How recommendation learning works" },
  },
  {
    // Secondary hub — no advisory-scans specialty; omit Learn more (TB-2050).
    prefix: "/governance/advisory-scans",
    topic: { label: "Advisory scans" },
  },
  { prefix: "/integrations/cloud-connections/azure", topic: { slug: "azure-permissions", label: "Azure permissions" } },
  { prefix: "/settings/cloud-connections/azure", topic: { slug: "azure-permissions", label: "Azure permissions" } },
  { prefix: "/integrations/cloud-connections/aws", topic: { slug: "cloud-connections-aws", label: "AWS cloud connection" } },
  { prefix: "/integrations/cloud-connections/gcp", topic: { slug: "cloud-connections-gcp", label: "GCP cloud connection" } },
  { prefix: "/integrations/cloud-connections", topic: { slug: "cloud-connections", label: "Cloud connections" } },
  { prefix: "/integrations/azure-boards", topic: { slug: "azure-boards", label: "Azure Boards integration" } },
  {
    prefix: "/integrations/jira",
    topic: { slug: "integration-readiness", label: "Jira integration" },
  },
  {
    prefix: "/integrations/itsm/oauth/callback",
    topic: { slug: "integration-readiness", label: "Atlassian OAuth callback" },
  },
  {
    prefix: "/integrations/servicenow",
    topic: { slug: "integration-readiness", label: "ServiceNow integration" },
  },
  {
    prefix: "/integrations/slack",
    topic: { slug: "alerts", label: "Slack integration" },
  },
  {
    prefix: "/integrations/webhooks",
    topic: { slug: "alerts", label: "Webhooks" },
  },
  {
    prefix: "/integrations/teams",
    topic: { slug: "alerts", label: "Teams integration" },
  },
  { prefix: "/administration/connection-status", topic: { slug: "integration-readiness", label: "How integration readiness works" } },
  {
    prefix: "/operate/integration-events/dlq",
    topic: { slug: "integration-readiness", label: "Integration event dead letters" },
  },
  { prefix: "/administration/system-health", topic: { slug: "troubleshooting", label: "Troubleshooting" } },
  { prefix: "/admin/integrations/itsm", topic: { slug: "integration-readiness", label: "How integration readiness works" } },
  {
    prefix: "/admin/tenant-health",
    topic: { slug: "troubleshooting", label: "Tenant health" },
  },
  {
    prefix: "/admin/trial-funnel",
    topic: { slug: "billing-and-plans", label: "Trial funnel" },
  },
  {
    prefix: "/admin/demo-readiness",
    topic: { slug: "path-chooser", label: "Demo readiness" },
  },
  {
    prefix: "/admin/deployment-status",
    topic: { slug: "troubleshooting", label: "Deployment status" },
  },
  { prefix: "/settings/cloud-connections/aws", topic: { slug: "cloud-connections-aws", label: "AWS cloud connection" } },
  { prefix: "/settings/cloud-connections/gcp", topic: { slug: "cloud-connections-gcp", label: "GCP cloud connection" } },
  { prefix: "/settings/cloud-connections", topic: { slug: "cloud-connections", label: "Cloud connections" } },
  {
    prefix: "/administration/identity-providers/role-mapping",
    topic: { slug: "users-and-roles", label: "Role mapping" },
  },
  {
    prefix: "/administration/identity-providers",
    topic: { slug: "enterprise-onboarding", label: "SSO and identity" },
  },
  {
    prefix: "/administration/api-keys",
    topic: { slug: "users-and-roles", label: "API keys" },
  },
  {
    prefix: "/administration/preferences",
    topic: { slug: "getting-started", label: "Preferences" },
  },
  {
    prefix: "/administration/account-security",
    topic: { slug: "security-trust", label: "Account security" },
  },
  {
    prefix: "/administration/auth-domains",
    topic: { slug: "enterprise-onboarding", label: "Sign-in domains" },
  },
  {
    prefix: "/administration/extract-upload",
    topic: { slug: "evidence-intake", label: "Extract and Upload" },
  },
  {
    prefix: "/administration/users/invite-reviewer",
    topic: { slug: "users-and-roles", label: "Invite a reviewer" },
  },
  {
    prefix: "/settings/roles",
    topic: { slug: "users-and-roles", label: "Users and roles" },
  },
  {
    prefix: "/administration/users",
    topic: { slug: "users-and-roles", label: "Users and roles" },
  },
  {
    prefix: "/administration/security-trust",
    topic: { slug: "security-trust", label: "Security and trust" },
  },
  {
    prefix: "/administration/tenant",
    topic: { slug: "scope", label: OPERATOR_NAV_LINK_LABELS.settings },
  },
  { prefix: "/administration/baseline", topic: { slug: "pilot-roi-model", label: "View ROI methodology" } },
  { prefix: "/help", topic: { slug: "getting-started", label: "Help" } },
];

const ARTIFACT_PREVIEW_HELP_TOPIC: PageHelpTopic = {
  slug: "review-artifacts",
  label: "Review artifacts",
};

export function pageHelpTopicForPathname(pathname: string): PageHelpTopic | null {
  const path = (pathname ?? "").split("?")[0] ?? "";

  if (path.includes("/artifacts/")) {
    return ARTIFACT_PREVIEW_HELP_TOPIC;
  }

  if (pathIsRunProvenance(path)) {
    return PROVENANCE_HELP_TOPIC;
  }

  if (path === "/") {
    return PAGE_HELP_TOPICS.find((row) => row.prefix === "/")?.topic ?? null;
  }

  const sorted = [...PAGE_HELP_TOPICS].sort((left, right) => right.prefix.length - left.prefix.length);

  for (const row of sorted) {
    if (row.prefix === "/") {
      continue;
    }

    if (path === row.prefix || path.startsWith(`${row.prefix}/`)) {
      return row.topic;
    }
  }

  return null;
}
