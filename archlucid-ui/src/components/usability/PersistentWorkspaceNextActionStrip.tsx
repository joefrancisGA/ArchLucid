"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { InlineGuidanceLabel } from "@/components/InlineGuidanceLabel";
import { Button } from "@/components/ui/button";
import { StatusTag } from "@/components/ui/status-tag";
import { StepProgressMeter } from "@/components/ui/step-progress-meter";
import { CORE_PILOT_STEPS } from "@/lib/core-pilot-steps";
import { corePilotStepStatusTag, isCorePilotStepOptional } from "@/lib/core-pilot-step-status";
import { FIRST_REVIEW_GUIDE_PATH } from "@/lib/first-review-guide-route";
import { resolveCorePilotStepPresentation } from "@/lib/core-pilot-step-presentation";
import { resolvePersistentWorkspaceNextAction } from "@/lib/persistent-workspace-next-action";
import { useCorePilotCommitPresentationContext } from "@/lib/use-core-pilot-commit-presentation-context";
import { useCorePilotDerivedStepStatus } from "@/lib/use-core-pilot-derived-step-status";
import { OPERATOR_BODY_INLINE_LINK_CLASS, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { useTeachingChromeVisible } from "@/lib/workspace-mode/use-teaching-chrome-visible";
import { cn } from "@/lib/utils";
import {
  parsePersistentWorkspaceFirstReviewStepsOpenFromSearch,
  persistentWorkspaceFirstReviewStepsDisclosureHrefFromSearch,
} from "@/lib/reviews/persistent-workspace-first-review-steps-disclosure-url";

/** Cross-page strip: one highlighted next action while first-review steps remain. */
export function PersistentWorkspaceNextActionStrip(): React.JSX.Element | null {
  const router = useRouter();
  const pathname = usePathname() ?? "/";
  const searchParams = useSearchParams();
  const persistentWorkspaceFirstReviewStepsOpenParam = searchParams.get("persistentWorkspaceFirstReviewStepsOpen");
  const teachingChromeVisible = useTeachingChromeVisible();
  const [hydrated, setHydrated] = useState(false);
  const [firstReviewStepsOpen, setFirstReviewStepsOpenState] = useState(() =>
    parsePersistentWorkspaceFirstReviewStepsOpenFromSearch(persistentWorkspaceFirstReviewStepsOpenParam),
  );
  const commitPresentationContext = useCorePilotCommitPresentationContext();
  const { progress, nextStepIndex, statuses, isPending } = useCorePilotDerivedStepStatus();

  const syncFirstReviewStepsOpenToUrl = useCallback(
    (open: boolean) => {
      router.replace(
        persistentWorkspaceFirstReviewStepsDisclosureHrefFromSearch(searchParams.toString(), open, pathname),
        { scroll: false },
      );
    },
    [pathname, router, searchParams],
  );

  const setFirstReviewStepsOpen = useCallback(
    (open: boolean) => {
      setFirstReviewStepsOpenState(open);
      syncFirstReviewStepsOpenToUrl(open);
    },
    [syncFirstReviewStepsOpenToUrl],
  );

  useEffect(() => {
    setFirstReviewStepsOpenState(
      parsePersistentWorkspaceFirstReviewStepsOpenFromSearch(persistentWorkspaceFirstReviewStepsOpenParam),
    );
  }, [persistentWorkspaceFirstReviewStepsOpenParam]);

  useEffect(() => {
    setHydrated(true);
  }, []);

  if (!teachingChromeVisible || !hydrated || isPending) {
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
      className="mb-3 rounded-lg border border-neutral-200 border-l-4 border-l-[var(--al-accent-interactive)] bg-neutral-50/90 px-4 py-3 dark:border-neutral-700 dark:bg-neutral-900/50"
      data-testid="persistent-workspace-next-action-strip"
      role="status"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
            <p className={cn("m-0 font-semibold text-neutral-900 dark:text-neutral-50", OPERATOR_TYPOGRAPHY.cardTitle)}>
              {action.headline}
            </p>
            {action.detail !== null ? (
              <p
                className={cn("m-0 text-neutral-700 dark:text-neutral-300", OPERATOR_TYPOGRAPHY.dataValue)}
                data-testid="persistent-workspace-progress-count"
              >
                {action.detail}
              </p>
            ) : null}
          </div>
          <StepProgressMeter
            completedCount={progress.completedCount}
            totalCount={progress.totalCount}
            label={action.headline}
            valueText={action.detail ?? undefined}
            testId="persistent-workspace-progress-meter"
          />
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

      <details
        className="mt-3 group"
        data-testid="persistent-workspace-first-review-steps-disclosure"
        open={firstReviewStepsOpen}
        onToggle={(event) => {
          setFirstReviewStepsOpen((event.currentTarget as HTMLDetailsElement).open);
        }}
      >
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
                  isNext ? "bg-neutral-50/80 dark:bg-neutral-900/40" : null,
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
