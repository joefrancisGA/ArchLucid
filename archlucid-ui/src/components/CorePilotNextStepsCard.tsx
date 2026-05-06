"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { HelpLink } from "@/components/HelpLink";
import { fetchCorePilotCommitContext } from "@/lib/core-pilot-commit-context";

type Phase = "loading" | "ready";

/** Derived pilot state from commit-context signals. */
type PilotState = "no-run" | "has-run" | "committed";

function derivePilotState(hasCommit: boolean, latestRunId: string | null): PilotState {
  if (hasCommit) return "committed";
  if (latestRunId !== null) return "has-run";

  return "no-run";
}

/** Step badge shown in the panel header. */
function StepBadge({ label }: { label: string }) {
  return (
    <span
      className="inline-block rounded-full bg-teal-100 px-2 py-0.5 text-[11px] font-semibold text-teal-800 dark:bg-teal-900/50 dark:text-teal-300"
      data-testid="pilot-step-badge"
    >
      {label}
    </span>
  );
}

/** Run ID callout for support correlation. */
function RunIdNote({ runId }: { runId: string }) {
  return (
    <p
      className="m-0 text-[11px] text-neutral-500 dark:text-neutral-400"
      data-testid="pilot-run-id"
    >
      Run ID:{" "}
      <code className="font-mono">{runId}</code>
    </p>
  );
}

/**
 * "Skip for now" callout — explicitly names advanced features so first-time operators
 * are not distracted by Compare, Replay, and Governance surfaces.
 */
function SkipForNowNote() {
  return (
    <p
      className="m-0 mt-3 text-[11px] leading-relaxed text-neutral-500 dark:text-neutral-400"
      data-testid="pilot-skip-for-now"
    >
      <span className="font-medium text-neutral-600 dark:text-neutral-300">Skip for now:</span>{" "}
      Compare, Replay, Governance, and Ask — not needed for first architecture review.
    </p>
  );
}

/** Rescue link shown at the bottom of every pre-commit state. */
function RescueLink() {
  return (
    <p className="m-0 mt-2 text-[11px] text-neutral-500 dark:text-neutral-400" data-testid="pilot-rescue-link">
      Blocked?{" "}
      <Link href="/help" className="font-medium text-blue-700 underline underline-offset-2 dark:text-blue-400">
        Help
      </Link>
      {" "}or use the{" "}
      <HelpLink docPath="/docs/CORE_PILOT.md" label="Core Pilot guide (new tab)" />
    </p>
  );
}

/**
 * Core Pilot first-session status panel for operator home.
 *
 * Derives which of the four pilot steps is active from commit-context signals and renders:
 * - Current step indicator (Step N of 4)
 * - Next action CTA
 * - "Skip for now" note naming advanced features to ignore
 * - Rescue link when blocked
 * - Run ID for support correlation when available
 *
 * Operate links remain secondary: only offered after a manifest is committed.
 */
