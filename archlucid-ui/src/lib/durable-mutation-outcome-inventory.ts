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
} from "@/lib/governance/governance-mutation-outcome-copy";
import {
  REVIEW_CREATED_ANALYSIS_IN_PROGRESS_MESSAGE,
  REVIEW_CREATED_SUCCESS_MESSAGE,
} from "@/components/review-intake/ReviewGenerationCreatedNotice";
import { REVIEW_START_CREATED_CONFIRMATION } from "@/lib/review-start-progress-copy";
import {
  DURABLE_OUTCOME_DUAL_TOAST_TEST_PATHS,
  listDurableOutcomeGuardedSourceRoots,
} from "@/lib/operator/durable-outcome-registry";

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
export const DURABLE_MUTATION_GUARDED_SURFACE_PATHS: readonly string[] =
  listDurableOutcomeGuardedSourceRoots();

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
export const DURABLE_MUTATION_DUAL_TOAST_TEST_PATHS: readonly string[] = DURABLE_OUTCOME_DUAL_TOAST_TEST_PATHS;
