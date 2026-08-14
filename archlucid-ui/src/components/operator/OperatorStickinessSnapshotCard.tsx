"use client";
import { cn } from "@/lib/utils";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

import Link from "next/link";
import type { ReactElement } from "react";

import { OperatorApiProblem } from "@/components/operator/OperatorApiProblem";
import { OperatorLoadingNotice } from "@/components/operator/OperatorShellMessage";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { useAssignedToMeFindingsCountQuery } from "@/hooks/use-assigned-to-me-findings-count-query";
import { useOperatorStickinessSnapshotQuery } from "@/hooks/use-operator-stickiness-snapshot-query";
import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";
import { GOVERNANCE_ASSIGNED_TO_ME_FINDINGS_PATH } from "@/lib/governance/governance-route-paths";
import { formatInstantForLocale } from "@/lib/locale-datetime";

/**
 * Customer-success stickiness cockpit: funnel + habit metrics with links to next actions.
 */
export function OperatorStickinessSnapshotCard(): ReactElement | null {
  const buyerPolishedShell = isBuyerPolishedOperatorShellEnv();
  const { data, isPending, isError, error } = useOperatorStickinessSnapshotQuery();
  const assignedToMeCountQuery = useAssignedToMeFindingsCountQuery({
    enabled: !isPending && !isError,
  });
  const assignedToMeCount = assignedToMeCountQuery.data ?? 0;

  if (isPending && !data) {
    return (
      <OperatorLoadingNotice>
        <strong>Loading pilot health snapshot.</strong>
      </OperatorLoadingNotice>
    );
  }

  if (isError) {
    const message = error instanceof Error ? error.message : "Could not load stickiness snapshot.";

    return (
      <div className={cn("rounded-md border border-amber-600/40 bg-al-surface-raised px-3 py-2 text-al-text-primary dark:border-amber-700/50 p-4", OPERATOR_TYPOGRAPHY.body)}>
        <OperatorApiProblem
          problem={null}
          fallbackMessage={message}
          variant="warning"
        />
      </div>
    );
  }

  if (!data) {
    return <></>;
  }

  const funnel = data.pilotFunnel;

  if (!funnel) {
    return null;
  }

  // Nothing meaningful to display until the tenant has at least one run.
  if (funnel.committedRunsInScope === 0 && funnel.totalRunsInScope === 0) {
    return null;
  }

  return (
    <section aria-labelledby="stickiness-snapshot-heading">
      <h2
        id="stickiness-snapshot-heading"
        className={cn("mb-3 font-bold uppercase tracking-wide text-neutral-600 dark:text-neutral-300", OPERATOR_TYPOGRAPHY.body)}
      >
        Pilot &amp; repeat usage
      </h2>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <h3 className={cn("m-0 font-semibold text-neutral-900 dark:text-neutral-100", OPERATOR_TYPOGRAPHY.cardTitle)}>Reviews</h3>
          </CardHeader>
          <CardContent className={cn("space-y-1 text-neutral-700 dark:text-neutral-300", OPERATOR_TYPOGRAPHY.body)}>
            <p className="m-0 tabular-nums">
              <span className="font-medium">{funnel.committedRunsInScope}</span> committed ·{" "}
              <span className="font-medium">{funnel.totalRunsInScope}</span> total
            </p>
            {data.latestRunId ? (
              <p className="m-0">
                Latest:{" "}
                <Link className="font-medium text-teal-800 underline dark:text-teal-300" href={`/architecture/reviews/${data.latestRunId}`}>
                  open review
                </Link>
              </p>
            ) : (
              <p className="m-0 text-neutral-500 dark:text-neutral-400">No recent review in scope.</p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <h3 className={cn("m-0 font-semibold text-neutral-900 dark:text-neutral-100", OPERATOR_TYPOGRAPHY.cardTitle)}>Adoption milestones</h3>
          </CardHeader>
          <CardContent className={cn("space-y-1 text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>
            <p className="m-0">
              First manifest:{" "}
              {formatInstantForLocale(funnel.firstGoldenManifestUtc ?? null)}
            </p>
            <p className="m-0">
              First comparison:{" "}
              {formatInstantForLocale(funnel.firstComparisonUtc ?? null)}
            </p>
            <p className="m-0">
              Product-learning (90d): <span className="font-medium text-neutral-800 dark:text-neutral-200">{funnel.productLearningSignalsLast90Days}</span>
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <h3 className={cn("m-0 font-semibold text-neutral-900 dark:text-neutral-100", OPERATOR_TYPOGRAPHY.cardTitle)}>Governance habit</h3>
          </CardHeader>
          <CardContent className={cn("space-y-2 text-neutral-700 dark:text-neutral-300", OPERATOR_TYPOGRAPHY.body)}>
            <p className="m-0 tabular-nums">
              Comparisons (30d): <span className="font-medium">{data.comparisonEventsLast30Days}</span>
            </p>
            <p className="m-0 tabular-nums">
              Pending approvals: <span className="font-medium">{data.pendingGovernanceApprovals}</span>
            </p>
            <p className="m-0 tabular-nums">
              Assigned to you: <span className="font-medium">{assignedToMeCount}</span>
            </p>
            <Link className={cn("font-medium text-teal-800 underline dark:text-teal-300", OPERATOR_TYPOGRAPHY.helper)} href="/governance/approval-queue">
              {buyerPolishedShell ? "View governance approval" : "Open governance workflow"}
            </Link>
            {assignedToMeCount > 0 ? (
              <Link
                className={cn("font-medium text-teal-800 underline dark:text-teal-300", OPERATOR_TYPOGRAPHY.helper)}
                href={GOVERNANCE_ASSIGNED_TO_ME_FINDINGS_PATH}
              >
                Open assigned findings
              </Link>
            ) : null}
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
