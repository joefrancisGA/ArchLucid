import type { FeasibilityVerdictKind } from "@/types/feasibility-verdict";
import {
  VERDICT_KIND_NOT_STORED_LABEL,
  verdictKindLabel,
  verdictTierFromFeasibilityKind,
  verdictTierTone,
} from "@/lib/verdict-taxonomy";

export function feasibilityVerdictKindLabel(kind: FeasibilityVerdictKind | null | undefined): string {
  return verdictKindLabel(kind);
}

/** Stored feasibility verdict kind for spine and receipts — not tier-only Proceed/Remediate/Hold. */
export function feasibilityVerdictStoredKindLabel(kind: FeasibilityVerdictKind | null | undefined): string {
  if (kind === null || kind === undefined) {
    return VERDICT_KIND_NOT_STORED_LABEL;
  }

  switch (kind) {
    case "Feasible":
    case "SoftInfeasible":
    case "HardInfeasible":
      return kind;
    default:
      return String(kind);
  }
}

export function feasibilityVerdictTone(
  kind: FeasibilityVerdictKind,
): "success" | "warning" | "danger" {
  return verdictTierTone(verdictTierFromFeasibilityKind(kind));
}
