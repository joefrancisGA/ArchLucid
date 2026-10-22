import type { AiUsageDashboardDerived } from "@/lib/ai-usage-dashboard-model";

/**
 * True only when every usage slice has settled and there is nothing billable or
 * token-bearing to show — avoids a premature or false “no usage” cockpit (TB-1217).
 */
export function isAiUsageQuietEmptyPeriod(
  derived: AiUsageDashboardDerived,
  costReportingLoading: boolean,
): boolean {
  if (costReportingLoading) {
    return false;
  }

  if (
    derived.costReportingState === "loading"
    || derived.budgetState === "loading"
    || derived.activityState === "loading"
  ) {
    return false;
  }

  // costReportingState "empty" already requires zero USD and zero tokens in daily buckets.
  if (derived.costReportingState !== "empty") {
    return false;
  }

  if (derived.hasAnyUsage) {
    return false;
  }

  // Recent events (even $0 / skipped) still deserve the activity panel.
  if (derived.activityState === "ready") {
    return false;
  }

  return true;
}
