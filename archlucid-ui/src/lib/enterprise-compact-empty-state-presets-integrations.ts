import type { EnterpriseCompactEmptyStateProps } from "@/components/EnterpriseCompactEmptyState";
import {
  BUYER_START_ARCHITECTURE_REVIEW_CTA,
  OPERATOR_HOME_WORKSPACE_ARCHIVED_EMPTY_BODY,
  OPERATOR_HOME_WORKSPACE_ARCHIVED_EMPTY_TITLE,
  OPERATOR_HOME_WORKSPACE_EMPTY_BODY,
  OPERATOR_HOME_WORKSPACE_EMPTY_TITLE,
} from "@/lib/buyer/buyer-polish-copy";
import {
  AZURE_REFERENCE_SAMPLE_REVIEW_CTA_LABEL,
} from "@/lib/empty-state-presets";
import { GOVERNANCE_APPROVAL_QUEUE_PATH, GOVERNANCE_FINDINGS_PATH, governanceAlertRulesTabHref } from "@/lib/governance/governance-route-paths";
import {
  ALERT_RULES_LIST_EMPTY_BODY,
} from "@/lib/alert-rule-conditions-copy";
import {
  COMPOSITE_RULES_LIST_EMPTY_BODY,
  COMPOSITE_RULES_NOUN,
} from "@/lib/enterprise-controls-context-copy";
import {
  ADVISORY_SCANS_SCHEDULES_EMPTY_BODY,
  ADVISORY_SCANS_SCHEDULES_NO_FINALIZED_REVIEWS_BODY,
  ADVISORY_SCANS_SCHEDULES_NO_FINALIZED_REVIEWS_TITLE,
} from "@/lib/advisory-copy";
import {
  ALERTS_ACTION_OPEN_GOVERNANCE_SETUP_GUIDE,
  ALERTS_ACTION_OPEN_GOVERNANCE_SETUP_GUIDE_HREF,
  ALERTS_ACTION_OPEN_GOVERNANCE_WORKFLOW,
  ALERTS_ACTION_OPEN_GOVERNANCE_WORKFLOW_HREF,
  ALERTS_ACTION_OPEN_REVIEW_PACKAGES,
  ALERTS_ACTION_OPEN_REVIEW_PACKAGES_HREF,
  ALERTS_ACTION_START_ARCHITECTURE_REVIEW,
  ALERTS_ACTION_START_ARCHITECTURE_REVIEW_HREF,
  ALERTS_CONFIGURE_RULES_LINK_LABEL,
  ALERTS_EMPTY_FILTERED_BODY,
  ALERTS_EMPTY_FILTERED_TITLE,
  ALERTS_EMPTY_HEALTHY_BODY,
  ALERTS_EMPTY_HEALTHY_TITLE,
  ALERTS_EMPTY_NO_REVIEWS_BODY,
  ALERTS_EMPTY_NO_REVIEWS_TITLE,
  ALERTS_EMPTY_NO_RULES_BODY,
  ALERTS_EMPTY_NO_RULES_TITLE,
} from "@/lib/alerts-page-copy";
import {
  STANDARDS_RULES_EMPTY_BODY,
  STANDARDS_RULES_EMPTY_HEADING,
} from "@/lib/standards-rules-page";
import { SHOWCASE_STATIC_DEMO_RUN_ID } from "@/lib/showcase-static-demo";
import { buildInsightsFinalizedReviewPrerequisiteEmpty } from "@/lib/insights-finalized-review-prerequisite-empty";
import {
  buildOperatorFilteredEmptyCompact,
  buildOperatorHubZoneEmptyCompact,
  buildOperatorPermissionEmptyCompact,
  buildOperatorPrerequisiteEmptyCompact,
} from "@/lib/operator/operator-empty-state-kind-presets";
import {
  ACCOUNT_SECURITY_AUTH_GATE_MESSAGE,
  ACCOUNT_SECURITY_DEMO_GATE_MESSAGE,
} from "@/lib/account-security-page-copy";
import { buildAuthSignInHref } from "@/lib/navigation/auth-sign-in-href";
import {
  API_KEYS_FORBIDDEN_EMPTY_BODY,
  API_KEYS_SURFACE_DISABLED_DESCRIPTION,
} from "@/lib/api-keys-settings-copy";
import { OPERATOR_NAV_LINK_LABELS } from "@/lib/i18n";
import {
  REVIEW_SCORECARD_EMPTY_DESCRIPTION,
  REVIEW_SCORECARD_EMPTY_HEADING,
  REVIEW_SCORECARD_EMPTY_PRIMARY_CTA,
  REVIEW_SCORECARD_EMPTY_PRIMARY_HREF,
  REVIEW_SCORECARD_EMPTY_SECONDARY_CTA,
  REVIEW_SCORECARD_EMPTY_SECONDARY_HREF,
  REVIEW_SCORECARD_EMPTY_TERTIARY_CTA,
  buildReviewScorecardSampleHref,
} from "@/lib/review-scorecard-empty-state";
import { PILOT_FEEDBACK_VOCABULARY } from "@/lib/vocabulary/buyer-surface-vocabulary";
import {
  INTEGRATION_EVENTS_DLQ_EMPTY_DESCRIPTION,
  INTEGRATION_EVENTS_DLQ_EMPTY_TITLE,
} from "@/lib/integration-events-dlq-page-copy";
import { WEBHOOKS_EMPTY_BODY, WEBHOOKS_EMPTY_TITLE } from "@/lib/webhooks-page-copy";
import { ACCOUNT_SECURITY_PATH } from "@/lib/account-route-paths";
import { SETTINGS_ROOT_PATH } from "@/lib/settings-admin-route-paths";
import { API_KEYS_USERS_USERS_LINK } from "@/lib/vocabulary/api-keys-users-vocabulary";

