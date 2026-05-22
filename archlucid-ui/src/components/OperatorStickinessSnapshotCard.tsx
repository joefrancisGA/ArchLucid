"use client";

import Link from "next/link";
import { useEffect, useState, type ReactElement } from "react";

import { OperatorApiProblem } from "@/components/OperatorApiProblem";
import { OperatorLoadingNotice } from "@/components/OperatorShellMessage";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { fetchOperatorStickinessSnapshot } from "@/lib/api";
import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";
import { formatInstantForLocale } from "@/lib/locale-datetime";
import type { ApiProblemDetails } from "@/lib/api-problem";
import type { OperatorStickinessSnapshotDto } from "@/types/operate-rhythm";

/**
 * Customer-success stickiness cockpit: funnel + habit metrics with links to next actions.
 */
export function OperatorStickinessSnapshotCard(): ReactElement | null {
  const buyerPolishedShell = isBuyerPolishedOperatorShellEnv();
  const [data, setData] = useState<OperatorStickinessSnapshotDto | null>(null);
  const [problem, setProblem] = useState<{
    problem: ApiProblemDetails | null;
    message: string;
    correlationId?: string | null;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load(): Promise<void> {
      setLoading(true);
      setProblem(null);

      try {
        const snap = await fetchOperatorStickinessSnapshot();

        if (!cancelled) {
          setData(snap);
        }
      } catch (e: unknown) {
        if (!cancelled) {
          const message = e instanceof Error ? e.message : "Could not load stickiness snapshot.";
          setProblem({ message, problem: null });
          setData(null);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, []);

  if (loading && !data) {
    return (
      <OperatorLoadingNotice>
        <strong>Loading pilot health snapshot.</strong>
      </OperatorLoadingNotice>
    );
  }

  if (problem !== null) {
    return (
      <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-900 dark:bg-amber-950/40">
        <OperatorApiProblem
          problem={problem.problem}
          fallbackMessage={problem.message}
          correlationId={problem.correlationId}
          variant="warning"
        />
      </div>
    );
  }

  if (!data) {
    return <></>;
  }

  const funnel = data.pilotFunnel;

  // Nothing meaningful to display until the tenant has at least one run.
  if (funnel.committedRunsInScope === 0 && funnel.totalRunsInScope === 0) {
    return null;
  }

  return (
    <section aria-labelledby="stickiness-snapshot-heading">
      <h2
        id="stickiness-snapshot-heading"
        className="mb-3 text-sm font-bold uppercase tracking-wide text-neutral-600 dark:text-neutral-300"
      >
        Pilot &amp; repeat usage
      </h2>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <h3 className="m-0 text-sm font-semibold text-neutral-900 dark:text-neutral-100">Reviews</h3>
          </CardHeader>
          <CardContent className="space-y-1 text-sm text-neutral-700 dark:text-neutral-300">
            <p className="m-0 tabular-nums">
              <span className="font-medium">{funnel.committedRunsInScope}</span> committed ·{" "}
              <span className="font-medium">{funnel.totalRunsInScope}</span> total
            </p>
            {data.latestRunId ? (
              <p className="m-0">
                Latest:{" "}
                <Link className="font-medium text-teal-800 underline dark:text-teal-300" href={`/reviews/${data.latestRunId}`}>
                  open review
                </Link>
              </p>
            ) : (
              <p className="m-0 text-neutral-500 dark:text-neutral-400">No latest run in scope.</p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <h3 className="m-0 text-sm font-semibold text-neutral-900 dark:text-neutral-100">First-value milestones</h3>
          </CardHeader>
          <CardContent className="space-y-1 text-xs text-neutral-600 dark:text-neutral-400">
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
            <h3 className="m-0 text-sm font-semibold text-neutral-900 dark:text-neutral-100">Governance habit</h3>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-neutral-700 dark:text-neutral-300">
            <p className="m-0 tabular-nums">
              Comparisons (30d): <span className="font-medium">{data.comparisonEventsLast30Days}</span>
            </p>
            <p className="m-0 tabular-nums">
              Pending approvals: <span className="font-medium">{data.pendingGovernanceApprovals}</span>
            </p>
            <Link className="text-xs font-medium text-teal-800 underline dark:text-teal-300" href="/governance">
              {buyerPolishedShell ? "View governance approval" : "Open governance workflow"}
            </Link>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
