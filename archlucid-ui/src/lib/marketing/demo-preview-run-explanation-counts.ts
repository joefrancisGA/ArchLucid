import type { DemoCommitPagePreviewResponse } from "@/types/demo-preview";

function isUsableNonNegativeIntegerCount(value: unknown): boolean {
  return typeof value === "number" && Number.isFinite(value) && Number.isInteger(value) && value >= 0;
}

/** Shared gate for marketing surfaces that surface buyer-facing finding and compliance gap counts. */
export function hasUsableMarketingRunExplanationCounts(
  runExplanation: DemoCommitPagePreviewResponse["runExplanation"] | null | undefined,
): boolean {
  if (runExplanation === null || runExplanation === undefined) {
    return false;
  }

  if (!isUsableNonNegativeIntegerCount(runExplanation.findingCount)) {
    return false;
  }

  if (!isUsableNonNegativeIntegerCount(runExplanation.complianceGapCount)) {
    return false;
  }

  return true;
}
