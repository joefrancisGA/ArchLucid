import type { ReviewPackageSummaryMode } from "./resolve-review-package-summary-mode";

export type ResolveReviewPackageAttentionLineInput = {
  readonly mode: ReviewPackageSummaryMode;
  readonly blockingFindingCount: number;
  readonly hasCommitBlockingFailures: boolean;
  readonly proofPacketExportReady: boolean;
  readonly hasGoldenManifest: boolean;
};

/** One-line "what needs attention" copy — only when underlying signals are present. */
export function resolveReviewPackageAttentionLine(
  input: ResolveReviewPackageAttentionLineInput,
): string | null {
  if (input.hasCommitBlockingFailures) {
    return "Open blocking findings need review before finalization.";
  }

  if (input.mode === "draft") {
    if (!input.hasGoldenManifest) {
      return "Finalize the review when findings and evidence are ready.";
    }

    return null;
  }

  if (input.blockingFindingCount > 0) {
    const countLabel = String(Math.trunc(input.blockingFindingCount));

    return `${countLabel} high-severity finding${input.blockingFindingCount === 1 ? "" : "s"} need review`;
  }

  if (input.proofPacketExportReady) {
    return "Proof packet ready for export.";
  }

  return null;
}
