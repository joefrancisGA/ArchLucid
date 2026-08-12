import { START_REVIEW_LABEL } from "@/lib/architecture/architecture-workflow-labels";
import { OperatorPageContainer } from "@/components/OperatorPageContainer";
import type { Metadata } from "next";
import dynamic from "next/dynamic";
import { Suspense } from "react";

import { NewRunWizardSkeleton } from "@/components/skeletons/NewRunWizardSkeleton";

import { ReviewsNewPageChrome } from "./ReviewsNewPageChrome";

const ReviewsNewPathSwitcher = dynamic(
  () => import("./ReviewsNewPathSwitcher").then((module) => module.ReviewsNewPathSwitcher),
  { loading: () => <NewRunWizardSkeleton /> },
);

export const metadata: Metadata = {
  title: START_REVIEW_LABEL,
};

export default async function NewRunPage() {
  return (
    <OperatorPageContainer variant="workflow">
      <ReviewsNewPageChrome />
      <div id="new-review-wizard" className="mt-6 scroll-mt-24">
        <Suspense fallback={<NewRunWizardSkeleton />}>
          <ReviewsNewPathSwitcher />
        </Suspense>
      </div>
    </OperatorPageContainer>
  );
}
