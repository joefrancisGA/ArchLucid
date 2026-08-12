/**
 * TB-2116 — inventory for durable action outcome Vitest / CI guards.
 * Documents guarded mutation surfaces (TB-2113–TB-2115) vs trivial toast-only echoes.
 */

import {
  BILLING_CHECKOUT_COMPLETED_SUCCESS_MESSAGE,
  CLOUD_CONNECTION_SAVE_SUCCESS_MESSAGE,
  SAML_CONFIGURATION_SAVED_SUCCESS_MESSAGE,
  SCIM_TOKEN_CREATED_SUCCESS_MESSAGE,
  SCIM_TOKEN_REVOKED_SUCCESS_MESSAGE,
  SLACK_INTEGRATION_DISABLE_SUCCESS_MESSAGE,
  SLACK_INTEGRATION_ENABLE_SUCCESS_MESSAGE,
  SLACK_INTEGRATION_SAVE_SUCCESS_MESSAGE,
  SSO_WIZARD_ACTIVATE_SUCCESS_MESSAGE,
  TEAMS_INTEGRATION_REMOVE_SUCCESS_MESSAGE,
  TEAMS_INTEGRATION_SAVE_SUCCESS_MESSAGE,
  WEBHOOK_SUBSCRIPTION_SAVE_SUCCESS_MESSAGE,
} from "@/lib/admin-integration-mutation-outcome-copy";
import {
  GOVERNANCE_QUICK_APPROVE_SUCCESS_MESSAGE,
  GOVERNANCE_WORKFLOW_APPROVAL_SUBMITTED_SUCCESS,
  GOVERNANCE_WORKFLOW_REQUEST_APPROVED_SUCCESS,
  GOVERNANCE_WORKFLOW_REQUEST_REJECTED_SUCCESS,
} from "@/lib/governance/governance-mutation-outcome-copy";
import {
  REVIEW_CREATED_ANALYSIS_IN_PROGRESS_MESSAGE,
  REVIEW_CREATED_SUCCESS_MESSAGE,
} from "@/components/review-intake/ReviewGenerationCreatedNotice";
import { REVIEW_START_STEP_VALIDATION_MESSAGE } from "@/lib/review-start-progress-copy";

export type DurableActionOutcomeGuardedSurface = {
  readonly id: string;
  readonly sourceRoots: readonly string[];
  readonly requiredDurableMarkers: readonly string[];
  /**
   * When `showSuccess` / `showError` appear in a guarded root, the line must match
   * at least one pattern (clipboard echoes, template preload, webhook test delivery, …).
   */
  readonly allowedToastLinePatterns?: readonly RegExp[];
};

/** High-stakes acceptance copy that must never be toast-only on the golden path. */
export const DURABLE_ACTION_OUTCOME_HIGH_STAKES_MESSAGES: readonly string[] = [
  CLOUD_CONNECTION_SAVE_SUCCESS_MESSAGE,
  WEBHOOK_SUBSCRIPTION_SAVE_SUCCESS_MESSAGE,
  SLACK_INTEGRATION_SAVE_SUCCESS_MESSAGE,
  SLACK_INTEGRATION_ENABLE_SUCCESS_MESSAGE,
  SLACK_INTEGRATION_DISABLE_SUCCESS_MESSAGE,
  TEAMS_INTEGRATION_SAVE_SUCCESS_MESSAGE,
  TEAMS_INTEGRATION_REMOVE_SUCCESS_MESSAGE,
  SSO_WIZARD_ACTIVATE_SUCCESS_MESSAGE,
  SAML_CONFIGURATION_SAVED_SUCCESS_MESSAGE,
  SCIM_TOKEN_CREATED_SUCCESS_MESSAGE,
  SCIM_TOKEN_REVOKED_SUCCESS_MESSAGE,
  BILLING_CHECKOUT_COMPLETED_SUCCESS_MESSAGE,
  GOVERNANCE_QUICK_APPROVE_SUCCESS_MESSAGE,
  GOVERNANCE_WORKFLOW_APPROVAL_SUBMITTED_SUCCESS,
  GOVERNANCE_WORKFLOW_REQUEST_APPROVED_SUCCESS,
  GOVERNANCE_WORKFLOW_REQUEST_REJECTED_SUCCESS,
  REVIEW_CREATED_SUCCESS_MESSAGE,
  REVIEW_CREATED_ANALYSIS_IN_PROGRESS_MESSAGE,
  REVIEW_START_STEP_VALIDATION_MESSAGE,
  "Policy pack version",
  "Marked ",
  "finding(s) as ",
  "Activated ",
  "for ",
];

