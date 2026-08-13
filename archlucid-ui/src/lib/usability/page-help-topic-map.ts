/**
 * Maps operator routes to in-app `/help/{slug}` topics for contextual help buttons.
 */

import { canonicalizeLegacyOperatorRoutePath } from "@/lib/canonicalize-legacy-operator-route-path";
import {
  ALERTS_CONFIGURATION_PAGE_TITLE,
  ALERTS_HOW_ALERTS_WORK_LABEL,
} from "@/lib/alerts-page-copy";
import { AI_USAGE_HELP_TOPIC_LABEL } from "@/lib/ai-usage-settings-evidence-copy";
import { API_KEYS_HELP_TOPIC_LABEL } from "@/lib/api-keys-settings-evidence-copy";
import { BASELINE_SETTINGS_HELP_TOPIC_LABEL } from "@/lib/baseline-settings-evidence-copy";
import { ARCHITECTURES_LIST_PATH } from "@/lib/architecture/architecture-routes";
import { ARCHITECTURE_DRAFTS_HELP_TOPIC_LABEL } from "@/lib/architecture-drafts-evidence-copy";
import { ARCHITECTURE_INTELLIGENCE_HELP_TOPIC_LABEL } from "@/lib/architecture/architecture-intelligence-evidence-copy";
import { APPROVAL_LINEAGE_HELP_TOPIC_LABEL } from "@/lib/approval-lineage-evidence-copy";
import { APPROVAL_QUEUE_HELP_TOPIC_LABEL } from "@/lib/approval-queue-evidence-copy";
import { SPONSOR_DASHBOARD_HELP_TOPIC_LABEL } from "@/lib/architecture/architecture-sponsor-dashboard-evidence-copy";
import { AZURE_BOARDS_INTEGRATION_HELP_TOPIC_LABEL } from "@/lib/azure-boards-integration-evidence-copy";
import { PRIOR_MANIFEST_RETRIEVAL_HELP_TOPIC_LABEL } from "@/lib/ask-review-questions-evidence-copy";
import {
  COMPARISON_REPLAY_HELP_TOPIC_LABEL,
  COMPARISON_REPLAY_VALIDATE_HELP_TOPIC_LABEL,
} from "@/lib/comparison-replay-help-evidence-copy";
import { EVIDENCE_GRAPH_HELP_TOPIC_LABEL } from "@/lib/evidence-graph-evidence-copy";
import { FINDINGS_HELP_TOPIC_LABEL } from "@/lib/findings/findings-help-evidence-copy";
import { JIRA_INTEGRATION_HELP_TOPIC_LABEL } from "@/lib/jira-integration-evidence-copy";
import { MODEL_GOVERNANCE_HELP_TOPIC_LABEL } from "@/lib/model-governance-settings-evidence-copy";
import { SERVICENOW_INTEGRATION_HELP_TOPIC_LABEL } from "@/lib/servicenow-integration-evidence-copy";
import { ARCHITECTURE_DRAFTS_LIST_LABEL, START_REVIEW_LABEL } from "@/lib/architecture/architecture-workflow-labels";
import { BUYER_ONBOARDING_PAGE_TITLE, BUYER_VALUE_REPORT_HOW_IT_WORKS_TITLE } from "@/lib/buyer/buyer-polish-copy";
import { GOVERNANCE_SETUP_HREF, GOVERNANCE_SETUP_PAGE_TITLE } from "@/lib/governance/governance-setup-route";
import { GOVERNANCE_EXCEPTIONS_PATH } from "@/lib/governance/governance-route-paths";
import { GOVERNANCE_APPROVAL_HELP_TOPIC_LABEL } from "@/lib/governance/governance-approval-help-evidence-copy";
import { NOTIFICATIONS_HELP_TOPIC_LABEL } from "@/lib/notification-preference-center";
import { OPERATOR_NAV_LINK_LABELS } from "@/lib/i18n";
import { PATTERN_LIBRARY_HELP_TOPIC_LABEL } from "@/lib/pattern-library-evidence-copy";
import { PREFERENCES_HELP_TOPIC_LABEL } from "@/lib/preferences-settings-evidence-copy";
import { PROVENANCE_HELP_TOPIC, pathIsRunProvenance } from "@/lib/provenance-evidence-copy";
import { pathIsFindingEvidenceTrace } from "@/lib/evidence-trace-contextual-help";
import {
  pathIsSettingsHubRoot,
} from "@/lib/settings-admin-route-paths";
import { SPONSOR_DASHBOARD_HREF } from "@/lib/sponsor/sponsor-dashboard-route";
import { ARCHITECTURE_SCORECARD_HELP_TOPIC_LABEL } from "@/lib/architecture/architecture-scorecard-page-copy";
import { CONNECTION_STATUS_HELP_TOPIC_LABEL } from "@/lib/connection-status-evidence-copy";
import { PILOT_OUTCOMES_HELP_TOPIC_LABEL } from "@/lib/pilot-outcomes-evidence-copy";
import { ROI_SUMMARY_HELP_TOPIC_LABEL } from "@/lib/roi-summary-help-evidence-copy";
import { SLACK_INTEGRATION_HELP_TOPIC_LABEL } from "@/lib/slack-integration-evidence-copy";
import { RECURRENCE_SCHEDULES_HOW_IT_WORKS_TITLE } from "@/lib/recurrence-schedules-copy";
import { ACCELERATOR_CHOOSER_HELP_INBOUND_LABEL } from "@/lib/accelerator-chooser-help-title-honesty-surfaces";
import { REPEAT_REVIEW_LOOP_HELP_INBOUND_LABEL } from "@/lib/repeat-review-loop-help-title-honesty-surfaces";
import { RISK_EXCEPTIONS_HELP_TOPIC_LABEL } from "@/lib/risk-exceptions-evidence-copy";
import { SEARCH_REVIEW_EVIDENCE_HELP_TOPIC_LABEL } from "@/lib/search-review-evidence-evidence-copy";
import { REVIEW_PACKAGES_HELP_INBOUND_LABEL } from "@/lib/review-packages-help-title-honesty-surfaces";
import { SYSTEM_HEALTH_HELP_TOPIC_LABEL } from "@/lib/system-health-evidence-copy";
import { WORKSPACE_SETTINGS_HELP_TOPIC_LABEL } from "@/lib/tenant-settings-evidence-copy";
import { STANDARDS_RULES_HELP_TOPIC_LABEL } from "@/lib/standards-rules-page";
import { SIGNED_RECORDS_LIST_PATH } from "@/lib/signed-records-paths";
import { TEAMS_INTEGRATION_HELP_TOPIC_LABEL } from "@/lib/teams-integration-evidence-copy";
import { WEBHOOKS_INTEGRATION_HELP_TOPIC_LABEL } from "@/lib/webhooks-integration-evidence-copy";

