import { START_REVIEW_LABEL } from "@/lib/architecture-workflow-labels";
import { ARCHITECTURES_NEW_PATH } from "@/lib/architecture-routes";
import { redirect } from "next/navigation";
import { cn } from "@/lib/utils";
import { OperatorPageContainer } from "@/components/OperatorPageContainer";
import type { Metadata } from "next";
import dynamic from "next/dynamic";
import { Suspense } from "react";

import { NewReviewSampleEscapeLink } from "@/components/usability/NewReviewSampleEscapeLink";
import { InAppHelpLink } from "@/components/InAppHelpLink";
import { NewRunWizardSkeleton } from "@/components/skeletons/NewRunWizardSkeleton";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { CREATE_ARCHITECTURE_INTENT } from "@/lib/architecture-workflow-intent";
import { REVIEWS_NEW_PAGE_LEAD } from "@/lib/buyer-polish-copy";

const ReviewsNewPathSwitcher = dynamic(
  () => import("./ReviewsNewPathSwitcher").then((module) => module.ReviewsNewPathSwitcher),
  { loading: () => <NewRunWizardSkeleton /> },
);

export const metadata: Metadata = {
  title: START_REVIEW_LABEL,
};

type NewRunPageProps = {
  readonly searchParams: Promise<{ intent?: string | string[] }>;
};

function resolveIntentParam(intent: string | string[] | undefined): string {
  if (Array.isArray(intent)) {
    return intent[0]?.trim() ?? "";
  }

  return intent?.trim() ?? "";
}

export default async function NewRunPage(props: NewRunPageProps) {
  const resolvedSearchParams = await props.searchParams;
  const isCreateArchitectureIntent =
    resolveIntentParam(resolvedSearchParams.intent) === CREATE_ARCHITECTURE_INTENT;

  if (isCreateArchitectureIntent) {
    redirect(ARCHITECTURES_NEW_PATH);
  }

  return (
    <OperatorPageContainer variant="workflow">
      <div className={cn("mt-6 mb-1 flex flex-wrap items-baseline gap-3")}>
        <h2 className={cn("m-0", OPERATOR_TYPOGRAPHY.pageTitle)}>{START_REVIEW_LABEL}</h2>
        <InAppHelpLink helpSlug="review-guide" label="Review guide" variant="text" />
      </div>
      <p className={cn("mt-1 max-w-prose", OPERATOR_TYPOGRAPHY.helper)} data-testid="reviews-new-page-lead">
        {REVIEWS_NEW_PAGE_LEAD}
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
