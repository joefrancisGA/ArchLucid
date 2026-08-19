/**
 * TB-2155 — inventory for golden-path operator error recovery contract Vitest guards.
 */

import { ERROR_RECOVERY_CONTRACT_MARKERS } from "@/lib/error-recovery-contract-copy";

export type ErrorRecoveryContractGuardedSurface = {
  readonly id: string;
  readonly sourceRoots: readonly string[];
  readonly requiredMarkers: readonly string[];
};

export const ERROR_RECOVERY_CONTRACT_REQUIRED_MARKERS: readonly string[] = [
  ERROR_RECOVERY_CONTRACT_MARKERS.root,
  ERROR_RECOVERY_CONTRACT_MARKERS.whatFailed,
  ERROR_RECOVERY_CONTRACT_MARKERS.intact,
  ERROR_RECOVERY_CONTRACT_MARKERS.nextStep,
];

const ERROR_RECOVERY_CONTRACT_WIRED_ROOT_MARKERS: readonly string[] = [
  "OperatorErrorRecoveryContract",
  "errorRecoveryContractForScenario",
];

/** Golden-path error roots that must render the three-part recovery contract inline. */
export const ERROR_RECOVERY_CONTRACT_GUARDED_SURFACES: readonly ErrorRecoveryContractGuardedSurface[] = [
  {
    id: "operator-error-recovery-contract-component",
    sourceRoots: ["components/usability/OperatorErrorRecoveryContract.tsx"],
    requiredMarkers: [...ERROR_RECOVERY_CONTRACT_REQUIRED_MARKERS, "OperatorErrorRecoveryContract"],
  },
  {
    id: "review-package-load-failure",
    sourceRoots: ["components/ReviewPackageLoadFailureView.tsx"],
    requiredMarkers: ERROR_RECOVERY_CONTRACT_WIRED_ROOT_MARKERS,
  },
  {
    id: "operator-api-problem",
    sourceRoots: ["components/operator/OperatorApiProblem.tsx"],
    requiredMarkers: ERROR_RECOVERY_CONTRACT_WIRED_ROOT_MARKERS,
  },
  {
    id: "operator-connectivity-error",
    sourceRoots: ["components/operator/OperatorLayeredConnectivityError.tsx"],
    requiredMarkers: ERROR_RECOVERY_CONTRACT_WIRED_ROOT_MARKERS,
  },
  {
    id: "governance-mutation-inline-error",
    sourceRoots: ["components/operator/OperatorMutationInlineError.tsx"],
    requiredMarkers: ERROR_RECOVERY_CONTRACT_WIRED_ROOT_MARKERS,
  },
] as const;
