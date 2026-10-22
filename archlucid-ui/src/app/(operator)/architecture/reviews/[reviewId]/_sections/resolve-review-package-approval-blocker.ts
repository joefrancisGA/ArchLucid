import type { ResolveReviewPackagePrimaryActionInput } from "./resolve-review-package-primary-action";

export type ReviewPackageApprovalBlockerKind =
  | "incomplete-assessment"
  | "finding-coverage-failed"
  | "blocking-findings"
  | "none";

export function resolveReviewPackageApprovalBlockerKind(
  input: ResolveReviewPackagePrimaryActionInput & {
    readonly commitBlockedReason: string | null;
  },
): ReviewPackageApprovalBlockerKind {
  if (input.hasCommitBlockingFailures) {
    return "finding-coverage-failed";
  }

  if (input.commitBlockedReason !== null) {
    return "incomplete-assessment";
  }

  if (input.blockingFindingCount > 0) {
    return "blocking-findings";
  }

  return "none";
}

export function buildReviewPackageRerunHref(runId: string): string {
  return `/architecture/reviews/new?path=guided-intake&rerun=${encodeURIComponent(runId)}`;
}

export function resolveReviewPackageBlockerHelperText(
  blockerKind: ReviewPackageApprovalBlockerKind,
  input: {
    readonly blockingFindingCount: number;
    readonly commitBlockedSummary: string | null;
  },
): string | null {
  switch (blockerKind) {
    case "incomplete-assessment":
    case "finding-coverage-failed":
      return input.commitBlockedSummary;
    case "blocking-findings": {
      const count = Math.trunc(input.blockingFindingCount);
      const verb = count === 1 ? "blocks" : "block";

      return `${count} unresolved finding${count === 1 ? "" : "s"} currently ${verb} approval.`;
    }
    default:
      return null;
  }
}
