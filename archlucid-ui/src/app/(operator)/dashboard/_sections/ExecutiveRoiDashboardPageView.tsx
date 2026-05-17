import { OperatorWelcomeOnboarding } from "@/components/OperatorWelcomeOnboarding";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BUYER_EXECUTIVE_SUMMARY_VOCABULARY } from "@/lib/buyer-surface-vocabulary";

import { ExecutiveDashboardBaselineWarningBanner } from "./ExecutiveDashboardBaselineWarningBanner";
import { executiveRoiDashboardMockKpis } from "./executive-roi-dashboard-mock-kpis";
export function ExecutiveRoiDashboardPageView() {
  const k = executiveRoiDashboardMockKpis;
  const v = BUYER_EXECUTIVE_SUMMARY_VOCABULARY;

  return (
    <div className="mx-auto max-w-6xl space-y-8 px-4 py-8">
      <ExecutiveDashboardBaselineWarningBanner />
      <OperatorWelcomeOnboarding />
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight text-neutral-900 dark:text-neutral-100">
          {v.pageTitle}
        </h1>
        <p className="max-w-3xl text-sm text-neutral-600 dark:text-neutral-300">{v.pageLead}</p>
      </header>

      <section aria-labelledby="exec-roi-heading">
        <h2 id="exec-roi-heading" className="sr-only">
          {v.roiMetricsSrOnly}
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-neutral-600 dark:text-neutral-400">
                {v.architecturalDriftsPreventedMetric.title}
              </CardTitle>
              <CardDescription className="text-xs text-neutral-500 dark:text-neutral-500">
                {v.architecturalDriftsPreventedMetric.description}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="font-mono text-4xl font-semibold tabular-nums text-neutral-900 dark:text-neutral-50">
                {k.architecturalDriftsPrevented}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-neutral-600 dark:text-neutral-400">
                {v.estimatedHoursSavedMetric.title}
              </CardTitle>
              <CardDescription className="text-xs text-neutral-500 dark:text-neutral-500">
                {v.estimatedHoursSavedMetric.description}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="font-mono text-4xl font-semibold tabular-nums text-neutral-900 dark:text-neutral-50">
                {k.estimatedHoursSaved}
                <span className="ml-1 text-2xl font-medium text-neutral-600 dark:text-neutral-400">h</span>
              </p>
            </CardContent>
          </Card>

          <Card className="sm:col-span-2 lg:col-span-1">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-neutral-600 dark:text-neutral-400">
                {v.compliancePostureScoreMetric.title}
              </CardTitle>
              <CardDescription className="text-xs text-neutral-500 dark:text-neutral-500">
                {v.compliancePostureScoreMetric.description}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="font-mono text-4xl font-semibold tabular-nums text-neutral-900 dark:text-neutral-50">
                {k.compliancePosturePercent}%
              </p>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}