/** Export names scanned for `showSuccess(…NAME` / `showError(…NAME` misuse. */
export const DURABLE_ACTION_OUTCOME_HIGH_STAKES_COPY_EXPORTS: readonly string[] = [
  "CLOUD_CONNECTION_SAVE_SUCCESS_MESSAGE",
  "WEBHOOK_SUBSCRIPTION_SAVE_SUCCESS_MESSAGE",
  "SLACK_INTEGRATION_SAVE_SUCCESS_MESSAGE",
  "SLACK_INTEGRATION_ENABLE_SUCCESS_MESSAGE",
  "SLACK_INTEGRATION_DISABLE_SUCCESS_MESSAGE",
  "TEAMS_INTEGRATION_SAVE_SUCCESS_MESSAGE",
  "TEAMS_INTEGRATION_REMOVE_SUCCESS_MESSAGE",
  "SSO_WIZARD_ACTIVATE_SUCCESS_MESSAGE",
  "SAML_CONFIGURATION_SAVED_SUCCESS_MESSAGE",
  "SCIM_TOKEN_CREATED_SUCCESS_MESSAGE",
  "SCIM_TOKEN_REVOKED_SUCCESS_MESSAGE",
  "BILLING_CHECKOUT_COMPLETED_SUCCESS_MESSAGE",
  "GOVERNANCE_QUICK_APPROVE_SUCCESS_MESSAGE",
  "GOVERNANCE_WORKFLOW_APPROVAL_SUBMITTED_SUCCESS",
  "GOVERNANCE_WORKFLOW_REQUEST_APPROVED_SUCCESS",
  "GOVERNANCE_WORKFLOW_REQUEST_REJECTED_SUCCESS",
  "policyPackPublishSuccessMessage",
  "governanceBulkDispositionSuccessMessage",
  "governanceWorkflowActivateSuccessMessage",
  "REVIEW_START_CREATED_CONFIRMATION",
  "REVIEW_CREATED_SUCCESS_MESSAGE",
  "REVIEW_CREATED_ANALYSIS_IN_PROGRESS_MESSAGE",
  "REVIEW_START_STEP_VALIDATION_MESSAGE",
  "REVIEW_START_SUBMIT_VALIDATION_MESSAGE",
];

/** Sources where toast is the intentional sole channel (clipboard, webhook test, template preload). */
export const DURABLE_ACTION_OUTCOME_TRIVIAL_TOAST_SOURCE_ROOTS: readonly string[] = [
  "lib/webhook-subscription-connection-test.ts",
  "lib/durable-action-outcome-inventory.ts",
  "lib/durable-action-outcome-guard.ts",
  "lib/durable-mutation-outcome-inventory.ts",
];

