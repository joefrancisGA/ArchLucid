"use client";

import { PageContextualHelpButton } from "@/components/usability/PageContextualHelpButton";
import { useProductionEvalChrome } from "@/hooks/useProductionDeskChrome";
import { reviewsNewShowsPathTabChrome } from "@/lib/reviews-new-page-resume-hero";
import type { ReviewsNewPathMode } from "@/lib/reviews-new-path-copy";

type ReviewsNewHeaderActionsProps = {
  readonly activePath: ReviewsNewPathMode | null;
};

/** Header actions for `/architecture/reviews/new` (RNX). */
export function ReviewsNewHeaderActions(props: ReviewsNewHeaderActionsProps): React.JSX.Element | null {
  const evalChrome = useProductionEvalChrome();
  const onPathTab = reviewsNewShowsPathTabChrome(evalChrome, props.activePath);
  const showContextualHelp = !(evalChrome && onPathTab);

  if (!showContextualHelp) {
    return null;
  }

  return <PageContextualHelpButton />;
}
