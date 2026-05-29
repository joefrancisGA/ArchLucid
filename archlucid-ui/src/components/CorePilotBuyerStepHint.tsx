"use client";

import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";

import { HelpLink } from "@/components/HelpLink";
import {
  corePilotCommitProgressFromContext,
  corePilotStepBadgeLabel,
  type CorePilotCommitProgressState,
} from "@/lib/core-pilot-commit-progress";
import { fetchCorePilotCommitContext } from "@/lib/core-pilot-commit-context";
import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";
import { OPERATOR_NAV_LINK_LABELS } from "@/lib/i18n";

type Phase = "loading" | "ready";

function StepBadge({ label }: { label: string }) {
  return (
    <span
      className="inline-block shrink-0 rounded-full bg-teal-100 px-2 py-0.5 text-[11px] font-semibold text-teal-800 dark:bg-teal-900/50 dark:text-teal-300"
      data-testid="core-pilot-buyer-step-badge"
    >
      {label}
    </span>
  );
}

function buyerHintBody(
  state: CorePilotCommitProgressState,
  latestRunId: string | null,
  firstCommittedRunId: string | null,
): ReactNode {
  if (state === "no-run") {
    return (
      <>
        Start a tenant-backed review when you are ready to move beyond the demonstration package.{" "}
        <Link
          href="/reviews/new"
          className="font-medium text-teal-800 underline decoration-teal-300 underline-offset-2 hover:text-teal-900 dark:text-teal-300 dark:decoration-teal-600"
        >
          {OPERATOR_NAV_LINK_LABELS.capture}
        </Link>
        .
      </>
    );
  }

  if (state === "has-run") {
    const href = latestRunId !== null ? `/reviews/${encodeURIComponent(latestRunId)}` : "/reviews?projectId=default";

    return (
      <>
        Finish automation and finalize the review package from review detail.{" "}
        <Link
          href={href}
          className="font-medium text-teal-800 underline decoration-teal-300 underline-offset-2 hover:text-teal-900 dark:text-teal-300 dark:decoration-teal-600"
        >
          Open your in-progress review
        </Link>
        .
      </>
    );
  }

  const href =
    firstCommittedRunId !== null
      ? `/reviews/${encodeURIComponent(firstCommittedRunId)}`
      : "/reviews?projectId=default";

  return (
    <>
      Review detail holds executive summary and deliverables.{" "}
      <Link
        href={href}
        className="font-medium text-teal-800 underline decoration-teal-300 underline-offset-2 hover:text-teal-900 dark:text-teal-300 dark:decoration-teal-600"
      >
        Open review package
      </Link>
      .
    </>
  );
}

/**
 * Buyer shell: compact Core Pilot position (Step N of 4) without operator checklist chrome.
 * Uses the same commit-context signals as {@link CorePilotNextStepsCard}.
 */
export function CorePilotBuyerStepHint() {
  const buyerShell = isBuyerPolishedOperatorShellEnv();
  const [phase, setPhase] = useState<Phase>("loading");
  const [progress, setProgress] = useState<CorePilotCommitProgressState>("no-run");
  const [latestRunId, setLatestRunId] = useState<string | null>(null);
  const [firstCommittedRunId, setFirstCommittedRunId] = useState<string | null>(null);

  useEffect(() => {
    if (!buyerShell) {
      return;
    }

    let cancelled = false;

    async function load(): Promise<void> {
      setPhase("loading");

      try {
        const ctx = await fetchCorePilotCommitContext();

        if (cancelled) {
          return;
        }

        setProgress(corePilotCommitProgressFromContext(ctx));
        setLatestRunId(ctx.latestRunId);
        setFirstCommittedRunId(ctx.firstCommittedRunId);
        setPhase("ready");
      } catch {
        if (cancelled) {
          return;
        }

        setProgress("no-run");
        setLatestRunId(null);
        setFirstCommittedRunId(null);
        setPhase("ready");
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, [buyerShell]);

  if (!buyerShell || phase === "loading") {
    return null;
  }

  const badge = corePilotStepBadgeLabel(progress);

  return (
    <section
      aria-label="First review progress"
      data-testid="core-pilot-buyer-step-hint"
      className="rounded-lg border border-neutral-200 bg-white px-3 py-2.5 shadow-sm dark:border-neutral-700 dark:bg-neutral-950"
    >
      <div className="flex flex-wrap items-center gap-2 gap-y-1">
        <StepBadge label={badge} />
        <p className="m-0 flex-1 text-sm leading-snug text-neutral-700 dark:text-neutral-300">
          {buyerHintBody(progress, latestRunId, firstCommittedRunId)}
        </p>
        <HelpLink docPath="/docs/CORE_PILOT.md" label="Core Pilot steps — guide on GitHub (new tab)" />
        <HelpLink
          docPath="/docs/runbooks/FIRST_PILOT_OPERATOR_PATH.md"
          label="First-pilot operator path — full walkthrough on GitHub (new tab)"
        />
      </div>
    </section>
  );
}
