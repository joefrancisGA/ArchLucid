import type { FeasibilityVerdictKind } from "@/types/feasibility-verdict";

export type VerdictTier = "Proceed" | "Remediate" | "Hold";

export const VERDICT_KIND_NOT_STORED_LABEL = "Verdict kind was not stored." as const;

export const VERDICT_NOT_STORED_LABEL = "Verdict was not stored." as const;

export const RISK_POSTURE_NOT_STORED_LABEL = "Risk posture was not stored." as const;

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

export function verdictKindLabel(kind: FeasibilityVerdictKind | null | undefined): string {
  if (kind === null || kind === undefined) {
    return VERDICT_KIND_NOT_STORED_LABEL;
  }

  switch (kind) {
    case "Feasible":
    case "SoftInfeasible":
    case "HardInfeasible":
      return verdictTierFromFeasibilityKind(kind);
    default:
      return String(kind);
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
export function tryVerdictTierFromRiskPosture(riskPosture: string | null | undefined): VerdictTier | null {
  const normalized = (riskPosture ?? "").trim().toLowerCase();

  if (normalized.length === 0) {
    return null;
  }

  if (!riskPostureMapsToKnownTier(normalized)) {
    return null;
  }

  return verdictTierFromRiskPosture(riskPosture ?? "");
}

function riskPostureMapsToKnownTier(normalized: string): boolean {
  if (
    normalized.includes("proceed")
    || normalized.includes("approved")
    || normalized.includes("low")
    || normalized.includes("green")
    || normalized.includes("feasible")
  ) {
    return true;
  }

  if (
    normalized.includes("hold")
    || normalized.includes("critical")
    || normalized.includes("hard")
    || normalized.includes("blocked")
    || normalized.includes("red")
  ) {
    return true;
  }

  if (
    normalized.includes("remediate")
    || normalized.includes("elevated")
    || normalized.includes("residual")
    || normalized.includes("medium")
    || normalized.includes("yellow")
    || normalized.includes("amber")
    || normalized.includes("soft")
  ) {
    return true;
  }

  return false;
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
