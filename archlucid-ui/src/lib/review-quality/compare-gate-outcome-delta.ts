import { feasibilityVerdictKindLabel } from "@/lib/feasibility-verdict-display";
import type { FeasibilityVerdictKind } from "@/types/feasibility-verdict";

export type CompareGateOutcomeSide = {
  readonly label: string;
  readonly gateLabel: string;
  readonly kind: FeasibilityVerdictKind | null;
};

export type CompareGateOutcomeDeltaView = {
  readonly baseline: CompareGateOutcomeSide;
  readonly target: CompareGateOutcomeSide;
  readonly changed: boolean;
};

function formatGateLabel(kind: FeasibilityVerdictKind | null): string {
  if (kind === null) {
    return "Gate pending";
  }

  return feasibilityVerdictKindLabel(kind);
}

/** Compact compare gate delta — buyer-visible even when Working provenance band is hidden. */
export function buildCompareGateOutcomeDeltaView(input: {
  readonly baselineKind: FeasibilityVerdictKind | null;
  readonly targetKind: FeasibilityVerdictKind | null;
}): CompareGateOutcomeDeltaView | null {
  if (input.baselineKind === null && input.targetKind === null) {
    return null;
  }

  return {
    baseline: {
      label: "Baseline review",
      gateLabel: formatGateLabel(input.baselineKind),
      kind: input.baselineKind,
    },
    target: {
      label: "Updated review",
      gateLabel: formatGateLabel(input.targetKind),
      kind: input.targetKind,
    },
    changed: input.baselineKind !== input.targetKind,
  };
}
