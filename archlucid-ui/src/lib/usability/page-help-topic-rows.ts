/**
 * Operator route prefixes and inbound labels for contextual help.
 * Lookup lives in page-help-topic-map.ts so this file stays a data leaf.
 */

import {
  ALERTS_CONFIGURATION_PAGE_TITLE,
  ALERTS_HOW_ALERTS_WORK_LABEL,
} from "@/lib/alerts-page-copy";
import { ADMIN_DIAGNOSTICS_HELP_TOPIC_LABEL } from "@/lib/admin-diagnostics-help-evidence-copy";
import { ADMIN_HEALTH_HELP_TOPIC_LABEL } from "@/lib/admin-health-evidence-copy";
import { ADMIN_TENANTS_HELP_TOPIC_LABEL } from "@/lib/admin-tenants-evidence-copy";
import { ACCOUNT_SECURITY_SETTINGS_HELP_TOPIC_LABEL } from "@/lib/account-security-settings-evidence-copy";
import { AI_USAGE_HELP_TOPIC_LABEL } from "@/lib/ai-usage-settings-evidence-copy";
import { AGENT_MODEL_CATALOG_HELP_TOPIC_LABEL } from "@/lib/agent-model-catalog-evidence-copy";
import { AUTH_DOMAINS_SETTINGS_HELP_TOPIC_LABEL } from "@/lib/auth-domains-settings-evidence-copy";
import { API_CONTRACTS_HELP_TOPIC_LABEL } from "@/lib/api-contracts-help-guide-content";
import { API_KEYS_HELP_TOPIC_LABEL } from "@/lib/api-keys-settings-evidence-copy";
import { AUTHENTICATION_SIGN_IN_HELP_TOPIC_LABEL } from "@/lib/authentication-sign-in-help-evidence-copy";
import { BASELINE_SETTINGS_HELP_TOPIC_LABEL } from "@/lib/baseline-settings-evidence-copy";
import { CAIQ_SIG_RESPONSE_HELP_TOPIC_LABEL } from "@/lib/caiq-sig-response-help-evidence-copy";
import { CLI_USAGE_HELP_TOPIC_LABEL } from "@/lib/cli-usage-help-evidence-copy";
import { CLOUD_CONNECTIONS_HELP_TOPIC_LABEL } from "@/lib/cloud-connections-evidence-copy";
import { CONFIGURATION_REFERENCE_HELP_TOPIC_LABEL } from "@/lib/configuration-reference-help-guide-content";
import { CONNECT_AWS_SECURELY_HELP_TOPIC_LABEL } from "@/lib/connect-aws-securely-help-evidence-copy";
import { CONNECT_GCP_SECURELY_HELP_TOPIC_LABEL } from "@/lib/connect-gcp-securely-help-evidence-copy";
import { CONNECT_AZURE_SECURELY_HELP_TOPIC_LABEL } from "@/lib/cloud-provider-connection-evidence-copy";
import { AZURE_PERMISSIONS_HELP_TOPIC_LABEL } from "@/lib/azure-permissions-help-evidence-copy";
import { AUDIT_TRAIL_HELP_TOPIC_LABEL } from "@/lib/audit-trail-help-evidence-copy";
import { DIGESTS_HELP_TOPIC_LABEL } from "@/lib/digests-help-evidence-copy";
import { ADVISORY_SCANS_HELP_TOPIC_LABEL } from "@/lib/advisory-scans-help-evidence-copy";
import { ARCHITECTURES_NEW_HELP_TOPIC_LABEL } from "@/lib/architectures-new-evidence-copy";
import { ARCHITECTURES_LIST_PATH } from "@/lib/architecture/architecture-routes";
import { DATA_HANDLING_TENANT_ISOLATION_HELP_TOPIC_LABEL } from "@/lib/data-handling-tenant-isolation-help-evidence-copy";
import { DECISION_REGISTER_HELP_TOPIC_LABEL } from "@/lib/decision-register-help-evidence-copy";
import { DEMO_EXPLAIN_HELP_TOPIC_LABEL } from "@/lib/demo-explain-evidence-copy";
import { DEMO_READINESS_HELP_TOPIC_LABEL } from "@/lib/demo-readiness-evidence-copy";
import { INTERNAL_DEVELOPER_TOOLS_PAGE_TITLE } from "@/lib/developer-settings-evidence-copy";
import { HELP_HUB_HELP_TOPIC_LABEL } from "@/lib/help/help-hub-evidence-copy";
import { REVIEW_ARTIFACTS_HELP_TOPIC_LABEL } from "@/lib/review-artifacts-evidence-copy";
import { WHY_ARCHLUCID_HELP_TOPIC_LABEL } from "@/lib/why-archlucid-evidence-copy";
import { DEPLOYMENT_STATUS_HELP_TOPIC_LABEL } from "@/lib/deployment-status-evidence-copy";
import { FLEET_LLM_COGS_HELP_TOPIC_LABEL } from "@/lib/fleet-llm-cogs-evidence-copy";
import { DPA_TEMPLATE_HELP_TOPIC_LABEL } from "@/lib/dpa-template-help-guide-content";
import { EVIDENCE_PROPOSALS_HELP_TOPIC_LABEL } from "@/lib/evidence-proposals-evidence-copy";
import { EVIDENCE_TRAIL_HELP_TOPIC_LABEL } from "@/lib/evidence-trail-help-evidence-copy";
import { GETTING_STARTED_HELP_TOPIC_LABEL } from "@/lib/getting-started-help-guide-content";
import { IMPACT_PREVIEW_HELP_TOPIC_LABEL } from "@/lib/impact-preview-help-evidence-copy";
import {
  INTERNAL_AGENT_MODEL_CATALOG_PATH,
  INTERNAL_DEMO_READINESS_PATH,
  INTERNAL_DEPLOYMENT_STATUS_PATH,
  INTERNAL_PLATFORM_BUNDLED_POLICY_PACKS_PATH,
  INTERNAL_PRICING_QUOTE_AGING_PATH,
  INTERNAL_REPLAY_PATH,
  INTERNAL_TENANT_HEALTH_PATH,
  INTERNAL_TRIAL_FUNNEL_PATH,
} from "@/lib/internal-ops-route-paths";
import { IMPROVEMENT_PLANNING_HELP_TOPIC_LABEL } from "@/lib/improvement-planning-help-evidence-copy";
import { RAG_HEALTH_HELP_TOPIC_LABEL } from "@/lib/rag-health-evidence-copy";
import { RECOMMENDATION_LEARNING_HELP_TOPIC_LABEL } from "@/lib/recommendation-learning-evidence-copy";
import { SIGNED_RECORDS_LIST_HELP_TOPIC_LABEL } from "@/lib/signed-records-list-evidence-copy";
import { ARCHITECTURE_DRAFTS_HELP_TOPIC_LABEL } from "@/lib/architecture-drafts-evidence-copy";
import { ARCHITECTURE_INTELLIGENCE_HELP_TOPIC_LABEL } from "@/lib/architecture/architecture-intelligence-evidence-copy";
import { APPROVAL_LINEAGE_HELP_TOPIC_LABEL } from "@/lib/approval-lineage-evidence-copy";
import { APPROVAL_QUEUE_HELP_TOPIC_LABEL } from "@/lib/approval-queue-evidence-copy";
import { SPONSOR_DASHBOARD_HELP_TOPIC_LABEL } from "@/lib/architecture/architecture-sponsor-dashboard-evidence-copy";
import { AZURE_BOARDS_INTEGRATION_HELP_TOPIC_LABEL } from "@/lib/azure-boards-integration-evidence-copy";
import { PRIOR_MANIFEST_RETRIEVAL_HELP_TOPIC_LABEL } from "@/lib/prior-manifest-retrieval-help-evidence-copy";
import {
  COMPARISON_REPLAY_HELP_TOPIC_LABEL,
} from "@/lib/comparison-replay-help-evidence-copy";
import { ENGINEERING_TROUBLESHOOTING_HELP_TOPIC_LABEL } from "@/lib/engineering-troubleshooting-help-guide-content";
import { ENTERPRISE_ONBOARDING_HELP_TOPIC_LABEL } from "@/lib/enterprise-onboarding-help-evidence-copy";
import { EVIDENCE_GRAPH_HELP_TOPIC_LABEL } from "@/lib/evidence-graph-evidence-copy";
import { EVIDENCE_INTAKE_HELP_TOPIC_LABEL } from "@/lib/evidence-intake-help-evidence-copy";
import { FIRST_ARCHITECTURE_REVIEW_HELP_TOPIC_LABEL } from "@/lib/first-architecture-review-help-copy";
import { FINDINGS_HELP_TOPIC_LABEL } from "@/lib/findings/findings-help-evidence-copy";
import { JIRA_INTEGRATION_HELP_TOPIC_LABEL } from "@/lib/jira-integration-evidence-copy";
import { MODEL_GOVERNANCE_HELP_TOPIC_LABEL } from "@/lib/model-governance-settings-evidence-copy";
import { SERVICENOW_INTEGRATION_HELP_TOPIC_LABEL } from "@/lib/servicenow-integration-evidence-copy";
import { ARCHITECTURE_DRAFTS_LIST_LABEL, START_REVIEW_LABEL } from "@/lib/architecture/architecture-workflow-labels";
import { BILLING_AND_PLANS_HELP_TOPIC_LABEL } from "@/lib/billing-and-plans-help-evidence-copy";
import { EXTRACT_UPLOAD_SETTINGS_HELP_TOPIC_LABEL } from "@/lib/extract-upload-settings-evidence-copy";
import { INVITE_REVIEWER_HELP_TOPIC_LABEL } from "@/lib/invite-reviewer-evidence-copy";
import { OPERATOR_BILLING_SETTINGS_HELP_TOPIC_LABEL } from "@/lib/operator/operator-billing-settings-evidence-copy";
import { PILOT_FEEDBACK_HELP_TOPIC_LABEL } from "@/lib/pilot-feedback-help-evidence-copy";
import { PRICING_QUOTE_AGING_HELP_TOPIC_LABEL } from "@/lib/pricing-quote-aging-evidence-copy";
import { SECURITY_TRUST_HELP_TOPIC_LABEL } from "@/lib/security-trust-help-evidence-copy";
import { SETTINGS_SECURITY_TRUST_HELP_TOPIC_LABEL } from "@/lib/settings-security-trust-evidence-copy";
import { SETTINGS_USERS_HELP_TOPIC_LABEL } from "@/lib/settings-users-evidence-copy";
import { TENANT_HEALTH_HELP_TOPIC_LABEL } from "@/lib/tenant-health-evidence-copy";
import { TRIAL_FUNNEL_HELP_TOPIC_LABEL } from "@/lib/trial-funnel-evidence-copy";
import { USERS_AND_ROLES_HELP_TOPIC_LABEL } from "@/lib/users-and-roles-help-evidence-copy";
import { BUYER_ONBOARDING_PAGE_TITLE } from "@/lib/buyer/buyer-polish-copy";
import { SPONSOR_REPORT_HELP_TOPIC_LABEL } from "@/lib/sponsor/sponsor-report-help-evidence-copy";
import { GOVERNANCE_SETUP_HREF, GOVERNANCE_SETUP_PAGE_TITLE } from "@/lib/governance/governance-setup-route";
import { GOVERNANCE_EXCEPTIONS_PATH } from "@/lib/governance/governance-route-paths";
import { GLOSSARY_HELP_TOPIC_LABEL } from "@/lib/glossary-help-evidence-copy";
import { GOVERNANCE_APPROVAL_HELP_TOPIC_LABEL } from "@/lib/governance/governance-approval-help-evidence-copy";
import { IDENTITY_PROVIDERS_DIAGNOSTICS_HELP_TOPIC_LABEL } from "@/lib/identity-providers-diagnostics-evidence-copy";
import { IDENTITY_PROVIDERS_OIDC_HELP_TOPIC_LABEL } from "@/lib/identity-providers-oidc-evidence-copy";
import { IDENTITY_PROVIDERS_SAML_HELP_TOPIC_LABEL } from "@/lib/identity-providers-saml-evidence-copy";
import { IDENTITY_PROVIDERS_SETTINGS_HELP_TOPIC_LABEL } from "@/lib/identity-providers-settings-evidence-copy";
import { INTEGRATION_EVENTS_DLQ_HELP_TOPIC_LABEL } from "@/lib/integration-events-dlq-evidence-copy";
import { INTEGRATION_READINESS_HELP_TOPIC_LABEL } from "@/lib/integration-readiness-help-evidence-copy";
import { ITSM_CONNECTORS_HELP_TOPIC_LABEL } from "@/lib/admin-itsm-connectors-evidence-copy";
import { ITSM_OAUTH_CALLBACK_HELP_TOPIC_LABEL } from "@/lib/itsm/itsm-oauth-callback-evidence-copy";
import {
  NOTIFICATION_PREFERENCE_CENTER_PAGE_TITLE,
  NOTIFICATIONS_HELP_TOPIC_LABEL,
} from "@/lib/notification-preference-center";
import { OPERATOR_NAV_LINK_LABELS } from "@/lib/i18n";
import { PATH_CHOOSER_HELP_TOPIC_LABEL } from "@/lib/path-chooser-help-evidence-copy";
import { PATTERN_LIBRARY_HELP_TOPIC_LABEL } from "@/lib/pattern-library-evidence-copy";
import { PILOT_GUIDE_HELP_TOPIC_LABEL } from "@/lib/pilot-guide-help-evidence-copy";
import { POLICY_PACKS_HELP_TOPIC_LABEL } from "@/lib/policy/policy-packs-help-evidence-copy";
import { PLATFORM_BUNDLED_POLICY_PACKS_HELP_TOPIC_LABEL } from "@/lib/platform-bundled-policy-packs-evidence-copy";
import { POLICY_PACKS_HUB_HELP_TOPIC_LABEL } from "@/lib/policy/policy-packs-hub-evidence-copy";
import { PREFERENCES_HELP_TOPIC_LABEL } from "@/lib/preferences-settings-evidence-copy";
import { PROCUREMENT_HELP_TOPIC_LABEL } from "@/lib/procurement-help-evidence-copy";
import { SPONSOR_DASHBOARD_HREF } from "@/lib/sponsor/sponsor-dashboard-route";
import { ARCHITECTURE_SCORECARD_HELP_TOPIC_LABEL } from "@/lib/architecture/architecture-scorecard-page-copy";
import { REVIEW_SCORECARD_PAGE_TITLE } from "@/lib/pilot-scorecard-present";
import { CONNECTION_STATUS_HELP_TOPIC_LABEL } from "@/lib/connection-status-evidence-copy";
import { ROI_SUMMARY_HELP_TOPIC_LABEL } from "@/lib/roi-summary-help-evidence-copy";
import { SLACK_INTEGRATION_HELP_TOPIC_LABEL } from "@/lib/slack-integration-evidence-copy";
import { RECURRENCE_SCHEDULES_HELP_TOPIC_LABEL } from "@/lib/recurrence-schedules-help-evidence-copy";
import { RECURRENCE_SCHEDULES_HOW_IT_WORKS_TITLE } from "@/lib/recurrence-schedules-copy";
import { ACCELERATOR_CHOOSER_HELP_INBOUND_LABEL } from "@/lib/accelerator-chooser-help-title-honesty-surfaces";
import { REPEAT_REVIEW_LOOP_HELP_INBOUND_LABEL } from "@/lib/repeat-review-loop-help-title-honesty-surfaces";
import { ROLE_MAPPING_SETTINGS_HELP_TOPIC_LABEL } from "@/lib/role-mapping-settings-evidence-copy";
import { RISK_EXCEPTIONS_HELP_TOPIC_LABEL } from "@/lib/risk-exceptions-evidence-copy";
import { SCOPE_HELP_TOPIC_LABEL } from "@/lib/scope-help-evidence-copy";
import { SCIM_PROVISIONING_HELP_TOPIC_LABEL } from "@/lib/scim-provisioning-evidence-copy";
import { SEARCH_REVIEW_EVIDENCE_HELP_TOPIC_LABEL } from "@/lib/search-review-evidence-evidence-copy";
import { SOC2_SELF_ASSESSMENT_HELP_TOPIC_LABEL } from "@/lib/soc2-self-assessment-help-guide-content";
import { SSO_WIZARD_HELP_TOPIC_LABEL } from "@/lib/sso-wizard-evidence-copy";
import { REVIEW_GUIDE_HELP_TOPIC_LABEL } from "@/lib/review-guide-help-evidence-copy";
import { REVIEW_PACKAGES_HELP_INBOUND_LABEL } from "@/lib/review-packages-help-title-honesty-surfaces";
import { SYSTEM_HEALTH_HELP_TOPIC_LABEL } from "@/lib/system-health-evidence-copy";
import { WORKSPACE_SETTINGS_HELP_TOPIC_LABEL } from "@/lib/tenant-settings-evidence-copy";
import { STANDARDS_RULES_HELP_TOPIC_LABEL } from "@/lib/standards-rules-page";
import { SIGNED_RECORDS_LIST_PATH } from "@/lib/signed-records-paths";
import { TEAMS_INTEGRATION_HELP_TOPIC_LABEL } from "@/lib/teams-integration-evidence-copy";
import { TROUBLESHOOTING_HELP_TOPIC_LABEL } from "@/lib/troubleshooting-help-evidence-copy";
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

