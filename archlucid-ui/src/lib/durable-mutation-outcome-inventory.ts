import { DURABLE_ACTION_OUTCOME_FORBIDDEN_TOAST_PHRASES } from "@/lib/durable-action-outcome-inventory";
import {
  DURABLE_OUTCOME_DUAL_TOAST_TEST_PATHS,
  listDurableOutcomeGuardedSourceRoots,
} from "@/lib/operator/durable-outcome-registry";

/** Success copy that must not be toast-only on operator high-stakes mutation paths (TB-2112–TB-2116). */
export const DURABLE_MUTATION_FORBIDDEN_TOAST_SUCCESS_PHRASES: readonly string[] =
  DURABLE_ACTION_OUTCOME_FORBIDDEN_TOAST_PHRASES;

/**
 * Surfaces still on toast-only billing checkout until a follow-up row converts them.
 * Guard skips `showSuccess` in these files so TB-2116 can land without reopening TB-2115 scope.
 */
export const DURABLE_MUTATION_TEMPORARY_TOAST_DEBT_PATHS: readonly string[] = [
  "components/TrialBanner.tsx",
  "components/TrialLimitModal.tsx",
  "app/(operator)/architecture/reviews/[reviewId]/_sections/PilotConversionCta.tsx",
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
