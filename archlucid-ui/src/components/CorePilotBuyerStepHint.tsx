"use client";

import { cn } from "@/lib/utils";
import Link from "next/link";
import type { ReactNode } from "react";

import { OperatorHomeGuidanceLink } from "@/components/operator-home/OperatorHomeGuidanceLink";
import { OperatorHomeGuidanceLinks } from "@/components/operator-home/OperatorHomeGuidanceLinks";
import { useCorePilotCommitContextQuery } from "@/hooks/use-core-pilot-commit-context-query";
import {
  corePilotCommitProgressFromContext,
  corePilotStepBadgeLabel,
  type CorePilotCommitProgressState,
} from "@/lib/core-pilot-commit-progress";
import { BUYER_ONBOARDING_PAGE_TITLE } from "@/lib/buyer/buyer-polish-copy";
import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";
import { OPERATOR_TYPOGRAPHY, OPERATOR_TYPE_SCALE } from "@/lib/design-tokens";
import { OPERATOR_START_REVIEW_QUICK_ACTION_LABEL } from "@/lib/operator/operator-nav-labels";


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
  const { data, isPending, isError } = useCorePilotCommitContextQuery({ enabled: buyerShell });

  if (!buyerShell || isPending) {
    return null;
  }

  const progress: CorePilotCommitProgressState = isError ? "no-run" : corePilotCommitProgressFromContext(data);
  const latestRunId = isError ? null : data.latestRunId;
  const firstCommittedRunId = isError ? null : data.firstCommittedRunId;

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
