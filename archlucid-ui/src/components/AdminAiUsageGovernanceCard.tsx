"use client";

import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { OperatorSectionLoadFailure } from "@/components/operator/OperatorSectionLoadFailure";
import { fetchAdminAiUsageDashboard } from "@/lib/admin-ai-usage-dashboard";
import { OPERATOR_CARD, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { operatorQueryKeys } from "@/lib/query/operator-query-keys";
import { OPERATOR_QUERY_STALE_MS } from "@/lib/query/operator-query-stale-time";

export function AdminAiUsageGovernanceCard() {
  const { data, isError, isLoading, refetch, isFetching } = useQuery({
    queryKey: operatorQueryKeys.adminAiUsageDashboard,
    queryFn: fetchAdminAiUsageDashboard,
    staleTime: OPERATOR_QUERY_STALE_MS,
    retry: false,
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader className={OPERATOR_CARD.header}>
          <CardTitle className={OPERATOR_TYPOGRAPHY.sectionTitle}>AI usage governance</CardTitle>
        </CardHeader>
        <CardContent className={OPERATOR_CARD.content}>
          <p className={cn("m-0", OPERATOR_TYPOGRAPHY.helper)}>Loading…</p>
        </CardContent>
      </Card>
    );
  }

  if (isError || data === undefined) {
    return (
      <Card data-testid="admin-ai-usage-governance-card">
        <CardHeader className={OPERATOR_CARD.header}>
          <CardTitle className={OPERATOR_TYPOGRAPHY.sectionTitle}>AI usage governance</CardTitle>
        </CardHeader>
        <CardContent className={OPERATOR_CARD.content}>
          <OperatorSectionLoadFailure
            message="Could not load AI usage governance data."
            onRetry={() => void refetch()}
            retrying={isFetching}
            testId="admin-ai-usage-governance-load-failure"
          />
        </CardContent>
      </Card>
    );
  }

  const featureRows = Object.entries(data.usageByFeatureUsd).sort((a, b) => b[1] - a[1]);
  const expensiveEvents = data.recentEvents.filter((e) => e.estimatedCostUsd >= 0.25 && !e.servedFromDemoCache);
  const exhaustionEvents = data.recentEvents.filter((e) => e.budgetBlocked);

  return (
    <Card data-testid="admin-ai-usage-governance-card">
      <CardHeader className={OPERATOR_CARD.header}>
        <CardTitle className={OPERATOR_TYPOGRAPHY.sectionTitle}>AI usage governance</CardTitle>
      </CardHeader>
      <CardContent className={cn(OPERATOR_CARD.content, "space-y-4")}>
        <p className={cn("m-0", OPERATOR_TYPOGRAPHY.body)}>
          Workspace kind: <strong>{data.workspaceKind}</strong> · Budget remaining:{" "}
          <strong>${data.remainingAmountUsd.toFixed(2)}</strong> of ${data.budgetAmountUsd.toFixed(2)} ({data.resetPeriod})
        </p>

        {featureRows.length > 0 ? (
          <div>
            <p className={cn("m-0 mb-2 font-medium", OPERATOR_TYPOGRAPHY.body)}>Usage by feature (30 days)</p>
            <ul className={cn("m-0 list-disc space-y-1 pl-5", OPERATOR_TYPOGRAPHY.helper)}>
              {featureRows.map(([feature, usd]) => (
                <li key={feature}>
                  {feature}: ${usd.toFixed(2)}
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        {expensiveEvents.length > 0 ? (
          <div>
            <p className={cn("m-0 mb-2 font-medium", OPERATOR_TYPOGRAPHY.body)}>Recent expensive requests</p>
            <ul className={cn("m-0 list-disc space-y-1 pl-5", OPERATOR_TYPOGRAPHY.helper)}>
              {expensiveEvents.slice(0, 5).map((event, index) => (
                <li key={`${event.occurredUtc}-${index}`}>
                  {event.feature} · ${event.estimatedCostUsd.toFixed(2)} · {event.providerKind}
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        {exhaustionEvents.length > 0 ? (
          <div>
            <p className={cn("m-0 mb-2 font-medium text-rose-800 dark:text-rose-200", OPERATOR_TYPOGRAPHY.body)}>
              Budget exhaustion events
            </p>
            <ul className={cn("m-0 list-disc space-y-1 pl-5 text-rose-900 dark:text-rose-100", OPERATOR_TYPOGRAPHY.helper)}>
              {exhaustionEvents.slice(0, 5).map((event, index) => (
                <li key={`blocked-${event.occurredUtc}-${index}`}>
                  {event.feature} blocked for {event.userId ?? "unknown user"}
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
