import { START_REVIEW_LABEL } from "@/lib/architecture/architecture-workflow-labels";
import type { Metadata } from "next";
import { Suspense } from "react";

import { NewRunWizardSkeleton } from "@/components/skeletons/NewRunWizardSkeleton";

import { ReviewsNewPageShell } from "./ReviewsNewPageShell";
import { ReviewsNewRouteBody } from "./ReviewsNewRouteBody";

export const metadata: Metadata = {
  title: START_REVIEW_LABEL,
};

export default async function NewRunPage() {
  return (
    <Suspense fallback={<NewRunWizardSkeleton />}>
      <ReviewsNewPageShell>
        <ReviewsNewRouteBody />
      </ReviewsNewPageShell>
    </Suspense>
  );
}
