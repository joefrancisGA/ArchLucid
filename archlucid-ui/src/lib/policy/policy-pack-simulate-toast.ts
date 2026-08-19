import type { components } from "@/lib/openapi-schemas";
import { showError, showSuccess } from "@/lib/toast";

export type PolicyPackSimulateToastKind = "success" | "warning" | "none";

export type PolicyPackSimulateToastOutcome = {
  readonly kind: PolicyPackSimulateToastKind;
  readonly message: string;
};

/** Resolves toast disposition after a successful policy simulate HTTP response. */
export function resolvePolicyPackSimulateToastOutcome(
  result: components["schemas"]["PolicyPackGovernanceDryRunResult"],
): PolicyPackSimulateToastOutcome {
  const blocked = result.gateResult?.blocked === true;
  const failedCheckCount = result.failedChecks?.length ?? 0;

  if (blocked) {
    return {
      kind: "warning",
      message: "Policy validation completed — this pack would block finalizing the selected review.",
    };
  }

  if (failedCheckCount > 0) {
    return {
      kind: "warning",
      message: `Policy validation completed with ${failedCheckCount} failed check${failedCheckCount === 1 ? "" : "s"}.`,
    };
  }

  return {
    kind: "success",
    message: "Policy validation completed.",
  };
}

/** Shows success or warning toast from a policy simulate result (never green on block). */
export function presentPolicyPackSimulateToast(
  result: components["schemas"]["PolicyPackGovernanceDryRunResult"],
  options?: {
    readonly successMessage?: string;
  },
): void {
  const outcome = resolvePolicyPackSimulateToastOutcome(result);

  if (outcome.kind === "success") {
    showSuccess(options?.successMessage ?? outcome.message);

    return;
  }

  if (outcome.kind === "warning") {
    showError(outcome.message, undefined, { type: "warning" });
  }
}
