import type { ManifestFeasibilityVerdict } from "@/types/feasibility-verdict";

import { feasibilityVerdictKindLabel, feasibilityVerdictTone } from "@/lib/feasibility-verdict-display";
import { isExportableDecisionVerdict } from "@/lib/decision-receipt-export";
import { hasHardInfeasibleCitation } from "@/lib/feasibility/feasibility-verdict-citation";

export type FeasibilityVerdictDisplayResolution = {
  readonly verdict: ManifestFeasibilityVerdict;
  readonly kindLabel: string;
  readonly tone: "success" | "warning" | "danger";
  readonly missingHardCitationDefect: boolean;
  readonly leadsPackageSurfaces: boolean;
};

/** UI-safe feasibility verdict presentation — never labels Hard without a citation (ADR 0050). */
export function resolveFeasibilityVerdictForDisplay(
  verdict: ManifestFeasibilityVerdict,
): FeasibilityVerdictDisplayResolution {
  const missingHardCitationDefect =
    verdict.kind === "HardInfeasible" && !hasHardInfeasibleCitation(verdict);

  return {
    verdict,
    kindLabel: missingHardCitationDefect
      ? "Infeasibility verdict needs citation"
      : feasibilityVerdictKindLabel(verdict.kind),
    tone: missingHardCitationDefect ? "warning" : feasibilityVerdictTone(verdict.kind),
    missingHardCitationDefect,
    leadsPackageSurfaces: isExportableDecisionVerdict(verdict.kind),
  };
}
