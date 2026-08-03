"use client";

import { OperatorPageHeader } from "@/components/OperatorPageHeader";
import { PageContextualHelpButton } from "@/components/usability/PageContextualHelpButton";
import { START_REVIEW_LABEL } from "@/lib/architecture-workflow-labels";
import { REVIEWS_NEW_PAGE_LEAD } from "@/lib/buyer-polish-copy";

import { ReviewsNewSourcesStrip } from "./ReviewsNewSourcesStrip";

/** Hero + Evidence chrome for `/reviews/new` (RNX). */
export function ReviewsNewPageChrome(): React.JSX.Element {
  return (
    <>
      <OperatorPageHeader
        title={START_REVIEW_LABEL}
        titleTestId="reviews-new-page-title"
        subtitle={REVIEWS_NEW_PAGE_LEAD}
        subtitleTestId="reviews-new-page-lead"
        headingLevel="h1"
        actions={<PageContextualHelpButton />}
      />
      <ReviewsNewSourcesStrip />
    </>
  );
}
