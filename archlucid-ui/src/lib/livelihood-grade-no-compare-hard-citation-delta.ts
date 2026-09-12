import type { FeasibilityVerdictKind } from "@/types/feasibility-verdict";

export type CompareHardCitationSide = {
  readonly runLabel: string;
  readonly feasibilityVerdictKind: FeasibilityVerdictKind | null;
  readonly hardCitationCount: number;
};

export type CompareHardCitationDeltaSummary = {
  readonly showCitationDelta: boolean;
  readonly line: string | null;
};

export function summarizeCompareHardCitationDelta(
  baseline: CompareHardCitationSide,
  target: CompareHardCitationSide,
): CompareHardCitationDeltaSummary {
  const baselineHard = baseline.feasibilityVerdictKind === "HardInfeasible";
  const targetHard = target.feasibilityVerdictKind === "HardInfeasible";
  const citationCountsDiffer = baseline.hardCitationCount !== target.hardCitationCount;

  if (!baselineHard && !targetHard && !citationCountsDiffer) {
    return { showCitationDelta: false, line: null };
  }

  const line =
    `Hard citation delta — ${baseline.runLabel}: ${baseline.hardCitationCount} citation(s); `
    + `${target.runLabel}: ${target.hardCitationCount} citation(s). `
    + "Uncited hard cannot export as Career-hard (ADR 0093).";

  return { showCitationDelta: true, line };
}
