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
  readonly slug: string;
  readonly label: string;
};

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
    prefix: "/governance/decision-register",
    topic: { slug: "getting-started", label: "Decision register" },
  },
  {
    prefix: "/governance/dashboard",
    topic: { slug: "getting-started", label: "Workspace overview" },
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
  { prefix: "/digests", topic: { slug: "getting-started", label: "Architecture digests" } },
  { prefix: "/insights/planning", topic: { slug: "getting-started", label: "Improvement planning" } },
  {
    prefix: "/internal/product-learning",
    topic: { slug: "pilot-feedback", label: "Pilot feedback" },
  },
  { prefix: "/administration/settings/billing", topic: { slug: "billing-and-plans", label: "Billing and plans" } },
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
  { prefix: "/insights/impact-preview", topic: { slug: "getting-started", label: "Impact preview" } },
  { prefix: "/internal-operations/recommendation-learning", topic: { slug: "getting-started", label: "How recommendation learning works" } },
  { prefix: "/governance/advisory-scans", topic: { slug: "getting-started", label: "Advisory scans" } },
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
  { prefix: "/settings/cloud-connections/aws", topic: { slug: "cloud-connections-aws", label: "AWS cloud connection" } },
  { prefix: "/settings/cloud-connections/gcp", topic: { slug: "cloud-connections-gcp", label: "GCP cloud connection" } },
  { prefix: "/settings/cloud-connections", topic: { slug: "cloud-connections", label: "Cloud connections" } },
  {
    prefix: "/administration/settings/identity-providers",
    topic: { slug: "enterprise-onboarding", label: "SSO and identity" },
  },
  {
    prefix: "/administration/settings/users/invite-reviewer",
    topic: { slug: "users-and-roles", label: "Invite a reviewer" },
  },
  {
    prefix: "/administration/settings/users",
    topic: { slug: "users-and-roles", label: "Users and roles" },
  },
  {
    prefix: "/administration/settings/security-trust",
    topic: { slug: "security-trust", label: "Security and trust" },
  },
  { prefix: "/administration/settings/tenant", topic: { slug: "getting-started", label: OPERATOR_NAV_LINK_LABELS.settings } },
  { prefix: "/administration/settings/baseline", topic: { slug: "pilot-roi-model", label: "View ROI methodology" } },
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