export const PAGE_HELP_TOPICS: readonly { prefix: string; topic: PageHelpTopic }[] = [
  // Overview hero help — same topic the former "Learn / View workflow" links opened.
  {
    prefix: "/",
    topic: { label: OPERATOR_NAV_LINK_LABELS.home },
  },
  { prefix: "/architecture/first-review-guide", topic: { label: BUYER_ONBOARDING_PAGE_TITLE } },
  { prefix: "/help/getting-started", topic: { slug: "getting-started", label: GETTING_STARTED_HELP_TOPIC_LABEL } },
  {
    prefix: "/help/accelerator-chooser",
    topic: { slug: "accelerator-chooser", label: ACCELERATOR_CHOOSER_HELP_INBOUND_LABEL },
  },
  {
    prefix: "/help/admin-diagnostics",
    topic: { slug: "admin-diagnostics", label: ADMIN_DIAGNOSTICS_HELP_TOPIC_LABEL },
  },
  {
    prefix: "/help/authentication-sign-in",
    topic: { slug: "authentication-sign-in", label: AUTHENTICATION_SIGN_IN_HELP_TOPIC_LABEL },
  },
  {
    prefix: "/help/azure-boards",
    topic: { slug: "azure-boards", label: AZURE_BOARDS_INTEGRATION_HELP_TOPIC_LABEL },
  },
  {
    prefix: "/help/integration-readiness",
    topic: { slug: "integration-readiness", label: INTEGRATION_READINESS_HELP_TOPIC_LABEL },
  },
  {
    prefix: "/help/caiq-sig-response",
    topic: { slug: "caiq-sig-response", label: CAIQ_SIG_RESPONSE_HELP_TOPIC_LABEL },
  },
  {
    prefix: "/help/comparison-replay",
    topic: { slug: "comparison-replay", label: COMPARISON_REPLAY_HELP_TOPIC_LABEL },
  },
  {
    prefix: "/help/troubleshooting",
    topic: { slug: "troubleshooting", label: TROUBLESHOOTING_HELP_TOPIC_LABEL },
  },
  {
    prefix: "/help/alerts",
    topic: { slug: "alerts", label: ALERTS_HOW_ALERTS_WORK_LABEL },
  },
  {
    prefix: "/help/findings",
    topic: { slug: "findings", label: FINDINGS_HELP_TOPIC_LABEL },
  },
  {
    prefix: "/help/governance-approval",
    topic: { slug: "governance-approval", label: GOVERNANCE_APPROVAL_HELP_TOPIC_LABEL },
  },
  {
    prefix: "/help/review-guide",
    topic: { slug: "review-guide", label: REVIEW_GUIDE_HELP_TOPIC_LABEL },
  },
  {
    prefix: "/help/pilot-guide",
    topic: { slug: "pilot-guide", label: PILOT_GUIDE_HELP_TOPIC_LABEL },
  },
  {
    prefix: "/help/first-architecture-review",
    topic: { slug: "first-architecture-review", label: FIRST_ARCHITECTURE_REVIEW_HELP_TOPIC_LABEL },
  },
  {
    prefix: "/help/cloud-connections/azure",
    topic: { slug: "cloud-connections-azure", label: CONNECT_AZURE_SECURELY_HELP_TOPIC_LABEL },
  },
  {
    prefix: "/help/cloud-connections/aws",
    topic: { slug: "cloud-connections-aws", label: CONNECT_AWS_SECURELY_HELP_TOPIC_LABEL },
  },
  {
    prefix: "/help/cloud-connections/gcp",
    topic: { slug: "cloud-connections-gcp", label: CONNECT_GCP_SECURELY_HELP_TOPIC_LABEL },
  },
  {
    prefix: "/help/azure-permissions",
    topic: { slug: "azure-permissions", label: AZURE_PERMISSIONS_HELP_TOPIC_LABEL },
  },
  {
    prefix: "/help/glossary",
    topic: { slug: "glossary", label: GLOSSARY_HELP_TOPIC_LABEL },
  },
  {
    prefix: "/help/cloud-connections",
    topic: { slug: "cloud-connections", label: CLOUD_CONNECTIONS_HELP_TOPIC_LABEL },
  },
  {
    prefix: "/help/users-and-roles",
    topic: { slug: "users-and-roles", label: USERS_AND_ROLES_HELP_TOPIC_LABEL },
  },
  { prefix: ARCHITECTURES_LIST_PATH, topic: { slug: "architecture-drafts", label: ARCHITECTURE_DRAFTS_LIST_LABEL } },
  { prefix: "/architecture/architectures/new", topic: { slug: "structured-brief", label: ARCHITECTURES_NEW_HELP_TOPIC_LABEL } },
  {
    prefix: "/architecture/architecture-intelligence",
    topic: { slug: "architecture-intelligence", label: ARCHITECTURE_INTELLIGENCE_HELP_TOPIC_LABEL },
  },
  { prefix: "/architectures", topic: { slug: "architecture-drafts", label: ARCHITECTURE_DRAFTS_LIST_LABEL } },
  { prefix: "/architecture/reviews/new", topic: { slug: "evidence-intake", label: START_REVIEW_LABEL } },
  { prefix: "/architecture/reviews", topic: { slug: "review-packages", label: REVIEW_PACKAGES_HELP_INBOUND_LABEL } },
  {
    prefix: SIGNED_RECORDS_LIST_PATH,
    topic: { slug: "review-packages", label: SIGNED_RECORDS_LIST_HELP_TOPIC_LABEL },
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
    topic: { slug: "comparison-replay", label: COMPARISON_REPLAY_HELP_TOPIC_LABEL },
  },
  {
    prefix: INTERNAL_REPLAY_PATH,
    topic: { slug: "comparison-replay", label: COMPARISON_REPLAY_HELP_TOPIC_LABEL },
  },
  { prefix: "/governance/findings", topic: { slug: "findings", label: OPERATOR_NAV_LINK_LABELS.findings } },
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
  { prefix: "/governance/audit", topic: { slug: "audit-trail", label: AUDIT_TRAIL_HELP_TOPIC_LABEL } },
  {
    prefix: "/governance/decision-register",
    topic: { slug: "decision-register", label: DECISION_REGISTER_HELP_TOPIC_LABEL },
  },
  {
    prefix: "/governance/alerts",
    topic: { slug: "alerts", label: OPERATOR_NAV_LINK_LABELS.alerts },
  },
  {
    prefix: "/governance/alert-rules",
    topic: { slug: "alerts", label: ALERTS_CONFIGURATION_PAGE_TITLE },
  },
  {
    prefix: "/governance/policy-packs",
    topic: { slug: "policy-packs", label: POLICY_PACKS_HUB_HELP_TOPIC_LABEL },
  },
  {
    prefix: "/governance/standards-and-rules",
    topic: { slug: "standards-and-rules", label: STANDARDS_RULES_HELP_TOPIC_LABEL },
  },
  { prefix: "/governance", topic: { slug: "governance-approval", label: GOVERNANCE_APPROVAL_HELP_TOPIC_LABEL } },
  {
    prefix: "/insights/roi-summary",
    topic: { slug: "roi-summary", label: ROI_SUMMARY_HELP_TOPIC_LABEL },
  },
  {
    prefix: "/insights/architecture-scorecard",
    topic: {
      slug: "architecture-scorecard",
      label: REVIEW_SCORECARD_PAGE_TITLE,
    },
  },
  {
    prefix: "/insights/sponsor-report",
    topic: { slug: "sponsor-report", label: SPONSOR_REPORT_HELP_TOPIC_LABEL },
  },
  // Legacy sponsor-report bookmarks canonicalize to /insights/* above; keep prefixes for direct lookups.
  {
    prefix: "/sponsor-report/roi-summary",
    topic: { slug: "roi-summary", label: ROI_SUMMARY_HELP_TOPIC_LABEL },
  },
  { prefix: "/sponsor-report", topic: { slug: "sponsor-report", label: SPONSOR_REPORT_HELP_TOPIC_LABEL } },
  { prefix: "/architecture/digests", topic: { slug: "digests", label: DIGESTS_HELP_TOPIC_LABEL } },
  { prefix: "/digests", topic: { slug: "digests", label: DIGESTS_HELP_TOPIC_LABEL } },
  { prefix: "/digest-subscriptions", topic: { slug: "digests", label: DIGESTS_HELP_TOPIC_LABEL } },
  { prefix: "/help/digests", topic: { slug: "digests", label: DIGESTS_HELP_TOPIC_LABEL } },
  {
    prefix: "/help/recurrence-schedules",
    topic: { slug: "recurrence-schedules", label: RECURRENCE_SCHEDULES_HELP_TOPIC_LABEL },
  },
  {
    prefix: "/help/roi-summary",
    topic: { slug: "roi-summary", label: ROI_SUMMARY_HELP_TOPIC_LABEL },
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
    prefix: "/insights/improvement-planning",
    topic: { slug: "improvement-planning", label: IMPROVEMENT_PLANNING_HELP_TOPIC_LABEL },
  },
  {
    prefix: "/internal/evidence-proposals",
    topic: { slug: "evidence-trail", label: EVIDENCE_PROPOSALS_HELP_TOPIC_LABEL },
  },
  {
    prefix: "/admin/evidence-proposals",
    topic: { slug: "evidence-trail", label: EVIDENCE_PROPOSALS_HELP_TOPIC_LABEL },
  },
  {
    prefix: "/internal/product-learning",
    topic: { slug: "pilot-feedback", label: PILOT_FEEDBACK_HELP_TOPIC_LABEL },
  },
  {
    prefix: "/internal/health",
    topic: { slug: "admin-diagnostics", label: ADMIN_HEALTH_HELP_TOPIC_LABEL },
  },
  {
    // Panel-only — telemetry copy is route-specific; getting-started duplicates product orientation.
    prefix: "/why-archlucid",
    topic: {
      label: WHY_ARCHLUCID_HELP_TOPIC_LABEL,
    },
  },
  {
    prefix: "/demo/explain",
    topic: { slug: "evidence-trail", label: DEMO_EXPLAIN_HELP_TOPIC_LABEL },
  },
  { prefix: "/administration/billing", topic: { slug: "billing-and-plans", label: OPERATOR_BILLING_SETTINGS_HELP_TOPIC_LABEL } },
  {
    prefix: "/administration/ai-usage",
    topic: { slug: "ai-usage", label: AI_USAGE_HELP_TOPIC_LABEL },
  },
  {
    prefix: "/administration/settings/ai-usage",
    topic: { slug: "ai-usage", label: AI_USAGE_HELP_TOPIC_LABEL },
  },
  { prefix: "/help/billing-and-plans", topic: { slug: "billing-and-plans", label: BILLING_AND_PLANS_HELP_TOPIC_LABEL } },
  {
    prefix: "/help/security-trust",
    topic: { slug: "security-trust", label: SECURITY_TRUST_HELP_TOPIC_LABEL },
  },
  {
    prefix: "/help/procurement",
    topic: { slug: "procurement", label: PROCUREMENT_HELP_TOPIC_LABEL },
  },
  {
    prefix: "/help/scope",
    topic: { slug: "scope", label: SCOPE_HELP_TOPIC_LABEL },
  },
  {
    prefix: "/help/repeat-review-loop",
    topic: { slug: "repeat-review-loop", label: REPEAT_REVIEW_LOOP_HELP_INBOUND_LABEL },
  },
  { prefix: "/help/audit-trail", topic: { slug: "audit-trail", label: AUDIT_TRAIL_HELP_TOPIC_LABEL } },
  {
    prefix: "/help/evidence-trail",
    topic: { slug: "evidence-trail", label: EVIDENCE_TRAIL_HELP_TOPIC_LABEL },
  },
  {
    prefix: "/help/evidence-intake",
    topic: { slug: "evidence-intake", label: EVIDENCE_INTAKE_HELP_TOPIC_LABEL },
  },
  {
    prefix: "/help/data-handling",
    topic: { slug: "data-handling", label: DATA_HANDLING_TENANT_ISOLATION_HELP_TOPIC_LABEL },
  },
  {
    prefix: "/help/dpa-template",
    topic: { slug: "dpa-template", label: DPA_TEMPLATE_HELP_TOPIC_LABEL },
  },
  {
    prefix: "/help/soc2-self-assessment",
    topic: { slug: "soc2-self-assessment", label: SOC2_SELF_ASSESSMENT_HELP_TOPIC_LABEL },
  },
  {
    prefix: "/help/choose-your-next-step",
    topic: { slug: "choose-your-next-step", label: PATH_CHOOSER_HELP_TOPIC_LABEL },
  },
  {
    prefix: "/help/enterprise-onboarding",
    topic: { slug: "enterprise-onboarding", label: ENTERPRISE_ONBOARDING_HELP_TOPIC_LABEL },
  },
  {
    prefix: "/help/pilot-feedback",
    topic: { slug: "pilot-feedback", label: PILOT_FEEDBACK_HELP_TOPIC_LABEL },
  },
  {
    prefix: "/help/sponsor-report",
    topic: { slug: "sponsor-report", label: SPONSOR_REPORT_HELP_TOPIC_LABEL },
  },
  {
    prefix: "/help/policy-packs",
    topic: { slug: "policy-packs", label: POLICY_PACKS_HELP_TOPIC_LABEL },
  },
  {
    prefix: "/help/configuration-reference",
    topic: { slug: "configuration-reference", label: CONFIGURATION_REFERENCE_HELP_TOPIC_LABEL },
  },
  {
    prefix: "/help/cli-usage",
    topic: { slug: "cli-usage", label: CLI_USAGE_HELP_TOPIC_LABEL },
  },
  {
    prefix: "/help/engineering-troubleshooting",
    topic: { slug: "engineering-troubleshooting", label: ENGINEERING_TROUBLESHOOTING_HELP_TOPIC_LABEL },
  },
  {
    prefix: "/help/api-contracts",
    topic: { slug: "api-contracts", label: API_CONTRACTS_HELP_TOPIC_LABEL },
  },
  {
    prefix: "/insights/impact-preview",
    topic: { slug: "impact-preview", label: IMPACT_PREVIEW_HELP_TOPIC_LABEL },
  },
  {
    prefix: "/internal/rag-health",
    topic: { slug: "troubleshooting", label: RAG_HEALTH_HELP_TOPIC_LABEL },
  },
  {
    prefix: "/admin/rag-health",
    topic: { slug: "troubleshooting", label: RAG_HEALTH_HELP_TOPIC_LABEL },
  },
  {
    prefix: "/internal/recommendation-learning",
    topic: { slug: "pilot-feedback", label: RECOMMENDATION_LEARNING_HELP_TOPIC_LABEL },
  },
  {
    prefix: "/internal/tenants",
    topic: { slug: "enterprise-onboarding", label: ADMIN_TENANTS_HELP_TOPIC_LABEL },
  },
  {
    prefix: "/governance/advisory-scans",
    topic: { slug: "advisory-scans", label: ADVISORY_SCANS_HELP_TOPIC_LABEL },
  },
  {
    prefix: "/integrations/cloud-connections/azure",
    topic: { slug: "cloud-connections-azure", label: CONNECT_AZURE_SECURELY_HELP_TOPIC_LABEL },
  },
  { prefix: "/integrations/cloud-connections/aws", topic: { slug: "cloud-connections-aws", label: CONNECT_AWS_SECURELY_HELP_TOPIC_LABEL } },
  { prefix: "/integrations/cloud-connections/gcp", topic: { slug: "cloud-connections-gcp", label: CONNECT_GCP_SECURELY_HELP_TOPIC_LABEL } },
  { prefix: "/integrations/cloud-connections", topic: { slug: "cloud-connections", label: CLOUD_CONNECTIONS_HELP_TOPIC_LABEL } },
  { prefix: "/integrations/azure-boards", topic: { slug: "azure-boards", label: AZURE_BOARDS_INTEGRATION_HELP_TOPIC_LABEL } },
  {
    prefix: "/integrations/jira",
    topic: { slug: "jira-integration", label: JIRA_INTEGRATION_HELP_TOPIC_LABEL },
  },
  {
    prefix: "/integrations/itsm/oauth/callback",
    topic: { slug: "integration-readiness", label: ITSM_OAUTH_CALLBACK_HELP_TOPIC_LABEL },
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
  { prefix: "/administration/developer", topic: { slug: "cli-usage", label: INTERNAL_DEVELOPER_TOOLS_PAGE_TITLE } },
  {
    prefix: "/internal/failed-integration-messages",
    topic: { slug: "integration-readiness", label: INTEGRATION_EVENTS_DLQ_HELP_TOPIC_LABEL },
  },
  {
    prefix: INTERNAL_PLATFORM_BUNDLED_POLICY_PACKS_PATH,
    topic: { slug: "policy-packs", label: PLATFORM_BUNDLED_POLICY_PACKS_HELP_TOPIC_LABEL },
  },
  { prefix: "/administration/system-health", topic: { slug: "system-health", label: SYSTEM_HEALTH_HELP_TOPIC_LABEL } },
  { prefix: "/internal/integrations/itsm", topic: { slug: "integration-readiness", label: ITSM_CONNECTORS_HELP_TOPIC_LABEL } },
  {
    prefix: INTERNAL_AGENT_MODEL_CATALOG_PATH,
    topic: { slug: "model-governance", label: AGENT_MODEL_CATALOG_HELP_TOPIC_LABEL },
  },
  {
    prefix: "/internal/fleet-llm-cogs",
    topic: { slug: "ai-usage", label: FLEET_LLM_COGS_HELP_TOPIC_LABEL },
  },
  {
    prefix: "/admin/fleet-llm-cogs",
    topic: { slug: "ai-usage", label: FLEET_LLM_COGS_HELP_TOPIC_LABEL },
  },
  {
    prefix: INTERNAL_TENANT_HEALTH_PATH,
    topic: { slug: "troubleshooting", label: TENANT_HEALTH_HELP_TOPIC_LABEL },
  },
  {
    prefix: "/admin/tenant-health",
    topic: { slug: "troubleshooting", label: TENANT_HEALTH_HELP_TOPIC_LABEL },
  },
  {
    prefix: INTERNAL_TRIAL_FUNNEL_PATH,
    topic: { slug: "billing-and-plans", label: TRIAL_FUNNEL_HELP_TOPIC_LABEL },
  },
  {
    prefix: "/admin/trial-funnel",
    topic: { slug: "billing-and-plans", label: TRIAL_FUNNEL_HELP_TOPIC_LABEL },
  },
  {
    prefix: INTERNAL_DEMO_READINESS_PATH,
    topic: { slug: "choose-your-next-step", label: DEMO_READINESS_HELP_TOPIC_LABEL },
  },
  {
    prefix: "/admin/demo-readiness",
    topic: { slug: "choose-your-next-step", label: DEMO_READINESS_HELP_TOPIC_LABEL },
  },
  {
    prefix: INTERNAL_DEPLOYMENT_STATUS_PATH,
    topic: { slug: "troubleshooting", label: DEPLOYMENT_STATUS_HELP_TOPIC_LABEL },
  },
  {
    prefix: "/admin/deployment-status",
    topic: { slug: "troubleshooting", label: DEPLOYMENT_STATUS_HELP_TOPIC_LABEL },
  },
  {
    prefix: INTERNAL_PRICING_QUOTE_AGING_PATH,
    topic: { slug: "billing-and-plans", label: PRICING_QUOTE_AGING_HELP_TOPIC_LABEL },
  },
  {
    prefix: "/administration/identity-providers/role-mapping",
    topic: { slug: "users-and-roles", label: ROLE_MAPPING_SETTINGS_HELP_TOPIC_LABEL },
  },
  {
    prefix: "/administration/identity-providers/oidc",
    topic: { slug: "enterprise-onboarding", label: IDENTITY_PROVIDERS_OIDC_HELP_TOPIC_LABEL },
  },
  {
    prefix: "/administration/identity-providers/saml",
    topic: { slug: "enterprise-onboarding", label: IDENTITY_PROVIDERS_SAML_HELP_TOPIC_LABEL },
  },
  {
    prefix: "/administration/identity/sso-wizard",
    topic: { slug: "enterprise-onboarding", label: SSO_WIZARD_HELP_TOPIC_LABEL },
  },
  {
    prefix: "/administration/scim-provisioning",
    topic: { slug: "enterprise-onboarding", label: SCIM_PROVISIONING_HELP_TOPIC_LABEL },
  },
  {
    prefix: "/administration/workspace-settings/recycle-bin",
    topic: { slug: "workspace-settings", label: WORKSPACE_SETTINGS_HELP_TOPIC_LABEL },
  },
  {
    prefix: "/administration/identity-providers/diagnostics",
    topic: { slug: "enterprise-onboarding", label: IDENTITY_PROVIDERS_DIAGNOSTICS_HELP_TOPIC_LABEL },
  },
  {
    prefix: "/administration/identity-providers",
    topic: { slug: "enterprise-onboarding", label: IDENTITY_PROVIDERS_SETTINGS_HELP_TOPIC_LABEL },
  },
  {
    prefix: "/administration/api-keys",
    topic: { slug: "api-keys", label: API_KEYS_HELP_TOPIC_LABEL },
  },
  {
    prefix: "/account/preferences",
    topic: { slug: "preferences", label: PREFERENCES_HELP_TOPIC_LABEL },
  },
  {
    prefix: "/administration/notifications",
    topic: { slug: "notifications", label: NOTIFICATION_PREFERENCE_CENTER_PAGE_TITLE },
  },
  {
    prefix: "/account/security",
    topic: { slug: "security-trust", label: ACCOUNT_SECURITY_SETTINGS_HELP_TOPIC_LABEL },
  },
  {
    prefix: "/administration/auth-domains",
    topic: { slug: "enterprise-onboarding", label: AUTH_DOMAINS_SETTINGS_HELP_TOPIC_LABEL },
  },
  {
    prefix: "/administration/extract-upload",
    topic: { slug: "evidence-intake", label: EXTRACT_UPLOAD_SETTINGS_HELP_TOPIC_LABEL },
  },
  {
    prefix: "/administration/model-governance",
    topic: { slug: "model-governance", label: MODEL_GOVERNANCE_HELP_TOPIC_LABEL },
  },
  {
    prefix: "/administration/users/invite-reviewer",
    topic: { slug: "users-and-roles", label: INVITE_REVIEWER_HELP_TOPIC_LABEL },
  },
  {
    prefix: "/administration/users",
    topic: { slug: "users-and-roles", label: SETTINGS_USERS_HELP_TOPIC_LABEL },
  },
  {
    // Legacy settings segment — permanent redirect destination still resolves help before navigation settles.
    prefix: "/administration/settings/users",
    topic: { slug: "users-and-roles", label: SETTINGS_USERS_HELP_TOPIC_LABEL },
  },
  {
    prefix: "/settings/roles",
    topic: { slug: "users-and-roles", label: SETTINGS_USERS_HELP_TOPIC_LABEL },
  },
  {
    prefix: "/administration/security-trust",
    topic: { slug: "security-trust", label: SETTINGS_SECURITY_TRUST_HELP_TOPIC_LABEL },
  },
  {
    prefix: "/administration/settings/security-trust",
    topic: { slug: "security-trust", label: SETTINGS_SECURITY_TRUST_HELP_TOPIC_LABEL },
  },
  {
    prefix: "/administration/workspace-settings",
    topic: { slug: "workspace-settings", label: OPERATOR_NAV_LINK_LABELS.workspaceSettings },
  },
  {
    prefix: "/administration/baseline",
    topic: { slug: "baseline-settings", label: BASELINE_SETTINGS_HELP_TOPIC_LABEL },
  },
  { prefix: "/help", topic: { slug: "getting-started", label: HELP_HUB_HELP_TOPIC_LABEL } },
];

export const ARTIFACT_PREVIEW_HELP_TOPIC: PageHelpTopic = {
  slug: "review-artifacts",
  label: REVIEW_ARTIFACTS_HELP_TOPIC_LABEL,
};


export function listPageHelpTopicSlugs(): readonly string[] {
  const slugs: string[] = [];

  for (const row of PAGE_HELP_TOPICS) {
    const slug = row.topic.slug;

    if (slug !== undefined && slug.length > 0) {
      slugs.push(slug);
    }
  }

  if (ARTIFACT_PREVIEW_HELP_TOPIC.slug !== undefined && ARTIFACT_PREVIEW_HELP_TOPIC.slug.length > 0) {
    slugs.push(ARTIFACT_PREVIEW_HELP_TOPIC.slug);
  }

  return slugs;
}
