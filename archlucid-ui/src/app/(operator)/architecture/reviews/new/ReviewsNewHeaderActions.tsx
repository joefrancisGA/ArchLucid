"use client";

import { PageContextualHelpButton } from "@/components/usability/PageContextualHelpButton";
import { useProductionEvalChrome } from "@/hooks/useProductionDeskChrome";
import type { ReviewsNewPathMode } from "@/lib/reviews-new-path-copy";

type ReviewsNewHeaderActionsProps = {
  readonly activePath: ReviewsNewPathMode | null;
};

/** Header actions for `/architecture/reviews/new` (RNX). */
export function ReviewsNewHeaderActions(props: ReviewsNewHeaderActionsProps): React.JSX.Element | null {
  const buyerPolishedShell = useProductionEvalChrome();

  if (buyerPolishedShell) {
    return null;
  }

  return <PageContextualHelpButton />;
}
