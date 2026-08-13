import type { FeasibilityVerdictKind } from "@/types/feasibility-verdict";

export type VerdictTier = "Proceed" | "Remediate" | "Hold";

export function verdictTierFromFeasibilityKind(kind: FeasibilityVerdictKind): VerdictTier {
  switch (kind) {
    case "Feasible":
      return "Proceed";

    case "SoftInfeasible":
      return "Remediate";

    case "HardInfeasible":
      return "Hold";

    default:
      return "Remediate";
  }
}

export function verdictTierTone(tier: VerdictTier): "success" | "warning" | "danger" {
  switch (tier) {
    case "Proceed":
      return "success";

    case "Remediate":
      return "warning";

    case "Hold":
      return "danger";

    default:
      return "warning";
  }
}

export function verdictTierLabel(tier: VerdictTier): string {
  return tier;
}

/** Best-effort mapper for free-text sponsor risk posture strings. */
export function verdictTierFromRiskPosture(riskPosture: string): VerdictTier {
  const normalized = riskPosture.trim().toLowerCase();

  if (normalized.length === 0) {
    return "Remediate";
  }

  if (
    normalized.includes("proceed") ||
    normalized.includes("approved") ||
    normalized.includes("low") ||
    normalized.includes("green") ||
    normalized.includes("feasible")
  ) {
    return "Proceed";
  }

  if (
    normalized.includes("hold") ||
    normalized.includes("critical") ||
    normalized.includes("hard") ||
    normalized.includes("blocked") ||
    normalized.includes("red")
  ) {
    return "Hold";
  }

  return "Remediate";
}
