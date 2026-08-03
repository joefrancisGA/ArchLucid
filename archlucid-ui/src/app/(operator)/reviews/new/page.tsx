import { START_REVIEW_LABEL } from "@/lib/architecture-workflow-labels";
import { ARCHITECTURES_NEW_PATH } from "@/lib/architecture-routes";
import { redirect } from "next/navigation";
import { OperatorPageContainer } from "@/components/OperatorPageContainer";
import type { Metadata } from "next";
import dynamic from "next/dynamic";
import { Suspense } from "react";

import { NewReviewSampleEscapeLink } from "@/components/usability/NewReviewSampleEscapeLink";
import { NewRunWizardSkeleton } from "@/components/skeletons/NewRunWizardSkeleton";
import { CREATE_ARCHITECTURE_INTENT } from "@/lib/architecture-workflow-intent";

import { ReviewsNewPageChrome } from "./ReviewsNewPageChrome";

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
      <ReviewsNewPageChrome />
      <NewReviewSampleEscapeLink className="mt-2" />
      <div id="new-review-wizard" className="mt-4 scroll-mt-24">
        <Suspense fallback={<NewRunWizardSkeleton />}>
          <ReviewsNewPathSwitcher />
        </Suspense>
      </div>
    </OperatorPageContainer>
  );
}
