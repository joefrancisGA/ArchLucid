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
  | "governance-mutation"
  | "architecture-draft-load"
  | "architecture-draft-offline-replay-conflict"
  | "livelihood-mutation-resume-failed"
  | "in-flight-cancel-failure"
  | "review-detail-segment-error";

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
  whatIsIntact: "Prior approvals, findings, and Finalized review records are unchanged.",
  nextStep: "Review the inline error, fix any required fields, and submit again.",
};

const ARCHITECTURE_DRAFT_LOAD_RECOVERY: ErrorRecoveryContractPresentation = {
  whatFailed: "This architecture draft could not be loaded.",
  whatIsIntact:
    "Typed work in this browser may still be recoverable from offline recovery until you reload successfully.",
  nextStep: "Retry loading the draft, or return to the architectures list.",
};

const IN_FLIGHT_CANCEL_FAILURE_RECOVERY: ErrorRecoveryContractPresentation = {
  whatFailed: "Could not cancel this in-flight operation.",
  whatIsIntact: "The operation may still be running on the server until cancel succeeds.",
  nextStep: "Try cancel again in a moment, or open the operation to check its status.",
};

const REVIEW_DETAIL_SEGMENT_ERROR_RECOVERY: ErrorRecoveryContractPresentation = {
  whatFailed: "This review desk could not render.",
  whatIsIntact:
    "The review package on the server is unchanged. Typed livelihood fields registered on this page may still restore after Retry when idle snapshots were preserved.",
  nextStep:
    "Choose Retry to reload this review desk. Retry does not change execute posture or mark a rehearsal run Career-complete. Open reviews only if Retry keeps failing.",
};

const ARCHITECTURE_DRAFT_OFFLINE_REPLAY_CONFLICT_RECOVERY: ErrorRecoveryContractPresentation = {
  whatFailed: "This architecture draft changed in another browser session or from offline replay.",
  whatIsIntact: "Your unsaved edits in this tab are still on screen and were not overwritten.",
  nextStep:
    "Refresh the draft to load the latest version, then re-apply any edits you still need.",
};

const ARCHITECTURE_DRAFT_OFFLINE_REPLAY_CONFLICT_WORKING_RECOVERY: ErrorRecoveryContractPresentation = {
  ...ARCHITECTURE_DRAFT_OFFLINE_REPLAY_CONFLICT_RECOVERY,
  nextStep: "Keep your edits, load the server copy, or retry save after you choose.",
};

const LIVELIHOOD_MUTATION_RESUME_FAILED_RECOVERY: ErrorRecoveryContractPresentation = {
  whatFailed: "Your saved action could not finish after sign-in.",
  whatIsIntact:
    "The server may have applied part of this request. Your on-screen work and other reviews are unchanged unless the action already succeeded.",
  nextStep: "Retry once, discard the saved action, or re-run the change manually from this page.",
};

export const GOVERNANCE_CONCURRENCY_CONFLICT_RECOVERY: ErrorRecoveryContractPresentation = {
  whatFailed: "Another session saved a newer version of this record first.",
  whatIsIntact: "The server copy is unchanged by this attempt; your unsaved form edits are still on screen.",
  nextStep: "Refresh this page to load the latest server state, then re-apply any changes you still need.",
};

/** Resolves the three-part operator error recovery copy for a guarded golden-path surface. */
export function errorRecoveryContractForScenario(
  scenario: ErrorRecoveryContractScenario,
  context?: {
    readonly failureSummary?: string | null;
    readonly workingMode?: boolean;
  },
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
    case "architecture-draft-load": {
      const summary = context?.failureSummary?.trim() ?? "";

      if (summary.length > 0) {
        return {
          ...ARCHITECTURE_DRAFT_LOAD_RECOVERY,
          whatFailed: summary,
        };
      }

      return ARCHITECTURE_DRAFT_LOAD_RECOVERY;
    }
    case "in-flight-cancel-failure": {
      const summary = context?.failureSummary?.trim() ?? "";

      if (summary.length > 0) {
        return {
          ...IN_FLIGHT_CANCEL_FAILURE_RECOVERY,
          nextStep: summary,
        };
      }

      return IN_FLIGHT_CANCEL_FAILURE_RECOVERY;
    }
    case "review-detail-segment-error":
      return REVIEW_DETAIL_SEGMENT_ERROR_RECOVERY;
    case "architecture-draft-offline-replay-conflict":
      return context?.workingMode === true
        ? ARCHITECTURE_DRAFT_OFFLINE_REPLAY_CONFLICT_WORKING_RECOVERY
        : ARCHITECTURE_DRAFT_OFFLINE_REPLAY_CONFLICT_RECOVERY;
    case "livelihood-mutation-resume-failed": {
      const summary = context?.failureSummary?.trim() ?? "";

      if (summary.length > 0) {
        return {
          ...LIVELIHOOD_MUTATION_RESUME_FAILED_RECOVERY,
          whatFailed: summary,
        };
      }

      return LIVELIHOOD_MUTATION_RESUME_FAILED_RECOVERY;
    }
    default: {
      const exhaustive: never = scenario;

      return exhaustive;
    }
  }
}
