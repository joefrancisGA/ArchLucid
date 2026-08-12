import {
  BILLING_CHECKOUT_COMPLETED_SUCCESS_MESSAGE,
  BILLING_CHECKOUT_NOT_CONFIGURED_MESSAGE,
  BILLING_CHECKOUT_REQUEST_ACCEPTED_MESSAGE,
  CLOUD_CONNECTION_SAVE_SUCCESS_MESSAGE,
  SAML_CONFIGURATION_SAVED_SUCCESS_MESSAGE,
  SCIM_TOKEN_CREATED_SUCCESS_MESSAGE,
  SCIM_TOKEN_REVOKED_SUCCESS_MESSAGE,
  SLACK_INTEGRATION_DISABLE_SUCCESS_MESSAGE,
  SLACK_INTEGRATION_ENABLE_SUCCESS_MESSAGE,
  SLACK_INTEGRATION_SAVE_SUCCESS_MESSAGE,
  SSO_WIZARD_ACTIVATE_SUCCESS_MESSAGE,
  SSO_WIZARD_METADATA_RETRIEVED_SUCCESS_MESSAGE,
  SSO_WIZARD_TEST_LOGIN_SUCCESS_MESSAGE,
  TEAMS_INTEGRATION_REMOVE_SUCCESS_MESSAGE,
  TEAMS_INTEGRATION_SAVE_SUCCESS_MESSAGE,
  WEBHOOK_SUBSCRIPTION_SAVE_SUCCESS_MESSAGE,
} from "@/lib/admin-integration-mutation-outcome-copy";
import {
  GOVERNANCE_QUICK_APPROVE_SUCCESS_MESSAGE,
  GOVERNANCE_WORKFLOW_APPROVAL_SUBMITTED_SUCCESS,
  GOVERNANCE_WORKFLOW_REQUEST_APPROVED_SUCCESS,
  GOVERNANCE_WORKFLOW_REQUEST_REJECTED_SUCCESS,
} from "@/lib/governance-mutation-outcome-copy";
import {
  REVIEW_CREATED_ANALYSIS_IN_PROGRESS_MESSAGE,
  REVIEW_CREATED_SUCCESS_MESSAGE,
} from "@/components/review-intake/ReviewGenerationCreatedNotice";
import { REVIEW_START_CREATED_CONFIRMATION } from "@/lib/review-start-progress-copy";

/** Success copy that must not be toast-only on operator high-stakes mutation paths (TB-2112–TB-2116). */
export const DURABLE_MUTATION_FORBIDDEN_TOAST_SUCCESS_PHRASES: readonly string[] = [
  GOVERNANCE_QUICK_APPROVE_SUCCESS_MESSAGE,
  GOVERNANCE_WORKFLOW_APPROVAL_SUBMITTED_SUCCESS,
  GOVERNANCE_WORKFLOW_REQUEST_APPROVED_SUCCESS,
  GOVERNANCE_WORKFLOW_REQUEST_REJECTED_SUCCESS,
  "Marked ",
  "finding(s) as ",
  "Policy pack version ",
  "Policy pack version published.",
  CLOUD_CONNECTION_SAVE_SUCCESS_MESSAGE,
  WEBHOOK_SUBSCRIPTION_SAVE_SUCCESS_MESSAGE,
  SLACK_INTEGRATION_SAVE_SUCCESS_MESSAGE,
  SLACK_INTEGRATION_ENABLE_SUCCESS_MESSAGE,
  SLACK_INTEGRATION_DISABLE_SUCCESS_MESSAGE,
  TEAMS_INTEGRATION_SAVE_SUCCESS_MESSAGE,
  TEAMS_INTEGRATION_REMOVE_SUCCESS_MESSAGE,
  SSO_WIZARD_METADATA_RETRIEVED_SUCCESS_MESSAGE,
  SSO_WIZARD_TEST_LOGIN_SUCCESS_MESSAGE,
  SSO_WIZARD_ACTIVATE_SUCCESS_MESSAGE,
  SAML_CONFIGURATION_SAVED_SUCCESS_MESSAGE,
  SCIM_TOKEN_CREATED_SUCCESS_MESSAGE,
  SCIM_TOKEN_REVOKED_SUCCESS_MESSAGE,
  BILLING_CHECKOUT_COMPLETED_SUCCESS_MESSAGE,
  BILLING_CHECKOUT_NOT_CONFIGURED_MESSAGE,
  BILLING_CHECKOUT_REQUEST_ACCEPTED_MESSAGE,
  REVIEW_CREATED_SUCCESS_MESSAGE,
  REVIEW_CREATED_ANALYSIS_IN_PROGRESS_MESSAGE,
  REVIEW_START_CREATED_CONFIRMATION,
];

/**
 * Surfaces still on toast-only billing checkout until a follow-up row converts them.
 * Guard skips `showSuccess` in these files so TB-2116 can land without reopening TB-2115 scope.
 */
