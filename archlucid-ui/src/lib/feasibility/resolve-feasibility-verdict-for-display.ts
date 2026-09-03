import type { ManifestFeasibilityVerdict } from "@/types/feasibility-verdict";

import { feasibilityVerdictKindLabel, feasibilityVerdictTone } from "@/lib/feasibility-verdict-display";
import { isExportableDecisionVerdict } from "@/lib/decision-receipt-export";

export type FeasibilityVerdictDisplayResolution = {
  readonly verdict: ManifestFeasibilityVerdict;
  readonly kindLabel: string;
  readonly tone: "success" | "warning" | "danger";
  readonly missingHardCitationDefect: boolean;
  readonly leadsPackageSurfaces: boolean;
};

function hasHardInfeasibleCitation(verdict: ManifestFeasibilityVerdict): boolean {
  const citations = verdict.hardCitations ?? [];

  if (citations.some((citation) => (citation.reference ?? "").trim().length > 0)) {
    return true;
  }

  const unsatCore = verdict.unsatCoreInvariantKeys ?? [];

  return unsatCore.some((key) => key.trim().length > 0);
}

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
