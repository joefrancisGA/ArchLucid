"use client";

import { cn } from "@/lib/utils";
import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";

import { OperatorHomeGuidanceLink } from "@/components/operator-home/OperatorHomeGuidanceLink";
import { OperatorHomeGuidanceLinks } from "@/components/operator-home/OperatorHomeGuidanceLinks";
import {
  corePilotCommitProgressFromContext,
  corePilotStepBadgeLabel,
  type CorePilotCommitProgressState,
} from "@/lib/core-pilot-commit-progress";
import { fetchCorePilotCommitContextCached } from "@/lib/core-pilot-commit-context";
import { BUYER_ONBOARDING_PAGE_TITLE } from "@/lib/buyer/buyer-polish-copy";
import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";
import { OPERATOR_TYPOGRAPHY, OPERATOR_TYPE_SCALE } from "@/lib/design-tokens";
import { OPERATOR_START_REVIEW_QUICK_ACTION_LABEL } from "@/lib/operator/operator-nav-labels";

type Phase = "loading" | "ready";

function StepBadge({ label }: { label: string }) {
  return (
    <span
      className={cn(
        "inline-block shrink-0 min-h-[20px] rounded-full bg-teal-100 px-2.5 py-0.5 text-teal-800 dark:bg-teal-900/50 dark:text-teal-300",
        OPERATOR_TYPOGRAPHY.badge,
        "font-semibold",
      )}
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
        Start a review on your own architecture when ready.{" "}
        <Link
          href="/architecture/reviews/new"
          className="font-medium text-teal-800 underline decoration-teal-300 underline-offset-2 hover:text-teal-900 dark:text-teal-300 dark:decoration-teal-600"
        >
          {OPERATOR_START_REVIEW_QUICK_ACTION_LABEL}
        </Link>
        .
      </>
    );
  }

  if (state === "has-run") {
    const href = latestRunId !== null ? `/architecture/reviews/${encodeURIComponent(latestRunId)}` : "/architecture/reviews";

    return (
      <>
        Finish automation and finalize the review from review detail.{" "}
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
      ? `/architecture/reviews/${encodeURIComponent(firstCommittedRunId)}`
      : "/architecture/reviews";

  return (
    <>
      Review detail holds executive summary and deliverables.{" "}
      <Link
        href={href}
        className="font-medium text-teal-800 underline decoration-teal-300 underline-offset-2 hover:text-teal-900 dark:text-teal-300 dark:decoration-teal-600"
      >
        Open review
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

    let canceled = false;

    async function load(): Promise<void> {
      setPhase("loading");

      try {
        const ctx = await fetchCorePilotCommitContextCached();

        if (canceled) {
          return;
        }

        setProgress(corePilotCommitProgressFromContext(ctx));
        setLatestRunId(ctx.latestRunId);
        setFirstCommittedRunId(ctx.firstCommittedRunId);
        setPhase("ready");
      } catch {
        if (canceled) {
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
      canceled = true;
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
        <p className={cn("m-0 flex-1", OPERATOR_TYPE_SCALE.body, "text-neutral-700 dark:text-neutral-300")}>
          {buyerHintBody(progress, latestRunId, firstCommittedRunId)}
        </p>
      </div>
      <OperatorHomeGuidanceLinks className="mt-2">
        <OperatorHomeGuidanceLink helpSlug="first-architecture-review" label={`${BUYER_ONBOARDING_PAGE_TITLE} — guide`} />
        <OperatorHomeGuidanceLink helpSlug="first-architecture-review" label="Full review walkthrough" />
      </OperatorHomeGuidanceLinks>
    </section>
  );
}
