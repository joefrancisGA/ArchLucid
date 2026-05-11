import type { Metadata } from "next";

import { OperatorWelcomeOnboarding } from "@/components/OperatorWelcomeOnboarding";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Executive summary",
};

/** Placeholder KPIs until the executive ROI API exists (`docs/assessments/LATEST.md`). */
const MOCK_ARCHITECTURAL_DRIFTS_PREVENTED = 12;
const MOCK_ESTIMATED_HOURS_SAVED = 45;
const MOCK_COMPLIANCE_POSTURE_PERCENT = 92;

export default function ExecutiveRoiDashboardPage() {
  return (
    <div className="mx-auto max-w-6xl space-y-8 px-4 py-8">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight text-neutral-900 dark:text-neutral-100">
          Executive summary
        </h1>
        <p className="max-w-3xl text-sm text-neutral-600 dark:text-neutral-300">
          High-level ROI indicators for sponsors. Figures below are illustrative placeholders until live workspace metrics
          are wired.
        </p>
      </header>

      <section aria-labelledby="exec-roi-heading">
        <h2 id="exec-roi-heading" className="sr-only">
          Executive ROI metrics
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-neutral-600 dark:text-neutral-400">
                Architectural drifts prevented
              </CardTitle>
              <CardDescription className="text-xs text-neutral-500 dark:text-neutral-500">
                Early correction count (mock)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="font-mono text-4xl font-semibold tabular-nums text-neutral-900 dark:text-neutral-50">
                {MOCK_ARCHITECTURAL_DRIFTS_PREVENTED}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-neutral-600 dark:text-neutral-400">
                Estimated hours saved
              </CardTitle>
              <CardDescription className="text-xs text-neutral-500 dark:text-neutral-500">
                Architect time (mock)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="font-mono text-4xl font-semibold tabular-nums text-neutral-900 dark:text-neutral-50">
                {MOCK_ESTIMATED_HOURS_SAVED}
                <span className="ml-1 text-2xl font-medium text-neutral-600 dark:text-neutral-400">h</span>
              </p>
            </CardContent>
          </Card>

          <Card className="sm:col-span-2 lg:col-span-1">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-neutral-600 dark:text-neutral-400">
                Compliance posture score
              </CardTitle>
              <CardDescription className="text-xs text-neutral-500 dark:text-neutral-500">
                Aggregate posture (mock)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="font-mono text-4xl font-semibold tabular-nums text-neutral-900 dark:text-neutral-50">
                {MOCK_COMPLIANCE_POSTURE_PERCENT}%
              </p>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}
