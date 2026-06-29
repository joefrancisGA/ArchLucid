import { cn } from "@/lib/utils";
import { OperatorPageContainer } from "@/components/OperatorPageContainer";
import { cn } from "@/lib/utils";
import type { Metadata } from "next";
import { cn } from "@/lib/utils";
import dynamic from "next/dynamic";
import { cn } from "@/lib/utils";
import { Suspense } from "react";

import { cn } from "@/lib/utils";
import { NewReviewSampleEscapeLink } from "@/components/usability/NewReviewSampleEscapeLink";
import { cn } from "@/lib/utils";
import { InAppHelpLink } from "@/components/InAppHelpLink";
import { cn } from "@/lib/utils";
import { NewRunWizardSkeleton } from "@/components/skeletons/NewRunWizardSkeleton";
import { cn } from "@/lib/utils";
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
        <InAppHelpLink helpSlug="pilot-guide" label="Full pilot guidance" variant="text" />
      </div>
      <p className={cn("mt-1 max-w-prose", OPERATOR_TYPOGRAPHY.helper)}>
        Use Quick start when you already have an architecture brief or evidence file. Use Guided intake when you want
        ArchLucid to walk you through the context.
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
