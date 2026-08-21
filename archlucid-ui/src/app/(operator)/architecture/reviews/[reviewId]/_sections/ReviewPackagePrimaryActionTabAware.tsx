"use client";

import { useSearchParams } from "next/navigation";

import {
  REVIEW_DETAIL_TAB_PARAM,
  resolveReviewDetailTab,
} from "@/lib/review-detail-workspace-tabs";

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
  const searchParams = useSearchParams();
  const activeTab = resolveReviewDetailTab(searchParams.get(REVIEW_DETAIL_TAB_PARAM));
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
