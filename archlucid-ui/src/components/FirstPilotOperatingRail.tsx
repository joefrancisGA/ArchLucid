"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { HelpLink } from "@/components/HelpLink";
import { Button } from "@/components/ui/button";
import { fetchCorePilotCommitContext } from "@/lib/core-pilot-commit-context";
import { recordCorePilotRailChecklistStep } from "@/lib/core-pilot-rail-telemetry";
import {
  buildFirstPilotOperatingRailSignals,
  readFirstPilotEvidenceAcknowledged,
  resolveFirstPilotOperatingRailSteps,
  writeFirstPilotEvidenceAcknowledged,
  type FirstPilotOperatingRailStepStatus,
} from "@/lib/first-pilot-operating-rail-status";
import { FIRST_PILOT_OPERATING_RAIL_STEPS } from "@/lib/first-pilot-operating-rail-steps";
import { fetchHealthReadySummary } from "@/lib/fetch-health-ready";
import { loadProjectRunsMergedWithDemoFallback } from "@/lib/operator-run-picker-client";
import { SHOWCASE_STATIC_DEMO_RUN_ID } from "@/lib/showcase-static-demo";
import { cn } from "@/lib/utils";

const RAIL_MINIMIZED_STORAGE_KEY = "archlucid_first_pilot_operating_rail_minimized_v1";

type LoadPhase = "loading" | "ready";

function statusLabel(status: FirstPilotOperatingRailStepStatus): string {
  switch (status) {
    case "complete":
      return "Complete";
    case "current":
      return "Current step";
    case "attention":
      return "Needs attention";
    case "upcoming":
      return "Upcoming";
    default: {
      const exhaustive: never = status;

      return exhaustive;
    }
  }
}

function statusBadgeClass(status: FirstPilotOperatingRailStepStatus): string {
  switch (status) {
    case "complete":
      return "border-teal-200 bg-teal-50 text-teal-900 dark:border-teal-900 dark:bg-teal-950/50 dark:text-teal-100";
    case "current":
      return "border-teal-500 bg-teal-50 text-teal-950 shadow-sm dark:border-teal-500 dark:bg-teal-950/70 dark:text-teal-50";
    case "attention":
      return "border-amber-400 bg-amber-50 text-amber-950 dark:border-amber-700 dark:bg-amber-950/50 dark:text-amber-100";
    case "upcoming":
      return "border-neutral-200 bg-neutral-50 text-neutral-600 dark:border-neutral-700 dark:bg-neutral-900/60 dark:text-neutral-400";
    default: {
      const exhaustive: never = status;

      return exhaustive;
    }
  }
}

/**
 * Single first-pilot operating rail: six visible steps from setup verification through sponsor packet.
 * Operate surfaces stay out of the required path until after finalize (see layer-guidance deferral notes).
 */
