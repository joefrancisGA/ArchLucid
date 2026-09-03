"use client";

import { PageContextualHelpButton } from "@/components/usability/PageContextualHelpButton";
import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";
import { reviewsNewShowsPathTabChrome } from "@/lib/reviews-new-page-resume-hero";
import type { ReviewsNewPathMode } from "@/lib/reviews-new-path-copy";

type ReviewsNewHeaderActionsProps = {
  readonly activePath: ReviewsNewPathMode | null;
};

/** Header actions for `/architecture/reviews/new` (RNX). */
export function ReviewsNewHeaderActions(props: ReviewsNewHeaderActionsProps): React.JSX.Element | null {
  const buyerPolishedShell = isBuyerPolishedOperatorShellEnv();
  const onPathTab = reviewsNewShowsPathTabChrome(buyerPolishedShell, props.activePath);
  const showContextualHelp = !(buyerPolishedShell && onPathTab);

  if (!showContextualHelp) {
    return null;
  }

  return <PageContextualHelpButton />;
}
