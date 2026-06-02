import type { Metadata } from "next";
import { Suspense } from "react";

import { InAppHelpLink } from "@/components/InAppHelpLink";
import { FirstWeekRouteGuidance } from "@/components/FirstWeekRouteGuidance";
import { NewRunWizardSkeleton } from "@/components/skeletons/NewRunWizardSkeleton";
import { ReviewsNewPathSwitcher } from "./QuickReviewWizard";

export const metadata: Metadata = {
  title: "New Architecture Review",
};

export default function NewRunPage() {
  return (
    <div>
      <div className="mb-1 flex flex-wrap items-baseline gap-3">
        <h2 className="m-0">New Architecture Review</h2>
        <InAppHelpLink helpSlug="pilot-guide" label="Full pilot guidance" variant="text" />
      </div>
      <p className="mt-1 max-w-prose text-sm text-neutral-600 dark:text-neutral-400">
        Start fast with a pasted brief (Quick review) or use the full multi-step wizard with templates and imports.
      </p>
      <div className="mt-3">
        <FirstWeekRouteGuidance variant="new-review" />
      </div>
      <div id="new-review-wizard" className="scroll-mt-24">
        <Suspense fallback={<NewRunWizardSkeleton />}>
          <ReviewsNewPathSwitcher />
        </Suspense>
      </div>
    </div>
  );
}
