import { finiteIntegerCountDisplay } from "@/lib/finite-count-display";

export function presentRunExplanationHeadlineCount(value: number | null | undefined): string {
  return finiteIntegerCountDisplay(value, { missingLabel: "not-returned" });
}

export function resolveRunExplanationFindingCountForHeadline(
  displayFindingCount: number | null | undefined,
  summaryFindingCount: number | undefined,
): string {
  if (displayFindingCount !== undefined && displayFindingCount !== null) {
    if (!Number.isFinite(displayFindingCount)) {
      return "Not returned";
    }

    return String(Math.trunc(displayFindingCount));
  }

  return presentRunExplanationHeadlineCount(summaryFindingCount);
}