export const DURABLE_ACTION_OUTCOME_GLOBAL_ALLOWED_TOAST_LINE_PATTERNS: readonly RegExp[] = [
  /clipboard/i,
  /copied/i,
  /Test event/i,
  /template loaded/i,
  /Cloned catalog/i,
  /Policy validation completed/i,
  /Draft JSON synced/i,
  /Added draft rule/i,
  /Generated pack loaded/i,
  /Guided fields loaded/i,
  /Policy test completed/i,
  /showInfo\(/,
];

export const DURABLE_ACTION_OUTCOME_GUARDED_SURFACES: readonly DurableActionOutcomeGuardedSurface[] = [
  {
    id: "review-start-first-pilot",
    sourceRoots: ["app/(operator)/architecture/reviews/new/FirstPilotIntakeWizard.tsx"],
    requiredDurableMarkers: ["ReviewStartInlineError"],
  },
  {
    id: "review-start-quick-start",
    sourceRoots: [
      "app/(operator)/architecture/reviews/new/QuickStartWizard.tsx",
      "components/wizard/WizardStickyFooter.tsx",
    ],
    requiredDurableMarkers: ["ReviewStartInlineError"],
  },
  {
    id: "review-start-simplified-pilot",
    sourceRoots: [
      "app/(operator)/architecture/reviews/new/SimplifiedPilotWizard.tsx",
      "components/wizard/WizardStickyFooter.tsx",
    ],
    requiredDurableMarkers: ["ReviewStartInlineError"],
  },
  {
    id: "review-generation-created-notice",
    sourceRoots: ["components/review-intake/ReviewGenerationCreatedNotice.tsx"],
    requiredDurableMarkers: ["review-generation-created-notice", "role=\"status\""],
  },
  {
    id: "governance-quick-approve",
    sourceRoots: [
      "components/governance/GovernanceQuickApproveButton.tsx",
      "components/governance/GovernanceQuickApproveDialog.tsx",
    ],
    requiredDurableMarkers: ["OperatorSuccessCallout", "OperatorMutationInlineError"],
  },
  {
    id: "governance-bulk-disposition",
    sourceRoots: [
      "components/usability/GovernanceFindingsBulkActions.tsx",
      "components/governance/findings/GovernanceFindingsList.tsx",
    ],
    requiredDurableMarkers: ["ReversibleMutationSuccessCallout", "OperatorMutationInlineError"],
  },
  {
    id: "governance-workflow",
    sourceRoots: ["app/(operator)/governance/_sections/GovernanceWorkflowPageContent.tsx"],
    requiredDurableMarkers: ["OperatorSuccessCallout", "OperatorMutationInlineError"],
  },
  {
    id: "governance-policy-pack-publish",
    sourceRoots: [
      "app/(operator)/governance/policy-packs/_sections/PolicyPacksPageView.tsx",
      "app/(operator)/governance/policy-packs/_sections/use-policy-packs-page.ts",
    ],
    requiredDurableMarkers: ["OperatorSuccessCallout", "setPublishSuccessMessage"],
    allowedToastLinePatterns: [
      /Cloned catalog pack/i,
      /template loaded into the create form/i,
    ],
  },
  {
    id: "admin-cloud-connection-save",
    sourceRoots: ["app/(operator)/integrations/cloud-connections/_sections/Tier2ConnectionWizard.tsx"],
    requiredDurableMarkers: ["OperatorSuccessCallout", "OperatorMutationInlineError"],
    allowedToastLinePatterns: [
      /Setup script copied/i,
      /Could not write to clipboard/i,
      /Could not copy /i,
    ],
  },
  {
    id: "admin-sso-wizard",
    sourceRoots: ["app/(operator)/administration/identity/sso-wizard/_sections/SsoWizardPageClient.tsx"],
    requiredDurableMarkers: ["OperatorSuccessCallout", "OperatorMutationInlineError"],
  },
  {
    id: "admin-saml-configuration",
    sourceRoots: ["app/(operator)/administration/identity-providers/_sections/SamlSpConfigurationForm.tsx"],
    requiredDurableMarkers: ["OperatorSuccessCallout"],
  },
  {
    id: "admin-scim-provisioning",
    sourceRoots: ["app/(operator)/administration/scim-provisioning/_sections/ScimProvisioningSettingsPageClient.tsx"],
    requiredDurableMarkers: ["OperatorSuccessCallout", "OperatorMutationInlineError"],
  },
  {
    id: "admin-webhook-save",
    sourceRoots: ["app/(operator)/integrations/webhooks/WebhooksSettingsClient.tsx"],
    requiredDurableMarkers: ["OperatorSuccessCallout"],
  },
  {
    id: "admin-slack-integration",
    sourceRoots: ["app/(operator)/integrations/slack/_sections/SlackIntegrationPageClient.tsx"],
    requiredDurableMarkers: ["OperatorSuccessCallout"],
  },
  {
    id: "admin-teams-integration",
    sourceRoots: ["app/(operator)/integrations/teams/_sections/TeamsNotificationsIntegrationPageView.tsx"],
    requiredDurableMarkers: ["OperatorSuccessCallout"],
  },
  {
    id: "admin-billing-checkout",
    sourceRoots: ["app/(operator)/administration/billing/OperatorBillingPlansClient.tsx"],
    requiredDurableMarkers: ["OperatorSuccessCallout", "OperatorMutationInlineError"],
  },
];

/** Vitest files that assert high-stakes saves do not toast (dual-toast guard inventory). */
export const DURABLE_ACTION_OUTCOME_DUAL_TOAST_TEST_PATHS: readonly string[] = [
  "app/(operator)/integrations/cloud-connections/_sections/Tier2ConnectionWizard.test.tsx",
  "app/(operator)/administration/identity/sso-wizard/page.test.tsx",
  "app/(operator)/administration/identity-providers/_sections/SamlSpConfigurationForm.test.tsx",
  "app/(operator)/administration/scim-provisioning/_sections/ScimProvisioningSettingsPageClient.test.tsx",
  "app/(operator)/integrations/webhooks/page.test.tsx",
  "app/(operator)/integrations/slack/SlackIntegrationPageClient.test.tsx",
  "app/(operator)/integrations/teams/TeamsNotificationsIntegrationPageClient.test.tsx",
  "app/(operator)/administration/billing/page.test.tsx",
  "components/governance/GovernanceQuickApproveButton.test.tsx",
  "components/usability/GovernanceFindingsBulkActions.test.tsx",
  "components/governance/findings/GovernanceFindingsList.bulk-disposition.test.tsx",
  "app/(operator)/governance/policy-packs/_sections/PolicyPacksPageView.tabs.test.tsx",
  "app/(operator)/architecture/reviews/new/FirstPilotIntakeWizard.test.tsx",
  "app/(operator)/architecture/reviews/new/QuickStartWizard.test.tsx",
  "app/(operator)/architecture/reviews/new/SimplifiedPilotWizard.test.tsx",
  "components/operator/OperatorSuccessCallout.test.tsx",
  "components/review-intake/ReviewGenerationCreatedNotice.test.tsx",
];
