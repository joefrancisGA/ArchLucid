"use client";

import Link from "next/link";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { loadProjectRunsMergedWithDemoFallback } from "@/lib/operator-run-picker-client";
import {
  fetchCorePilotTeamChecklist,
  putCorePilotTeamChecklistStep,
} from "@/lib/api";
import { corePilotStepDoneStorageKey, emitCorePilotChecklistChanged } from "@/lib/core-pilot-checklist-storage";
import type { CorePilotCommitContext } from "@/lib/core-pilot-commit-context";
import { fetchCorePilotCommitContext } from "@/lib/core-pilot-commit-context";
import { recordCorePilotRailChecklistStep } from "@/lib/core-pilot-rail-telemetry";
import {
  CORE_PILOT_FIRST_REVIEW_HEADING,
  CORE_PILOT_FIRST_REVIEW_HEADING_COMPACT,
  CORE_PILOT_FIRST_REVIEW_MINIMIZED_BUTTON,
  CORE_PILOT_FIRST_SESSION_GUIDANCE_BULLETS,
  CORE_PILOT_WORKFLOW_SUMMARY_LINE,
  OPERATOR_SAMPLE_PACKAGE_SHORTCUTS_HEADING,
} from "@/lib/core-pilot-first-review-copy";
import { CORE_PILOT_STEPS } from "@/lib/core-pilot-steps";
import { OPERATOR_CO_ARCHITECT_CHECKLIST_KICKER } from "@/lib/operator-co-architect-copy";
import { readHasExistingRunsCache, writeHasExistingRunsCache } from "@/lib/operator-run-presence";
import { getShowcaseManifestHref, getShowcaseWalkthroughHref } from "@/lib/buyer-safe-review-navigation";
import { SHOWCASE_STATIC_DEMO_RUN_ID } from "@/lib/showcase-static-demo";

const minimizedStorageKey = "archlucid_operator_workflow_guide_v1";
const graduatedStorageKey = "archlucid_checklist_graduated";

const emptyCommitContext: CorePilotCommitContext = {
  hasCommittedManifest: false,
  committedReviewCount: 0,
  latestRunId: null,
  firstCommittedRunId: null,
  secondCommittedRunId: null,
};

const showcaseCommitContext: CorePilotCommitContext = {
  hasCommittedManifest: true,
  committedReviewCount: 1,
  latestRunId: SHOWCASE_STATIC_DEMO_RUN_ID,
  firstCommittedRunId: SHOWCASE_STATIC_DEMO_RUN_ID,
  secondCommittedRunId: null,
};

const corePilotSteps = CORE_PILOT_STEPS;

/**
 * Collapsible first architecture-review checklist. Persists "minimized" in localStorage. Compact for a side column; step actions are
 * outline buttons so they do not compete with the main home CTAs.
 */
