import type { Metadata } from "next";
import { Suspense } from "react";

import { HelpLink } from "@/components/HelpLink";
import { ContextualHelp } from "@/components/ContextualHelp";
import { NewRunWizardSkeleton } from "@/components/skeletons/NewRunWizardSkeleton";
import { ReviewsNewPathSwitcher } from "./QuickReviewWizard";

export const metadata: Metadata = {
  title: "New architecture request",
};

export default function NewRunPage() {
  return (
    <main>
      <div className="mb-1 flex flex-wrap items-center gap-2">
        <h2 className="m-0">New architecture request</h2>
        <ContextualHelp helpKey="new-run-wizard" />
        <HelpLink
          docPath="/docs/library/PILOT_GUIDE.md"
          label="Full pilot guidance on GitHub (new tab)"
        />
      </div>
      <p className="mt-1 max-w-prose text-sm text-neutral-600 dark:text-neutral-400">
        Start fast with a pasted brief (Quick review) or use the full multi-step wizard with templates and imports.
      </p>
      <Suspense fallback={<NewRunWizardSkeleton />}>
        <ReviewsNewPathSwitcher />
      </Suspense>
    </main>
  );
}
