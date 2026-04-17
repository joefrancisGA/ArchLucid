import type { Metadata } from "next";
import { Suspense } from "react";

import { OnboardingStartClient } from "./OnboardingStartClient";

export const metadata: Metadata = {
  title: "Trial onboarding",
  description: "Post-signup checklist and links into the new-run wizard with your seeded sample run.",
};

function OnboardingStartFallback() {
  return <p className="text-sm text-neutral-600 dark:text-neutral-400">Loading…</p>;
}

export default function OnboardingStartPage() {
  return (
    <main>
      <h2 className="mb-2 text-xl font-semibold text-neutral-900 dark:text-neutral-100">Onboarding</h2>
      <p className="mb-6 max-w-3xl text-sm text-neutral-700 dark:text-neutral-300">
        Use the checklist below to confirm trial limits, then open the seeded sample run or continue in the guided
        wizard with the sample highlighted on step one.
      </p>
      <Suspense fallback={<OnboardingStartFallback />}>
        <OnboardingStartClient />
      </Suspense>
    </main>
  );
}