/** Webhook subscriptions list when the tenant has no subscriptions yet. */
export const WEBHOOKS_SUBSCRIPTIONS_EMPTY_COMPACT: EnterpriseCompactEmptyStateProps = {
  testId: "webhooks-empty-state",
  title: WEBHOOKS_EMPTY_TITLE,
  description: WEBHOOKS_EMPTY_BODY,
};

/** Internal ops DLQ when no failed integration messages exist. */
export const INTEGRATION_EVENTS_DLQ_EMPTY_COMPACT: EnterpriseCompactEmptyStateProps = {
  testId: "integration-events-dlq-empty-state",
  title: INTEGRATION_EVENTS_DLQ_EMPTY_TITLE,
  description: INTEGRATION_EVENTS_DLQ_EMPTY_DESCRIPTION,
};

/** Internal ops DLQ when filters hide every row. */
export const INTEGRATION_EVENTS_DLQ_FILTER_EMPTY_COMPACT: EnterpriseCompactEmptyStateProps = {
  testId: "integration-events-dlq-filter-empty-state",
  title: "No rows match these filters",
  description: "Clear filters or broaden the tenant substring to review failed messages again.",
};

/** SCIM token list when no inbound provisioning tokens exist yet. */
export const SCIM_NO_TOKENS_EMPTY_COMPACT: EnterpriseCompactEmptyStateProps = {
  testId: "scim-no-tokens-empty-state",
  title: "No active SCIM tokens",
  description: "Create a token above to begin configuring automated user and group provisioning.",
};

/** Identity provider catalog when hosting configuration has not produced rows yet. */
export const IDENTITY_PROVIDERS_CATALOG_EMPTY_COMPACT: EnterpriseCompactEmptyStateProps = {
  testId: "identity-providers-catalog-empty-state",
  title: "No identity provider catalog rows yet",
  description:
    "OIDC and SAML settings are configured in your hosting environment. Use the SSO wizard for guided tenant setup; this read-only table populates when values are present.",
  actions: [
    { label: "Open SSO wizard", href: "/administration/identity/sso-wizard", variant: "primary" },
    { label: "SCIM provisioning", href: "/administration/scim-provisioning", variant: "outline" },
  ],
};