export function CorePilotNextStepsCard() {
  const [phase, setPhase] = useState<Phase>("loading");
  const [hasCommit, setHasCommit] = useState(false);
  const [latestRunId, setLatestRunId] = useState<string | null>(null);
  const [firstCommittedRunId, setFirstCommittedRunId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setPhase("loading");

      try {
        const ctx = await fetchCorePilotCommitContext();

        if (cancelled) {
          return;
        }

        setHasCommit(ctx.hasCommittedManifest);
        setLatestRunId(ctx.latestRunId);
        setFirstCommittedRunId(ctx.firstCommittedRunId);
        setPhase("ready");
      } catch {
        if (cancelled) {
          return;
        }

        setHasCommit(false);
        setLatestRunId(null);
        setFirstCommittedRunId(null);
        setPhase("ready");
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, []);

  if (phase === "loading") {
    return null;
  }

  const pilotState = derivePilotState(hasCommit, latestRunId);

  if (pilotState === "committed") {
    const reviewHref =
      firstCommittedRunId !== null ? `/reviews/${firstCommittedRunId}` : "/reviews?projectId=default";

    return (
      <section
        className="rounded-lg border border-neutral-200 bg-white p-4 shadow-sm dark:border-neutral-700 dark:bg-neutral-950"
        aria-labelledby="core-pilot-next-steps-complete"
        data-testid="core-pilot-next-steps-complete"
      >
        <div className="mb-2 flex flex-wrap items-center gap-2">
          <h2
            id="core-pilot-next-steps-complete"
            className="m-0 text-base font-semibold text-neutral-900 dark:text-neutral-100"
          >
            Core Pilot complete
          </h2>
          <StepBadge label="Step 4 of 4" />
        </div>
        <p className="mb-3 mt-2 text-sm text-neutral-700 dark:text-neutral-300">
          First committed manifest is in place. Review the architecture package and findings — export sponsor-ready
          Markdown/PDF from review detail when needed; CLI shortcuts below speed support tickets.
        </p>

        <div className="mb-3">
          <Link
            href={reviewHref}
            className="font-medium text-blue-700 underline underline-offset-2 dark:text-blue-400"
          >
            Open architecture review detail
          </Link>
        </div>

        <div className="mb-3 rounded-md border border-neutral-200 bg-neutral-50 p-3 text-xs leading-relaxed text-neutral-700 dark:border-neutral-600 dark:bg-neutral-900 dark:text-neutral-300">
          <p className="m-0 font-semibold text-neutral-800 dark:text-neutral-100">Copy/paste CLI (replace RUN)</p>
          <code className="mt-1 block whitespace-pre-wrap break-all font-mono">
            archlucid first-value-report RUN --save{"\n"}
            archlucid run-support-packet RUN
          </code>
          <p className="mb-0 mt-2 text-[11px] text-neutral-600 dark:text-neutral-400">
            <code className="font-mono">run-support-packet</code> prints manifest/version/trace/context for escalation — pair with{" "}
            <HelpLink docPath="/docs/library/CLI_USAGE.md" label="CLI_USAGE.md on GitHub (new tab)" />.
          </p>
        </div>

        {firstCommittedRunId !== null ? (
          <RunIdNote runId={firstCommittedRunId} />
        ) : null}

        <div className="mt-3 flex flex-col gap-2 border-t border-neutral-100 pt-3 text-sm dark:border-neutral-800">
          <p className="m-0 text-[11px] font-medium text-neutral-500 dark:text-neutral-400">
            Now available (optional):
          </p>
          <Link
            href="/governance/dashboard"
            className="text-neutral-600 underline decoration-neutral-400 underline-offset-2 hover:text-neutral-800 dark:text-neutral-400 dark:hover:text-neutral-200"
          >
            Workspace health (sponsor view)
          </Link>
          <Link href="/ask" className="font-medium text-blue-700 underline dark:text-blue-400">
            Open Ask (Operate)
          </Link>
        </div>
      </section>
    );
  }

  if (pilotState === "has-run") {
    return (
      <section
        className="rounded-lg border border-neutral-200 bg-white p-4 shadow-sm dark:border-neutral-700 dark:bg-neutral-950"
        aria-labelledby="core-pilot-next-steps"
        data-testid="core-pilot-next-steps"
      >
        <div className="mb-2 flex flex-wrap items-center gap-2">
          <h2 id="core-pilot-next-steps" className="m-0 text-base font-semibold text-neutral-900 dark:text-neutral-100">
            Core Pilot — your first architecture review
          </h2>
          <StepBadge label="Step 2–3 of 4" />
          <HelpLink docPath="/docs/CORE_PILOT.md" label="Open Core Pilot guide on GitHub (new tab)" />
        </div>

        {latestRunId !== null ? <RunIdNote runId={latestRunId} /> : null}

        <ol className="m-0 mt-3 list-none space-y-2 p-0 text-sm text-neutral-800 dark:text-neutral-200">
          <li className="flex items-start gap-2 text-neutral-400 dark:text-neutral-500" aria-label="Step 1 complete">
            <span aria-hidden className="mt-0.5 shrink-0 text-[11px] font-bold text-teal-600 dark:text-teal-400">✓</span>
            <span className="line-through">Create architecture request</span>
          </li>
          <li className="flex items-start gap-2" aria-label="Step 2 active">
            <span aria-hidden className="mt-0.5 shrink-0 text-[11px] font-bold text-teal-700 dark:text-teal-300">▶</span>
            <Link
              href={latestRunId !== null ? `/reviews/${latestRunId}` : "/reviews?projectId=default"}
              className="font-medium text-blue-700 underline dark:text-blue-400"
              data-testid="pilot-active-step-link"
            >
              Open Reviews — run the pipeline
            </Link>
          </li>
          <li className="flex items-start gap-2 text-neutral-500 dark:text-neutral-400" aria-label="Step 3 pending">
            <span aria-hidden className="mt-0.5 shrink-0 text-[11px] text-neutral-400">3.</span>
            <span>
              Commit a golden manifest from review detail when the pipeline completes (
              <HelpLink docPath="/docs/CORE_PILOT.md" label="Core Pilot — commit step (new tab)" />).
            </span>
          </li>
          <li className="flex items-start gap-2 text-neutral-500 dark:text-neutral-400" aria-label="Step 4 pending">
            <span aria-hidden className="mt-0.5 shrink-0 text-[11px] text-neutral-400">4.</span>
            <span>Review the architecture package and findings.</span>
          </li>
        </ol>

        <SkipForNowNote />
        <RescueLink />
      </section>
    );
  }

  return (
    <section
      className="rounded-lg border border-neutral-200 bg-white p-4 shadow-sm dark:border-neutral-700 dark:bg-neutral-950"
      aria-labelledby="core-pilot-next-steps"
      data-testid="core-pilot-next-steps"
    >
      <div className="mb-2 flex flex-wrap items-center gap-2">
        <h2 id="core-pilot-next-steps" className="m-0 text-base font-semibold text-neutral-900 dark:text-neutral-100">
          Core Pilot — your first architecture review
        </h2>
        <StepBadge label="Step 1 of 4" />
        <HelpLink docPath="/docs/CORE_PILOT.md" label="Open Core Pilot guide on GitHub (new tab)" />
      </div>

      <ol className="m-0 mt-3 list-none space-y-2 p-0 text-sm text-neutral-800 dark:text-neutral-200">
        <li className="flex items-start gap-2" aria-label="Step 1 active">
          <span aria-hidden className="mt-0.5 shrink-0 text-[11px] font-bold text-teal-700 dark:text-teal-300">▶</span>
          <Link
            href="/reviews/new"
            className="font-medium text-blue-700 underline dark:text-blue-400"
            data-testid="pilot-active-step-link"
          >
            Create architecture request
          </Link>
        </li>
        <li className="flex items-start gap-2 text-neutral-500 dark:text-neutral-400" aria-label="Step 2 pending">
          <span aria-hidden className="mt-0.5 shrink-0 text-[11px] text-neutral-400">2.</span>
          <span>Open Reviews — run the pipeline.</span>
        </li>
        <li className="flex items-start gap-2 text-neutral-500 dark:text-neutral-400" aria-label="Step 3 pending">
          <span aria-hidden className="mt-0.5 shrink-0 text-[11px] text-neutral-400">3.</span>
          <span>Commit the golden manifest from review detail.</span>
        </li>
        <li className="flex items-start gap-2 text-neutral-500 dark:text-neutral-400" aria-label="Step 4 pending">
          <span aria-hidden className="mt-0.5 shrink-0 text-[11px] text-neutral-400">4.</span>
          <span>Review the architecture package and findings.</span>
        </li>
      </ol>

      <SkipForNowNote />
      <RescueLink />
    </section>
  );
}