export function OperatorFirstRunWorkflowPanel(props: { exploreCompletedOutput?: boolean } = {}) {
  const exploreCompletedOutput = props.exploreCompletedOutput === true;
  const autoGraduateBlockedRef = useRef(false);
  const [hydrated, setHydrated] = useState(false);
  const [minimized, setMinimized] = useState(false);
  const [graduated, setGraduated] = useState(false);
  const [doneByIndex, setDoneByIndex] = useState<boolean[]>(() => corePilotSteps.map(() => false));
  const [hasAnyRun, setHasAnyRun] = useState(false);
  const [commitCtx, setCommitCtx] = useState<CorePilotCommitContext>(() =>
    exploreCompletedOutput ? showcaseCommitContext : emptyCommitContext,
  );

  useEffect(() => {
    if (exploreCompletedOutput) {
      return;
    }

    let cancelled = false;

    void (async () => {
      try {
        const ctx = await fetchCorePilotCommitContext();

        if (!cancelled) {
          setCommitCtx(ctx);
        }
      } catch {
        if (!cancelled) {
          setCommitCtx(emptyCommitContext);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [exploreCompletedOutput]);

  useEffect(() => {
    const nextDone: boolean[] = [];

    for (let i = 0; i < corePilotSteps.length; i++) {
      try {
        if (typeof window !== "undefined" && window.localStorage.getItem(corePilotStepDoneStorageKey(i)) === "1") {
          nextDone.push(true);
        } else {
          nextDone.push(false);
        }
      } catch {
        nextDone.push(false);
      }
    }

    setDoneByIndex(nextDone);

    const allDoneFromStorage = nextDone.length === corePilotSteps.length && nextDone.every(Boolean);

    try {
      if (typeof window !== "undefined" && window.localStorage.getItem(minimizedStorageKey) === "1") {
        setMinimized(true);
      }
    } catch {
      /* private mode */
    }

    try {
      if (typeof window !== "undefined") {
        const rawGrad = window.localStorage.getItem(graduatedStorageKey);

        if (rawGrad === "1" && allDoneFromStorage) {
          setGraduated(true);
        }

        if (rawGrad === "1" && !allDoneFromStorage) {
          window.localStorage.removeItem(graduatedStorageKey);
        }
      }
    } catch {
      /* private mode */
    }

    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated || exploreCompletedOutput) {
      return;
    }

    let cancelled = false;

    void (async () => {
      try {
        const rows = await fetchCorePilotTeamChecklist();

        if (cancelled) {
          return;
        }

        const serverDone = corePilotSteps.map(() => false);

        for (const r of rows) {
          if (r.stepIndex >= 0 && r.stepIndex < serverDone.length && r.isCompleted) {
            serverDone[r.stepIndex] = true;
          }
        }

        setDoneByIndex((prev) => {
          const merged = prev.map((p, i) => p || serverDone[i]);

          for (let i = 0; i < merged.length; i++) {
            try {
              if (merged[i]) {
                window.localStorage.setItem(corePilotStepDoneStorageKey(i), "1");
              } else {
                window.localStorage.removeItem(corePilotStepDoneStorageKey(i));
              }
            } catch {
              /* private mode */
            }
          }

          for (let i = 0; i < merged.length; i++) {
            if (merged[i] && !serverDone[i]) {
              void putCorePilotTeamChecklistStep(i, true).catch(() => {});
            }
          }

          return merged;
        });
        emitCorePilotChecklistChanged();
      } catch {
        /* unauthenticated / offline — keep local-only checklist */
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [exploreCompletedOutput, hydrated]);

  useEffect(() => {
    setHasAnyRun(readHasExistingRunsCache());
    let cancelled = false;

    void (async () => {
      try {
        const merged = await loadProjectRunsMergedWithDemoFallback("default");
        const next = merged.items.length > 0;

        if (cancelled) {
          return;
        }

        setHasAnyRun(next);
        writeHasExistingRunsCache(next);
      } catch {
        if (!cancelled) {
          setHasAnyRun(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const doneCount = useMemo(() => doneByIndex.filter(Boolean).length, [doneByIndex]);
  const allDone = doneCount === corePilotSteps.length;

  useEffect(() => {
    if (!hydrated || !allDone) {
      return;
    }

    if (autoGraduateBlockedRef.current) {
      return;
    }

    try {
      window.localStorage.setItem(graduatedStorageKey, "1");
    } catch {
      /* private mode */
    }

    setGraduated(true);
  }, [hydrated, allDone]);

  const toggleStep = useCallback(
    (index: number) => {
      autoGraduateBlockedRef.current = false;

      setDoneByIndex((prev) => {
        const next = [...prev];
        next[index] = !next[index];

        try {
          if (next[index]) {
            window.localStorage.setItem(corePilotStepDoneStorageKey(index), "1");
          } else {
            window.localStorage.removeItem(corePilotStepDoneStorageKey(index));
          }
        } catch {
          /* ignore */
        }

        if (!exploreCompletedOutput) {
          void putCorePilotTeamChecklistStep(index, next[index]).catch(() => {});
        }

        if (next[index]) {
          recordCorePilotRailChecklistStep(index);
        }

        return next;
      });
      emitCorePilotChecklistChanged();
    },
    [exploreCompletedOutput],
  );

  function minimize() {
    setMinimized(true);

    try {
      window.localStorage.setItem(minimizedStorageKey, "1");
    } catch {
      /* ignore */
    }
  }

  function expand() {
    setMinimized(false);

    try {
      window.localStorage.removeItem(minimizedStorageKey);
    } catch {
      /* ignore */
    }
  }

  if (!hydrated) {
    return <div className="min-h-[100px] w-full" aria-hidden />;
  }

  function revisitChecklist() {
    autoGraduateBlockedRef.current = true;

    try {
      window.localStorage.removeItem(graduatedStorageKey);
    } catch {
      /* private mode */
    }

    setGraduated(false);
    setMinimized(false);

    try {
      window.localStorage.removeItem(minimizedStorageKey);
    } catch {
      /* private mode */
    }
  }

  if (minimized) {
    return (
      <div data-onboarding="tour-core-pilot">
        <button
          type="button"
          onClick={expand}
          aria-expanded={false}
          aria-controls="first-run-workflow-panel"
          className="auth-panel-focus w-full cursor-pointer rounded-lg border border-neutral-300 bg-white px-3.5 py-2 text-left text-sm text-neutral-900 dark:border-neutral-600 dark:bg-neutral-900 dark:text-neutral-100"
        >
          {CORE_PILOT_FIRST_REVIEW_MINIMIZED_BUTTON}
        </button>
      </div>
    );
  }

  if (graduated && allDone) {
    return (
      <section
        data-onboarding="tour-core-pilot"
        className="w-full rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-3 dark:border-neutral-700 dark:bg-neutral-900/80"
        aria-labelledby="whats-next-heading"
      >
        <h2 id="whats-next-heading" className="m-0 text-sm font-semibold text-al-text-primary">
          What&apos;s next
        </h2>
        <p className="m-0 mt-1 text-xs text-neutral-700 dark:text-neutral-300">
          Optional: compare reviews, replay review process steps, or explore the architecture graph.
        </p>
        <div className="mt-2 flex flex-wrap gap-1.5">
          <Link
            className="inline-flex rounded-full border border-neutral-200 bg-white px-2 py-0.5 text-xs font-medium text-teal-800 no-underline hover:bg-neutral-50 dark:border-neutral-600 dark:bg-neutral-900 dark:text-teal-300 dark:hover:bg-neutral-800"
            href="/compare"
          >
            Compare
          </Link>
          <Link
            className="inline-flex rounded-full border border-neutral-200 bg-white px-2 py-0.5 text-xs font-medium text-teal-800 no-underline hover:bg-neutral-50 dark:border-neutral-600 dark:bg-neutral-900 dark:text-teal-300 dark:hover:bg-neutral-800"
            href="/replay"
          >
            Replay
          </Link>
          <Link
            className="inline-flex rounded-full border border-neutral-200 bg-white px-2 py-0.5 text-xs font-medium text-teal-800 no-underline hover:bg-neutral-50 dark:border-neutral-600 dark:bg-neutral-900 dark:text-teal-300 dark:hover:bg-neutral-800"
            href="/graph"
          >
            Graph
          </Link>
        </div>
        <button
          type="button"
          onClick={revisitChecklist}
          className="auth-panel-focus mt-2 cursor-pointer text-xs font-semibold text-teal-800 underline dark:text-teal-300"
        >
          Revisit checklist
        </button>
      </section>
    );
  }

  return (
    <section
      id="first-run-workflow-panel"
      data-onboarding="tour-core-pilot"
      className="w-full rounded-lg border border-neutral-200 bg-white px-3 py-3 shadow-sm dark:border-neutral-700 dark:bg-neutral-900"
      aria-labelledby="first-run-workflow-heading"
    >
      {hasAnyRun ? (
        <div className="mb-3 rounded-md border border-neutral-200 bg-al-surface-raised dark:border-neutral-800 px-3 py-2.5">
          <h2 id="first-run-workflow-heading" className="m-0 text-sm font-semibold text-teal-900 dark:text-teal-100">
            {OPERATOR_SAMPLE_PACKAGE_SHORTCUTS_HEADING}
          </h2>
          <div className="mt-2 flex flex-wrap gap-1.5">
            <Link
              className="inline-flex rounded-full border border-neutral-300 bg-al-surface-raised px-2 py-0.5 text-xs font-medium text-al-text-primary no-underline hover:bg-[var(--al-layer-hover)] dark:border-neutral-600"
              href={`/reviews/${encodeURIComponent(SHOWCASE_STATIC_DEMO_RUN_ID)}`}
            >
              Open sample review
            </Link>
            <Link
              className="inline-flex rounded-full border border-neutral-300 bg-al-surface-raised px-2 py-0.5 text-xs font-medium text-al-text-primary no-underline hover:bg-[var(--al-layer-hover)] dark:border-neutral-600"
              href={getShowcaseManifestHref()}
            >
              Manifest summary
            </Link>
            <Link
              className="inline-flex rounded-full border border-neutral-300 bg-al-surface-raised px-2 py-0.5 text-xs font-medium text-al-text-primary no-underline hover:bg-[var(--al-layer-hover)] dark:border-neutral-600"
              href={getShowcaseWalkthroughHref()}
            >
              Walkthrough
            </Link>
            <Link
              className="inline-flex rounded-full border border-neutral-300 bg-al-surface-raised px-2 py-0.5 text-xs font-medium text-al-text-primary no-underline hover:bg-[var(--al-layer-hover)] dark:border-neutral-600"
              href="/compare"
            >
              Compare
            </Link>
            {commitCtx.firstCommittedRunId !== null ? (
              <Link
                className="inline-flex rounded-full border border-neutral-300 bg-al-surface-raised px-2 py-0.5 text-xs font-medium text-al-text-primary no-underline hover:bg-[var(--al-layer-hover)] dark:border-neutral-600"
                href={`/reviews/${encodeURIComponent(commitCtx.firstCommittedRunId)}`}
              >
                Open finalized review
              </Link>
            ) : null}
          </div>
        </div>
      ) : null}

      <div className="mb-2 flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          {exploreCompletedOutput ? (
            <>
              <h2 id="first-run-workflow-heading" className="m-0 text-sm font-semibold text-al-text-primary">
                {OPERATOR_SAMPLE_PACKAGE_SHORTCUTS_HEADING}
              </h2>
              <p className="m-0 mt-1 text-xs text-neutral-600 dark:text-neutral-400">
                Claims Intake is the sample package — start with the manifest summary, then review detail or the read-only
                walkthrough. The checklist below is optional.
              </p>
              <p className="m-0 mt-2 text-xs font-medium text-neutral-700 dark:text-neutral-300">
                <Link
                  className="text-teal-800 underline decoration-teal-300/50 underline-offset-2 hover:text-teal-900 dark:text-teal-300 dark:hover:text-teal-200"
                  href={getShowcaseManifestHref()}
                >
                  View manifest summary
                </Link>{" "}
                ·{" "}
                <Link
                  className="text-teal-800 underline decoration-teal-300/50 underline-offset-2 hover:text-teal-900 dark:text-teal-300 dark:hover:text-teal-200"
                  href={`/reviews/${encodeURIComponent(SHOWCASE_STATIC_DEMO_RUN_ID)}`}
                >
                  Open review detail
                </Link>{" "}
                ·{" "}
                <Link
                  className="text-teal-800 underline decoration-teal-300/50 underline-offset-2 hover:text-teal-900 dark:text-teal-300 dark:hover:text-teal-200"
                  href={getShowcaseWalkthroughHref()}
                >
                  Read-only walkthrough
                </Link>
              </p>
            </>
          ) : !hasAnyRun ? (
            <h2 id="first-run-workflow-heading" className="m-0 text-sm font-semibold text-al-text-primary">
              {CORE_PILOT_FIRST_REVIEW_HEADING}
            </h2>
          ) : (
            <h2
              id="first-run-workflow-heading"
              className="m-0 text-xs font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400"
            >
              {CORE_PILOT_FIRST_REVIEW_HEADING_COMPACT}
            </h2>
          )}
          {!exploreCompletedOutput ? (
            <>
              <p className="m-0 mt-0.5 text-xs font-medium tracking-wide text-neutral-600 dark:text-neutral-400">
                {CORE_PILOT_WORKFLOW_SUMMARY_LINE}
              </p>
              <details className="m-0 mt-2 rounded-md border border-neutral-200/90 bg-neutral-50 px-3 py-2.5 dark:border-neutral-700 dark:bg-neutral-900/55">
                <summary className="cursor-pointer text-[11px] font-semibold uppercase tracking-wide text-neutral-600 dark:text-neutral-400">
                  First session coaching
                </summary>
                <p className="m-0 mt-1.5 text-xs leading-snug text-neutral-600 dark:text-neutral-400">
                  {OPERATOR_CO_ARCHITECT_CHECKLIST_KICKER}
                </p>
                <ul className="m-0 mt-1.5 list-disc space-y-1.5 pl-4 text-xs leading-snug text-neutral-800 dark:text-neutral-200">
                  {CORE_PILOT_FIRST_SESSION_GUIDANCE_BULLETS.map((line) => (
                    <li key={line} className="pl-0.5 marker:text-teal-700 dark:marker:text-teal-400">
                      {line}
                    </li>
                  ))}
                </ul>
              </details>
            </>
          ) : null}
        </div>
        <button
          type="button"
          onClick={minimize}
          aria-expanded={true}
          aria-controls="first-run-workflow-panel"
          className="auth-panel-focus shrink-0 cursor-pointer rounded-md border border-neutral-300 bg-white px-2.5 py-1 text-xs text-neutral-800 dark:border-neutral-600 dark:bg-neutral-900 dark:text-neutral-200"
        >
          Hide
        </button>
      </div>
      {!allDone ? (
        <div className="mt-2 flex items-center justify-between rounded-md border border-neutral-200/80 px-2.5 py-2 dark:border-neutral-800/80">
          <p className="m-0 text-xs text-neutral-600 dark:text-neutral-400" aria-live="polite">
            {doneCount} of {corePilotSteps.length} steps complete
          </p>
          <Link
            href="#core-pilot-checklist-anchor"
            className="shrink-0 text-xs font-medium text-teal-800 underline-offset-2 hover:underline dark:text-teal-300"
          >
            Continue checklist ↓
          </Link>
        </div>
      ) : (
        <p className="m-0 mt-2 rounded-md border border-emerald-700/40 bg-al-surface-raised px-2 py-1.5 text-xs text-al-text-primary dark:border-emerald-800/50">
          First review complete.
        </p>
      )}

    </section>
  );
}