export function FirstPilotOperatingRail() {
  const [phase, setPhase] = useState<LoadPhase>("loading");
  const [minimized, setMinimized] = useState(false);
  const [healthStatus, setHealthStatus] = useState<string | null>(null);
  const [runs, setRuns] = useState<Awaited<ReturnType<typeof loadProjectRunsMergedWithDemoFallback>>["items"]>([]);
  const [commitCtx, setCommitCtx] = useState({
    hasCommittedManifest: false,
    latestRunId: null as string | null,
    firstCommittedRunId: null as string | null,
  });

  useEffect(() => {
    try {
      if (typeof window !== "undefined" && window.localStorage.getItem(RAIL_MINIMIZED_STORAGE_KEY) === "1") {
        setMinimized(true);
      }
    } catch {
      /* private mode */
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function load(): Promise<void> {
      setPhase("loading");

      const [readyBody, merged, ctx] = await Promise.all([
        fetchHealthReadySummary().catch(() => null),
        loadProjectRunsMergedWithDemoFallback("default").catch(() => ({ items: [] })),
        fetchCorePilotCommitContext().catch(() => ({
          hasCommittedManifest: false,
          latestRunId: null,
          firstCommittedRunId: null,
        })),
      ]);

      if (cancelled) {
        return;
      }

      setHealthStatus(readyBody?.status ?? null);
      setRuns(merged.items);
      setCommitCtx(ctx);
      setPhase("ready");
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, []);

  const signals = useMemo(
    () =>
      buildFirstPilotOperatingRailSignals({
        healthStatus,
        runs,
        evidenceAcknowledged: readFirstPilotEvidenceAcknowledged(),
        hasCommittedManifest: commitCtx.hasCommittedManifest,
        latestRunId: commitCtx.latestRunId,
        firstCommittedRunId: commitCtx.firstCommittedRunId,
      }),
    [healthStatus, runs, commitCtx],
  );

  const resolved = useMemo(() => resolveFirstPilotOperatingRailSteps(signals), [signals]);

  const allComplete = resolved.every((r) => r.status === "complete");

  useEffect(() => {
    if (phase !== "ready") {
      return;
    }

    resolved.forEach((step, index) => {
      if (step.status === "complete") {
        recordCorePilotRailChecklistStep(index);
      }
    });
  }, [phase, resolved]);

  if (phase === "loading") {
    return (
      <div
        className="min-h-[4.5rem] rounded-lg border border-neutral-200 bg-white dark:border-neutral-700 dark:bg-neutral-950"
        aria-hidden
        data-testid="first-pilot-operating-rail-loading"
      />
    );
  }

  if (minimized) {
    return (
      <div
        className="rounded-lg border border-neutral-200 bg-white p-3 shadow-sm dark:border-neutral-700 dark:bg-neutral-950"
        data-testid="first-pilot-operating-rail-minimized"
      >
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => {
            setMinimized(false);

            try {
              window.localStorage.removeItem(RAIL_MINIMIZED_STORAGE_KEY);
            } catch {
              /* ignore */
            }
          }}
        >
          Show first-pilot path
        </Button>
      </div>
    );
  }

  return (
    <section
      aria-labelledby="first-pilot-operating-rail-heading"
      className="rounded-lg border border-teal-200/90 bg-white p-4 shadow-sm dark:border-teal-900/70 dark:bg-neutral-950"
      data-testid="first-pilot-operating-rail"
    >
      <div className="mb-3 flex flex-wrap items-start gap-2">
        <div className="min-w-0 flex-1">
          <h2
            id="first-pilot-operating-rail-heading"
            className="m-0 text-base font-semibold text-neutral-900 dark:text-neutral-100"
          >
            First-pilot operating path
          </h2>
          <p className="m-0 mt-1 max-w-prose text-sm text-neutral-600 dark:text-neutral-400">
            Six steps from setup verification to sponsor packet. Operate compare, governance dashboards, and V1.1
            connectors stay secondary until you have a finalized review package.
          </p>
        </div>
        <HelpLink
          docPath="/docs/runbooks/FIRST_PILOT_OPERATOR_PATH.md"
          label="Full first-pilot operator path on GitHub (new tab)"
        />
      </div>

      <ol className="m-0 list-none space-y-3 p-0">
        {FIRST_PILOT_OPERATING_RAIL_STEPS.map((step, index) => {
          const { status, primaryHref } = resolved[index];

          return (
            <li
              key={step.id}
              className={cn(
                "rounded-md border px-3 py-2.5",
                status === "current" ? "ring-1 ring-teal-400/60" : "",
                statusBadgeClass(status),
              )}
              data-testid={`first-pilot-rail-step-${step.id}`}
              aria-current={status === "current" ? "step" : undefined}
            >
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-semibold uppercase tracking-wide tabular-nums text-neutral-500 dark:text-neutral-400">
                  Step {index + 1}
                </span>
                <span className="sr-only">{statusLabel(status)}</span>
                <span
                  className="rounded-full border border-current/20 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide"
                  aria-hidden
                >
                  {statusLabel(status)}
                </span>
              </div>
              <p className="m-0 mt-1 text-sm font-semibold text-neutral-900 dark:text-neutral-100">{step.title}</p>
              <p className="m-0 mt-1 text-sm leading-snug text-neutral-700 dark:text-neutral-300">{step.shortBody}</p>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <Button variant="outline" size="sm" asChild>
                  <Link href={primaryHref}>{step.primaryLabel}</Link>
                </Button>
                {step.id === "ingest-evidence" && status !== "complete" ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      writeFirstPilotEvidenceAcknowledged();
                      window.location.assign(`/reviews/${encodeURIComponent(SHOWCASE_STATIC_DEMO_RUN_ID)}`);
                    }}
                  >
                    Use sample package instead
                  </Button>
                ) : null}
                {status === "attention" || status === "current" ? (
                  <HelpLink docPath={step.troubleshootDocPath} label={`Troubleshoot — ${step.title} (new tab)`} />
                ) : null}
              </div>
            </li>
          );
        })}
      </ol>

      {allComplete ? (
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <p className="m-0 text-sm font-medium text-teal-900 dark:text-teal-100">
            First-pilot path complete — share the sponsor packet, then open Operate surfaces only when you have a
            concrete follow-up question.
          </p>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            data-testid="first-pilot-operating-rail-hide"
            onClick={() => {
              setMinimized(true);

              try {
                window.localStorage.setItem(RAIL_MINIMIZED_STORAGE_KEY, "1");
              } catch {
                /* ignore */
              }
            }}
          >
            Hide path
          </Button>
        </div>
      ) : null}
    </section>
  );
}
