import { buildReviewDetailTabHref, type ReviewDetailTabId } from "@/lib/review-detail-workspace-tabs";

import {
  buildReviewPackageRerunHref,
  resolveReviewPackageApprovalBlockerKind,
} from "./resolve-review-package-approval-blocker";
import {
  type ResolveReviewPackagePrimaryActionInput,
  type ReviewPackagePrimaryAction,
  resolveReviewPackagePrimaryAction,
} from "./resolve-review-package-primary-action";

export function contextualizeReviewPackagePrimaryActionForActiveTab(
  action: ReviewPackagePrimaryAction,
  activeTab: ReviewDetailTabId,
  input: ResolveReviewPackagePrimaryActionInput & {
    readonly commitBlockedReason: string | null;
  },
): ReviewPackagePrimaryAction {
  if (activeTab !== "findings" || action.kind !== "review-findings") {
    return action;
  }

  const blockerKind = resolveReviewPackageApprovalBlockerKind(input);

  if (blockerKind === "blocking-findings") {
    return {
      kind: "review-findings",
      label: "Disposition blocking findings",
      href: buildReviewDetailTabHref(input.runId, "findings", {
        hash: "run-detail-findings-workspace",
      }),
    };
  }

  if (blockerKind === "incomplete-assessment" || blockerKind === "finding-coverage-failed") {
    return {
      kind: "review-findings",
      label: "Re-run review",
      href: buildReviewPackageRerunHref(input.runId),
    };
  }

  const reassigned = resolveReviewPackagePrimaryAction({
    ...input,
    hasCommitBlockingFailures: false,
    blockingFindingCount: 0,
  });

  if (reassigned.kind !== "review-findings") {
    return reassigned;
  }

  return {
    kind: "add-evidence",
    label: "Add evidence",
    href: buildReviewDetailTabHref(input.runId, "evidence"),
  };
}
