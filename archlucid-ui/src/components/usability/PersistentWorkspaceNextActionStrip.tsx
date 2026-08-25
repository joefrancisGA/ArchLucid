"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { InlineGuidanceLabel } from "@/components/InlineGuidanceLabel";
import { Button } from "@/components/ui/button";
import { StatusTag } from "@/components/ui/status-tag";
import { CORE_PILOT_STEPS } from "@/lib/core-pilot-steps";
import { corePilotStepStatusTag, isCorePilotStepOptional } from "@/lib/core-pilot-step-status";
import { FIRST_REVIEW_GUIDE_PATH } from "@/lib/first-review-guide-route";
import { resolveCorePilotStepPresentation } from "@/lib/core-pilot-step-presentation";
import { resolvePersistentWorkspaceNextAction } from "@/lib/persistent-workspace-next-action";
import { useCorePilotCommitPresentationContext } from "@/lib/use-core-pilot-commit-presentation-context";
import { useCorePilotDerivedStepStatus } from "@/lib/use-core-pilot-derived-step-status";
import { OPERATOR_BODY_INLINE_LINK_CLASS, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

/** Cross-page strip: one highlighted next action while first-review steps remain. */
export function PersistentWorkspaceNextActionStrip(): React.JSX.Element | null {
  const [hydrated, setHydrated] = useState(false);
  const commitPresentationContext = useCorePilotCommitPresentationContext();
  const { progress, nextStepIndex, statuses, isPending } = useCorePilotDerivedStepStatus();

  useEffect(() => {
    setHydrated(true);
  }, []);

  if (!hydrated || isPending) {
    return null;
  }

  const nextStep = nextStepIndex !== null ? CORE_PILOT_STEPS[nextStepIndex] : null;
  const nextPresentation =
    nextStepIndex !== null
      ? resolveCorePilotStepPresentation(nextStepIndex, commitPresentationContext)
      : null;

  const action = resolvePersistentWorkspaceNextAction(
    progress,
    nextPresentation?.href ?? null,
    nextPresentation?.label ?? null,
    nextStep?.title ?? null,
  );

  if (action === null) {
    return null;
  }

  return (
    <div
      className="mb-3 rounded-lg border border-neutral-200 bg-neutral-50/90 px-4 py-3 dark:border-neutral-700 dark:bg-neutral-900/50"
      data-testid="persistent-workspace-next-action-strip"
      role="status"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 space-y-1">
          <p className={cn("m-0 font-medium text-neutral-900 dark:text-neutral-50", OPERATOR_TYPOGRAPHY.body)}>
            {action.headline}
          </p>
          {action.detail !== null ? (
            <p className={cn("m-0 text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>
              {action.detail}
            </p>
          ) : null}
          {action.nextStepTitle !== null ? (
            <p className={cn("m-0 text-neutral-700 dark:text-neutral-300", OPERATOR_TYPOGRAPHY.body)}>
              <InlineGuidanceLabel label="Next:" testId="persistent-workspace-next-step-label" />{" "}
              <span className="font-medium">{action.nextStepTitle}</span>
            </p>
          ) : null}
        </div>
        <Button
          type="button"
          variant="primary"
          size="sm"
          asChild
          className="shrink-0"
          data-testid="persistent-workspace-next-action-cta"
        >
          <Link href={action.href}>{action.actionLabel}</Link>
        </Button>
      </div>

      <details className="mt-3 group" data-testid="persistent-workspace-first-review-steps-disclosure">
        <summary
          className={cn(
            "cursor-pointer list-none text-neutral-700 marker:content-none dark:text-neutral-300",
            OPERATOR_TYPOGRAPHY.helper,
            "[&::-webkit-details-marker]:hidden",
          )}
        >
          <span className={cn(OPERATOR_BODY_INLINE_LINK_CLASS, "font-medium")}>Show all 7 steps</span>
        </summary>
        <ol
          className="m-0 mt-2 list-none space-y-2 p-0"
          aria-label="First review progress steps"
          data-testid="persistent-workspace-first-review-steps"
        >
          {CORE_PILOT_STEPS.map((step, index) => {
            const stepStatus = statuses[index] ?? "not-started";
            const statusTag = corePilotStepStatusTag(stepStatus);
            const isNext = index === nextStepIndex;

            return (
              <li
                key={step.title}
                className={cn(
                  "flex flex-wrap items-start justify-between gap-2 rounded-md px-2 py-1",
                  isNext ? "bg-teal-50/60 dark:bg-teal-950/20" : null,
                )}
                data-testid={`persistent-workspace-first-review-step-${index}`}
              >
                <span
                  className={cn(
                    "min-w-0 text-neutral-800 dark:text-neutral-200",
                    OPERATOR_TYPOGRAPHY.body,
                    isNext ? "font-medium" : null,
                  )}
                >
                  {index + 1}. {step.title}
                  {isCorePilotStepOptional(index) ? (
                    <span className={cn("ml-1 text-neutral-500 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>
                      (optional)
                    </span>
                  ) : null}
                </span>
                <StatusTag kind={statusTag.kind} label={statusTag.label} />
              </li>
            );
          })}
        </ol>
        <p className={cn("m-0 mt-2", OPERATOR_TYPOGRAPHY.helper)}>
          <Link href={FIRST_REVIEW_GUIDE_PATH} className={OPERATOR_BODY_INLINE_LINK_CLASS}>
            Open first review guide
          </Link>
        </p>
      </details>
    </div>
  );
}
