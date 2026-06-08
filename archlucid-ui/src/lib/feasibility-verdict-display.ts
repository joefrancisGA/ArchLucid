import type { FeasibilityVerdictKind } from "@/types/feasibility-verdict";

export function feasibilityVerdictKindLabel(kind: FeasibilityVerdictKind): string {
  switch (kind) {
    case "Feasible":
      return "Feasible";
    case "SoftInfeasible":
      return "Soft infeasible";
    case "HardInfeasible":
      return "Hard infeasible";
    default:
      return kind;
  }
}

export function feasibilityVerdictTone(
  kind: FeasibilityVerdictKind,
): "success" | "warning" | "danger" {
  switch (kind) {
    case "Feasible":
      return "success";
    case "SoftInfeasible":
      return "warning";
    case "HardInfeasible":
      return "danger";
    default:
      return "warning";
  }
}
