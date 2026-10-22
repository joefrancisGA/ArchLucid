import type { FeasibilityVerdictKind } from "@/types/feasibility-verdict";
import {
  verdictKindLabel,
  verdictTierFromFeasibilityKind,
  verdictTierTone,
} from "@/lib/verdict-taxonomy";

export function feasibilityVerdictKindLabel(kind: FeasibilityVerdictKind | null | undefined): string {
  return verdictKindLabel(kind);
}

export function feasibilityVerdictTone(
  kind: FeasibilityVerdictKind,
): "success" | "warning" | "danger" {
  return verdictTierTone(verdictTierFromFeasibilityKind(kind));
}
