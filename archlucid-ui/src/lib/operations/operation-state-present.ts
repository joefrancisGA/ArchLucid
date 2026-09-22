import type { EnterpriseStatusKind } from "@/lib/design-tokens";
import { ENTERPRISE_STATUS_LABELS } from "@/lib/design-tokens";
import type { OperationState } from "@/lib/operations/operation-state";

export type OperationStateStatusPresentation = {
  readonly kind: EnterpriseStatusKind;
  readonly label: string;
};

/** StatusTag presentation aligned with shell in-flight strip semantics (TB-2077 / DW-015). */
export function resolveOperationStateStatusPresentation(
  state: OperationState,
): OperationStateStatusPresentation {
  switch (state) {
    case "Pending":
    case "Running":
    case "CancelRequested":
      return { kind: "in-progress", label: ENTERPRISE_STATUS_LABELS["in-progress"] };

    case "Succeeded":
      return { kind: "ready", label: ENTERPRISE_STATUS_LABELS.ready };

    case "Failed":
      return { kind: "blocked", label: ENTERPRISE_STATUS_LABELS.blocked };

    case "Canceled":
      return { kind: "neutral", label: "Canceled" };

    default: {
      const exhaustive: never = state;

      return exhaustive;
    }
  }
}
