"use client";

import { PageContextualHelpButton } from "@/components/usability/PageContextualHelpButton";
import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";
import type { ReviewsNewPathMode } from "@/lib/reviews-new-path-copy";

type ReviewsNewHeaderActionsProps = {
  readonly activePath: ReviewsNewPathMode | null;
};

/** Header actions for `/architecture/reviews/new` (RNX). */
export function ReviewsNewHeaderActions(props: ReviewsNewHeaderActionsProps): React.JSX.Element | null {
  if (isBuyerPolishedOperatorShellEnv()) {
    return null;
  }

  return <PageContextualHelpButton />;
}
