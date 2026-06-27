"use client";
import { ENTERPRISE_STATUS_LABELS, OPERATOR_TYPOGRAPHY, type EnterpriseStatusKind } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { StatusTag } from "@/components/ui/status-tag";
import { Button } from "@/components/ui/button";
import {
  fetchCorePilotCommitContext,
  type CorePilotCommitContext,
} from "@/lib/core-pilot-commit-context";
import {
  FIRST_VALUE_LANE_HEADING,
  isFirstValueLaneComplete,
  mapFirstValueLaneStatusLabel,
  resolveFirstValueLanePhases,
  type FirstValueLanePhaseStatus,
} from "@/lib/first-value-lane";
import { fetchHealthReadySummary } from "@/lib/fetch-health-ready";
import { loadProjectRunsMergedWithDemoFallback } from "@/lib/operator-run-picker-client";

const emptyCommitContext: CorePilotCommitContext = {
  hasCommittedManifest: false,
  committedReviewCount: 0,
  latestRunId: null,
  firstCommittedRunId: null,
  secondCommittedRunId: null,
  latestRunReadyToFinalize: false,
};

function mapLaneStatusToEnterpriseKind(status: FirstValueLanePhaseStatus): EnterpriseStatusKind {
  switch (status) {
    case "completed":
      return "ready";

    case "in_progress":
      return "needs-attention";

    case "blocked":
      return "blocked";

    case "not_started":
      return "neutral";

    default: {
      const exhaustive: never = status;

      return exhaustive;
    }
  }
}

function mapLaneStatusToTagLabel(status: FirstValueLanePhaseStatus): string {
  switch (status) {
    case "completed":
      return ENTERPRISE_STATUS_LABELS.ready;

    case "in_progress":
      return mapFirstValueLaneStatusLabel(status);

    case "blocked":
      return ENTERPRISE_STATUS_LABELS.blocked;

    case "not_started":
      return mapFirstValueLaneStatusLabel(status);

    default: {
      const exhaustive: never = status;

      return exhaustive;
    }
  }
}

/** Four-step first-value lane with explicit Not started / In progress / Completed / Blocked markers. */
export function FirstValueLanePanel(props: { readonly className?: string } = {}) {
  const [hydrated, setHydrated] = useState(false);
  const [healthBlocked, setHealthBlocked] = useState(false);
  const [hasAnyRun, setHasAnyRun] = useState(false);
  const [hasUncommittedRun, setHasUncommittedRun] = useState(false);
  const [commitContext, setCommitContext] = useState<CorePilotCommitContext>(emptyCommitContext);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      const [health, merged, ctx] = await Promise.all([
        fetchHealthReadySummary().catch(() => null),
        loadProjectRunsMergedWithDemoFallback("default").catch(() => ({ items: [] })),
        fetchCorePilotCommitContext().catch(() => emptyCommitContext),
      ]);

      if (cancelled) {
        return;
      }

      const healthStatus = (health?.status ?? "").toLowerCase();

      setHealthBlocked(healthStatus.length > 0 && healthStatus !== "ready" && healthStatus !== "ok");
      setHasAnyRun(merged.items.length > 0);
      setHasUncommittedRun(merged.items.some((run) => run.hasGoldenManifest !== true));
      setCommitContext(ctx);
      setHydrated(true);
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const phases = useMemo(
    () =>
      resolveFirstValueLanePhases({
        hasAnyRun,
        hasUncommittedRun,
        commitContext,
        healthBlocked,
      }),
    [commitContext, hasAnyRun, hasUncommittedRun, healthBlocked],
  );

  const laneComplete = isFirstValueLaneComplete(phases);
  const nextPhase = phases.find((phase) => phase.status === "in_progress" || phase.status === "blocked");

  if (!hydrated) {
    return <div className={cn("min-h-[88px]", props.className)} aria-hidden data-testid="first-value-lane-loading" />;
  }

  return (
    <section
      className={cn(
        "rounded-lg border border-neutral-200 bg-white px-4 py-3 shadow-sm dark:border-neutral-700 dark:bg-neutral-900",
        props.className,
      )}
      aria-labelledby="first-value-lane-heading"
      data-testid="first-value-lane-panel"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 space-y-1">
          <h2 id="first-value-lane-heading" className={cn("m-0 font-semibold text-neutral-900 dark:text-neutral-50", OPERATOR_TYPOGRAPHY.cardTitle)}>
            {FIRST_VALUE_LANE_HEADING}
          </h2>
          <p className={cn("m-0 text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>
            Minimum path to one sponsor-usable artifact — advanced branches stay out of lane until after first commit.
          </p>
        </div>
        <Link
          href="/help/first-value-20-minutes"
          className={cn("shrink-0 font-medium text-teal-800 underline-offset-2 hover:underline dark:text-teal-300", OPERATOR_TYPOGRAPHY.helper)}
        >
          Lane runbook
        </Link>
      </div>

      {laneComplete ? (
        <p
          className={cn("m-0 mt-3 rounded-md border border-emerald-700/40 bg-al-surface-raised px-2.5 py-2 text-al-text-primary dark:border-emerald-800/50", OPERATOR_TYPOGRAPHY.helper)}
          role="status"
        >
          First-value lane complete — sponsor artifact available from the committed review.
        </p>
      ) : null}

      <ol className="m-0 mt-3 list-none space-y-2 p-0" aria-label="First-value lane phases">
        {phases.map((phase, index) => (
          <li
            key={phase.id}
            className="rounded-md border border-neutral-200/90 px-3 py-2.5 dark:border-neutral-800"
            data-testid={`first-value-lane-phase-${phase.id}`}
          >
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div className="min-w-0 space-y-1">
                <p className={cn("m-0 font-medium text-neutral-900 dark:text-neutral-100", OPERATOR_TYPOGRAPHY.body)}>
                  {index + 1}. {phase.title}
                </p>
                <p className={cn("m-0 text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>{phase.summary}</p>
                {phase.advancedNote ? (
                  <p className={cn("m-0 text-neutral-500 dark:text-neutral-500", OPERATOR_TYPOGRAPHY.helper)}>{phase.advancedNote}</p>
                ) : null}
              </div>
              <StatusTag
                kind={mapLaneStatusToEnterpriseKind(phase.status)}
                label={mapLaneStatusToTagLabel(phase.status)}
              />
            </div>
            {(phase.status === "in_progress" || phase.status === "blocked") && nextPhase?.id === phase.id ? (
              <div className="mt-2">
                <Button asChild type="button" size="sm" variant="default">
                  <Link href={phase.primaryHref}>{phase.primaryLabel}</Link>
                </Button>
              </div>
            ) : null}
          </li>
        ))}
      </ol>
    </section>
  );
}
