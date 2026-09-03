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


import type { PageHelpTopic } from "./page-help-topic-rows-operator";

export const PAGE_HELP_TOPIC_ROWS_ADMIN: readonly { prefix: string; topic: PageHelpTopic }[] = [
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
