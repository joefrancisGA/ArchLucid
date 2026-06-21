import { OperatorPageContainer } from "@/components/OperatorPageContainer";
import type { Metadata } from "next";
import dynamic from "next/dynamic";
import { Suspense } from "react";

import { NewReviewSampleEscapeLink } from "@/components/usability/NewReviewSampleEscapeLink";
import { InAppHelpLink } from "@/components/InAppHelpLink";
import { NewRunWizardSkeleton } from "@/components/skeletons/NewRunWizardSkeleton";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

const ReviewsNewPathSwitcher = dynamic(
  () => import("./ReviewsNewPathSwitcher").then((module) => module.ReviewsNewPathSwitcher),
  { loading: () => <NewRunWizardSkeleton /> },
);

export const metadata: Metadata = {
  title: "New Architecture Review",
};

export default function NewRunPage() {
  return (
    <OperatorPageContainer variant="workflow">
      <div className="mb-1 flex flex-wrap items-baseline gap-3">
        <h2 className={cn("m-0", OPERATOR_TYPOGRAPHY.pageTitle)}>New Architecture Review</h2>
        <InAppHelpLink helpSlug="pilot-guide" label="Full pilot guidance" variant="text" />
      </div>
      <NewReviewSampleEscapeLink className="mt-2" />
      <div id="new-review-wizard" className="mt-4 scroll-mt-24">
        <Suspense fallback={<NewRunWizardSkeleton />}>
          <ReviewsNewPathSwitcher />
        </Suspense>
      </div>
    </OperatorPageContainer>
  );
}
