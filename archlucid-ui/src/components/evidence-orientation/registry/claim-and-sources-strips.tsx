import { EvidenceOrientationClaimAndSourcesStrip } from "@/components/evidence-orientation/EvidenceOrientationClaimAndSourcesStrip";
import { EvidenceOrientationClaimCallout } from "@/components/evidence-orientation/EvidenceOrientationClaimCallout";
import { EvidenceOrientationSourcesSection } from "@/components/evidence-orientation/EvidenceOrientationSourcesSection";
import { EvidenceOrientationStripShell } from "@/components/evidence-orientation/EvidenceOrientationStripShell";
import {
  AUDIT_TRAIL_HELP_CLAIM_DISCIPLINE,
  AUDIT_TRAIL_HELP_CLAIM_DISCIPLINE_HEADING,
  AUDIT_TRAIL_HELP_CLAIM_HEADING_ID,
  AUDIT_TRAIL_HELP_FOLLOW_UPS_TITLE,
  AUDIT_TRAIL_HELP_SOURCES,
  AUDIT_TRAIL_HELP_SOURCES_INTRO,
} from "@/lib/audit-trail-help-evidence-copy";
import {
  ALERTS_HELP_CLAIM_DISCIPLINE,
  ALERTS_HELP_CLAIM_DISCIPLINE_HEADING,
  ALERTS_HELP_CLAIM_HEADING_ID,
  ALERTS_HELP_FOLLOW_UPS_TITLE,
  ALERTS_HELP_SOURCES,
  ALERTS_HELP_SOURCES_INTRO,
} from "@/lib/alerts-help-evidence-copy";
import {
  AUTHENTICATION_SIGN_IN_HELP_CLAIM_DISCIPLINE,
  AUTHENTICATION_SIGN_IN_HELP_CLAIM_DISCIPLINE_HEADING,
  AUTHENTICATION_SIGN_IN_HELP_CLAIM_HEADING_ID,
  AUTHENTICATION_SIGN_IN_HELP_FOLLOW_UPS_TITLE,
  AUTHENTICATION_SIGN_IN_HELP_SOURCES,
  AUTHENTICATION_SIGN_IN_HELP_SOURCES_INTRO,
} from "@/lib/authentication-sign-in-help-evidence-copy";
import {
  BILLING_AND_PLANS_HELP_CLAIM_DISCIPLINE,
  BILLING_AND_PLANS_HELP_CLAIM_DISCIPLINE_HEADING,
  BILLING_AND_PLANS_HELP_CLAIM_HEADING_ID,
  BILLING_AND_PLANS_HELP_FOLLOW_UPS_TITLE,
  BILLING_AND_PLANS_HELP_SOURCES,
  BILLING_AND_PLANS_HELP_SOURCES_INTRO,
} from "@/lib/billing-and-plans-help-evidence-copy";
import {
  COMPARISON_REPLAY_HELP_CLAIM_DISCIPLINE,
  COMPARISON_REPLAY_HELP_CLAIM_DISCIPLINE_HEADING,
  COMPARISON_REPLAY_HELP_CLAIM_HEADING_ID,
  COMPARISON_REPLAY_HELP_FOLLOW_UPS_TITLE,
  COMPARISON_REPLAY_HELP_SOURCES,
  COMPARISON_REPLAY_HELP_SOURCES_INTRO,
} from "@/lib/comparison-replay-help-evidence-copy";
import {
  CONNECT_AWS_SECURELY_CLAIM_DISCIPLINE,
  CONNECT_AWS_SECURELY_CLAIM_DISCIPLINE_HEADING,
  CONNECT_AWS_SECURELY_CLAIM_HEADING_ID,
  CONNECT_AWS_SECURELY_FOLLOW_UPS_TITLE,
  CONNECT_AWS_SECURELY_SOURCES,
  CONNECT_AWS_SECURELY_SOURCES_INTRO,
} from "@/lib/connect-aws-securely-help-evidence-copy";
import {
  CONNECT_AZURE_SECURELY_CLAIM_DISCIPLINE,
  CONNECT_AZURE_SECURELY_CLAIM_DISCIPLINE_HEADING,
  CONNECT_AZURE_SECURELY_CLAIM_HEADING_ID,
  CONNECT_AZURE_SECURELY_FOLLOW_UPS_TITLE,
  CONNECT_AZURE_SECURELY_SOURCES,
  CONNECT_AZURE_SECURELY_SOURCES_INTRO,
} from "@/lib/connect-azure-securely-help-content";
import {
  CLOUD_CONNECTIONS_FOLLOW_UPS_TITLE,
  CLOUD_CONNECTIONS_SOURCES,
  CLOUD_CONNECTIONS_SOURCES_INTRO,
} from "@/lib/cloud-connections-evidence-copy";
import {
  EVIDENCE_CLAIM_STYLE,
  EVIDENCE_SOURCES_STYLE,
} from "@/components/evidence-orientation/evidence-orientation-styles";
import {
  DIGESTS_HELP_CLAIM_DISCIPLINE,
  DIGESTS_HELP_CLAIM_DISCIPLINE_HEADING,
  DIGESTS_HELP_FOLLOW_UPS_TITLE,
  DIGESTS_HELP_SOURCES,
  DIGESTS_HELP_SOURCES_INTRO,
} from "@/lib/digests-help-evidence-copy";
import { DIGESTS_HELP_CLAIM_HEADING_ID } from "@/lib/digests-help-guide-content";
import {
  RECURRENCE_SCHEDULES_HELP_CLAIM_DISCIPLINE,
  RECURRENCE_SCHEDULES_HELP_CLAIM_DISCIPLINE_HEADING,
  RECURRENCE_SCHEDULES_HELP_FOLLOW_UPS_TITLE,
  RECURRENCE_SCHEDULES_HELP_SOURCES,
  RECURRENCE_SCHEDULES_HELP_SOURCES_INTRO,
} from "@/lib/recurrence-schedules-help-evidence-copy";
import { RECURRENCE_SCHEDULES_HELP_CLAIM_HEADING_ID } from "@/lib/recurrence-schedules-help-guide-content";
import {
  ROI_SUMMARY_HELP_CLAIM_DISCIPLINE,
  ROI_SUMMARY_HELP_CLAIM_DISCIPLINE_HEADING,
  ROI_SUMMARY_HELP_CLAIM_HEADING_ID,
  ROI_SUMMARY_HELP_FOLLOW_UPS_TITLE,
  ROI_SUMMARY_HELP_SOURCES,
  ROI_SUMMARY_HELP_SOURCES_INTRO,
} from "@/lib/roi-summary-help-evidence-copy";
import {
  BASELINE_SETTINGS_HELP_CLAIM_DISCIPLINE,
  BASELINE_SETTINGS_HELP_CLAIM_DISCIPLINE_HEADING,
  BASELINE_SETTINGS_HELP_FOLLOW_UPS_TITLE,
  BASELINE_SETTINGS_HELP_SOURCES,
  BASELINE_SETTINGS_HELP_SOURCES_INTRO,
} from "@/lib/baseline-settings-help-evidence-copy";
import { BASELINE_SETTINGS_HELP_CLAIM_HEADING_ID } from "@/lib/baseline-settings-help-guide-content";
import {
  BASELINE_SETTINGS_FOLLOW_UPS_TITLE,
  BASELINE_SETTINGS_SOURCES,
  BASELINE_SETTINGS_SOURCES_INTRO,
} from "@/lib/baseline-settings-evidence-copy";
import {
  API_KEYS_HELP_CLAIM_DISCIPLINE,
  API_KEYS_HELP_CLAIM_DISCIPLINE_HEADING,
  API_KEYS_HELP_FOLLOW_UPS_TITLE,
  API_KEYS_HELP_SOURCES,
  API_KEYS_HELP_SOURCES_INTRO,
} from "@/lib/api-keys-help-evidence-copy";
import { API_KEYS_HELP_CLAIM_HEADING_ID } from "@/lib/api-keys-help-guide-content";
import {
  API_KEYS_SETTINGS_FOLLOW_UPS_TITLE,
  API_KEYS_SETTINGS_SOURCES,
  API_KEYS_SETTINGS_SOURCES_INTRO,
} from "@/lib/api-keys-settings-evidence-copy";
import {
  ACCOUNT_SECURITY_SETTINGS_CLAIM_DISCIPLINE,
  ACCOUNT_SECURITY_SETTINGS_CLAIM_DISCIPLINE_HEADING,
  ACCOUNT_SECURITY_SETTINGS_CLAIM_HEADING_ID,
  ACCOUNT_SECURITY_SETTINGS_FOLLOW_UPS_TITLE,
  ACCOUNT_SECURITY_SETTINGS_SOURCES,
  ACCOUNT_SECURITY_SETTINGS_SOURCES_INTRO,
} from "@/lib/account-security-settings-evidence-copy";
import {
  AI_USAGE_SETTINGS_FOLLOW_UPS_TITLE,
  AI_USAGE_SETTINGS_SOURCES,
  AI_USAGE_SETTINGS_SOURCES_INTRO,
} from "@/lib/ai-usage-settings-evidence-copy";
import {
  AUTH_DOMAINS_SETTINGS_CLAIM_DISCIPLINE,
  AUTH_DOMAINS_SETTINGS_CLAIM_DISCIPLINE_HEADING,
  AUTH_DOMAINS_SETTINGS_CLAIM_HEADING_ID,
  AUTH_DOMAINS_SETTINGS_FOLLOW_UPS_TITLE,
  AUTH_DOMAINS_SETTINGS_SOURCES,
  AUTH_DOMAINS_SETTINGS_SOURCES_INTRO,
} from "@/lib/auth-domains-settings-evidence-copy";
import {
  SYSTEM_HEALTH_HELP_CLAIM_DISCIPLINE,
  SYSTEM_HEALTH_HELP_CLAIM_DISCIPLINE_HEADING,
  SYSTEM_HEALTH_HELP_FOLLOW_UPS_TITLE,
  SYSTEM_HEALTH_HELP_SOURCES,
  SYSTEM_HEALTH_HELP_SOURCES_INTRO,
} from "@/lib/system-health-help-evidence-copy";
import { SYSTEM_HEALTH_HELP_CLAIM_HEADING_ID } from "@/lib/system-health-help-guide-content";
import {
  AI_USAGE_HELP_CLAIM_DISCIPLINE,
  AI_USAGE_HELP_CLAIM_DISCIPLINE_HEADING,
  AI_USAGE_HELP_FOLLOW_UPS_TITLE,
  AI_USAGE_HELP_SOURCES,
  AI_USAGE_HELP_SOURCES_INTRO,
} from "@/lib/ai-usage-help-evidence-copy";
import { AI_USAGE_HELP_CLAIM_HEADING_ID } from "@/lib/ai-usage-help-guide-content";
import {
  PREFERENCES_HELP_CLAIM_DISCIPLINE,
  PREFERENCES_HELP_CLAIM_DISCIPLINE_HEADING,
  PREFERENCES_HELP_FOLLOW_UPS_TITLE,
  PREFERENCES_HELP_SOURCES,
  PREFERENCES_HELP_SOURCES_INTRO,
} from "@/lib/preferences-help-evidence-copy";
import { PREFERENCES_HELP_CLAIM_HEADING_ID } from "@/lib/preferences-help-guide-content";
import {
  PREFERENCES_SETTINGS_CLAIM_DISCIPLINE,
  PREFERENCES_SETTINGS_CLAIM_DISCIPLINE_HEADING,
  PREFERENCES_SETTINGS_CLAIM_HEADING_ID,
  PREFERENCES_SETTINGS_FOLLOW_UPS_TITLE,
  PREFERENCES_SETTINGS_SOURCES,
  PREFERENCES_SETTINGS_SOURCES_INTRO,
} from "@/lib/preferences-settings-evidence-copy";
import {
  NOTIFICATIONS_HELP_CLAIM_DISCIPLINE,
  NOTIFICATIONS_HELP_CLAIM_DISCIPLINE_HEADING,
  NOTIFICATIONS_HELP_CLAIM_HEADING_ID,
  NOTIFICATIONS_HELP_FOLLOW_UPS_TITLE,
  NOTIFICATIONS_HELP_SOURCES,
  NOTIFICATIONS_HELP_SOURCES_INTRO,
} from "@/lib/notifications-help-evidence-copy";
import {
  ARCHITECTURE_DRAFTS_HELP_CLAIM_DISCIPLINE,
  ARCHITECTURE_DRAFTS_HELP_CLAIM_DISCIPLINE_HEADING,
  ARCHITECTURE_DRAFTS_HELP_FOLLOW_UPS_TITLE,
  ARCHITECTURE_DRAFTS_HELP_SOURCES,
  ARCHITECTURE_DRAFTS_HELP_SOURCES_INTRO,
} from "@/lib/architecture-drafts-help-evidence-copy";
import { ARCHITECTURE_DRAFTS_HELP_CLAIM_HEADING_ID } from "@/lib/architecture-drafts-help-guide-content";
import {
  EVIDENCE_GRAPH_HELP_CLAIM_DISCIPLINE,
  EVIDENCE_GRAPH_HELP_CLAIM_DISCIPLINE_HEADING,
  EVIDENCE_GRAPH_HELP_FOLLOW_UPS_TITLE,
  EVIDENCE_GRAPH_HELP_SOURCES,
  EVIDENCE_GRAPH_HELP_SOURCES_INTRO,
} from "@/lib/evidence-graph-help-evidence-copy";
import { EVIDENCE_GRAPH_HELP_CLAIM_HEADING_ID } from "@/lib/evidence-graph-help-guide-content";
import {
  EVIDENCE_PROPOSALS_FOLLOW_UPS_TITLE,
  EVIDENCE_PROPOSALS_SOURCES,
  EVIDENCE_PROPOSALS_SOURCES_INTRO,
} from "@/lib/evidence-proposals-evidence-copy";
import {
  ARCHITECTURE_INTELLIGENCE_HELP_CLAIM_DISCIPLINE,
  ARCHITECTURE_INTELLIGENCE_HELP_CLAIM_DISCIPLINE_HEADING,
  ARCHITECTURE_INTELLIGENCE_HELP_FOLLOW_UPS_TITLE,
  ARCHITECTURE_INTELLIGENCE_HELP_SOURCES,
  ARCHITECTURE_INTELLIGENCE_HELP_SOURCES_INTRO,
} from "@/lib/architecture-intelligence-help-evidence-copy";
import { ARCHITECTURE_INTELLIGENCE_HELP_CLAIM_HEADING_ID } from "@/lib/architecture-intelligence-help-guide-content";
import {
  SEARCH_REVIEW_EVIDENCE_HELP_CLAIM_DISCIPLINE,
  SEARCH_REVIEW_EVIDENCE_HELP_CLAIM_DISCIPLINE_HEADING,
  SEARCH_REVIEW_EVIDENCE_HELP_FOLLOW_UPS_TITLE,
  SEARCH_REVIEW_EVIDENCE_HELP_SOURCES,
  SEARCH_REVIEW_EVIDENCE_HELP_SOURCES_INTRO,
} from "@/lib/search-review-evidence-help-evidence-copy";
import { SEARCH_REVIEW_EVIDENCE_HELP_CLAIM_HEADING_ID } from "@/lib/search-review-evidence-help-guide-content";
import {
  AZURE_BOARDS_INTEGRATION_FOLLOW_UPS_TITLE,
  AZURE_BOARDS_INTEGRATION_SOURCES,
  AZURE_BOARDS_INTEGRATION_SOURCES_INTRO,
} from "@/lib/azure-boards-integration-evidence-copy";
import {
  JIRA_INTEGRATION_HELP_CLAIM_DISCIPLINE,
  JIRA_INTEGRATION_HELP_CLAIM_DISCIPLINE_HEADING,
  JIRA_INTEGRATION_HELP_FOLLOW_UPS_TITLE,
  JIRA_INTEGRATION_HELP_SOURCES,
  JIRA_INTEGRATION_HELP_SOURCES_INTRO,
} from "@/lib/jira-integration-help-evidence-copy";
import { JIRA_INTEGRATION_HELP_CLAIM_HEADING_ID } from "@/lib/jira-integration-help-guide-content";
import {
  JIRA_INTEGRATION_FOLLOW_UPS_TITLE,
  JIRA_INTEGRATION_SOURCES,
  JIRA_INTEGRATION_SOURCES_INTRO,
} from "@/lib/jira-integration-evidence-copy";
import {
  MODEL_GOVERNANCE_SETTINGS_FOLLOW_UPS_TITLE,
  MODEL_GOVERNANCE_SETTINGS_SOURCES,
  MODEL_GOVERNANCE_SETTINGS_SOURCES_INTRO,
} from "@/lib/model-governance-settings-evidence-copy";
import {
  MODEL_GOVERNANCE_HELP_CLAIM_DISCIPLINE,
  MODEL_GOVERNANCE_HELP_CLAIM_DISCIPLINE_HEADING,
  MODEL_GOVERNANCE_HELP_FOLLOW_UPS_TITLE,
  MODEL_GOVERNANCE_HELP_SOURCES,
  MODEL_GOVERNANCE_HELP_SOURCES_INTRO,
} from "@/lib/model-governance-help-evidence-copy";
import { MODEL_GOVERNANCE_HELP_CLAIM_HEADING_ID } from "@/lib/model-governance-help-guide-content";
import {
  SERVICENOW_INTEGRATION_FOLLOW_UPS_TITLE,
  SERVICENOW_INTEGRATION_SOURCES,
  SERVICENOW_INTEGRATION_SOURCES_INTRO,
} from "@/lib/servicenow-integration-evidence-copy";
import {
  SERVICENOW_INTEGRATION_HELP_CLAIM_DISCIPLINE,
  SERVICENOW_INTEGRATION_HELP_CLAIM_DISCIPLINE_HEADING,
  SERVICENOW_INTEGRATION_HELP_FOLLOW_UPS_TITLE,
  SERVICENOW_INTEGRATION_HELP_SOURCES,
  SERVICENOW_INTEGRATION_HELP_SOURCES_INTRO,
} from "@/lib/servicenow-integration-help-evidence-copy";
import { SERVICENOW_INTEGRATION_HELP_CLAIM_HEADING_ID } from "@/lib/servicenow-integration-help-guide-content";
import { SPONSOR_DASHBOARD_HELP_CLAIM_HEADING_ID } from "@/lib/sponsor-dashboard-help-guide-content";
import {
  SPONSOR_DASHBOARD_HELP_CLAIM_DISCIPLINE,
  SPONSOR_DASHBOARD_HELP_CLAIM_DISCIPLINE_HEADING,
  SPONSOR_DASHBOARD_HELP_FOLLOW_UPS_TITLE,
  SPONSOR_DASHBOARD_HELP_SOURCES,
  SPONSOR_DASHBOARD_HELP_SOURCES_INTRO,
} from "@/lib/sponsor-dashboard-help-evidence-copy";
import {
  WORKSPACE_SETTINGS_HELP_CLAIM_DISCIPLINE,
  WORKSPACE_SETTINGS_HELP_CLAIM_DISCIPLINE_HEADING,
  WORKSPACE_SETTINGS_HELP_FOLLOW_UPS_TITLE,
  WORKSPACE_SETTINGS_HELP_SOURCES,
  WORKSPACE_SETTINGS_HELP_SOURCES_INTRO,
} from "@/lib/workspace-settings-help-evidence-copy";
import { WORKSPACE_SETTINGS_HELP_CLAIM_HEADING_ID } from "@/lib/workspace-settings-help-guide-content";
import {
  ARCHITECTURE_SCORECARD_HELP_CLAIM_DISCIPLINE,
  ARCHITECTURE_SCORECARD_HELP_CLAIM_DISCIPLINE_HEADING,
  ARCHITECTURE_SCORECARD_HELP_CLAIM_HEADING_ID,
  ARCHITECTURE_SCORECARD_HELP_RELATED_SOURCES_TITLE,
  ARCHITECTURE_SCORECARD_HELP_SOURCES,
  ARCHITECTURE_SCORECARD_HELP_SOURCES_INTRO,
} from "@/lib/architecture-scorecard-help-evidence-copy";
import {
  CONNECTION_STATUS_HELP_CLAIM_DISCIPLINE,
  CONNECTION_STATUS_HELP_CLAIM_DISCIPLINE_HEADING,
  CONNECTION_STATUS_HELP_FOLLOW_UPS_TITLE,
  CONNECTION_STATUS_HELP_SOURCES,
  CONNECTION_STATUS_HELP_SOURCES_INTRO,
} from "@/lib/connection-status-help-evidence-copy";
import {
  CONNECTION_STATUS_FOLLOW_UPS_TITLE,
  CONNECTION_STATUS_SOURCES,
  CONNECTION_STATUS_SOURCES_INTRO,
} from "@/lib/connection-status-evidence-copy";
import { CONNECTION_STATUS_HELP_CLAIM_HEADING_ID } from "@/lib/connection-status-help-guide-content";
import {
  ADMIN_CONFIGURATION_FOLLOW_UPS_TITLE,
  ADMIN_CONFIGURATION_SOURCES,
  ADMIN_CONFIGURATION_SOURCES_INTRO,
} from "@/lib/admin-configuration-evidence-copy";
import {
  ADMIN_HEALTH_FOLLOW_UPS_TITLE,
  ADMIN_HEALTH_SOURCES,
  ADMIN_HEALTH_SOURCES_INTRO,
} from "@/lib/admin-health-evidence-copy";
import {
  ADMIN_ITSM_CONNECTORS_FOLLOW_UPS_TITLE,
  ADMIN_ITSM_CONNECTORS_SOURCES,
  ADMIN_ITSM_CONNECTORS_SOURCES_INTRO,
} from "@/lib/admin-itsm-connectors-evidence-copy";
import {
  AGENT_MODEL_CATALOG_FOLLOW_UPS_TITLE,
  AGENT_MODEL_CATALOG_SOURCES,
  AGENT_MODEL_CATALOG_SOURCES_INTRO,
} from "@/lib/agent-model-catalog-evidence-copy";
import {
  ADMIN_TENANTS_FOLLOW_UPS_TITLE,
  ADMIN_TENANTS_SOURCES,
  ADMIN_TENANTS_SOURCES_INTRO,
} from "@/lib/admin-tenants-evidence-copy";
import {
  DEMO_READINESS_FOLLOW_UPS_TITLE,
  DEMO_READINESS_SOURCES,
  DEMO_READINESS_SOURCES_INTRO,
} from "@/lib/demo-readiness-evidence-copy";
import {
  DEPLOYMENT_STATUS_FOLLOW_UPS_TITLE,
  DEPLOYMENT_STATUS_SOURCES,
  DEPLOYMENT_STATUS_SOURCES_INTRO,
} from "@/lib/deployment-status-evidence-copy";
import {
  EXTRACT_UPLOAD_SETTINGS_FOLLOW_UPS_TITLE,
  EXTRACT_UPLOAD_SETTINGS_SOURCES,
  EXTRACT_UPLOAD_SETTINGS_SOURCES_INTRO,
} from "@/lib/extract-upload-settings-evidence-copy";
import {
  FLEET_LLM_COGS_FOLLOW_UPS_TITLE,
  FLEET_LLM_COGS_SOURCES,
  FLEET_LLM_COGS_SOURCES_INTRO,
} from "@/lib/fleet-llm-cogs-evidence-copy";
import {
  DECISION_REGISTER_HELP_CLAIM_DISCIPLINE,
  DECISION_REGISTER_HELP_CLAIM_DISCIPLINE_HEADING,
  DECISION_REGISTER_HELP_FOLLOW_UPS_TITLE,
  DECISION_REGISTER_HELP_SOURCES,
  DECISION_REGISTER_HELP_SOURCES_INTRO,
} from "@/lib/decision-register-help-evidence-copy";
import { DECISION_REGISTER_HELP_CLAIM_HEADING_ID } from "@/lib/decision-register-help-guide-content";
import {
  IMPROVEMENT_PLANNING_HELP_CLAIM_DISCIPLINE,
  IMPROVEMENT_PLANNING_HELP_CLAIM_DISCIPLINE_HEADING,
  IMPROVEMENT_PLANNING_HELP_FOLLOW_UPS_TITLE,
  IMPROVEMENT_PLANNING_HELP_SOURCES,
  IMPROVEMENT_PLANNING_HELP_SOURCES_INTRO,
} from "@/lib/improvement-planning-help-evidence-copy";
import { IMPROVEMENT_PLANNING_HELP_CLAIM_HEADING_ID } from "@/lib/improvement-planning-help-guide-content";
import {
  IMPACT_PREVIEW_HELP_CLAIM_DISCIPLINE,
  IMPACT_PREVIEW_HELP_CLAIM_DISCIPLINE_HEADING,
  IMPACT_PREVIEW_HELP_FOLLOW_UPS_TITLE,
  IMPACT_PREVIEW_HELP_SOURCES,
  IMPACT_PREVIEW_HELP_SOURCES_INTRO,
} from "@/lib/impact-preview-help-evidence-copy";
import { IMPACT_PREVIEW_HELP_CLAIM_HEADING_ID } from "@/lib/impact-preview-help-guide-content";
import {
  ADVISORY_SCANS_HELP_CLAIM_DISCIPLINE,
  ADVISORY_SCANS_HELP_CLAIM_DISCIPLINE_HEADING,
  ADVISORY_SCANS_HELP_FOLLOW_UPS_TITLE,
  ADVISORY_SCANS_HELP_SOURCES,
  ADVISORY_SCANS_HELP_SOURCES_INTRO,
} from "@/lib/advisory-scans-help-evidence-copy";
import { ADVISORY_SCANS_HELP_CLAIM_HEADING_ID } from "@/lib/advisory-scans-help-guide-content";
import { HELP_PAGE_LAYOUT } from "@/lib/help/help-page-layout";
import { OPERATOR_SHELL_SCROLL_OFFSET_CLASS, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";
import {
  SLACK_INTEGRATION_HELP_CLAIM_DISCIPLINE,
  SLACK_INTEGRATION_HELP_CLAIM_DISCIPLINE_HEADING,
  SLACK_INTEGRATION_HELP_FOLLOW_UPS_TITLE,
  SLACK_INTEGRATION_HELP_SOURCES,
  SLACK_INTEGRATION_HELP_SOURCES_INTRO,
} from "@/lib/slack-integration-help-evidence-copy";
import { SLACK_INTEGRATION_HELP_CLAIM_HEADING_ID } from "@/lib/slack-integration-help-guide-content";
import {
  SLACK_INTEGRATION_FOLLOW_UPS_TITLE,
  SLACK_INTEGRATION_SOURCES,
  SLACK_INTEGRATION_SOURCES_INTRO,
} from "@/lib/slack-integration-evidence-copy";
import {
  STANDARDS_RULES_HELP_CLAIM_DISCIPLINE,
  STANDARDS_RULES_HELP_CLAIM_DISCIPLINE_HEADING,
  STANDARDS_RULES_HELP_FOLLOW_UPS_TITLE,
  STANDARDS_RULES_HELP_SOURCES,
  STANDARDS_RULES_HELP_SOURCES_INTRO,
} from "@/lib/standards-rules-help-evidence-copy";
import { STANDARDS_RULES_HELP_CLAIM_HEADING_ID } from "@/lib/standards-rules-help-guide-content";
import {
  ENTERPRISE_ONBOARDING_HELP_CLAIM_DISCIPLINE,
  ENTERPRISE_ONBOARDING_HELP_CLAIM_DISCIPLINE_HEADING,
  ENTERPRISE_ONBOARDING_HELP_CLAIM_HEADING_ID,
  ENTERPRISE_ONBOARDING_HELP_FOLLOW_UPS_TITLE,
  ENTERPRISE_ONBOARDING_HELP_SOURCES,
  ENTERPRISE_ONBOARDING_HELP_SOURCES_INTRO,
} from "@/lib/enterprise-onboarding-help-evidence-copy";
import {
  GOVERNANCE_APPROVAL_HELP_CLAIM_DISCIPLINE,
  GOVERNANCE_APPROVAL_HELP_CLAIM_DISCIPLINE_HEADING,
  GOVERNANCE_APPROVAL_HELP_CLAIM_HEADING_ID,
  GOVERNANCE_APPROVAL_HELP_FOLLOW_UPS_TITLE,
  GOVERNANCE_APPROVAL_HELP_SOURCES,
  GOVERNANCE_APPROVAL_HELP_SOURCES_INTRO,
} from "@/lib/governance/governance-approval-help-evidence-copy";
import {
  FINDINGS_HELP_CLAIM_DISCIPLINE,
  FINDINGS_HELP_CLAIM_DISCIPLINE_HEADING,
  FINDINGS_HELP_FOLLOW_UPS_TITLE,
  FINDINGS_HELP_SOURCES,
  FINDINGS_HELP_SOURCES_INTRO,
} from "@/lib/findings/findings-help-evidence-copy";
import { FINDINGS_HELP_CLAIM_HEADING_ID } from "@/lib/findings/findings-help-guide-content";
import {
  INTEGRATION_READINESS_HELP_CLAIM_DISCIPLINE,
  INTEGRATION_READINESS_HELP_CLAIM_DISCIPLINE_HEADING,
  INTEGRATION_READINESS_HELP_CLAIM_HEADING_ID,
  INTEGRATION_READINESS_HELP_FOLLOW_UPS_TITLE,
  INTEGRATION_READINESS_HELP_SOURCES,
  INTEGRATION_READINESS_HELP_SOURCES_INTRO,
} from "@/lib/integration-readiness-help-evidence-copy";
import {
  INTEGRATION_EVENTS_DLQ_FOLLOW_UPS_TITLE,
  INTEGRATION_EVENTS_DLQ_SOURCES,
  INTEGRATION_EVENTS_DLQ_SOURCES_INTRO,
} from "@/lib/integration-events-dlq-evidence-copy";
import {
  PILOT_FEEDBACK_HELP_CLAIM_DISCIPLINE,
  PILOT_FEEDBACK_HELP_CLAIM_DISCIPLINE_HEADING,
  PILOT_FEEDBACK_HELP_CLAIM_HEADING_ID,
  PILOT_FEEDBACK_HELP_FOLLOW_UPS_TITLE,
  PILOT_FEEDBACK_HELP_SOURCES,
  PILOT_FEEDBACK_HELP_SOURCES_INTRO,
} from "@/lib/pilot-feedback-help-evidence-copy";
import {
  PRIOR_MANIFEST_RETRIEVAL_HELP_CLAIM_DISCIPLINE,
  PRIOR_MANIFEST_RETRIEVAL_HELP_CLAIM_DISCIPLINE_HEADING,
  PRIOR_MANIFEST_RETRIEVAL_HELP_CLAIM_HEADING_ID,
  PRIOR_MANIFEST_RETRIEVAL_HELP_FOLLOW_UPS_TITLE,
  PRIOR_MANIFEST_RETRIEVAL_HELP_SOURCES,
  PRIOR_MANIFEST_RETRIEVAL_HELP_SOURCES_INTRO,
} from "@/lib/prior-manifest-retrieval-help-evidence-copy";
import {
  POLICY_PACKS_HELP_CLAIM_DISCIPLINE,
  POLICY_PACKS_HELP_CLAIM_DISCIPLINE_HEADING,
  POLICY_PACKS_HELP_CLAIM_HEADING_ID,
  POLICY_PACKS_HELP_FOLLOW_UPS_TITLE,
  POLICY_PACKS_HELP_SOURCES,
  POLICY_PACKS_HELP_SOURCES_INTRO,
} from "@/lib/policy/policy-packs-help-evidence-copy";
import {
  PRICING_QUOTE_AGING_FOLLOW_UPS_TITLE,
  PRICING_QUOTE_AGING_SOURCES,
  PRICING_QUOTE_AGING_SOURCES_INTRO,
} from "@/lib/pricing-quote-aging-evidence-copy";
import {
  PLATFORM_BUNDLED_POLICY_PACKS_FOLLOW_UPS_TITLE,
  PLATFORM_BUNDLED_POLICY_PACKS_SOURCES,
  PLATFORM_BUNDLED_POLICY_PACKS_SOURCES_INTRO,
} from "@/lib/platform-bundled-policy-packs-evidence-copy";
import {
  PRODUCT_LEARNING_FOLLOW_UPS_TITLE,
  PRODUCT_LEARNING_SOURCES,
  PRODUCT_LEARNING_SOURCES_INTRO,
} from "@/lib/product-learning-evidence-copy";
import {
  OPERATOR_BILLING_SETTINGS_FOLLOW_UPS_TITLE,
  OPERATOR_BILLING_SETTINGS_SOURCES,
  OPERATOR_BILLING_SETTINGS_SOURCES_INTRO,
} from "@/lib/operator/operator-billing-settings-evidence-copy";
import {
  RAG_HEALTH_FOLLOW_UPS_TITLE,
  RAG_HEALTH_SOURCES,
  RAG_HEALTH_SOURCES_INTRO,
} from "@/lib/rag-health-evidence-copy";
import {
  RECOMMENDATION_LEARNING_FOLLOW_UPS_TITLE,
  RECOMMENDATION_LEARNING_SOURCES,
  RECOMMENDATION_LEARNING_SOURCES_INTRO,
} from "@/lib/recommendation-learning-evidence-copy";
import {
  REPLAY_FOLLOW_UPS_TITLE,
  REPLAY_SOURCES,
  REPLAY_SOURCES_INTRO,
} from "@/lib/replay-evidence-copy";
import {
  IDENTITY_PROVIDERS_DIAGNOSTICS_FOLLOW_UPS_TITLE,
  IDENTITY_PROVIDERS_DIAGNOSTICS_SOURCES,
  IDENTITY_PROVIDERS_DIAGNOSTICS_SOURCES_INTRO,
} from "@/lib/identity-providers-diagnostics-evidence-copy";
import {
  IDENTITY_PROVIDERS_OIDC_FOLLOW_UPS_TITLE,
  IDENTITY_PROVIDERS_OIDC_SOURCES,
  IDENTITY_PROVIDERS_OIDC_SOURCES_INTRO,
} from "@/lib/identity-providers-oidc-evidence-copy";
import {
  IDENTITY_PROVIDERS_SAML_FOLLOW_UPS_TITLE,
  IDENTITY_PROVIDERS_SAML_SOURCES,
  IDENTITY_PROVIDERS_SAML_SOURCES_INTRO,
} from "@/lib/identity-providers-saml-evidence-copy";
import {
  IDENTITY_PROVIDERS_SETTINGS_FOLLOW_UPS_TITLE,
  IDENTITY_PROVIDERS_SETTINGS_SOURCES,
  IDENTITY_PROVIDERS_SETTINGS_SOURCES_INTRO,
} from "@/lib/identity-providers-settings-evidence-copy";
import {
  ROLE_MAPPING_SETTINGS_FOLLOW_UPS_TITLE,
  ROLE_MAPPING_SETTINGS_SOURCES,
  ROLE_MAPPING_SETTINGS_SOURCES_INTRO,
} from "@/lib/role-mapping-settings-evidence-copy";
import {
  SCIM_PROVISIONING_FOLLOW_UPS_TITLE,
  SCIM_PROVISIONING_SOURCES,
  SCIM_PROVISIONING_SOURCES_INTRO,
} from "@/lib/scim-provisioning-evidence-copy";
import {
  SSO_WIZARD_FOLLOW_UPS_TITLE,
  SSO_WIZARD_SOURCES,
  SSO_WIZARD_SOURCES_INTRO,
} from "@/lib/sso-wizard-evidence-copy";
import {
  REPEAT_REVIEW_LOOP_HELP_CLAIM_DISCIPLINE,
  REPEAT_REVIEW_LOOP_HELP_CLAIM_DISCIPLINE_HEADING,
  REPEAT_REVIEW_LOOP_HELP_CLAIM_HEADING_ID,
  REPEAT_REVIEW_LOOP_HELP_FOLLOW_UPS_TITLE,
  REPEAT_REVIEW_LOOP_HELP_SOURCES,
  REPEAT_REVIEW_LOOP_HELP_SOURCES_INTRO,
} from "@/lib/repeat-review-loop-help-evidence-copy";
import {
  REPORT_A_PROBLEM_HELP_CLAIM_DISCIPLINE,
  REPORT_A_PROBLEM_HELP_CLAIM_DISCIPLINE_HEADING,
  REPORT_A_PROBLEM_HELP_CLAIM_HEADING_ID,
  REPORT_A_PROBLEM_HELP_FOLLOW_UPS_TITLE,
  REPORT_A_PROBLEM_HELP_SOURCES,
  REPORT_A_PROBLEM_HELP_SOURCES_INTRO,
} from "@/lib/report-a-problem-help-evidence-copy";
import {
  SECURITY_TRUST_HELP_CLAIM_DISCIPLINE,
  SECURITY_TRUST_HELP_CLAIM_DISCIPLINE_HEADING,
  SECURITY_TRUST_HELP_CLAIM_HEADING_ID,
  SECURITY_TRUST_HELP_FOLLOW_UPS_TITLE,
  SECURITY_TRUST_HELP_SOURCES,
  SECURITY_TRUST_HELP_SOURCES_INTRO,
} from "@/lib/security-trust-help-evidence-copy";
import {
  SUBPROCESSORS_HELP_CLAIM_DISCIPLINE,
  SUBPROCESSORS_HELP_CLAIM_DISCIPLINE_HEADING,
  SUBPROCESSORS_HELP_CLAIM_HEADING_ID,
  SUBPROCESSORS_HELP_FOLLOW_UPS_TITLE,
  SUBPROCESSORS_HELP_SOURCES,
  SUBPROCESSORS_HELP_SOURCES_INTRO,
} from "@/lib/subprocessors-help-evidence-copy";
import {
  TEAMS_INTEGRATION_HELP_ALERT_RULES_HREF,
  TEAMS_INTEGRATION_HELP_ALTERNATIVE_SOURCES,
  TEAMS_INTEGRATION_HELP_ALTERNATIVES_TITLE,
  TEAMS_INTEGRATION_HELP_CLAIM_DISCIPLINE,
  TEAMS_INTEGRATION_HELP_CLAIM_DISCIPLINE_HEADING,
  TEAMS_INTEGRATION_HELP_FOLLOW_UPS_TITLE,
  TEAMS_INTEGRATION_HELP_SOURCES,
  TEAMS_INTEGRATION_HELP_SOURCES_INTRO,
} from "@/lib/teams-integration-help-evidence-copy";
import { TEAMS_INTEGRATION_HELP_CLAIM_HEADING_ID } from "@/lib/teams-integration-help-guide-content";
import {
  TEAMS_INTEGRATION_FOLLOW_UPS_TITLE,
  TEAMS_INTEGRATION_SOURCES,
  TEAMS_INTEGRATION_SOURCES_INTRO,
} from "@/lib/teams-integration-evidence-copy";
import {
  TRIAL_FUNNEL_FOLLOW_UPS_TITLE,
  TRIAL_FUNNEL_SOURCES,
  TRIAL_FUNNEL_SOURCES_INTRO,
} from "@/lib/trial-funnel-evidence-copy";
import {
  TENANT_SETTINGS_FOLLOW_UPS_TITLE,
  TENANT_SETTINGS_SOURCES,
  TENANT_SETTINGS_SOURCES_INTRO,
} from "@/lib/tenant-settings-evidence-copy";
import {
  TENANT_HEALTH_FOLLOW_UPS_TITLE,
  TENANT_HEALTH_SOURCES,
  TENANT_HEALTH_SOURCES_INTRO,
} from "@/lib/tenant-health-evidence-copy";
import {
  WEBHOOKS_INTEGRATION_HELP_CLAIM_DISCIPLINE,
  WEBHOOKS_INTEGRATION_HELP_CLAIM_DISCIPLINE_HEADING,
  WEBHOOKS_INTEGRATION_HELP_FOLLOW_UPS_TITLE,
  WEBHOOKS_INTEGRATION_HELP_SOURCES,
  WEBHOOKS_INTEGRATION_HELP_SOURCES_INTRO,
} from "@/lib/webhooks-integration-help-evidence-copy";
import {
  WEBHOOKS_INTEGRATION_HELP_ALERT_RULES_HREF,
  WEBHOOKS_INTEGRATION_HELP_CLAIM_HEADING_ID,
} from "@/lib/webhooks-integration-help-guide-content";
import {
  WEBHOOKS_INTEGRATION_FOLLOW_UPS_TITLE,
  WEBHOOKS_INTEGRATION_SOURCES,
  WEBHOOKS_INTEGRATION_SOURCES_INTRO,
} from "@/lib/webhooks-integration-evidence-copy";
import {
  ITSM_OAUTH_CALLBACK_FOLLOW_UPS_TITLE,
  ITSM_OAUTH_CALLBACK_SOURCES,
  ITSM_OAUTH_CALLBACK_SOURCES_INTRO,
} from "@/lib/itsm/itsm-oauth-callback-evidence-copy";

export function AuditTrailHelpEvidenceOrientationStrip(): React.JSX.Element {
  return (
    <EvidenceOrientationClaimAndSourcesStrip
      slug="audit-trail-help"
      claimTestId="help-audit-trail-claim-discipline"
      claim={AUDIT_TRAIL_HELP_CLAIM_DISCIPLINE}
      claimHeading={AUDIT_TRAIL_HELP_CLAIM_DISCIPLINE_HEADING}
      claimHeadingId={AUDIT_TRAIL_HELP_CLAIM_HEADING_ID}
      claimElement="div"
      sourcesTitle={AUDIT_TRAIL_HELP_FOLLOW_UPS_TITLE}
      sourcesIntro={AUDIT_TRAIL_HELP_SOURCES_INTRO}
      sources={AUDIT_TRAIL_HELP_SOURCES}
      sourcesStyle={EVIDENCE_SOURCES_STYLE.operatorRaised}
      sourcesHeadingId="where-to-go-next"
      sourcesLayout="stacked"
    />
  );
}

export function AlertsHelpEvidenceOrientationStrip(): React.JSX.Element {
  return (
    <EvidenceOrientationClaimAndSourcesStrip
      slug="help-alerts"
      claimTestId="help-alerts-claim-discipline"
      claim={ALERTS_HELP_CLAIM_DISCIPLINE}
      claimHeading={ALERTS_HELP_CLAIM_DISCIPLINE_HEADING}
      claimHeadingId={ALERTS_HELP_CLAIM_HEADING_ID}
      claimElement="div"
      sourcesTitle={ALERTS_HELP_FOLLOW_UPS_TITLE}
      sourcesIntro={ALERTS_HELP_SOURCES_INTRO}
      sources={ALERTS_HELP_SOURCES}
      sourcesStyle={EVIDENCE_SOURCES_STYLE.operatorRaised}
      sourcesHeadingId="where-to-go-next"
      sourcesLayout="stacked"
    />
  );
}

export function AuthenticationSignInHelpEvidenceOrientationStrip(): React.JSX.Element {
  return (
    <EvidenceOrientationClaimAndSourcesStrip
      slug="authentication-sign-in-help"
      claim={AUTHENTICATION_SIGN_IN_HELP_CLAIM_DISCIPLINE}
      claimHeading={AUTHENTICATION_SIGN_IN_HELP_CLAIM_DISCIPLINE_HEADING}
      claimHeadingId={AUTHENTICATION_SIGN_IN_HELP_CLAIM_HEADING_ID}
      claimElement="div"
      sourcesTitle={AUTHENTICATION_SIGN_IN_HELP_FOLLOW_UPS_TITLE}
      sourcesIntro={AUTHENTICATION_SIGN_IN_HELP_SOURCES_INTRO}
      sources={AUTHENTICATION_SIGN_IN_HELP_SOURCES}
      sourcesStyle={EVIDENCE_SOURCES_STYLE.operatorRaised}
      sourcesHeadingId="where-to-go-next"
      sourcesLayout="stacked"
    />
  );
}

export function BillingAndPlansHelpEvidenceOrientationStrip(): React.JSX.Element {
  return (
    <EvidenceOrientationClaimAndSourcesStrip
      slug="help-billing-and-plans"
      claimTestId="help-billing-claim-discipline"
      claim={BILLING_AND_PLANS_HELP_CLAIM_DISCIPLINE}
      claimHeading={BILLING_AND_PLANS_HELP_CLAIM_DISCIPLINE_HEADING}
      claimHeadingId={BILLING_AND_PLANS_HELP_CLAIM_HEADING_ID}
      claimElement="div"
      sourcesTitle={BILLING_AND_PLANS_HELP_FOLLOW_UPS_TITLE}
      sourcesIntro={BILLING_AND_PLANS_HELP_SOURCES_INTRO}
      sources={BILLING_AND_PLANS_HELP_SOURCES}
      sourcesStyle={EVIDENCE_SOURCES_STYLE.operatorRaised}
      sourcesHeadingId="where-to-go-next"
      sourcesLayout="stacked"
      readingBodyClassName={HELP_PAGE_LAYOUT.readingBody}
    />
  );
}

export function ComparisonReplayHelpEvidenceOrientationStrip(): React.JSX.Element {
  return (
    <EvidenceOrientationClaimAndSourcesStrip
      slug="comparison-replay-help"
      claim={COMPARISON_REPLAY_HELP_CLAIM_DISCIPLINE}
      claimHeading={COMPARISON_REPLAY_HELP_CLAIM_DISCIPLINE_HEADING}
      claimHeadingId={COMPARISON_REPLAY_HELP_CLAIM_HEADING_ID}
      claimElement="div"
      sourcesTitle={COMPARISON_REPLAY_HELP_FOLLOW_UPS_TITLE}
      sourcesIntro={COMPARISON_REPLAY_HELP_SOURCES_INTRO}
      sources={COMPARISON_REPLAY_HELP_SOURCES}
      sourcesStyle={EVIDENCE_SOURCES_STYLE.operatorRaised}
      sourcesHeadingId="where-to-go-next"
      sourcesLayout="stacked"
    />
  );
}

export function ConnectAwsSecurelyHelpEvidenceOrientationStrip(): React.JSX.Element {
  return (
    <EvidenceOrientationClaimAndSourcesStrip
      slug="connect-aws-securely-help"
      claim={CONNECT_AWS_SECURELY_CLAIM_DISCIPLINE}
      claimHeading={CONNECT_AWS_SECURELY_CLAIM_DISCIPLINE_HEADING}
      claimHeadingId={CONNECT_AWS_SECURELY_CLAIM_HEADING_ID}
      claimElement="div"
      sourcesTitle={CONNECT_AWS_SECURELY_FOLLOW_UPS_TITLE}
      sourcesIntro={CONNECT_AWS_SECURELY_SOURCES_INTRO}
      sources={CONNECT_AWS_SECURELY_SOURCES}
      sourcesStyle={EVIDENCE_SOURCES_STYLE.operatorRaised}
      sourcesHeadingId="where-to-go-next"
      sourcesLayout="stacked"
    />
  );
}

export function ConnectAzureSecurelyHelpEvidenceOrientationStrip(): React.JSX.Element {
  return (
    <EvidenceOrientationClaimAndSourcesStrip
      slug="connect-azure-securely-help"
      claim={CONNECT_AZURE_SECURELY_CLAIM_DISCIPLINE}
      claimHeading={CONNECT_AZURE_SECURELY_CLAIM_DISCIPLINE_HEADING}
      claimHeadingId={CONNECT_AZURE_SECURELY_CLAIM_HEADING_ID}
      claimElement="div"
      sourcesTitle={CONNECT_AZURE_SECURELY_FOLLOW_UPS_TITLE}
      sourcesIntro={CONNECT_AZURE_SECURELY_SOURCES_INTRO}
      sources={CONNECT_AZURE_SECURELY_SOURCES}
      sourcesStyle={EVIDENCE_SOURCES_STYLE.operatorRaised}
      sourcesHeadingId="where-to-go-next"
      sourcesLayout="stacked"
    />
  );
}

export function DigestsHelpEvidenceOrientationStrip(): React.JSX.Element {
  return (
    <EvidenceOrientationClaimAndSourcesStrip
      slug="help-digests"
      claim={DIGESTS_HELP_CLAIM_DISCIPLINE}
      claimHeading={DIGESTS_HELP_CLAIM_DISCIPLINE_HEADING}
      claimHeadingId={DIGESTS_HELP_CLAIM_HEADING_ID}
      claimElement="div"
      sourcesTitle={DIGESTS_HELP_FOLLOW_UPS_TITLE}
      sourcesIntro={DIGESTS_HELP_SOURCES_INTRO}
      sources={DIGESTS_HELP_SOURCES}
      sourcesStyle={EVIDENCE_SOURCES_STYLE.operatorRaised}
      sourcesHeadingId="where-to-go-next"
      sourcesLayout="stacked"
    />
  );
}

export function RecurrenceSchedulesHelpEvidenceOrientationStrip(): React.JSX.Element {
  return (
    <EvidenceOrientationClaimAndSourcesStrip
      slug="help-recurrence-schedules"
      claim={RECURRENCE_SCHEDULES_HELP_CLAIM_DISCIPLINE}
      claimHeading={RECURRENCE_SCHEDULES_HELP_CLAIM_DISCIPLINE_HEADING}
      claimHeadingId={RECURRENCE_SCHEDULES_HELP_CLAIM_HEADING_ID}
      claimElement="div"
      sourcesTitle={RECURRENCE_SCHEDULES_HELP_FOLLOW_UPS_TITLE}
      sourcesIntro={RECURRENCE_SCHEDULES_HELP_SOURCES_INTRO}
      sources={RECURRENCE_SCHEDULES_HELP_SOURCES}
      sourcesStyle={EVIDENCE_SOURCES_STYLE.operatorRaised}
      sourcesHeadingId="where-to-go-next"
      sourcesLayout="stacked"
    />
  );
}

export type RoiSummaryHelpEvidenceOrientationStripProps = {
  readonly readingBodyClassName?: string;
};

export function RoiSummaryHelpEvidenceOrientationStrip(
  props: RoiSummaryHelpEvidenceOrientationStripProps = {},
): React.JSX.Element {
  return (
    <EvidenceOrientationClaimAndSourcesStrip
      slug="help-roi-summary"
      claim={ROI_SUMMARY_HELP_CLAIM_DISCIPLINE}
      claimHeading={ROI_SUMMARY_HELP_CLAIM_DISCIPLINE_HEADING}
      claimHeadingId={ROI_SUMMARY_HELP_CLAIM_HEADING_ID}
      claimElement="div"
      sourcesTitle={ROI_SUMMARY_HELP_FOLLOW_UPS_TITLE}
      sourcesIntro={ROI_SUMMARY_HELP_SOURCES_INTRO}
      sources={ROI_SUMMARY_HELP_SOURCES}
      sourcesStyle={EVIDENCE_SOURCES_STYLE.operatorRaised}
      sourcesHeadingId="where-to-go-next"
      sourcesLayout="stacked"
      readingBodyClassName={props.readingBodyClassName ?? HELP_PAGE_LAYOUT.readingBody}
    />
  );
}

export function ArchitectureScorecardHelpEvidenceOrientationStrip(): React.JSX.Element {
  return (
    <EvidenceOrientationClaimAndSourcesStrip
      slug="help-architecture-scorecard"
      claimTestId="help-architecture-scorecard-claim-discipline"
      claim={ARCHITECTURE_SCORECARD_HELP_CLAIM_DISCIPLINE}
      claimHeading={ARCHITECTURE_SCORECARD_HELP_CLAIM_DISCIPLINE_HEADING}
      claimHeadingId={ARCHITECTURE_SCORECARD_HELP_CLAIM_HEADING_ID}
      claimElement="div"
      sourcesTitle={ARCHITECTURE_SCORECARD_HELP_RELATED_SOURCES_TITLE}
      sourcesIntro={ARCHITECTURE_SCORECARD_HELP_SOURCES_INTRO}
      sources={ARCHITECTURE_SCORECARD_HELP_SOURCES}
      sourcesStyle={EVIDENCE_SOURCES_STYLE.operatorRaised}
      sourcesHeadingId="related-evidence-and-sources"
      sourcesLayout="stacked"
    />
  );
}

export type ConnectionStatusHelpEvidenceOrientationStripProps = {
  readonly readingBodyClassName?: string;
};

export function ConnectionStatusHelpEvidenceOrientationStrip(
  props: ConnectionStatusHelpEvidenceOrientationStripProps = {},
): React.JSX.Element {
  return (
    <EvidenceOrientationClaimAndSourcesStrip
      slug="help-connection-status"
      claim={CONNECTION_STATUS_HELP_CLAIM_DISCIPLINE}
      claimHeading={CONNECTION_STATUS_HELP_CLAIM_DISCIPLINE_HEADING}
      claimHeadingId={CONNECTION_STATUS_HELP_CLAIM_HEADING_ID}
      claimElement="div"
      sourcesTitle={CONNECTION_STATUS_HELP_FOLLOW_UPS_TITLE}
      sourcesIntro={CONNECTION_STATUS_HELP_SOURCES_INTRO}
      sources={CONNECTION_STATUS_HELP_SOURCES}
      sourcesStyle={EVIDENCE_SOURCES_STYLE.operatorRaised}
      sourcesHeadingId="where-to-go-next"
      sourcesLayout="stacked"
      readingBodyClassName={props.readingBodyClassName ?? HELP_PAGE_LAYOUT.readingBody}
    />
  );
}

export function ConnectionStatusEvidenceOrientationStrip(): React.JSX.Element {
  return (
    <EvidenceOrientationClaimAndSourcesStrip
      slug="connection-status"
      claimElement="div"
      sourcesTitle={CONNECTION_STATUS_FOLLOW_UPS_TITLE}
      sourcesIntro={CONNECTION_STATUS_SOURCES_INTRO}
      sources={CONNECTION_STATUS_SOURCES}
      sourcesStyle={EVIDENCE_SOURCES_STYLE.operatorRaised}
      sourcesHeadingId="where-to-go-next"
      sourcesLayout="stacked"
    />
  );
}

export function AdminConfigurationEvidenceOrientationStrip(): React.JSX.Element {
  return (
    <EvidenceOrientationClaimAndSourcesStrip
      slug="admin-configuration"
      claimElement="div"
      sourcesTitle={ADMIN_CONFIGURATION_FOLLOW_UPS_TITLE}
      sourcesIntro={ADMIN_CONFIGURATION_SOURCES_INTRO}
      sources={ADMIN_CONFIGURATION_SOURCES}
      sourcesStyle={EVIDENCE_SOURCES_STYLE.operatorRaised}
      sourcesHeadingId="where-to-go-next"
      sourcesLayout="stacked"
    />
  );
}

export function AdminHealthEvidenceOrientationStrip(): React.JSX.Element {
  return (
    <EvidenceOrientationClaimAndSourcesStrip
      slug="admin-health"
      claimElement="div"
      sourcesTitle={ADMIN_HEALTH_FOLLOW_UPS_TITLE}
      sourcesIntro={ADMIN_HEALTH_SOURCES_INTRO}
      sources={ADMIN_HEALTH_SOURCES}
      sourcesStyle={EVIDENCE_SOURCES_STYLE.operatorRaised}
      sourcesHeadingId="where-to-go-next"
      sourcesLayout="stacked"
    />
  );
}

export function IntegrationEventsDlqEvidenceOrientationStrip(): React.JSX.Element {
  return (
    <EvidenceOrientationClaimAndSourcesStrip
      slug="integration-events-dlq"
      claimElement="div"
      sourcesTitle={INTEGRATION_EVENTS_DLQ_FOLLOW_UPS_TITLE}
      sourcesIntro={INTEGRATION_EVENTS_DLQ_SOURCES_INTRO}
      sources={INTEGRATION_EVENTS_DLQ_SOURCES}
      sourcesStyle={EVIDENCE_SOURCES_STYLE.operatorRaised}
      sourcesHeadingId="where-to-go-next"
      sourcesLayout="stacked"
    />
  );
}

export function AdminItsmConnectorsEvidenceOrientationStrip(): React.JSX.Element {
  return (
    <EvidenceOrientationClaimAndSourcesStrip
      slug="admin-itsm-connectors"
      claimElement="div"
      sourcesTitle={ADMIN_ITSM_CONNECTORS_FOLLOW_UPS_TITLE}
      sourcesIntro={ADMIN_ITSM_CONNECTORS_SOURCES_INTRO}
      sources={ADMIN_ITSM_CONNECTORS_SOURCES}
      sourcesStyle={EVIDENCE_SOURCES_STYLE.operatorRaised}
      sourcesHeadingId="where-to-go-next"
      sourcesLayout="stacked"
    />
  );
}

export function AdminTenantsEvidenceOrientationStrip(): React.JSX.Element {
  return (
    <EvidenceOrientationClaimAndSourcesStrip
      slug="admin-tenants"
      claimElement="div"
      sourcesTitle={ADMIN_TENANTS_FOLLOW_UPS_TITLE}
      sourcesIntro={ADMIN_TENANTS_SOURCES_INTRO}
      sources={ADMIN_TENANTS_SOURCES}
      sourcesStyle={EVIDENCE_SOURCES_STYLE.operatorRaised}
      sourcesHeadingId="where-to-go-next"
      sourcesLayout="stacked"
    />
  );
}

export function AgentModelCatalogEvidenceOrientationStrip(): React.JSX.Element {
  return (
    <EvidenceOrientationClaimAndSourcesStrip
      slug="agent-model-catalog"
      claimElement="div"
      sourcesTitle={AGENT_MODEL_CATALOG_FOLLOW_UPS_TITLE}
      sourcesIntro={AGENT_MODEL_CATALOG_SOURCES_INTRO}
      sources={AGENT_MODEL_CATALOG_SOURCES}
      sourcesStyle={EVIDENCE_SOURCES_STYLE.operatorRaised}
      sourcesHeadingId="where-to-go-next"
      sourcesLayout="stacked"
    />
  );
}

export function DemoReadinessEvidenceOrientationStrip(): React.JSX.Element {
  return (
    <EvidenceOrientationClaimAndSourcesStrip
      slug="demo-readiness"
      claimElement="div"
      sourcesTitle={DEMO_READINESS_FOLLOW_UPS_TITLE}
      sourcesIntro={DEMO_READINESS_SOURCES_INTRO}
      sources={DEMO_READINESS_SOURCES}
      sourcesStyle={EVIDENCE_SOURCES_STYLE.operatorRaised}
      sourcesHeadingId="where-to-go-next"
      sourcesLayout="stacked"
    />
  );
}

export function DeploymentStatusEvidenceOrientationStrip(): React.JSX.Element {
  return (
    <EvidenceOrientationClaimAndSourcesStrip
      slug="deployment-status"
      claimElement="div"
      sourcesTitle={DEPLOYMENT_STATUS_FOLLOW_UPS_TITLE}
      sourcesIntro={DEPLOYMENT_STATUS_SOURCES_INTRO}
      sources={DEPLOYMENT_STATUS_SOURCES}
      sourcesStyle={EVIDENCE_SOURCES_STYLE.operatorRaised}
      sourcesHeadingId="where-to-go-next"
      sourcesLayout="stacked"
    />
  );
}

export function EvidenceProposalsEvidenceOrientationStrip(): React.JSX.Element {
  return (
    <EvidenceOrientationClaimAndSourcesStrip
      slug="evidence-proposals"
      claimElement="div"
      sourcesTitle={EVIDENCE_PROPOSALS_FOLLOW_UPS_TITLE}
      sourcesIntro={EVIDENCE_PROPOSALS_SOURCES_INTRO}
      sources={EVIDENCE_PROPOSALS_SOURCES}
      sourcesStyle={EVIDENCE_SOURCES_STYLE.operatorRaised}
      sourcesHeadingId="where-to-go-next"
      sourcesLayout="stacked"
    />
  );
}

export function FleetLlmCogsEvidenceOrientationStrip(): React.JSX.Element {
  return (
    <EvidenceOrientationClaimAndSourcesStrip
      slug="fleet-llm-cogs"
      claimElement="div"
      sourcesTitle={FLEET_LLM_COGS_FOLLOW_UPS_TITLE}
      sourcesIntro={FLEET_LLM_COGS_SOURCES_INTRO}
      sources={FLEET_LLM_COGS_SOURCES}
      sourcesStyle={EVIDENCE_SOURCES_STYLE.operatorRaised}
      sourcesHeadingId="where-to-go-next"
      sourcesLayout="stacked"
    />
  );
}

export function PricingQuoteAgingEvidenceOrientationStrip(): React.JSX.Element {
  return (
    <EvidenceOrientationClaimAndSourcesStrip
      slug="pricing-quote-aging"
      claimElement="div"
      sourcesTitle={PRICING_QUOTE_AGING_FOLLOW_UPS_TITLE}
      sourcesIntro={PRICING_QUOTE_AGING_SOURCES_INTRO}
      sources={PRICING_QUOTE_AGING_SOURCES}
      sourcesStyle={EVIDENCE_SOURCES_STYLE.operatorRaised}
      sourcesHeadingId="where-to-go-next"
      sourcesLayout="stacked"
    />
  );
}

export function PlatformBundledPolicyPacksEvidenceOrientationStrip(): React.JSX.Element {
  return (
    <EvidenceOrientationClaimAndSourcesStrip
      slug="platform-bundled-policy-packs"
      claimElement="div"
      sourcesTitle={PLATFORM_BUNDLED_POLICY_PACKS_FOLLOW_UPS_TITLE}
      sourcesIntro={PLATFORM_BUNDLED_POLICY_PACKS_SOURCES_INTRO}
      sources={PLATFORM_BUNDLED_POLICY_PACKS_SOURCES}
      sourcesStyle={EVIDENCE_SOURCES_STYLE.operatorRaised}
      sourcesHeadingId="where-to-go-next"
      sourcesLayout="stacked"
    />
  );
}

export function ProductLearningEvidenceOrientationStrip(): React.JSX.Element {
  return (
    <EvidenceOrientationClaimAndSourcesStrip
      slug="product-learning"
      claimElement="div"
      sourcesTitle={PRODUCT_LEARNING_FOLLOW_UPS_TITLE}
      sourcesIntro={PRODUCT_LEARNING_SOURCES_INTRO}
      sources={PRODUCT_LEARNING_SOURCES}
      sourcesStyle={EVIDENCE_SOURCES_STYLE.operatorRaised}
      sourcesHeadingId="where-to-go-next"
      sourcesLayout="stacked"
    />
  );
}

export function RagHealthEvidenceOrientationStrip(): React.JSX.Element {
  return (
    <EvidenceOrientationClaimAndSourcesStrip
      slug="rag-health"
      claimElement="div"
      sourcesTitle={RAG_HEALTH_FOLLOW_UPS_TITLE}
      sourcesIntro={RAG_HEALTH_SOURCES_INTRO}
      sources={RAG_HEALTH_SOURCES}
      sourcesStyle={EVIDENCE_SOURCES_STYLE.operatorRaised}
      sourcesHeadingId="where-to-go-next"
      sourcesLayout="stacked"
    />
  );
}

export function RecommendationLearningEvidenceOrientationStrip(): React.JSX.Element {
  return (
    <EvidenceOrientationClaimAndSourcesStrip
      slug="recommendation-learning"
      claimElement="div"
      sourcesTitle={RECOMMENDATION_LEARNING_FOLLOW_UPS_TITLE}
      sourcesIntro={RECOMMENDATION_LEARNING_SOURCES_INTRO}
      sources={RECOMMENDATION_LEARNING_SOURCES}
      sourcesStyle={EVIDENCE_SOURCES_STYLE.operatorRaised}
      sourcesHeadingId="where-to-go-next"
      sourcesLayout="stacked"
    />
  );
}

export function ReplayEvidenceOrientationStrip(): React.JSX.Element {
  return (
    <EvidenceOrientationClaimAndSourcesStrip
      slug="validate-route"
      claimElement="div"
      sourcesTitle={REPLAY_FOLLOW_UPS_TITLE}
      sourcesIntro={REPLAY_SOURCES_INTRO}
      sources={REPLAY_SOURCES}
      sourcesStyle={EVIDENCE_SOURCES_STYLE.operatorRaised}
      sourcesHeadingId="where-to-go-next"
      sourcesLayout="stacked"
    />
  );
}

export function TrialFunnelEvidenceOrientationStrip(): React.JSX.Element {
  return (
    <EvidenceOrientationClaimAndSourcesStrip
      slug="trial-funnel"
      claimElement="div"
      sourcesTitle={TRIAL_FUNNEL_FOLLOW_UPS_TITLE}
      sourcesIntro={TRIAL_FUNNEL_SOURCES_INTRO}
      sources={TRIAL_FUNNEL_SOURCES}
      sourcesStyle={EVIDENCE_SOURCES_STYLE.operatorRaised}
      sourcesHeadingId="where-to-go-next"
      sourcesLayout="stacked"
    />
  );
}

export function TenantHealthEvidenceOrientationStrip(): React.JSX.Element {
  return (
    <EvidenceOrientationClaimAndSourcesStrip
      slug="tenant-health"
      claimElement="div"
      sourcesTitle={TENANT_HEALTH_FOLLOW_UPS_TITLE}
      sourcesIntro={TENANT_HEALTH_SOURCES_INTRO}
      sources={TENANT_HEALTH_SOURCES}
      sourcesStyle={EVIDENCE_SOURCES_STYLE.operatorRaised}
      sourcesHeadingId="where-to-go-next"
      sourcesLayout="stacked"
    />
  );
}

export type StandardsRulesHelpEvidenceOrientationStripProps = {
  readonly readingBodyClassName?: string;
};

export function StandardsRulesHelpEvidenceOrientationStrip(
  props: StandardsRulesHelpEvidenceOrientationStripProps = {},
): React.JSX.Element {
  const sectionHeadingClass = cn(
    OPERATOR_SHELL_SCROLL_OFFSET_CLASS,
    OPERATOR_TYPOGRAPHY.sectionTitle,
    "m-0 scroll-mt-24",
  );

  return (
    <EvidenceOrientationClaimAndSourcesStrip
      slug="help-standards-rules"
      claim={STANDARDS_RULES_HELP_CLAIM_DISCIPLINE}
      claimHeading={STANDARDS_RULES_HELP_CLAIM_DISCIPLINE_HEADING}
      claimHeadingId={STANDARDS_RULES_HELP_CLAIM_HEADING_ID}
      claimElement="div"
      sourcesTitle={STANDARDS_RULES_HELP_FOLLOW_UPS_TITLE}
      sourcesIntro={STANDARDS_RULES_HELP_SOURCES_INTRO}
      sources={STANDARDS_RULES_HELP_SOURCES}
      sourcesStyle={EVIDENCE_SOURCES_STYLE.operatorRaised}
      sourcesHeadingId="where-to-go-next"
      sourcesLayout="stacked"
      readingBodyClassName={props.readingBodyClassName ?? HELP_PAGE_LAYOUT.readingBody}
      headingClassName={sectionHeadingClass}
    />
  );
}

export type BaselineSettingsHelpEvidenceOrientationStripProps = {
  readonly readingBodyClassName?: string;
};

export function BaselineSettingsEvidenceOrientationStrip(): React.JSX.Element {
  return (
    <EvidenceOrientationClaimAndSourcesStrip
      slug="baseline-settings"
      claimElement="div"
      sourcesTitle={BASELINE_SETTINGS_FOLLOW_UPS_TITLE}
      sourcesIntro={BASELINE_SETTINGS_SOURCES_INTRO}
      sources={BASELINE_SETTINGS_SOURCES}
      sourcesStyle={EVIDENCE_SOURCES_STYLE.operatorRaised}
      sourcesHeadingId="where-to-go-next"
      sourcesLayout="stacked"
    />
  );
}

export function ExtractUploadSettingsEvidenceOrientationStrip(): React.JSX.Element {
  return (
    <EvidenceOrientationClaimAndSourcesStrip
      slug="extract-upload-settings"
      claimElement="div"
      sourcesTitle={EXTRACT_UPLOAD_SETTINGS_FOLLOW_UPS_TITLE}
      sourcesIntro={EXTRACT_UPLOAD_SETTINGS_SOURCES_INTRO}
      sources={EXTRACT_UPLOAD_SETTINGS_SOURCES}
      sourcesStyle={EVIDENCE_SOURCES_STYLE.operatorRaised}
      sourcesHeadingId="where-to-go-next"
      sourcesLayout="stacked"
    />
  );
}

export function OperatorBillingSettingsEvidenceOrientationStrip(): React.JSX.Element {
  return (
    <EvidenceOrientationClaimAndSourcesStrip
      slug="operator-billing-settings"
      claimElement="div"
      sourcesTitle={OPERATOR_BILLING_SETTINGS_FOLLOW_UPS_TITLE}
      sourcesIntro={OPERATOR_BILLING_SETTINGS_SOURCES_INTRO}
      sources={OPERATOR_BILLING_SETTINGS_SOURCES}
      sourcesStyle={EVIDENCE_SOURCES_STYLE.operatorRaised}
      sourcesHeadingId="where-to-go-next"
      sourcesLayout="stacked"
    />
  );
}

export function PreferencesSettingsEvidenceOrientationStrip(): React.JSX.Element {
  return (
    <EvidenceOrientationClaimAndSourcesStrip
      slug="preferences-settings"
      claim={PREFERENCES_SETTINGS_CLAIM_DISCIPLINE}
      claimHeading={PREFERENCES_SETTINGS_CLAIM_DISCIPLINE_HEADING}
      claimHeadingId={PREFERENCES_SETTINGS_CLAIM_HEADING_ID}
      claimElement="div"
      sourcesTitle={PREFERENCES_SETTINGS_FOLLOW_UPS_TITLE}
      sourcesIntro={PREFERENCES_SETTINGS_SOURCES_INTRO}
      sources={PREFERENCES_SETTINGS_SOURCES}
      sourcesStyle={EVIDENCE_SOURCES_STYLE.operatorRaised}
      sourcesHeadingId="where-to-go-next"
      sourcesLayout="stacked"
    />
  );
}

export function RoleMappingSettingsEvidenceOrientationStrip(): React.JSX.Element {
  return (
    <EvidenceOrientationClaimAndSourcesStrip
      slug="role-mapping-settings"
      claimElement="div"
      sourcesTitle={ROLE_MAPPING_SETTINGS_FOLLOW_UPS_TITLE}
      sourcesIntro={ROLE_MAPPING_SETTINGS_SOURCES_INTRO}
      sources={ROLE_MAPPING_SETTINGS_SOURCES}
      sourcesStyle={EVIDENCE_SOURCES_STYLE.operatorRaised}
      sourcesHeadingId="where-to-go-next"
      sourcesLayout="stacked"
    />
  );
}

export function AccountSecuritySettingsEvidenceOrientationStrip(): React.JSX.Element {
  return (
    <EvidenceOrientationClaimAndSourcesStrip
      slug="account-security-settings"
      claim={ACCOUNT_SECURITY_SETTINGS_CLAIM_DISCIPLINE}
      claimHeading={ACCOUNT_SECURITY_SETTINGS_CLAIM_DISCIPLINE_HEADING}
      claimHeadingId={ACCOUNT_SECURITY_SETTINGS_CLAIM_HEADING_ID}
      claimElement="div"
      sourcesTitle={ACCOUNT_SECURITY_SETTINGS_FOLLOW_UPS_TITLE}
      sourcesIntro={ACCOUNT_SECURITY_SETTINGS_SOURCES_INTRO}
      sources={ACCOUNT_SECURITY_SETTINGS_SOURCES}
      sourcesStyle={EVIDENCE_SOURCES_STYLE.operatorRaised}
      sourcesHeadingId="where-to-go-next"
      sourcesLayout="stacked"
    />
  );
}

export function AuthDomainsSettingsEvidenceOrientationStrip(): React.JSX.Element {
  return (
    <EvidenceOrientationClaimAndSourcesStrip
      slug="auth-domains-settings"
      claim={AUTH_DOMAINS_SETTINGS_CLAIM_DISCIPLINE}
      claimHeading={AUTH_DOMAINS_SETTINGS_CLAIM_DISCIPLINE_HEADING}
      claimHeadingId={AUTH_DOMAINS_SETTINGS_CLAIM_HEADING_ID}
      claimElement="div"
      sourcesTitle={AUTH_DOMAINS_SETTINGS_FOLLOW_UPS_TITLE}
      sourcesIntro={AUTH_DOMAINS_SETTINGS_SOURCES_INTRO}
      sources={AUTH_DOMAINS_SETTINGS_SOURCES}
      sourcesStyle={EVIDENCE_SOURCES_STYLE.operatorRaised}
      sourcesHeadingId="where-to-go-next"
      sourcesLayout="stacked"
    />
  );
}

export function ModelGovernanceSettingsEvidenceOrientationStrip(): React.JSX.Element {
  return (
    <EvidenceOrientationClaimAndSourcesStrip
      slug="model-governance-settings"
      claimElement="div"
      sourcesTitle={MODEL_GOVERNANCE_SETTINGS_FOLLOW_UPS_TITLE}
      sourcesIntro={MODEL_GOVERNANCE_SETTINGS_SOURCES_INTRO}
      sources={MODEL_GOVERNANCE_SETTINGS_SOURCES}
      sourcesStyle={EVIDENCE_SOURCES_STYLE.operatorRaised}
      sourcesHeadingId="where-to-go-next"
      sourcesLayout="stacked"
    />
  );
}

export function AiUsageSettingsEvidenceOrientationStrip(): React.JSX.Element {
  return (
    <EvidenceOrientationClaimAndSourcesStrip
      slug="ai-usage-settings"
      claimElement="div"
      sourcesTitle={AI_USAGE_SETTINGS_FOLLOW_UPS_TITLE}
      sourcesIntro={AI_USAGE_SETTINGS_SOURCES_INTRO}
      sources={AI_USAGE_SETTINGS_SOURCES}
      sourcesStyle={EVIDENCE_SOURCES_STYLE.operatorRaised}
      sourcesHeadingId="where-to-go-next"
      sourcesLayout="stacked"
    />
  );
}

export function IdentityProvidersSettingsEvidenceOrientationStrip(): React.JSX.Element {
  return (
    <EvidenceOrientationClaimAndSourcesStrip
      slug="identity-providers-settings"
      claimElement="div"
      sourcesTitle={IDENTITY_PROVIDERS_SETTINGS_FOLLOW_UPS_TITLE}
      sourcesIntro={IDENTITY_PROVIDERS_SETTINGS_SOURCES_INTRO}
      sources={IDENTITY_PROVIDERS_SETTINGS_SOURCES}
      sourcesStyle={EVIDENCE_SOURCES_STYLE.operatorRaised}
      sourcesHeadingId="where-to-go-next"
      sourcesLayout="stacked"
    />
  );
}

export function IdentityProvidersOidcSettingsEvidenceOrientationStrip(): React.JSX.Element {
  return (
    <EvidenceOrientationClaimAndSourcesStrip
      slug="identity-providers-oidc-settings"
      claimElement="div"
      sourcesTitle={IDENTITY_PROVIDERS_OIDC_FOLLOW_UPS_TITLE}
      sourcesIntro={IDENTITY_PROVIDERS_OIDC_SOURCES_INTRO}
      sources={IDENTITY_PROVIDERS_OIDC_SOURCES}
      sourcesStyle={EVIDENCE_SOURCES_STYLE.operatorRaised}
      sourcesHeadingId="where-to-go-next"
      sourcesLayout="stacked"
    />
  );
}

export function IdentityProvidersSamlSettingsEvidenceOrientationStrip(): React.JSX.Element {
  return (
    <EvidenceOrientationClaimAndSourcesStrip
      slug="identity-providers-saml-settings"
      claimElement="div"
      sourcesTitle={IDENTITY_PROVIDERS_SAML_FOLLOW_UPS_TITLE}
      sourcesIntro={IDENTITY_PROVIDERS_SAML_SOURCES_INTRO}
      sources={IDENTITY_PROVIDERS_SAML_SOURCES}
      sourcesStyle={EVIDENCE_SOURCES_STYLE.operatorRaised}
      sourcesHeadingId="where-to-go-next"
      sourcesLayout="stacked"
    />
  );
}

export function IdentityProvidersDiagnosticsSettingsEvidenceOrientationStrip(): React.JSX.Element {
  return (
    <EvidenceOrientationClaimAndSourcesStrip
      slug="identity-providers-diagnostics-settings"
      claimElement="div"
      sourcesTitle={IDENTITY_PROVIDERS_DIAGNOSTICS_FOLLOW_UPS_TITLE}
      sourcesIntro={IDENTITY_PROVIDERS_DIAGNOSTICS_SOURCES_INTRO}
      sources={IDENTITY_PROVIDERS_DIAGNOSTICS_SOURCES}
      sourcesStyle={EVIDENCE_SOURCES_STYLE.operatorRaised}
      sourcesHeadingId="where-to-go-next"
      sourcesLayout="stacked"
    />
  );
}

export function ScimProvisioningSettingsEvidenceOrientationStrip(): React.JSX.Element {
  return (
    <EvidenceOrientationClaimAndSourcesStrip
      slug="scim-provisioning-settings"
      claimElement="div"
      sourcesTitle={SCIM_PROVISIONING_FOLLOW_UPS_TITLE}
      sourcesIntro={SCIM_PROVISIONING_SOURCES_INTRO}
      sources={SCIM_PROVISIONING_SOURCES}
      sourcesStyle={EVIDENCE_SOURCES_STYLE.operatorRaised}
      sourcesHeadingId="where-to-go-next"
      sourcesLayout="stacked"
    />
  );
}

export function SsoWizardSettingsEvidenceOrientationStrip(): React.JSX.Element {
  return (
    <EvidenceOrientationClaimAndSourcesStrip
      slug="sso-wizard-settings"
      claimElement="div"
      sourcesTitle={SSO_WIZARD_FOLLOW_UPS_TITLE}
      sourcesIntro={SSO_WIZARD_SOURCES_INTRO}
      sources={SSO_WIZARD_SOURCES}
      sourcesStyle={EVIDENCE_SOURCES_STYLE.operatorRaised}
      sourcesHeadingId="where-to-go-next"
      sourcesLayout="stacked"
    />
  );
}

export function TenantSettingsEvidenceOrientationStrip(): React.JSX.Element {
  return (
    <EvidenceOrientationClaimAndSourcesStrip
      slug="tenant-settings"
      claimElement="div"
      sourcesTitle={TENANT_SETTINGS_FOLLOW_UPS_TITLE}
      sourcesIntro={TENANT_SETTINGS_SOURCES_INTRO}
      sources={TENANT_SETTINGS_SOURCES}
      sourcesStyle={EVIDENCE_SOURCES_STYLE.operatorRaised}
      sourcesHeadingId="where-to-go-next"
      sourcesLayout="stacked"
    />
  );
}

export function BaselineSettingsHelpEvidenceOrientationStrip(
  props: BaselineSettingsHelpEvidenceOrientationStripProps = {},
): React.JSX.Element {
  return (
    <EvidenceOrientationClaimAndSourcesStrip
      slug="help-baseline-settings"
      claim={BASELINE_SETTINGS_HELP_CLAIM_DISCIPLINE}
      claimHeading={BASELINE_SETTINGS_HELP_CLAIM_DISCIPLINE_HEADING}
      claimHeadingId={BASELINE_SETTINGS_HELP_CLAIM_HEADING_ID}
      claimElement="div"
      sourcesTitle={BASELINE_SETTINGS_HELP_FOLLOW_UPS_TITLE}
      sourcesIntro={BASELINE_SETTINGS_HELP_SOURCES_INTRO}
      sources={BASELINE_SETTINGS_HELP_SOURCES}
      sourcesStyle={EVIDENCE_SOURCES_STYLE.operatorRaised}
      sourcesHeadingId="where-to-go-next"
      sourcesLayout="stacked"
      readingBodyClassName={props.readingBodyClassName ?? HELP_PAGE_LAYOUT.readingBody}
    />
  );
}

export function ApiKeysHelpEvidenceOrientationStrip(): React.JSX.Element {
  return (
    <EvidenceOrientationClaimAndSourcesStrip
      slug="help-api-keys"
      claim={API_KEYS_HELP_CLAIM_DISCIPLINE}
      claimHeading={API_KEYS_HELP_CLAIM_DISCIPLINE_HEADING}
      claimHeadingId={API_KEYS_HELP_CLAIM_HEADING_ID}
      claimElement="div"
      sourcesTitle={API_KEYS_HELP_FOLLOW_UPS_TITLE}
      sourcesIntro={API_KEYS_HELP_SOURCES_INTRO}
      sources={API_KEYS_HELP_SOURCES}
      sourcesStyle={EVIDENCE_SOURCES_STYLE.operatorRaised}
      sourcesHeadingId="where-to-go-next"
    />
  );
}

export function ApiKeysSettingsEvidenceOrientationStrip(): React.JSX.Element {
  return (
    <EvidenceOrientationClaimAndSourcesStrip
      slug="api-keys-settings"
      claimElement="div"
      sourcesTitle={API_KEYS_SETTINGS_FOLLOW_UPS_TITLE}
      sourcesIntro={API_KEYS_SETTINGS_SOURCES_INTRO}
      sources={API_KEYS_SETTINGS_SOURCES}
      sourcesStyle={EVIDENCE_SOURCES_STYLE.operatorRaised}
      sourcesHeadingId="where-to-go-next"
      sourcesLayout="stacked"
    />
  );
}

export function SystemHealthHelpEvidenceOrientationStrip(): React.JSX.Element {
  return (
    <EvidenceOrientationClaimAndSourcesStrip
      slug="help-system-health"
      claim={SYSTEM_HEALTH_HELP_CLAIM_DISCIPLINE}
      claimHeading={SYSTEM_HEALTH_HELP_CLAIM_DISCIPLINE_HEADING}
      claimHeadingId={SYSTEM_HEALTH_HELP_CLAIM_HEADING_ID}
      claimElement="div"
      sourcesTitle={SYSTEM_HEALTH_HELP_FOLLOW_UPS_TITLE}
      sourcesIntro={SYSTEM_HEALTH_HELP_SOURCES_INTRO}
      sources={SYSTEM_HEALTH_HELP_SOURCES}
      sourcesStyle={EVIDENCE_SOURCES_STYLE.operatorRaised}
      sourcesHeadingId="where-to-go-next"
      sourcesLayout="stacked"
      readingBodyClassName={HELP_PAGE_LAYOUT.readingBody}
    />
  );
}

export function AiUsageHelpEvidenceOrientationStrip(): React.JSX.Element {
  return (
    <EvidenceOrientationClaimAndSourcesStrip
      slug="help-ai-usage"
      claim={AI_USAGE_HELP_CLAIM_DISCIPLINE}
      claimHeading={AI_USAGE_HELP_CLAIM_DISCIPLINE_HEADING}
      claimHeadingId={AI_USAGE_HELP_CLAIM_HEADING_ID}
      claimElement="div"
      sourcesTitle={AI_USAGE_HELP_FOLLOW_UPS_TITLE}
      sourcesIntro={AI_USAGE_HELP_SOURCES_INTRO}
      sources={AI_USAGE_HELP_SOURCES}
      sourcesStyle={EVIDENCE_SOURCES_STYLE.operatorRaised}
      sourcesHeadingId="where-to-go-next"
    />
  );
}

export type PreferencesHelpEvidenceOrientationStripProps = {
  readonly readingBodyClassName?: string;
};

export function PreferencesHelpEvidenceOrientationStrip(
  props: PreferencesHelpEvidenceOrientationStripProps = {},
): React.JSX.Element {
  return (
    <EvidenceOrientationClaimAndSourcesStrip
      slug="help-preferences"
      claim={PREFERENCES_HELP_CLAIM_DISCIPLINE}
      claimHeading={PREFERENCES_HELP_CLAIM_DISCIPLINE_HEADING}
      claimHeadingId={PREFERENCES_HELP_CLAIM_HEADING_ID}
      claimElement="div"
      sourcesTitle={PREFERENCES_HELP_FOLLOW_UPS_TITLE}
      sourcesIntro={PREFERENCES_HELP_SOURCES_INTRO}
      sources={PREFERENCES_HELP_SOURCES}
      sourcesStyle={EVIDENCE_SOURCES_STYLE.operatorRaised}
      sourcesHeadingId="where-to-go-next"
      sourcesLayout="stacked"
      readingBodyClassName={props.readingBodyClassName ?? HELP_PAGE_LAYOUT.readingBody}
    />
  );
}

export type NotificationsHelpEvidenceOrientationStripProps = {
  readonly readingBodyClassName?: string;
};

export function NotificationsHelpEvidenceOrientationStrip(
  props: NotificationsHelpEvidenceOrientationStripProps = {},
): React.JSX.Element {
  return (
    <EvidenceOrientationClaimAndSourcesStrip
      slug="help-notifications"
      claim={NOTIFICATIONS_HELP_CLAIM_DISCIPLINE}
      claimHeading={NOTIFICATIONS_HELP_CLAIM_DISCIPLINE_HEADING}
      claimHeadingId={NOTIFICATIONS_HELP_CLAIM_HEADING_ID}
      claimElement="div"
      sourcesTitle={NOTIFICATIONS_HELP_FOLLOW_UPS_TITLE}
      sourcesIntro={NOTIFICATIONS_HELP_SOURCES_INTRO}
      sources={NOTIFICATIONS_HELP_SOURCES}
      sourcesStyle={EVIDENCE_SOURCES_STYLE.operatorRaised}
      sourcesHeadingId="where-to-go-next"
      sourcesLayout="stacked"
      readingBodyClassName={props.readingBodyClassName ?? HELP_PAGE_LAYOUT.readingBody}
    />
  );
}

export type WorkspaceSettingsHelpEvidenceOrientationStripProps = {
  readonly readingBodyClassName?: string;
};

export function WorkspaceSettingsHelpEvidenceOrientationStrip(
  props: WorkspaceSettingsHelpEvidenceOrientationStripProps = {},
): React.JSX.Element {
  return (
    <EvidenceOrientationClaimAndSourcesStrip
      slug="help-workspace-settings"
      claim={WORKSPACE_SETTINGS_HELP_CLAIM_DISCIPLINE}
      claimHeading={WORKSPACE_SETTINGS_HELP_CLAIM_DISCIPLINE_HEADING}
      claimHeadingId={WORKSPACE_SETTINGS_HELP_CLAIM_HEADING_ID}
      claimStyle={EVIDENCE_CLAIM_STYLE.operatorInlineNote}
      claimElement="div"
      sourcesTitle={WORKSPACE_SETTINGS_HELP_FOLLOW_UPS_TITLE}
      sourcesIntro={WORKSPACE_SETTINGS_HELP_SOURCES_INTRO}
      sources={WORKSPACE_SETTINGS_HELP_SOURCES}
      sourcesStyle={EVIDENCE_SOURCES_STYLE.operatorRaised}
      sourcesHeadingId="where-to-go-next"
      sourcesLayout="stacked"
      readingBodyClassName={props.readingBodyClassName ?? HELP_PAGE_LAYOUT.readingBody}
    />
  );
}

export type SlackIntegrationHelpEvidenceOrientationStripProps = {
  readonly readingBodyClassName?: string;
};

export function SlackIntegrationHelpEvidenceOrientationStrip(
  props: SlackIntegrationHelpEvidenceOrientationStripProps = {},
): React.JSX.Element {
  return (
    <EvidenceOrientationClaimAndSourcesStrip
      slug="help-slack-integration"
      claim={SLACK_INTEGRATION_HELP_CLAIM_DISCIPLINE}
      claimHeading={SLACK_INTEGRATION_HELP_CLAIM_DISCIPLINE_HEADING}
      claimHeadingId={SLACK_INTEGRATION_HELP_CLAIM_HEADING_ID}
      claimElement="div"
      sourcesTitle={SLACK_INTEGRATION_HELP_FOLLOW_UPS_TITLE}
      sourcesIntro={SLACK_INTEGRATION_HELP_SOURCES_INTRO}
      sources={SLACK_INTEGRATION_HELP_SOURCES}
      sourcesStyle={EVIDENCE_SOURCES_STYLE.operatorRaised}
      sourcesHeadingId="where-to-go-next"
      sourcesLayout="stacked"
      readingBodyClassName={props.readingBodyClassName ?? HELP_PAGE_LAYOUT.readingBody}
    />
  );
}

export function SlackIntegrationEvidenceOrientationStrip(): React.JSX.Element {
  return (
    <EvidenceOrientationClaimAndSourcesStrip
      slug="slack-integration"
      claimElement="div"
      sourcesTitle={SLACK_INTEGRATION_FOLLOW_UPS_TITLE}
      sourcesIntro={SLACK_INTEGRATION_SOURCES_INTRO}
      sources={SLACK_INTEGRATION_SOURCES}
      sourcesStyle={EVIDENCE_SOURCES_STYLE.operatorRaised}
      sourcesHeadingId="where-to-go-next"
      sourcesLayout="stacked"
    />
  );
}

export type TeamsIntegrationHelpEvidenceOrientationStripProps = {
  readonly readingBodyClassName?: string;
};

export function TeamsIntegrationHelpEvidenceOrientationStrip(
  props: TeamsIntegrationHelpEvidenceOrientationStripProps = {},
): React.JSX.Element {
  const sectionHeadingClass = cn(
    OPERATOR_SHELL_SCROLL_OFFSET_CLASS,
    OPERATOR_TYPOGRAPHY.sectionTitle,
    "m-0 scroll-mt-24",
  );

  return (
    <EvidenceOrientationStripShell testId="help-teams-integration-orientation">
      <EvidenceOrientationClaimCallout
        testId="help-teams-integration-claim-discipline"
        body={TEAMS_INTEGRATION_HELP_CLAIM_DISCIPLINE}
        style={EVIDENCE_CLAIM_STYLE.operatorNeutral}
        element="div"
        bodyClassName={props.readingBodyClassName ?? HELP_PAGE_LAYOUT.readingBody}
        headingClassName={sectionHeadingClass}
        heading={{
          text: TEAMS_INTEGRATION_HELP_CLAIM_DISCIPLINE_HEADING,
          id: TEAMS_INTEGRATION_HELP_CLAIM_HEADING_ID,
        }}
      />

      <EvidenceOrientationSourcesSection
        testId="help-teams-integration-sources"
        headingId="where-to-go-next"
        title={TEAMS_INTEGRATION_HELP_FOLLOW_UPS_TITLE}
        intro={TEAMS_INTEGRATION_HELP_SOURCES_INTRO}
        links={TEAMS_INTEGRATION_HELP_SOURCES}
        style={EVIDENCE_SOURCES_STYLE.operatorRaised}
        layout="stacked"
        listClassName={props.readingBodyClassName ?? HELP_PAGE_LAYOUT.readingBody}
        headingClassName={sectionHeadingClass}
        distinguishFollowUpDestinations
        promotedSourceHref={TEAMS_INTEGRATION_HELP_ALERT_RULES_HREF}
      />

      <EvidenceOrientationSourcesSection
        testId="help-teams-integration-alternative-sources"
        headingId="help-teams-integration-alternative-sources-heading"
        title={TEAMS_INTEGRATION_HELP_ALTERNATIVES_TITLE}
        intro="Compare sibling notification channels when Teams is not the only destination under review."
        links={TEAMS_INTEGRATION_HELP_ALTERNATIVE_SOURCES}
        style={EVIDENCE_SOURCES_STYLE.operatorRaised}
        layout="stacked"
        listClassName={props.readingBodyClassName ?? HELP_PAGE_LAYOUT.readingBody}
        headingClassName={cn(OPERATOR_TYPOGRAPHY.cardTitle, "m-0")}
        distinguishFollowUpDestinations
      />
    </EvidenceOrientationStripShell>
  );
}

export type WebhooksIntegrationHelpEvidenceOrientationStripProps = {
  readonly readingBodyClassName?: string;
};

export function WebhooksIntegrationHelpEvidenceOrientationStrip(
  props: WebhooksIntegrationHelpEvidenceOrientationStripProps = {},
): React.JSX.Element {
  return (
    <EvidenceOrientationClaimAndSourcesStrip
      slug="help-webhooks-integration"
      claim={WEBHOOKS_INTEGRATION_HELP_CLAIM_DISCIPLINE}
      claimHeading={WEBHOOKS_INTEGRATION_HELP_CLAIM_DISCIPLINE_HEADING}
      claimHeadingId={WEBHOOKS_INTEGRATION_HELP_CLAIM_HEADING_ID}
      claimElement="div"
      sourcesTitle={WEBHOOKS_INTEGRATION_HELP_FOLLOW_UPS_TITLE}
      sourcesIntro={WEBHOOKS_INTEGRATION_HELP_SOURCES_INTRO}
      sources={WEBHOOKS_INTEGRATION_HELP_SOURCES}
      sourcesStyle={EVIDENCE_SOURCES_STYLE.operatorRaised}
      sourcesHeadingId="where-to-go-next"
      sourcesLayout="stacked"
      readingBodyClassName={props.readingBodyClassName ?? HELP_PAGE_LAYOUT.readingBody}
      promotedSourceHref={WEBHOOKS_INTEGRATION_HELP_ALERT_RULES_HREF}
    />
  );
}

export function WebhooksIntegrationEvidenceOrientationStrip(): React.JSX.Element {
  return (
    <EvidenceOrientationClaimAndSourcesStrip
      slug="webhooks-integration"
      claimElement="div"
      sourcesTitle={WEBHOOKS_INTEGRATION_FOLLOW_UPS_TITLE}
      sourcesIntro={WEBHOOKS_INTEGRATION_SOURCES_INTRO}
      sources={WEBHOOKS_INTEGRATION_SOURCES}
      sourcesStyle={EVIDENCE_SOURCES_STYLE.operatorRaised}
      sourcesHeadingId="where-to-go-next"
      sourcesLayout="stacked"
    />
  );
}

export function EnterpriseOnboardingHelpEvidenceOrientationStrip(): React.JSX.Element {
  return (
    <EvidenceOrientationClaimAndSourcesStrip
      slug="enterprise-onboarding-help"
      claim={ENTERPRISE_ONBOARDING_HELP_CLAIM_DISCIPLINE}
      claimHeading={ENTERPRISE_ONBOARDING_HELP_CLAIM_DISCIPLINE_HEADING}
      claimHeadingId={ENTERPRISE_ONBOARDING_HELP_CLAIM_HEADING_ID}
      claimElement="div"
      sourcesTitle={ENTERPRISE_ONBOARDING_HELP_FOLLOW_UPS_TITLE}
      sourcesIntro={ENTERPRISE_ONBOARDING_HELP_SOURCES_INTRO}
      sources={ENTERPRISE_ONBOARDING_HELP_SOURCES}
      sourcesStyle={EVIDENCE_SOURCES_STYLE.operatorRaised}
      sourcesHeadingId="where-to-go-next"
      sourcesLayout="stacked"
    />
  );
}

export function GovernanceApprovalHelpEvidenceOrientationStrip(): React.JSX.Element {
  return (
    <EvidenceOrientationClaimAndSourcesStrip
      slug="help-governance-approval"
      claimTestId="help-governance-approval-claim-discipline"
      claim={GOVERNANCE_APPROVAL_HELP_CLAIM_DISCIPLINE}
      claimHeading={GOVERNANCE_APPROVAL_HELP_CLAIM_DISCIPLINE_HEADING}
      claimHeadingId={GOVERNANCE_APPROVAL_HELP_CLAIM_HEADING_ID}
      claimElement="div"
      sourcesTitle={GOVERNANCE_APPROVAL_HELP_FOLLOW_UPS_TITLE}
      sourcesIntro={GOVERNANCE_APPROVAL_HELP_SOURCES_INTRO}
      sources={GOVERNANCE_APPROVAL_HELP_SOURCES}
      sourcesStyle={EVIDENCE_SOURCES_STYLE.operatorRaised}
      sourcesHeadingId="where-to-go-next"
      sourcesLayout="stacked"
    />
  );
}

export function FindingsHelpEvidenceOrientationStrip(): React.JSX.Element {
  return (
    <EvidenceOrientationClaimAndSourcesStrip
      slug="findings-help"
      claimTestId="help-findings-claim-discipline"
      claim={FINDINGS_HELP_CLAIM_DISCIPLINE}
      claimHeading={FINDINGS_HELP_CLAIM_DISCIPLINE_HEADING}
      claimHeadingId={FINDINGS_HELP_CLAIM_HEADING_ID}
      claimElement="div"
      sourcesTitle={FINDINGS_HELP_FOLLOW_UPS_TITLE}
      sourcesIntro={FINDINGS_HELP_SOURCES_INTRO}
      sources={FINDINGS_HELP_SOURCES}
      sourcesStyle={EVIDENCE_SOURCES_STYLE.operatorRaised}
      sourcesHeadingId="where-to-go-next"
      sourcesLayout="stacked"
    />
  );
}

export function IntegrationReadinessHelpEvidenceOrientationStrip(): React.JSX.Element {
  return (
    <EvidenceOrientationClaimAndSourcesStrip
      slug="integration-readiness-help"
      claim={INTEGRATION_READINESS_HELP_CLAIM_DISCIPLINE}
      claimHeading={INTEGRATION_READINESS_HELP_CLAIM_DISCIPLINE_HEADING}
      claimHeadingId={INTEGRATION_READINESS_HELP_CLAIM_HEADING_ID}
      claimElement="div"
      sourcesTitle={INTEGRATION_READINESS_HELP_FOLLOW_UPS_TITLE}
      sourcesIntro={INTEGRATION_READINESS_HELP_SOURCES_INTRO}
      sources={INTEGRATION_READINESS_HELP_SOURCES}
      sourcesStyle={EVIDENCE_SOURCES_STYLE.operatorRaised}
      sourcesHeadingId="where-to-go-next"
      sourcesLayout="stacked"
    />
  );
}

export function PilotFeedbackHelpEvidenceOrientationStrip(): React.JSX.Element {
  return (
    <EvidenceOrientationClaimAndSourcesStrip
      slug="help-pilot-feedback"
      claim={PILOT_FEEDBACK_HELP_CLAIM_DISCIPLINE}
      claimHeading={PILOT_FEEDBACK_HELP_CLAIM_DISCIPLINE_HEADING}
      claimHeadingId={PILOT_FEEDBACK_HELP_CLAIM_HEADING_ID}
      claimElement="div"
      sourcesTitle={PILOT_FEEDBACK_HELP_FOLLOW_UPS_TITLE}
      sourcesIntro={PILOT_FEEDBACK_HELP_SOURCES_INTRO}
      sources={PILOT_FEEDBACK_HELP_SOURCES}
      sourcesStyle={EVIDENCE_SOURCES_STYLE.operatorRaised}
      sourcesHeadingId="where-to-go-next"
      sourcesLayout="stacked"
    />
  );
}

export function PriorManifestRetrievalHelpEvidenceOrientationStrip(): React.JSX.Element {
  return (
    <EvidenceOrientationClaimAndSourcesStrip
      slug="help-prior-manifest-retrieval"
      claim={PRIOR_MANIFEST_RETRIEVAL_HELP_CLAIM_DISCIPLINE}
      claimHeading={PRIOR_MANIFEST_RETRIEVAL_HELP_CLAIM_DISCIPLINE_HEADING}
      claimHeadingId={PRIOR_MANIFEST_RETRIEVAL_HELP_CLAIM_HEADING_ID}
      claimElement="div"
      sourcesTitle={PRIOR_MANIFEST_RETRIEVAL_HELP_FOLLOW_UPS_TITLE}
      sourcesIntro={PRIOR_MANIFEST_RETRIEVAL_HELP_SOURCES_INTRO}
      sources={PRIOR_MANIFEST_RETRIEVAL_HELP_SOURCES}
      sourcesStyle={EVIDENCE_SOURCES_STYLE.operatorRaised}
      sourcesHeadingId="where-to-go-next"
      sourcesLayout="stacked"
    />
  );
}

export function PolicyPacksHelpEvidenceOrientationStrip(): React.JSX.Element {
  return (
    <EvidenceOrientationClaimAndSourcesStrip
      slug="policy-packs-help"
      claim={POLICY_PACKS_HELP_CLAIM_DISCIPLINE}
      claimHeading={POLICY_PACKS_HELP_CLAIM_DISCIPLINE_HEADING}
      claimHeadingId={POLICY_PACKS_HELP_CLAIM_HEADING_ID}
      claimElement="div"
      sourcesTitle={POLICY_PACKS_HELP_FOLLOW_UPS_TITLE}
      sourcesIntro={POLICY_PACKS_HELP_SOURCES_INTRO}
      sources={POLICY_PACKS_HELP_SOURCES}
      sourcesStyle={EVIDENCE_SOURCES_STYLE.operatorRaised}
      sourcesHeadingId="where-to-go-next"
      sourcesLayout="stacked"
    />
  );
}

export function RepeatReviewLoopHelpEvidenceOrientationStrip(): React.JSX.Element {
  return (
    <EvidenceOrientationClaimAndSourcesStrip
      slug="repeat-review-loop-help"
      claim={REPEAT_REVIEW_LOOP_HELP_CLAIM_DISCIPLINE}
      claimHeading={REPEAT_REVIEW_LOOP_HELP_CLAIM_DISCIPLINE_HEADING}
      claimHeadingId={REPEAT_REVIEW_LOOP_HELP_CLAIM_HEADING_ID}
      claimElement="div"
      sourcesTitle={REPEAT_REVIEW_LOOP_HELP_FOLLOW_UPS_TITLE}
      sourcesIntro={REPEAT_REVIEW_LOOP_HELP_SOURCES_INTRO}
      sources={REPEAT_REVIEW_LOOP_HELP_SOURCES}
      sourcesStyle={EVIDENCE_SOURCES_STYLE.operatorRaised}
      sourcesHeadingId="where-to-go-next"
      sourcesLayout="stacked"
    />
  );
}

export function ReportProblemHelpEvidenceOrientationStrip(): React.JSX.Element {
  return (
    <EvidenceOrientationClaimAndSourcesStrip
      slug="report-a-problem-help"
      claim={REPORT_A_PROBLEM_HELP_CLAIM_DISCIPLINE}
      claimHeading={REPORT_A_PROBLEM_HELP_CLAIM_DISCIPLINE_HEADING}
      claimHeadingId={REPORT_A_PROBLEM_HELP_CLAIM_HEADING_ID}
      claimElement="div"
      sourcesTitle={REPORT_A_PROBLEM_HELP_FOLLOW_UPS_TITLE}
      sourcesIntro={REPORT_A_PROBLEM_HELP_SOURCES_INTRO}
      sources={REPORT_A_PROBLEM_HELP_SOURCES}
      sourcesStyle={EVIDENCE_SOURCES_STYLE.operatorRaised}
      sourcesHeadingId="where-to-go-next"
      sourcesLayout="stacked"
    />
  );
}

export function SecurityTrustHelpEvidenceOrientationStrip(): React.JSX.Element {
  return (
    <EvidenceOrientationClaimAndSourcesStrip
      slug="security-trust-help"
      claim={SECURITY_TRUST_HELP_CLAIM_DISCIPLINE}
      claimHeading={SECURITY_TRUST_HELP_CLAIM_DISCIPLINE_HEADING}
      claimHeadingId={SECURITY_TRUST_HELP_CLAIM_HEADING_ID}
      claimElement="div"
      sourcesTitle={SECURITY_TRUST_HELP_FOLLOW_UPS_TITLE}
      sourcesIntro={SECURITY_TRUST_HELP_SOURCES_INTRO}
      sources={SECURITY_TRUST_HELP_SOURCES}
      sourcesStyle={EVIDENCE_SOURCES_STYLE.operatorRaised}
      sourcesHeadingId="where-to-go-next"
      sourcesLayout="stacked"
    />
  );
}

export function SubprocessorsHelpEvidenceOrientationStrip(): React.JSX.Element {
  return (
    <EvidenceOrientationClaimAndSourcesStrip
      slug="subprocessors-help"
      claim={SUBPROCESSORS_HELP_CLAIM_DISCIPLINE}
      claimHeading={SUBPROCESSORS_HELP_CLAIM_DISCIPLINE_HEADING}
      claimHeadingId={SUBPROCESSORS_HELP_CLAIM_HEADING_ID}
      claimElement="div"
      sourcesTitle={SUBPROCESSORS_HELP_FOLLOW_UPS_TITLE}
      sourcesIntro={SUBPROCESSORS_HELP_SOURCES_INTRO}
      sources={SUBPROCESSORS_HELP_SOURCES}
      sourcesStyle={EVIDENCE_SOURCES_STYLE.operatorRaised}
      sourcesHeadingId="where-to-go-next"
      sourcesLayout="stacked"
    />
  );
}

export function TeamsIntegrationEvidenceOrientationStrip(): React.JSX.Element {
  return (
    <EvidenceOrientationClaimAndSourcesStrip
      slug="teams-integration"
      claimElement="div"
      sourcesTitle={TEAMS_INTEGRATION_FOLLOW_UPS_TITLE}
      sourcesIntro={TEAMS_INTEGRATION_SOURCES_INTRO}
      sources={TEAMS_INTEGRATION_SOURCES}
      sourcesStyle={EVIDENCE_SOURCES_STYLE.operatorRaised}
      sourcesHeadingId="where-to-go-next"
      sourcesLayout="stacked"
    />
  );
}

export function EvidenceGraphHelpEvidenceOrientationStrip(): React.JSX.Element {
  return (
    <EvidenceOrientationClaimAndSourcesStrip
      slug="help-evidence-graph"
      claim={EVIDENCE_GRAPH_HELP_CLAIM_DISCIPLINE}
      claimHeading={EVIDENCE_GRAPH_HELP_CLAIM_DISCIPLINE_HEADING}
      claimHeadingId={EVIDENCE_GRAPH_HELP_CLAIM_HEADING_ID}
      claimElement="div"
      sourcesTitle={EVIDENCE_GRAPH_HELP_FOLLOW_UPS_TITLE}
      sourcesIntro={EVIDENCE_GRAPH_HELP_SOURCES_INTRO}
      sources={EVIDENCE_GRAPH_HELP_SOURCES}
      sourcesStyle={EVIDENCE_SOURCES_STYLE.operatorRaised}
      sourcesHeadingId="where-to-go-next"
      sourcesLayout="stacked"
      readingBodyClassName={HELP_PAGE_LAYOUT.readingBody}
    />
  );
}

export function SearchReviewEvidenceHelpEvidenceOrientationStrip(): React.JSX.Element {
  return (
    <EvidenceOrientationClaimAndSourcesStrip
      slug="help-search-review-evidence"
      claim={SEARCH_REVIEW_EVIDENCE_HELP_CLAIM_DISCIPLINE}
      claimHeading={SEARCH_REVIEW_EVIDENCE_HELP_CLAIM_DISCIPLINE_HEADING}
      claimHeadingId={SEARCH_REVIEW_EVIDENCE_HELP_CLAIM_HEADING_ID}
      claimElement="div"
      sourcesTitle={SEARCH_REVIEW_EVIDENCE_HELP_FOLLOW_UPS_TITLE}
      sourcesIntro={SEARCH_REVIEW_EVIDENCE_HELP_SOURCES_INTRO}
      sources={SEARCH_REVIEW_EVIDENCE_HELP_SOURCES}
      sourcesStyle={EVIDENCE_SOURCES_STYLE.operatorRaised}
      sourcesHeadingId="where-to-go-next"
      sourcesLayout="wrap"
      readingBodyClassName={HELP_PAGE_LAYOUT.readingBody}
    />
  );
}

export function ArchitectureIntelligenceHelpEvidenceOrientationStrip(): React.JSX.Element {
  return (
    <EvidenceOrientationClaimAndSourcesStrip
      slug="help-architecture-intelligence"
      claim={ARCHITECTURE_INTELLIGENCE_HELP_CLAIM_DISCIPLINE}
      claimHeading={ARCHITECTURE_INTELLIGENCE_HELP_CLAIM_DISCIPLINE_HEADING}
      claimHeadingId={ARCHITECTURE_INTELLIGENCE_HELP_CLAIM_HEADING_ID}
      claimElement="div"
      sourcesTitle={ARCHITECTURE_INTELLIGENCE_HELP_FOLLOW_UPS_TITLE}
      sourcesIntro={ARCHITECTURE_INTELLIGENCE_HELP_SOURCES_INTRO}
      sources={ARCHITECTURE_INTELLIGENCE_HELP_SOURCES}
      sourcesStyle={EVIDENCE_SOURCES_STYLE.operatorRaised}
      sourcesHeadingId="where-to-go-next"
      sourcesLayout="stacked"
    />
  );
}

export type SponsorDashboardHelpEvidenceOrientationStripProps = {
  readonly readingBodyClassName?: string;
};

export function SponsorDashboardHelpEvidenceOrientationStrip(
  props: SponsorDashboardHelpEvidenceOrientationStripProps = {},
): React.JSX.Element {
  return (
    <EvidenceOrientationClaimAndSourcesStrip
      slug="help-sponsor-dashboard"
      claim={SPONSOR_DASHBOARD_HELP_CLAIM_DISCIPLINE}
      claimHeading={SPONSOR_DASHBOARD_HELP_CLAIM_DISCIPLINE_HEADING}
      claimHeadingId={SPONSOR_DASHBOARD_HELP_CLAIM_HEADING_ID}
      claimElement="div"
      sourcesTitle={SPONSOR_DASHBOARD_HELP_FOLLOW_UPS_TITLE}
      sourcesIntro={SPONSOR_DASHBOARD_HELP_SOURCES_INTRO}
      sources={SPONSOR_DASHBOARD_HELP_SOURCES}
      sourcesStyle={EVIDENCE_SOURCES_STYLE.operatorRaised}
      sourcesHeadingId="where-to-go-next"
      sourcesLayout="stacked"
      readingBodyClassName={props.readingBodyClassName ?? HELP_PAGE_LAYOUT.readingBody}
    />
  );
}

export function ArchitectureDraftsHelpEvidenceOrientationStrip(): React.JSX.Element {
  return (
    <EvidenceOrientationClaimAndSourcesStrip
      slug="help-architecture-drafts"
      claim={ARCHITECTURE_DRAFTS_HELP_CLAIM_DISCIPLINE}
      claimHeading={ARCHITECTURE_DRAFTS_HELP_CLAIM_DISCIPLINE_HEADING}
      claimHeadingId={ARCHITECTURE_DRAFTS_HELP_CLAIM_HEADING_ID}
      claimElement="div"
      sourcesTitle={ARCHITECTURE_DRAFTS_HELP_FOLLOW_UPS_TITLE}
      sourcesIntro={ARCHITECTURE_DRAFTS_HELP_SOURCES_INTRO}
      sources={ARCHITECTURE_DRAFTS_HELP_SOURCES}
      sourcesStyle={EVIDENCE_SOURCES_STYLE.operatorRaised}
      sourcesHeadingId="where-to-go-next"
    />
  );
}

export type ModelGovernanceHelpEvidenceOrientationStripProps = {
  readonly readingBodyClassName?: string;
};

export function ModelGovernanceHelpEvidenceOrientationStrip(
  props: ModelGovernanceHelpEvidenceOrientationStripProps = {},
): React.JSX.Element {
  return (
    <EvidenceOrientationClaimAndSourcesStrip
      slug="help-model-governance"
      claim={MODEL_GOVERNANCE_HELP_CLAIM_DISCIPLINE}
      claimHeading={MODEL_GOVERNANCE_HELP_CLAIM_DISCIPLINE_HEADING}
      claimHeadingId={MODEL_GOVERNANCE_HELP_CLAIM_HEADING_ID}
      claimElement="div"
      sourcesTitle={MODEL_GOVERNANCE_HELP_FOLLOW_UPS_TITLE}
      sourcesIntro={MODEL_GOVERNANCE_HELP_SOURCES_INTRO}
      sources={MODEL_GOVERNANCE_HELP_SOURCES}
      sourcesStyle={EVIDENCE_SOURCES_STYLE.operatorRaised}
      sourcesHeadingId="where-to-go-next"
      sourcesLayout="stacked"
      readingBodyClassName={props.readingBodyClassName ?? HELP_PAGE_LAYOUT.readingBody}
    />
  );
}

export function AzureBoardsIntegrationEvidenceOrientationStrip(): React.JSX.Element {
  return (
    <EvidenceOrientationClaimAndSourcesStrip
      slug="azure-boards-integration"
      claimElement="div"
      sourcesTitle={AZURE_BOARDS_INTEGRATION_FOLLOW_UPS_TITLE}
      sourcesIntro={AZURE_BOARDS_INTEGRATION_SOURCES_INTRO}
      sources={AZURE_BOARDS_INTEGRATION_SOURCES}
      sourcesStyle={EVIDENCE_SOURCES_STYLE.operatorRaised}
      sourcesHeadingId="where-to-go-next"
      sourcesLayout="stacked"
    />
  );
}

export function CloudConnectionsEvidenceOrientationStrip(): React.JSX.Element {
  return (
    <EvidenceOrientationClaimAndSourcesStrip
      slug="cloud-connections"
      claimElement="div"
      sourcesTitle={CLOUD_CONNECTIONS_FOLLOW_UPS_TITLE}
      sourcesIntro={CLOUD_CONNECTIONS_SOURCES_INTRO}
      sources={CLOUD_CONNECTIONS_SOURCES}
      sourcesStyle={EVIDENCE_SOURCES_STYLE.operatorRaised}
      sourcesHeadingId="where-to-go-next"
      sourcesLayout="stacked"
    />
  );
}

export type JiraIntegrationHelpEvidenceOrientationStripProps = {
  readonly readingBodyClassName?: string;
};

export function JiraIntegrationHelpEvidenceOrientationStrip(
  props: JiraIntegrationHelpEvidenceOrientationStripProps = {},
): React.JSX.Element {
  return (
    <EvidenceOrientationClaimAndSourcesStrip
      slug="help-jira-integration"
      claim={JIRA_INTEGRATION_HELP_CLAIM_DISCIPLINE}
      claimHeading={JIRA_INTEGRATION_HELP_CLAIM_DISCIPLINE_HEADING}
      claimHeadingId={JIRA_INTEGRATION_HELP_CLAIM_HEADING_ID}
      claimElement="div"
      sourcesTitle={JIRA_INTEGRATION_HELP_FOLLOW_UPS_TITLE}
      sourcesIntro={JIRA_INTEGRATION_HELP_SOURCES_INTRO}
      sources={JIRA_INTEGRATION_HELP_SOURCES}
      sourcesStyle={EVIDENCE_SOURCES_STYLE.operatorRaised}
      sourcesHeadingId="where-to-go-next"
      sourcesLayout="stacked"
      readingBodyClassName={props.readingBodyClassName ?? HELP_PAGE_LAYOUT.readingBody}
    />
  );
}

export function JiraIntegrationEvidenceOrientationStrip(): React.JSX.Element {
  return (
    <EvidenceOrientationClaimAndSourcesStrip
      slug="jira-integration"
      claimElement="div"
      sourcesTitle={JIRA_INTEGRATION_FOLLOW_UPS_TITLE}
      sourcesIntro={JIRA_INTEGRATION_SOURCES_INTRO}
      sources={JIRA_INTEGRATION_SOURCES}
      sourcesStyle={EVIDENCE_SOURCES_STYLE.operatorRaised}
      sourcesHeadingId="where-to-go-next"
      sourcesLayout="stacked"
    />
  );
}

export function ServiceNowIntegrationEvidenceOrientationStrip(): React.JSX.Element {
  return (
    <EvidenceOrientationClaimAndSourcesStrip
      slug="servicenow-integration"
      claimElement="div"
      sourcesTitle={SERVICENOW_INTEGRATION_FOLLOW_UPS_TITLE}
      sourcesIntro={SERVICENOW_INTEGRATION_SOURCES_INTRO}
      sources={SERVICENOW_INTEGRATION_SOURCES}
      sourcesStyle={EVIDENCE_SOURCES_STYLE.operatorRaised}
      sourcesHeadingId="where-to-go-next"
      sourcesLayout="stacked"
    />
  );
}

export type ServiceNowIntegrationHelpEvidenceOrientationStripProps = {
  readonly readingBodyClassName?: string;
};

export function ServiceNowIntegrationHelpEvidenceOrientationStrip(
  props: ServiceNowIntegrationHelpEvidenceOrientationStripProps = {},
): React.JSX.Element {
  return (
    <EvidenceOrientationClaimAndSourcesStrip
      slug="help-servicenow-integration"
      claim={SERVICENOW_INTEGRATION_HELP_CLAIM_DISCIPLINE}
      claimHeading={SERVICENOW_INTEGRATION_HELP_CLAIM_DISCIPLINE_HEADING}
      claimHeadingId={SERVICENOW_INTEGRATION_HELP_CLAIM_HEADING_ID}
      claimStyle={EVIDENCE_CLAIM_STYLE.operatorInlineNote}
      claimElement="div"
      sourcesTitle={SERVICENOW_INTEGRATION_HELP_FOLLOW_UPS_TITLE}
      sourcesIntro={SERVICENOW_INTEGRATION_HELP_SOURCES_INTRO}
      sources={SERVICENOW_INTEGRATION_HELP_SOURCES}
      sourcesStyle={EVIDENCE_SOURCES_STYLE.operatorRaised}
      sourcesHeadingId="where-to-go-next"
      sourcesLayout="stacked"
      readingBodyClassName={props.readingBodyClassName ?? HELP_PAGE_LAYOUT.readingBody}
    />
  );
}

export function ItsmOAuthCallbackEvidenceOrientationStrip(): React.JSX.Element {
  return (
    <EvidenceOrientationClaimAndSourcesStrip
      slug="itsm-oauth-callback"
      claimElement="div"
      sourcesTitle={ITSM_OAUTH_CALLBACK_FOLLOW_UPS_TITLE}
      sourcesIntro={ITSM_OAUTH_CALLBACK_SOURCES_INTRO}
      sources={ITSM_OAUTH_CALLBACK_SOURCES}
      sourcesStyle={EVIDENCE_SOURCES_STYLE.operatorRaised}
      sourcesHeadingId="where-to-go-next"
      sourcesLayout="stacked"
    />
  );
}

export type DecisionRegisterHelpEvidenceOrientationStripProps = {
  readonly readingBodyClassName?: string;
};

export function DecisionRegisterHelpEvidenceOrientationStrip(
  props: DecisionRegisterHelpEvidenceOrientationStripProps = {},
): React.JSX.Element {
  return (
    <EvidenceOrientationClaimAndSourcesStrip
      slug="help-decision-register"
      claim={DECISION_REGISTER_HELP_CLAIM_DISCIPLINE}
      claimHeading={DECISION_REGISTER_HELP_CLAIM_DISCIPLINE_HEADING}
      claimHeadingId={DECISION_REGISTER_HELP_CLAIM_HEADING_ID}
      claimElement="div"
      sourcesTitle={DECISION_REGISTER_HELP_FOLLOW_UPS_TITLE}
      sourcesIntro={DECISION_REGISTER_HELP_SOURCES_INTRO}
      sources={DECISION_REGISTER_HELP_SOURCES}
      sourcesStyle={EVIDENCE_SOURCES_STYLE.operatorRaised}
      sourcesHeadingId="where-to-go-next"
      sourcesLayout="stacked"
      readingBodyClassName={props.readingBodyClassName ?? HELP_PAGE_LAYOUT.readingBody}
    />
  );
}

export type ImprovementPlanningHelpEvidenceOrientationStripProps = {
  readonly readingBodyClassName?: string;
};

export function ImprovementPlanningHelpEvidenceOrientationStrip(
  props: ImprovementPlanningHelpEvidenceOrientationStripProps = {},
): React.JSX.Element {
  return (
    <EvidenceOrientationClaimAndSourcesStrip
      slug="help-improvement-planning"
      claim={IMPROVEMENT_PLANNING_HELP_CLAIM_DISCIPLINE}
      claimHeading={IMPROVEMENT_PLANNING_HELP_CLAIM_DISCIPLINE_HEADING}
      claimHeadingId={IMPROVEMENT_PLANNING_HELP_CLAIM_HEADING_ID}
      claimElement="div"
      sourcesTitle={IMPROVEMENT_PLANNING_HELP_FOLLOW_UPS_TITLE}
      sourcesIntro={IMPROVEMENT_PLANNING_HELP_SOURCES_INTRO}
      sources={IMPROVEMENT_PLANNING_HELP_SOURCES}
      sourcesStyle={EVIDENCE_SOURCES_STYLE.operatorRaised}
      sourcesHeadingId="where-to-go-next"
      sourcesLayout="stacked"
      readingBodyClassName={props.readingBodyClassName ?? HELP_PAGE_LAYOUT.readingBody}
    />
  );
}

export type ImpactPreviewHelpEvidenceOrientationStripProps = {
  readonly readingBodyClassName?: string;
};

export function ImpactPreviewHelpEvidenceOrientationStrip(
  props: ImpactPreviewHelpEvidenceOrientationStripProps = {},
): React.JSX.Element {
  return (
    <EvidenceOrientationClaimAndSourcesStrip
      slug="help-impact-preview"
      claim={IMPACT_PREVIEW_HELP_CLAIM_DISCIPLINE}
      claimHeading={IMPACT_PREVIEW_HELP_CLAIM_DISCIPLINE_HEADING}
      claimHeadingId={IMPACT_PREVIEW_HELP_CLAIM_HEADING_ID}
      claimElement="div"
      sourcesTitle={IMPACT_PREVIEW_HELP_FOLLOW_UPS_TITLE}
      sourcesIntro={IMPACT_PREVIEW_HELP_SOURCES_INTRO}
      sources={IMPACT_PREVIEW_HELP_SOURCES}
      sourcesStyle={EVIDENCE_SOURCES_STYLE.operatorRaised}
      sourcesHeadingId="where-to-go-next"
      sourcesLayout="stacked"
      readingBodyClassName={props.readingBodyClassName ?? HELP_PAGE_LAYOUT.readingBody}
    />
  );
}

export function AdvisoryScansHelpEvidenceOrientationStrip(): React.JSX.Element {
  return (
    <EvidenceOrientationClaimAndSourcesStrip
      slug="help-advisory-scans"
      claim={ADVISORY_SCANS_HELP_CLAIM_DISCIPLINE}
      claimHeading={ADVISORY_SCANS_HELP_CLAIM_DISCIPLINE_HEADING}
      claimHeadingId={ADVISORY_SCANS_HELP_CLAIM_HEADING_ID}
      claimElement="div"
      sourcesTitle={ADVISORY_SCANS_HELP_FOLLOW_UPS_TITLE}
      sourcesIntro={ADVISORY_SCANS_HELP_SOURCES_INTRO}
      sources={ADVISORY_SCANS_HELP_SOURCES}
      sourcesStyle={EVIDENCE_SOURCES_STYLE.operatorNeutral}
      sourcesHeadingId="where-to-go-next"
      sourcesLayout="stacked"
      readingBodyClassName={HELP_PAGE_LAYOUT.readingBody}
    />
  );
}
