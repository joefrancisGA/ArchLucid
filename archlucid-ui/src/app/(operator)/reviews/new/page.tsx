import { cn } from "@/lib/utils";
import { OperatorPageContainer } from "@/components/OperatorPageContainer";
import type { Metadata } from "next";
import dynamic from "next/dynamic";
import { Suspense } from "react";

import { NewReviewSampleEscapeLink } from "@/components/usability/NewReviewSampleEscapeLink";
import { InAppHelpLink } from "@/components/InAppHelpLink";
import { NewRunWizardSkeleton } from "@/components/skeletons/NewRunWizardSkeleton";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

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
        <InAppHelpLink helpSlug="pilot-guide" label="Review guide" variant="text" />
      </div>
      <p className={cn("mt-1 max-w-prose", OPERATOR_TYPOGRAPHY.helper)}>
        Start with a diagram or document (Quick start), or let ArchLucid guide you through what to include (Guided).
      </p>
      <NewReviewSampleEscapeLink className="mt-2" />
      <div id="new-review-wizard" className="mt-4 scroll-mt-24">
        <Suspense fallback={<NewRunWizardSkeleton />}>
          <ReviewsNewPathSwitcher />
        </Suspense>
      </div>
    </OperatorPageContainer>
  );
}