export const DURABLE_MUTATION_TEMPORARY_TOAST_DEBT_PATHS: readonly string[] = [
  "components/TrialBanner.tsx",
  "components/TrialLimitModal.tsx",
  "app/(operator)/architecture/reviews/[runId]/_sections/PilotConversionCta.tsx",
];

/**
 * Operator surfaces converted in TB-2113–TB-2115 that must keep durable in-page siblings.
 * Guard scans these for `OperatorSuccessCallout` / `ReviewGenerationCreatedNotice` usage.
 */
export const DURABLE_MUTATION_GUARDED_SURFACE_PATHS: readonly string[] = [
  "app/(operator)/integrations/cloud-connections/_sections/Tier2ConnectionWizard.tsx",
  "app/(operator)/administration/identity/sso-wizard/_sections/SsoWizardPageClient.tsx",
  "app/(operator)/administration/identity-providers/_sections/SamlSpConfigurationForm.tsx",
  "app/(operator)/administration/scim-provisioning/_sections/ScimProvisioningSettingsPageClient.tsx",
  "app/(operator)/integrations/webhooks/WebhooksSettingsClient.tsx",
  "app/(operator)/integrations/slack/_sections/SlackIntegrationPageClient.tsx",
  "app/(operator)/integrations/teams/_sections/TeamsNotificationsIntegrationPageView.tsx",
  "app/(operator)/administration/billing/OperatorBillingPlansClient.tsx",
  "components/GovernanceQuickApproveButton.tsx",
  "components/governance/findings/GovernanceFindingsList.tsx",
  "components/usability/GovernanceFindingsBulkActions.tsx",
  "app/(operator)/governance/_sections/GovernanceWorkflowPageContent.tsx",
  "app/(operator)/governance/policy-packs/_sections/PolicyPacksPageView.tsx",
  "app/(operator)/architecture/reviews/new/FirstPilotIntakeWizard.tsx",
  "app/(operator)/architecture/reviews/new/QuickReviewWizard.tsx",
  "app/(operator)/architecture/reviews/new/QuickStartWizard.tsx",
  "app/(operator)/architecture/reviews/new/SimplifiedPilotWizard.tsx",
  "components/review-intake/ReviewGenerationCreatedNotice.tsx",
];

/**
 * Paths where `showSuccess` may remain for clipboard / trivial echoes on otherwise guarded flows.
 */
export const DURABLE_MUTATION_TRIVIAL_TOAST_ALLOWLIST: readonly { readonly pathSuffix: string; readonly allowedPhrase: string }[] = [
  {
    pathSuffix: "integrations/cloud-connections/_sections/Tier2ConnectionWizard.tsx",
    allowedPhrase: "Setup script copied.",
  },
  {
    pathSuffix: "lib/webhook-subscription-connection-test.ts",
    allowedPhrase: "Test event delivered",
  },
];

/** Vitest files that assert high-stakes saves do not toast (dual-toast guard inventory). */
export const DURABLE_MUTATION_DUAL_TOAST_TEST_PATHS: readonly string[] = [
  "app/(operator)/integrations/cloud-connections/_sections/Tier2ConnectionWizard.test.tsx",
  "app/(operator)/administration/identity/sso-wizard/page.test.tsx",
  "app/(operator)/administration/identity-providers/_sections/SamlSpConfigurationForm.test.tsx",
  "app/(operator)/administration/scim-provisioning/_sections/ScimProvisioningSettingsPageClient.test.tsx",
  "app/(operator)/integrations/webhooks/page.test.tsx",
  "app/(operator)/integrations/slack/SlackIntegrationPageClient.test.tsx",
  "app/(operator)/integrations/teams/TeamsNotificationsIntegrationPageClient.test.tsx",
  "app/(operator)/administration/billing/page.test.tsx",
  "components/GovernanceQuickApproveButton.test.tsx",
  "components/usability/GovernanceFindingsBulkActions.test.tsx",
  "components/governance/findings/GovernanceFindingsList.bulk-disposition.test.tsx",
  "app/(operator)/governance/policy-packs/_sections/PolicyPacksPageView.tabs.test.tsx",
  "app/(operator)/architecture/reviews/new/FirstPilotIntakeWizard.test.tsx",
  "app/(operator)/architecture/reviews/new/QuickReviewWizard.test.tsx",
  "app/(operator)/architecture/reviews/new/QuickStartWizard.test.tsx",
  "app/(operator)/architecture/reviews/new/SimplifiedPilotWizard.test.tsx",
  "components/operator/OperatorSuccessCallout.test.tsx",
  "components/review-intake/ReviewGenerationCreatedNotice.test.tsx",
  "lib/durable-action-outcome-guard.test.ts",
  "lib/tb2116-durable-mutation-outcome-guard.test.ts",
];
