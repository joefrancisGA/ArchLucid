import type { FeasibilityVerdictKind } from "@/types/feasibility-verdict";
import {
  verdictTierFromFeasibilityKind,
  verdictTierLabel,
  verdictTierTone,
} from "@/lib/verdict-taxonomy";

export function feasibilityVerdictKindLabel(kind: FeasibilityVerdictKind): string {
  return verdictTierLabel(verdictTierFromFeasibilityKind(kind));
}

export function feasibilityVerdictTone(
  kind: FeasibilityVerdictKind,
): "success" | "warning" | "danger" {
  return verdictTierTone(verdictTierFromFeasibilityKind(kind));
}
