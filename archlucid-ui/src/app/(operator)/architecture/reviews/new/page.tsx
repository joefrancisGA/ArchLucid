import { START_REVIEW_LABEL } from "@/lib/architecture/architecture-workflow-labels";
import type { Metadata } from "next";
import dynamic from "next/dynamic";
import { Suspense } from "react";

import { NewRunWizardSkeleton } from "@/components/skeletons/NewRunWizardSkeleton";

import { ReviewsNewPageShell } from "./ReviewsNewPageShell";

const ReviewsNewPathSwitcher = dynamic(
  () => import("./ReviewsNewPathSwitcher").then((module) => module.ReviewsNewPathSwitcher),
  { loading: () => <NewRunWizardSkeleton /> },
);

export const metadata: Metadata = {
  title: START_REVIEW_LABEL,
};

export default async function NewRunPage() {
  return (
    <Suspense fallback={<NewRunWizardSkeleton />}>
      <ReviewsNewPageShell>
        <ReviewsNewPathSwitcher />
      </ReviewsNewPageShell>
    </Suspense>
  );
}
