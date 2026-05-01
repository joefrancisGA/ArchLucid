import Link from "next/link";

import { GettingStartedTrialSection } from "@/components/GettingStartedTrialSection";
import { OperatorFirstRunWorkflowPanel } from "@/components/OperatorFirstRunWorkflowPanel";

import { GlossaryTooltip } from "@/components/GlossaryTooltip";

type OnboardingPageProps = {
  searchParams: Promise<{ source?: string }>;
};

/**
 * Canonical onboarding orientation: trial card when `?source=registration` is set,
 * followed by the core first-manifest checklist wizard.
 */
export default async function OnboardingPage({ searchParams }: OnboardingPageProps) {
  const p = await searchParams;
  const fromRegistration = p.source === "registration";

  return (
    <main className="mx-auto max-w-3xl space-y-8 px-1 sm:px-0">
      <h1 className="m-0 text-2xl font-semibold tracking-tight text-neutral-900 dark:text-neutral-100">
        Onboarding
      </h1>
      <p className="m-0 text-sm text-neutral-600 dark:text-neutral-400 max-w-prose">
        Follow the checklist below to complete your first architecture review. For the full home overview, go to{" "}
        <Link className="font-medium text-teal-800 underline dark:text-teal-300" href="/">
          Home
        </Link>
        .
      </p>
      <p className="m-0 text-sm text-neutral-600 dark:text-neutral-400 max-w-prose">
        Prefer proof before wiring your own tenant?{" "}
        <Link className="font-medium text-teal-800 underline dark:text-teal-300" href="/demo/explain">
          See a live run — citations &amp; <GlossaryTooltip termKey="provenance">provenance</GlossaryTooltip>
        </Link>
        .
      </p>
      <GettingStartedTrialSection fromRegistrationQuery={fromRegistration} />
      <div>
        <OperatorFirstRunWorkflowPanel />
      </div>
    </main>
  );
}
