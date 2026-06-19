import { OperatorPageContainer } from "@/components/OperatorPageContainer";
import type { Metadata } from "next";
import { Suspense } from "react";

import { NewReviewSampleEscapeLink } from "@/components/usability/NewReviewSampleEscapeLink";
import { ContextualHelp } from "@/components/ContextualHelp";
import { InAppHelpLink } from "@/components/InAppHelpLink";
import { NewRunWizardSkeleton } from "@/components/skeletons/NewRunWizardSkeleton";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";
import { ReviewsNewPathSwitcher } from "./QuickReviewWizard";

export const metadata: Metadata = {
  title: "New Architecture Review",
};

export default function NewRunPage() {
  return (
    <OperatorPageContainer variant="workflow">
      <div className="mb-1 flex flex-wrap items-baseline gap-3">
        <h2 className={cn("m-0", OPERATOR_TYPOGRAPHY.pageTitle)}>New Architecture Review</h2>
        <ContextualHelp helpKey="new-run-wizard" />
        <InAppHelpLink helpSlug="pilot-guide" label="Full pilot guidance" variant="text" />
      </div>
      <p className="mt-1 max-w-prose text-sm text-neutral-600 dark:text-neutral-400">
        Start with guided intake, or use quick review if you already have a complete architecture brief.
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
