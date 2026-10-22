import { toApiLoadFailure } from "@/lib/api-load-failure";
import type { ErrorRecoveryContractScenario } from "@/lib/error-recovery-contract-copy";

export type OperatorInferredConnectionPanelErrorKind = "load" | "mutation";

export type OperatorInferredConnectionPanelError = {
  readonly message: string;
  readonly kind: OperatorInferredConnectionPanelErrorKind;
};

/**
 * proxyJsonGet throws ApiLoadFailureState (a plain object), not Error.
 * Map both shapes so the operator sees the API problem instead of a generic fallback.
 */
export function operatorInferredConnectionPanelErrorFromUnknown(
  error: unknown,
  fallbackMessage: string,
  kind: OperatorInferredConnectionPanelErrorKind,
): OperatorInferredConnectionPanelError {
  const failure = toApiLoadFailure(error);
  const trimmed = failure.message.trim();

  return {
    message: trimmed.length > 0 ? failure.message : fallbackMessage,
    kind,
  };
}

export function operatorInferredConnectionPanelErrorRecoveryScenario(
  kind: OperatorInferredConnectionPanelErrorKind,
): ErrorRecoveryContractScenario {
  switch (kind) {
    case "load":
      // GET failures are not saves — do not reuse governance-mutation copy.
      return "api-problem";
    case "mutation":
      return "governance-mutation";
    default: {
      const exhaustive: never = kind;

      return exhaustive;
    }
  }
}