export type PageHelpTopic = {
  /**
   * In-app `/help/{slug}` target for Learn more.
   * Omit (undefined) when Category-1 should mount without Learn more (TB-2048 / TB-2050).
   */
  readonly slug?: string;
  /** Optional hash on the resolved help href (e.g. getting-started#how-archlucid-works). */
  readonly hashFragment?: string;
  readonly label: string;
};

/** First-run / onboarding / help-topic paths allowed to keep generic `getting-started` Learn more. */
export const PAGE_HELP_FIRST_RUN_GENERIC_LEARN_MORE_ALLOWLIST_PREFIXES = [
  "/architecture/first-review-guide",
  "/help/getting-started",
  ARCHITECTURES_LIST_PATH,
  "/architectures",
  "/help",
  /** Learning proof page — product orientation via getting-started anchor. */
  "/why-archlucid",
] as const;

const PAGE_HELP_TOPICS: readonly { prefix: string; topic: PageHelpTopic }[] = [
  // Overview hero help — same topic the former "Learn / View workflow" links opened.
  {
    prefix: "/",
    topic: { slug: "first-architecture-review", label: OPERATOR_NAV_LINK_LABELS.home },
  },
  { prefix: "/architecture/first-review-guide", topic: { slug: "getting-started", label: BUYER_ONBOARDING_PAGE_TITLE } },
  { prefix: "/help/getting-started", topic: { slug: "getting-started", label: "Getting started" } },
  {
    prefix: "/help/accelerator-chooser",
    topic: { slug: "accelerator-chooser", label: ACCELERATOR_CHOOSER_HELP_INBOUND_LABEL },
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
  { prefix: ARCHITECTURES_LIST_PATH, topic: { slug: "architecture-drafts", label: ARCHITECTURE_DRAFTS_HELP_TOPIC_LABEL } },
  { prefix: "/architecture/architectures/new", topic: { slug: "first-architecture-review", label: "Create architecture" } },
  {
    prefix: "/architecture/architecture-intelligence",
    topic: { slug: "architecture-intelligence", label: ARCHITECTURE_INTELLIGENCE_HELP_TOPIC_LABEL },
  },
  { prefix: "/architectures", topic: { slug: "architecture-drafts", label: ARCHITECTURE_DRAFTS_HELP_TOPIC_LABEL } },
  { prefix: "/architecture/reviews/new", topic: { slug: "evidence-intake", label: START_REVIEW_LABEL } },
  { prefix: "/architecture/reviews", topic: { slug: "review-packages", label: REVIEW_PACKAGES_HELP_INBOUND_LABEL } },
  {
    prefix: SIGNED_RECORDS_LIST_PATH,
    topic: { slug: "review-packages", label: "Signed review records" },
  },
  { prefix: SPONSOR_DASHBOARD_HREF, topic: { slug: "sponsor-dashboard", label: SPONSOR_DASHBOARD_HELP_TOPIC_LABEL } },
  {
    prefix: "/insights/ask-review-questions",
    topic: { slug: "prior-manifest-retrieval", label: PRIOR_MANIFEST_RETRIEVAL_HELP_TOPIC_LABEL },
  },
  { prefix: "/insights/evidence-graph", topic: { slug: "evidence-graph", label: EVIDENCE_GRAPH_HELP_TOPIC_LABEL } },
  {
    prefix: "/insights/search-review-evidence",
    topic: { slug: "search-review-evidence", label: SEARCH_REVIEW_EVIDENCE_HELP_TOPIC_LABEL },
  },
  {
    prefix: "/insights/compare-two-reviews",
    topic: { slug: "comparison-replay", label: COMPARISON_REPLAY_HELP_TOPIC_LABEL },
  },
  {
    prefix: "/insights/patterns",
    topic: { slug: "repeat-review-loop", label: PATTERN_LIBRARY_HELP_TOPIC_LABEL },
  },
  { prefix: "/replay", topic: { slug: "comparison-replay", label: COMPARISON_REPLAY_HELP_TOPIC_LABEL } },
  {
    prefix: "/internal/replay",
    topic: { slug: "comparison-replay", label: COMPARISON_REPLAY_VALIDATE_HELP_TOPIC_LABEL },
  },
  { prefix: "/governance/findings", topic: { slug: "findings", label: FINDINGS_HELP_TOPIC_LABEL } },
  {
    prefix: GOVERNANCE_SETUP_HREF,
    topic: { slug: "governance-approval", label: GOVERNANCE_SETUP_PAGE_TITLE },
  },
  {
    prefix: "/governance/recurrence-schedules",
    topic: { slug: "recurrence-schedules", label: RECURRENCE_SCHEDULES_HOW_IT_WORKS_TITLE },
  },
  {
    prefix: GOVERNANCE_EXCEPTIONS_PATH,
    topic: { slug: "governance-approval", label: RISK_EXCEPTIONS_HELP_TOPIC_LABEL },
  },
  {
    prefix: "/governance/approval-queue",
    topic: { slug: "governance-approval", label: APPROVAL_QUEUE_HELP_TOPIC_LABEL },
  },
  {
    prefix: "/governance/approval-requests",
    topic: { slug: "governance-approval", label: APPROVAL_LINEAGE_HELP_TOPIC_LABEL },
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
    topic: { slug: "alerts", label: ALERTS_CONFIGURATION_PAGE_TITLE },
  },
  {
    prefix: "/governance/policy-packs",
    topic: { slug: "policy-packs", label: "Policy packs" },
  },
  {
    prefix: "/governance/standards-and-rules",
    topic: { slug: "standards-and-rules", label: STANDARDS_RULES_HELP_TOPIC_LABEL },
  },
  { prefix: "/governance", topic: { slug: "governance-approval", label: GOVERNANCE_APPROVAL_HELP_TOPIC_LABEL } },
  { prefix: "/governance/audit", topic: { slug: "audit-trail", label: "Audit trail" } },
  { prefix: "/governance/alerts", topic: { slug: "alerts", label: "Alerts" } },
  { prefix: "/governance/alert-rules", topic: { slug: "alerts", label: ALERTS_CONFIGURATION_PAGE_TITLE } },
  { prefix: "/governance/policy-packs", topic: { slug: "policy-packs", label: "Policy packs" } },
  {
    prefix: "/insights/roi-summary",
    topic: { slug: "roi-summary", label: ROI_SUMMARY_HELP_TOPIC_LABEL },
  },
  {
    prefix: "/insights/architecture-scorecard",
    topic: {
      slug: "architecture-scorecard",
      label: ARCHITECTURE_SCORECARD_HELP_TOPIC_LABEL,
    },
  },
  {
    prefix: "/insights/pilot-outcomes",
    topic: { slug: "pilot-outcomes", label: PILOT_OUTCOMES_HELP_TOPIC_LABEL },
  },
  {
    prefix: "/insights/sponsor-report",
    topic: { slug: "sponsor-report", label: BUYER_VALUE_REPORT_HOW_IT_WORKS_TITLE },
  },
  // Legacy sponsor-report bookmarks canonicalize to /insights/* above; keep prefixes for direct lookups.
  {
    prefix: "/sponsor-report/pilot-outcomes",
    topic: { slug: "pilot-outcomes", label: PILOT_OUTCOMES_HELP_TOPIC_LABEL },
  },
  {
    prefix: "/sponsor-report/roi-summary",
    topic: { slug: "roi-summary", label: ROI_SUMMARY_HELP_TOPIC_LABEL },
  },
  { prefix: "/sponsor-report", topic: { slug: "sponsor-report", label: BUYER_VALUE_REPORT_HOW_IT_WORKS_TITLE } },
  { prefix: "/architecture/digests", topic: { slug: "digests", label: "Architecture digests" } },
  { prefix: "/digests", topic: { slug: "digests", label: "Architecture digests" } },
  { prefix: "/digest-subscriptions", topic: { slug: "digests", label: "Architecture digests" } },
  { prefix: "/help/digests", topic: { slug: "digests", label: "Architecture digests" } },
  {
    prefix: "/help/recurrence-schedules",
    topic: { slug: "recurrence-schedules", label: OPERATOR_NAV_LINK_LABELS.recurrenceSchedules },
  },
  {
    prefix: "/help/roi-summary",
    topic: { slug: "roi-summary", label: ROI_SUMMARY_HELP_TOPIC_LABEL },
  },
  {
    prefix: "/help/pilot-outcomes",
    topic: { slug: "pilot-outcomes", label: PILOT_OUTCOMES_HELP_TOPIC_LABEL },
  },
  {
    prefix: "/help/architecture-scorecard",
    topic: { slug: "architecture-scorecard", label: ARCHITECTURE_SCORECARD_HELP_TOPIC_LABEL },
  },
  {
    prefix: "/help/connection-status",
    topic: { slug: "connection-status", label: CONNECTION_STATUS_HELP_TOPIC_LABEL },
  },
  {
    prefix: "/help/standards-and-rules",
    topic: { slug: "standards-and-rules", label: STANDARDS_RULES_HELP_TOPIC_LABEL },
  },
  {
    prefix: "/help/baseline-settings",
    topic: { slug: "baseline-settings", label: BASELINE_SETTINGS_HELP_TOPIC_LABEL },
  },
  {
    prefix: "/help/slack-integration",
    topic: { slug: "slack-integration", label: SLACK_INTEGRATION_HELP_TOPIC_LABEL },
  },
  {
    prefix: "/help/teams-integration",
    topic: { slug: "teams-integration", label: TEAMS_INTEGRATION_HELP_TOPIC_LABEL },
  },
  {
    prefix: "/help/webhooks-integration",
    topic: { slug: "webhooks-integration", label: WEBHOOKS_INTEGRATION_HELP_TOPIC_LABEL },
  },
  {
    prefix: "/help/api-keys",
    topic: { slug: "api-keys", label: API_KEYS_HELP_TOPIC_LABEL },
  },
  {
    prefix: "/help/system-health",
    topic: { slug: "system-health", label: SYSTEM_HEALTH_HELP_TOPIC_LABEL },
  },
  {
    prefix: "/help/ai-usage",
    topic: { slug: "ai-usage", label: AI_USAGE_HELP_TOPIC_LABEL },
  },
  {
    prefix: "/help/preferences",
    topic: { slug: "preferences", label: PREFERENCES_HELP_TOPIC_LABEL },
  },
  {
    prefix: "/help/notifications",
    topic: { slug: "notifications", label: NOTIFICATIONS_HELP_TOPIC_LABEL },
  },
  {
    prefix: "/help/workspace-settings",
    topic: { slug: "workspace-settings", label: WORKSPACE_SETTINGS_HELP_TOPIC_LABEL },
  },
  {
    prefix: "/help/evidence-graph",
    topic: { slug: "evidence-graph", label: EVIDENCE_GRAPH_HELP_TOPIC_LABEL },
  },
  {
    prefix: "/help/sponsor-dashboard",
    topic: { slug: "sponsor-dashboard", label: SPONSOR_DASHBOARD_HELP_TOPIC_LABEL },
  },
  {
    prefix: "/help/architecture-drafts",
    topic: { slug: "architecture-drafts", label: ARCHITECTURE_DRAFTS_HELP_TOPIC_LABEL },
  },
  {
    prefix: "/help/model-governance",
    topic: { slug: "model-governance", label: MODEL_GOVERNANCE_HELP_TOPIC_LABEL },
  },
  {
    prefix: "/help/jira-integration",
    topic: { slug: "jira-integration", label: JIRA_INTEGRATION_HELP_TOPIC_LABEL },
  },
  {
    prefix: "/help/servicenow-integration",
    topic: { slug: "servicenow-integration", label: SERVICENOW_INTEGRATION_HELP_TOPIC_LABEL },
  },
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
    prefix: "/internal/health",
    topic: { slug: "admin-diagnostics", label: "Diagnostics dashboard" },
  },
  {
    // Learning / product-orientation allowlist — retired how-it-works slug redirects to this anchor.
    prefix: "/why-archlucid",
    topic: {
      slug: "getting-started",
      hashFragment: "how-archlucid-works",
      label: "Why ArchLucid",
    },
  },
  {
    prefix: "/demo/explain",
    topic: { slug: "evidence-trail", label: "Demo explain" },
  },
  { prefix: "/administration/billing", topic: { slug: "billing-and-plans", label: "Billing and plans" } },
  {
    prefix: "/administration/ai-usage",
    topic: { slug: "ai-usage", label: AI_USAGE_HELP_TOPIC_LABEL },
  },
  {
    prefix: "/administration/settings/ai-usage",
    topic: { slug: "ai-usage", label: AI_USAGE_HELP_TOPIC_LABEL },
  },
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
    topic: { slug: "repeat-review-loop", label: REPEAT_REVIEW_LOOP_HELP_INBOUND_LABEL },
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
    prefix: "/help/choose-your-next-step",
    topic: { slug: "choose-your-next-step", label: "Choose your next step" },
  },
  {
    prefix: "/help/enterprise-onboarding",
    topic: { slug: "enterprise-onboarding", label: "Enterprise onboarding checklist" },
  },
  {
    prefix: "/help/pilot-feedback",
    topic: { slug: "pilot-feedback", label: "Pilot feedback" },
  },
  {
    prefix: "/help/sponsor-report",
    topic: { slug: "sponsor-report", label: BUYER_VALUE_REPORT_HOW_IT_WORKS_TITLE },
  },
  {
    prefix: "/help/policy-packs",
    topic: { slug: "policy-packs", label: "Policy packs" },
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
    prefix: "/help/first-architecture-review",
    topic: { slug: "first-architecture-review", label: "Your first architecture review" },
  },
  {
    prefix: "/help/engineering-troubleshooting",
    topic: { slug: "engineering-troubleshooting", label: "Engineering troubleshooting runbook" },
  },
  {
    prefix: "/help/api-contracts",
    topic: { slug: "api-contracts", label: "API contracts (technical reference)" },
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
  { prefix: "/integrations/azure-boards", topic: { slug: "azure-boards", label: AZURE_BOARDS_INTEGRATION_HELP_TOPIC_LABEL } },
  {
    prefix: "/integrations/jira",
    topic: { slug: "jira-integration", label: JIRA_INTEGRATION_HELP_TOPIC_LABEL },
  },
  {
    prefix: "/integrations/itsm/oauth/callback",
    topic: { slug: "integration-readiness", label: "Atlassian OAuth callback" },
  },
  {
    prefix: "/integrations/servicenow",
    topic: { slug: "servicenow-integration", label: SERVICENOW_INTEGRATION_HELP_TOPIC_LABEL },
  },
  {
    prefix: "/integrations/slack",
    topic: { slug: "slack-integration", label: SLACK_INTEGRATION_HELP_TOPIC_LABEL },
  },
  {
    prefix: "/integrations/webhooks",
    topic: { slug: "webhooks-integration", label: WEBHOOKS_INTEGRATION_HELP_TOPIC_LABEL },
  },
  {
    prefix: "/integrations/teams",
    topic: { slug: "teams-integration", label: TEAMS_INTEGRATION_HELP_TOPIC_LABEL },
  },
  { prefix: "/administration/connection-status", topic: { slug: "connection-status", label: CONNECTION_STATUS_HELP_TOPIC_LABEL } },
  { prefix: "/administration/developer", topic: { slug: "cli-usage", label: "Internal developer tools" } },
  {
    prefix: "/operate/integration-events/dlq",
    topic: { slug: "integration-readiness", label: "Integration event dead letters" },
  },
  { prefix: "/administration/system-health", topic: { slug: "system-health", label: SYSTEM_HEALTH_HELP_TOPIC_LABEL } },
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
    topic: { slug: "choose-your-next-step", label: "Demo readiness" },
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
    prefix: "/administration/workspace-settings/recycle-bin",
    topic: { slug: "workspace-settings", label: WORKSPACE_SETTINGS_HELP_TOPIC_LABEL },
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
    topic: { slug: "api-keys", label: API_KEYS_HELP_TOPIC_LABEL },
  },
  {
    prefix: "/administration/preferences",
    topic: { slug: "preferences", label: PREFERENCES_HELP_TOPIC_LABEL },
  },
  {
    prefix: "/administration/notifications",
    topic: { slug: "notifications", label: NOTIFICATIONS_HELP_TOPIC_LABEL },
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
    topic: { slug: "model-governance", label: MODEL_GOVERNANCE_HELP_TOPIC_LABEL },
  },
  {
    prefix: "/administration/users/invite-reviewer",
    topic: { slug: "users-and-roles", label: "Invite a reviewer" },
  },
  {
    prefix: "/administration/users",
    topic: { slug: "users-and-roles", label: `${OPERATOR_NAV_LINK_LABELS.usersAndRoles} help` },
  },
  {
    // Legacy settings segment — permanent redirect destination still resolves help before navigation settles.
    prefix: "/administration/settings/users",
    topic: { slug: "users-and-roles", label: `${OPERATOR_NAV_LINK_LABELS.usersAndRoles} help` },
  },
  {
    prefix: "/settings/roles",
    topic: { slug: "users-and-roles", label: `${OPERATOR_NAV_LINK_LABELS.usersAndRoles} help` },
  },
  {
    prefix: "/administration/security-trust",
    topic: { slug: "security-trust", label: `${OPERATOR_NAV_LINK_LABELS.securityTrust} help` },
  },
  {
    prefix: "/administration/settings/security-trust",
    topic: { slug: "security-trust", label: `${OPERATOR_NAV_LINK_LABELS.securityTrust} help` },
  },
  {
    prefix: "/administration/workspace-settings",
    topic: { slug: "workspace-settings", label: WORKSPACE_SETTINGS_HELP_TOPIC_LABEL },
  },
  {
    prefix: "/administration/baseline",
    topic: { slug: "baseline-settings", label: BASELINE_SETTINGS_HELP_TOPIC_LABEL },
  },
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

  // Exact Settings hub only — must not use prefix startsWith or `/administration/*` children inherit this topic.
  if (pathIsSettingsHubRoot(path)) {
    return { label: "Settings help" };
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
