/**
 * Maps operator routes to in-app `/help/{slug}` topics for contextual help buttons.
 */

import { canonicalizeLegacyOperatorRoutePath } from "@/lib/canonicalize-legacy-operator-route-path";
import { ALERTS_HOW_ALERTS_WORK_LABEL } from "@/lib/alerts-page-copy";
import { ARCHITECTURES_LIST_PATH } from "@/lib/architecture-routes";
import { ARCHITECTURE_DRAFTS_LIST_LABEL, START_REVIEW_LABEL } from "@/lib/architecture-workflow-labels";
import {
  BUYER_ONBOARDING_PAGE_TITLE,
  OPERATOR_HOME_EXPLORE_REVIEW_WALKTHROUGH_HEADING,
} from "@/lib/buyer-polish-copy";
import { EXECUTIVE_DASHBOARD_HREF } from "@/lib/executive-dashboard-route";
import { OPERATOR_NAV_LINK_LABELS } from "@/lib/i18n";
import { PROVENANCE_HELP_TOPIC, pathIsRunProvenance } from "@/lib/provenance-evidence-copy";
import { pathIsFindingEvidenceTrace } from "@/lib/evidence-trace-contextual-help";
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
    prefix: "/help/accelerator-chooser",
    topic: { slug: "accelerator-chooser", label: "Pick an accelerator pack" },
  },
  {
    prefix: "/help/admin-diagnostics",
    topic: { slug: "admin-diagnostics", label: "Admin diagnostics" },
  },
  {
    prefix: "/help/authentication-sign-in",
    topic: { slug: "authentication-sign-in", label: "Authentication and sign-in" },
  },
  {
    prefix: "/help/azure-boards",
    topic: { slug: "azure-boards", label: "Azure Boards integration" },
  },
  {
    prefix: "/help/integration-readiness",
    topic: { slug: "integration-readiness", label: "Integration readiness" },
  },
  {
    prefix: "/help/caiq-sig-response",
    topic: { slug: "caiq-sig-response", label: "CAIQ / SIG questionnaire responses" },
  },
  {
    prefix: "/help/comparison-replay",
    topic: { slug: "comparison-replay", label: "Compare and replay" },
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
    prefix: "/help/cloud-connections/azure",
    topic: { slug: "cloud-connections-azure", label: "Connect Azure securely" },
  },
  {
    prefix: "/help/cloud-connections/aws",
    topic: { slug: "cloud-connections-aws", label: "Connect AWS securely" },
  },
  {
    prefix: "/help/cloud-connections/gcp",
    topic: { slug: "cloud-connections-gcp", label: "Connect GCP securely" },
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
    prefix: "/help/users-and-roles",
    topic: { slug: "users-and-roles", label: "Users and roles" },
  },
  { prefix: ARCHITECTURES_LIST_PATH, topic: { slug: "getting-started", label: ARCHITECTURE_DRAFTS_LIST_LABEL } },
  { prefix: "/architecture/architectures/new", topic: { slug: "first-architecture-review", label: "Create architecture" } },
  {
    prefix: "/architecture/architecture-intelligence",
    topic: { slug: "evidence-trail", label: "Architecture intelligence" },
  },
  { prefix: "/architectures", topic: { slug: "getting-started", label: ARCHITECTURE_DRAFTS_LIST_LABEL } },
  { prefix: "/architecture/reviews/new", topic: { slug: "evidence-intake", label: START_REVIEW_LABEL } },
  { prefix: "/architecture/reviews", topic: { slug: "review-packages", label: "Reviews" } },
  {
    prefix: SIGNED_RECORDS_LIST_PATH,
    topic: { slug: "review-packages", label: "Signed review records" },
  },
  { prefix: EXECUTIVE_DASHBOARD_HREF, topic: { slug: "executive-summary", label: "Executive dashboard" } },
  { prefix: "/insights/evidence-graph", topic: { slug: "evidence-trail", label: OPERATOR_NAV_LINK_LABELS.evidenceGraph } },
  {
    prefix: "/insights/search-review-evidence",
    topic: { slug: "evidence-trail", label: OPERATOR_NAV_LINK_LABELS.searchEvidence },
  },
  { prefix: "/insights/compare-two-reviews", topic: { slug: "comparison-replay", label: "Compare and replay" } },
  {
    // Secondary hub — no pattern-library specialty; omit Learn more (TB-2050).
    prefix: "/insights/patterns",
    topic: { label: "Pattern library" },
  },
  { prefix: "/replay", topic: { slug: "comparison-replay", label: "Compare and replay" } },
  { prefix: "/governance/findings", topic: { slug: "governance-approval", label: OPERATOR_NAV_LINK_LABELS.findings } },
  {
    prefix: "/governance/approval-queue",
    topic: { slug: "governance-approval", label: "Approval queue" },
  },
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
  { prefix: "/governance/audit", topic: { slug: "audit-trail", label: "Audit trail" } },
  { prefix: "/governance/alerts", topic: { slug: "alerts", label: "Alerts" } },
  { prefix: "/governance/alert-rules", topic: { slug: "alerts", label: "How alerts work" } },
  { prefix: "/governance/policy-packs", topic: { slug: "policy-packs", label: "Policy packs" } },
  {
    prefix: "/insights/roi-summary",
    topic: { slug: "pilot-roi-model", label: "View ROI methodology" },
  },
  {
    prefix: "/insights/pilot-outcomes",
    topic: { slug: "executive-summary", label: "Pilot outcomes" },
  },
  {
    // Trigger names the page; Learn more still opens ROI methodology for assumption drill-down.
    prefix: "/insights/architecture-scorecard",
    topic: { slug: "pilot-roi-model", label: OPERATOR_NAV_LINK_LABELS.scorecard },
  },
  {
    prefix: "/insights/executive-summary",
    topic: { slug: "executive-summary", label: "Executive summary" },
  },
  // Legacy sponsor-report bookmarks canonicalize to /insights/* above; keep prefixes for direct lookups.
  {
    prefix: "/sponsor-report/roi-summary",
    topic: { slug: "pilot-roi-model", label: "View ROI methodology" },
  },
  {
    prefix: "/sponsor-report/pilot-outcomes",
    topic: { slug: "executive-summary", label: "Pilot outcomes" },
  },
  {
    prefix: "/insights/roi-summary",
    topic: { slug: "pilot-roi-model", label: "View ROI methodology" },
  },
  {
    prefix: "/insights/pilot-outcomes",
    topic: { slug: "executive-summary", label: "Pilot outcomes" },
  },
  {
    prefix: "/insights/executive-summary",
    topic: { slug: "executive-summary", label: "Executive summary" },
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
    prefix: "/insights/improvement-planning",
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
    prefix: "/help/data-handling",
    topic: { slug: "data-handling", label: "Data handling and tenant isolation" },
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
    prefix: "/help/enterprise-onboarding",
    topic: { slug: "enterprise-onboarding", label: "Enterprise onboarding checklist" },
  },
  {
    prefix: "/help/pilot-roi-model",
    topic: { slug: "pilot-roi-model", label: "Pilot ROI model" },
  },
  {
    prefix: "/help/pilot-feedback",
    topic: { slug: "pilot-feedback", label: "Pilot feedback" },
  },
  {
    prefix: "/help/executive-summary",
    topic: { slug: "executive-summary", label: "Executive summary" },
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
    // Secondary hub — no impact-preview specialty; omit Learn more (TB-2050).
    prefix: "/insights/impact-preview",
    topic: { label: "Impact preview" },
  },
  {
    prefix: "/internal/recommendation-learning",
    topic: { slug: "pilot-feedback", label: "How recommendation learning works" },
  },
  {
    prefix: "/internal/tenants",
    topic: { slug: "enterprise-onboarding", label: "Tenant provisioning" },
  },
  {
    // Secondary hub — no advisory-scans specialty; omit Learn more (TB-2050).
    prefix: "/governance/advisory-scans",
    topic: { label: "Advisory scans" },
  },
  { prefix: "/integrations/cloud-connections/azure", topic: { slug: "azure-permissions", label: "Azure permissions" } },
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
  { prefix: "/administration/developer", topic: { slug: "cli-usage", label: "Internal developer tools" } },
  {
    prefix: "/operate/integration-events/dlq",
    topic: { slug: "integration-readiness", label: "Integration event dead letters" },
  },
  { prefix: "/administration/system-health", topic: { slug: "troubleshooting", label: "Troubleshooting" } },
  { prefix: "/internal/integrations/itsm", topic: { slug: "integration-readiness", label: "ITSM connectors" } },
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
  {
    prefix: "/administration/identity-providers/role-mapping",
    topic: { slug: "users-and-roles", label: "Role mapping" },
  },
  {
    prefix: "/administration/identity-providers/oidc",
    topic: { slug: "enterprise-onboarding", label: "OIDC identity provider" },
  },
  {
    prefix: "/administration/identity-providers/saml",
    topic: { slug: "enterprise-onboarding", label: "SAML identity provider" },
  },
  {
    prefix: "/administration/identity/sso-wizard",
    topic: { slug: "enterprise-onboarding", label: "SSO wizard" },
  },
  {
    prefix: "/administration/scim-provisioning",
    topic: { slug: "enterprise-onboarding", label: "SCIM provisioning" },
  },
  {
    prefix: "/administration/tenant/recycle-bin",
    topic: { slug: "scope", label: "Projects recycle bin" },
  },
  {
    prefix: "/administration/identity-providers/diagnostics",
    topic: { slug: "enterprise-onboarding", label: "Identity diagnostics" },
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
    topic: { slug: "security-trust", label: "Sign-in methods" },
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
    prefix: "/administration/model-governance",
    topic: { slug: "how-it-works", label: "AI and model governance" },
  },
  {
    prefix: "/administration/users/invite-reviewer",
    topic: { slug: "users-and-roles", label: "Invite a reviewer" },
  },
  {
    prefix: "/administration/users",
    topic: { slug: "users-and-roles", label: "Users and roles" },
  },
  {
    prefix: "/settings/roles",
    topic: { slug: "users-and-roles", label: "Users and roles" },
  },
  {
    prefix: "/administration/security-trust",
    topic: { slug: "security-trust", label: "Security and trust" },
  },
  {
    prefix: "/administration/tenant",
    topic: { slug: "scope", label: OPERATOR_NAV_LINK_LABELS.workspaceSettings },
  },
  { prefix: "/administration/baseline", topic: { slug: "pilot-roi-model", label: "View ROI methodology" } },
  { prefix: "/help", topic: { slug: "getting-started", label: "Help" } },
];

const ARTIFACT_PREVIEW_HELP_TOPIC: PageHelpTopic = {
  slug: "review-artifacts",
  label: "Review artifacts",
};

/** True on in-app `/help` topic pages — contextual help chrome would only link back to the same article. */
export function pathnameIsInAppHelpTopic(pathname: string): boolean {
  const rawPath = (pathname ?? "").split("?")[0] ?? "";
  const path = (canonicalizeLegacyOperatorRoutePath(rawPath).split("?")[0] ?? rawPath).trim() || "/";

  return path === "/help" || path.startsWith("/help/");
}

export function pageHelpTopicForPathname(pathname: string): PageHelpTopic | null {
  const rawPath = (pathname ?? "").split("?")[0] ?? "";
  const path = (canonicalizeLegacyOperatorRoutePath(rawPath).split("?")[0] ?? rawPath).trim() || "/";

  if (path.includes("/artifacts/")) {
    return ARTIFACT_PREVIEW_HELP_TOPIC;
  }

  if (pathIsRunProvenance(path)) {
    return PROVENANCE_HELP_TOPIC;
  }

  if (pathIsFindingEvidenceTrace(path)) {
    return { slug: "findings", label: "Finding evidence trace" };
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
