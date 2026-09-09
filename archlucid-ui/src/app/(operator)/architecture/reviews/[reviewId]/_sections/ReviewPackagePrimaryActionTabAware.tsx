"use client";

import { useResolvedReviewDetailActiveTab } from "@/hooks/use-resolved-review-detail-active-tab";

import { contextualizeReviewPackagePrimaryActionForActiveTab } from "./contextualize-review-package-primary-action";
import { ReviewPackagePrimaryAction, type ReviewPackagePrimaryActionProps } from "./ReviewPackagePrimaryAction";
import type { ResolveReviewPackagePrimaryActionInput } from "./resolve-review-package-primary-action";
import type { ReviewPackagePrimaryAction as ReviewPackagePrimaryActionModel } from "./resolve-review-package-primary-action";

export type ReviewPackagePrimaryActionTabAwareProps = Omit<ReviewPackagePrimaryActionProps, "action"> & {
  readonly action: ReviewPackagePrimaryActionModel;
  readonly primaryActionContext: ResolveReviewPackagePrimaryActionInput;
  /** When Do this next owns the page primary, demote the tab-aware duplicate to outline. */
  readonly pagePrimaryOwnedElsewhere?: boolean;
};

export function ReviewPackagePrimaryActionTabAware(
  props: ReviewPackagePrimaryActionTabAwareProps,
): React.JSX.Element {
  const activeTab = useResolvedReviewDetailActiveTab({
    tabLifecycle: {
      manifestId: props.primaryActionContext.manifestId,
      showProgressTracker: false,
      runCompleted: props.primaryActionContext.runCompleted,
    },
  });
  const contextualAction = contextualizeReviewPackagePrimaryActionForActiveTab(
    props.action,
    activeTab,
    {
      ...props.primaryActionContext,
      commitBlockedReason: props.commitBlockedReason ?? null,
    },
  );

  return (
    <ReviewPackagePrimaryAction
      action={contextualAction}
      runId={props.runId}
      hasGoldenManifest={props.hasGoldenManifest}
      commitBlockedReason={props.commitBlockedReason}
      demoted={props.demoted === true || props.pagePrimaryOwnedElsewhere === true}
    />
  );
}
