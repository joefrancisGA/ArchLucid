import type { PolicyPackDryRunResponse } from "@/types/policy-pack-dry-run";

export type PolicyPackSimulationSummary = {
  readonly headline: string;
  readonly detail: string;
  readonly disposition: "PASS" | "WARN" | "HOLD";
};

/** Formats governance dry-run API output for operator policy-pack surfaces (assessment #15). */
export function buildPolicyPackSimulationSummary(
  result: PolicyPackDryRunResponse | null,
): PolicyPackSimulationSummary | null {
  if (result === null)
    return null;

  const evaluated = result.deltaCounts?.evaluated ?? 0;
  const wouldBlock = result.deltaCounts?.wouldBlock ?? 0;
  const wouldAllow = result.deltaCounts?.wouldAllow ?? 0;
  const missing = result.deltaCounts?.runMissing ?? 0;

  let disposition: PolicyPackSimulationSummary["disposition"] = "PASS";

  if (wouldBlock > 0 || missing > 0)
    disposition = "HOLD";
  else if (evaluated === 0)
    disposition = "WARN";

  const headline =
    disposition === "PASS"
      ? "Simulation would allow all evaluated reviews"
      : disposition === "WARN"
        ? "Simulation returned no evaluated reviews"
        : "Simulation would block one or more reviews";

  const detail = `Evaluated ${evaluated} review(s) — would block ${wouldBlock}, allow ${wouldAllow}, missing ${missing}. Page ${result.page} · returned ${result.returnedRuns} of ${result.totalRequestedRuns}.`;

  return { headline, detail, disposition };
}
