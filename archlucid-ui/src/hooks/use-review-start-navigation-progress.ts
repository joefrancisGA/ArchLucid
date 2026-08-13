"use client";

import { useCallback, useMemo, useState } from "react";

import { useLongOperationWait } from "@/hooks/use-long-operation-wait";
import { useSoftNavigationLoading } from "@/hooks/use-soft-navigation-loading";
import type { LongOperationWaitCopy } from "@/lib/operations/long-operation-wait-copy";
import {
  REVIEW_START_NAVIGATION_STALL_TIMEOUT_MS,
  REVIEW_START_OPENING_LABEL,
  REVIEW_START_PREPARING_LABEL,
  REVIEW_START_WAIT_OPERATION_LABEL,
} from "@/lib/review-start-progress-copy";
import {
  resolveReviewStartStages,
  type ReviewStartStageDefinition,
  type ReviewStartStageId,
} from "@/lib/review-start-progress-stages";

export type ReviewStartNavigationProgressState = {
  /** Progress chrome is up — covers the pre-navigation save round-trip and the navigation itself. */
  readonly isActive: boolean;
  /** CTA should stay depressed. Released once the navigation stalls so the operator is never stuck. */
  readonly isPending: boolean;
  readonly stageId: ReviewStartStageId | null;
  readonly stages: readonly ReviewStartStageDefinition[];
  readonly loadingLabel: string;
  readonly waitCopy: LongOperationWaitCopy;
  /** Soft navigation never committed within the ceiling; offer a direct (full page) open. */
  readonly stalled: boolean;
  readonly begin: () => void;
  readonly markPreparingQuestions: () => void;
  readonly openReview: (href: string) => void;
  readonly reset: () => void;
};

/**
 * Feedback for "prepare the architecture draft, then soft-navigate to the review start page".
 *
 * The chrome starts on click — before the save round-trip — and is released only when the App Router
 * commits the target pathname. A wall-clock timer must not clear it while the navigation is still
 * outstanding: that is what makes a slow route look like a dead button.
 */
export function useReviewStartNavigationProgress(): ReviewStartNavigationProgressState {
  const [stageId, setStageId] = useState<ReviewStartStageId | null>(null);
  const [stalled, setStalled] = useState(false);

  const handleNavigationTimeout = useCallback(() => {
    setStalled(true);
  }, []);

  const { navigate, reset: resetNavigation } = useSoftNavigationLoading({
    timeoutMs: REVIEW_START_NAVIGATION_STALL_TIMEOUT_MS,
    // The pending navigation is still in flight; replacing it with a full page load can be slower,
    // so the operator chooses via the stall notice instead of us aborting for them.
    hardNavigateOnTimeout: false,
    onTimeout: handleNavigationTimeout,
  });

  const isActive = stageId !== null;

  const loadingLabel = useMemo(
    () => (stageId === "opening-review" ? REVIEW_START_OPENING_LABEL : REVIEW_START_PREPARING_LABEL),
    [stageId],
  );

  const wait = useLongOperationWait({
    active: isActive,
    operationLabel: REVIEW_START_WAIT_OPERATION_LABEL,
    stageLabel: loadingLabel,
  });

  const begin = useCallback(() => {
    resetNavigation();
    setStalled(false);
    setStageId("creating-workspace");
  }, [resetNavigation]);

  const markPreparingQuestions = useCallback(() => {
    setStageId("preparing-questions");
  }, []);

  const openReview = useCallback(
    (href: string) => {
      setStageId("opening-review");
      navigate(href);
    },
    [navigate],
  );

  const reset = useCallback(() => {
    resetNavigation();
    setStalled(false);
    setStageId(null);
  }, [resetNavigation]);

  const stages = useMemo(() => resolveReviewStartStages(false), []);

  return {
    isActive,
    isPending: isActive && !stalled,
    stageId,
    stages,
    loadingLabel,
    waitCopy: wait.copy,
    stalled,
    begin,
    markPreparingQuestions,
    openReview,
    reset,
  };
}
