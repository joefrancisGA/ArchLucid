import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { NewRunWizardSkeleton } from "@/components/skeletons/NewRunWizardSkeleton";
import { START_REVIEW_LABEL } from "@/lib/architecture/architecture-workflow-labels";
import { isInvalidGuidOrSlugRouteToken } from "@/lib/route-dynamic-param";

import { NestedArchitectureStartReviewBody } from "./NestedArchitectureStartReviewBody";
import { ReviewsNewPageShell } from "../../../../reviews/new/ReviewsNewPageShell";

export const metadata: Metadata = {
  title: START_REVIEW_LABEL,
};

export default async function NestedArchitectureStartReviewPage({
  params,
}: {
  params: Promise<{ architectureId: string }>;
}): Promise<React.JSX.Element> {
  const { architectureId } = await params;

  if (isInvalidGuidOrSlugRouteToken(architectureId)) {
    notFound();
  }

  return (
    <Suspense fallback={<NewRunWizardSkeleton />}>
      <ReviewsNewPageShell>
        <NestedArchitectureStartReviewBody architectureId={architectureId} />
      </ReviewsNewPageShell>
    </Suspense>
  );
}
