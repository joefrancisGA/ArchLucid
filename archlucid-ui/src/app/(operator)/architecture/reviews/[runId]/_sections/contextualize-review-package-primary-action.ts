import { buildReviewDetailTabHref, type ReviewDetailTabId } from "@/lib/review-detail-workspace-tabs";

import {
  type ResolveReviewPackagePrimaryActionInput,
  type ReviewPackagePrimaryAction,
  resolveReviewPackagePrimaryAction,
} from "./resolve-review-package-primary-action";

export function contextualizeReviewPackagePrimaryActionForActiveTab(
  action: ReviewPackagePrimaryAction,
  activeTab: ReviewDetailTabId,
  input: ResolveReviewPackagePrimaryActionInput,
): ReviewPackagePrimaryAction {
  if (activeTab !== "findings" || action.kind !== "review-findings") {
    return action;
  }

  if (input.blockingFindingCount > 0 || input.hasCommitBlockingFailures) {
    return {
      kind: "review-findings",
      label: "Disposition blocking findings",
      href: buildReviewDetailTabHref(input.runId, "findings", {
        hash: "run-detail-findings-workspace",
      }),
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
