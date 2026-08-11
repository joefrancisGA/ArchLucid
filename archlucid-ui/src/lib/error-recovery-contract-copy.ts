export type ErrorRecoveryContractPresentation = {
  readonly whatFailed: string;
  readonly whatIsIntact: string;
  readonly nextStep: string;
};

export type ErrorRecoveryContractScenario =
  | "api-problem"
  | "connectivity"
  | "review-package-load"
  | "review-package-workspace-mismatch"
  | "governance-mutation";

export const ERROR_RECOVERY_CONTRACT_MARKERS = {
  root: "operator-error-recovery-contract",
  whatFailed: "operator-error-recovery-what-failed",
  intact: "operator-error-recovery-intact",
  nextStep: "operator-error-recovery-next-step",
} as const;

const API_PROBLEM_RECOVERY: ErrorRecoveryContractPresentation = {
  whatFailed: "ArchLucid could not complete this request.",
  whatIsIntact: "Your workspace data and in-progress drafts were not changed by this failed request.",
  nextStep: "Retry the action, then open troubleshooting if the error repeats.",
};

const CONNECTIVITY_RECOVERY: ErrorRecoveryContractPresentation = {
  whatFailed: "ArchLucid could not reach the API from this browser session.",
  whatIsIntact: "Saved workspace configuration and committed reviews remain on the server when connectivity returns.",
  nextStep: "Confirm network access, then retry or check system health.",
};

const REVIEW_PACKAGE_LOAD_RECOVERY: ErrorRecoveryContractPresentation = {
  whatFailed: "This architecture review could not be loaded in the current workspace.",
  whatIsIntact: "Other reviews in the workspace are unaffected; generation handoff metadata is preserved for diagnostics.",
  nextStep: "Retry loading the review, then open reviews or start a new review if it still fails.",
};

const REVIEW_PACKAGE_WORKSPACE_MISMATCH_RECOVERY: ErrorRecoveryContractPresentation = {
  whatFailed: "This review exists in a different workspace than the one currently selected.",
  whatIsIntact: "The review record was not deleted — it is only hidden until you switch to the correct workspace.",
  nextStep: "Switch workspace in the shell selector, then open the review again.",
};

const GOVERNANCE_MUTATION_RECOVERY: ErrorRecoveryContractPresentation = {
  whatFailed: "The governance change did not save.",
  whatIsIntact: "Prior approvals, findings, and signed review records are unchanged.",
  nextStep: "Review the inline error, fix any required fields, and submit again.",
};

/** Resolves the three-part operator error recovery copy for a guarded golden-path surface. */
export function errorRecoveryContractForScenario(
  scenario: ErrorRecoveryContractScenario,
  context?: { readonly failureSummary?: string | null },
): ErrorRecoveryContractPresentation {
  switch (scenario) {
    case "api-problem": {
      const summary = context?.failureSummary?.trim() ?? "";

      if (summary.length > 0) {
        return {
          ...API_PROBLEM_RECOVERY,
          whatFailed: summary,
        };
      }

      return API_PROBLEM_RECOVERY;
    }
    case "connectivity":
      return CONNECTIVITY_RECOVERY;
    case "review-package-load":
      return REVIEW_PACKAGE_LOAD_RECOVERY;
    case "review-package-workspace-mismatch":
      return REVIEW_PACKAGE_WORKSPACE_MISMATCH_RECOVERY;
    case "governance-mutation":
      return GOVERNANCE_MUTATION_RECOVERY;
    default: {
      const exhaustive: never = scenario;

      return exhaustive;
    }
  }
}
