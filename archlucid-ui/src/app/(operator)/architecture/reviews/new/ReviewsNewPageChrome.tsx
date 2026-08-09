"use client";

import { OperatorPageHeader } from "@/components/OperatorPageHeader";
import { InlineGlossaryChip } from "@/components/InlineGlossaryChip";
import { PageContextualHelpButton } from "@/components/usability/PageContextualHelpButton";
import { START_REVIEW_LABEL } from "@/lib/architecture-workflow-labels";
import { REVIEWS_NEW_PAGE_LEAD } from "@/lib/buyer-polish-copy";

/** Hero + Evidence chrome for `/architecture/reviews/new` (RNX). */
export function ReviewsNewPageChrome(): React.JSX.Element {
  return (
    <>
      <OperatorPageHeader
        title={START_REVIEW_LABEL}
        titleTestId="reviews-new-page-title"
        subtitle={
          <>
            {REVIEWS_NEW_PAGE_LEAD} Each review becomes an{" "}
            <InlineGlossaryChip nounId="review-package">architecture package</InlineGlossaryChip> with an{" "}
            <InlineGlossaryChip nounId="evidence-trail">evidence trail</InlineGlossaryChip>.
          </>
        }
        subtitleTestId="reviews-new-page-lead"
        headingLevel="h1"
        actions={<PageContextualHelpButton />}
      />
</>
  );
}
