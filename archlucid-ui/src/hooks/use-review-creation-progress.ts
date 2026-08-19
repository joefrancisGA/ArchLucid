"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { SOFT_NAVIGATION_TIMEOUT_MS } from "@/hooks/use-soft-navigation-loading";
import {
  buildLongOperationWaitCopy,
  type LongOperationWaitCopy,
} from "@/lib/operations/long-operation-wait-copy";
import {
  REVIEW_START_CREATION_FAILED_MESSAGE,
  REVIEW_START_OPENING_LABEL,
  REVIEW_START_PREPARING_LABEL,
  REVIEW_START_WAIT_OPERATION_LABEL,
} from "@/lib/review-start-progress-copy";
import {
  resolveReviewStartStages,
  type ReviewStartStageId,
} from "@/lib/review-start-progress-stages";

/** Create-run API + soft-nav can exceed pure soft-nav budget; keep CTA recoverable. */
export const REVIEW_CREATION_PROGRESS_TIMEOUT_MS = SOFT_NAVIGATION_TIMEOUT_MS + 45_000;

/** Drives escalating elapsed-time copy; not a progress percentage. */
export const REVIEW_CREATION_ELAPSED_TICK_MS = 1_000;

/**
 * `failed` means the server told us it went wrong. `unresolved` means only that the browser
 * stopped waiting — the create may still be running. Collapsing the two is what drove
 * duplicate submissions, so callers must render them differently.
 */
export type ReviewCreationOutcome =
  | { readonly kind: "failed"; readonly message: string }
  | { readonly kind: "unresolved" };

export type ReviewCreationProgressBeginInput = {
  readonly hasTemplate: boolean;
  /** Override soft-fail budget (e.g. longer when evidence upload follows create). */
  readonly timeoutMs?: number;
};

export function useReviewCreationProgress() {
  const [isActive, setIsActive] = useState(false);
  const [hasTemplate, setHasTemplate] = useState(false);
  const [activeStageId, setActiveStageId] = useState<ReviewStartStageId | null>(null);
  const [showStagedPanel, setShowStagedPanel] = useState(false);
  const [outcome, setOutcome] = useState<ReviewCreationOutcome | null>(null);
  const [elapsedMs, setElapsedMs] = useState(0);
  const timerIdsRef = useRef<number[]>([]);
  const activityTimeoutIdRef = useRef<number | null>(null);
  const elapsedIntervalIdRef = useRef<number | null>(null);

  const clearTimers = useCallback(() => {
    for (const timerId of timerIdsRef.current) {
      window.clearTimeout(timerId);
    }

    timerIdsRef.current = [];

    if (activityTimeoutIdRef.current !== null) {
      window.clearTimeout(activityTimeoutIdRef.current);
      activityTimeoutIdRef.current = null;
    }

    if (elapsedIntervalIdRef.current !== null) {
      window.clearInterval(elapsedIntervalIdRef.current);
      elapsedIntervalIdRef.current = null;
    }
  }, []);

  /** Tear down the in-progress chrome without deciding what the outcome was. */
  const settle = useCallback(() => {
    clearTimers();
    setIsActive(false);
    setHasTemplate(false);
    setActiveStageId(null);
    setShowStagedPanel(false);
  }, [clearTimers]);

  const reset = useCallback(() => {
    settle();
    setOutcome(null);
    setElapsedMs(0);
  }, [settle]);

  useEffect(() => {
    return () => {
      clearTimers();
    };
  }, [clearTimers]);

  // `input` is optional so a caller that forgets the stage hints degrades to the default
  // stage list instead of throwing mid-submit and losing the create-run call.
  const begin = useCallback(
    (input?: ReviewCreationProgressBeginInput) => {
      if (isActive) {
        return;
      }

      const hasTemplateStage = input?.hasTemplate === true;

      clearTimers();
      setOutcome(null);
      setElapsedMs(0);
      setIsActive(true);
      setHasTemplate(hasTemplateStage);
      setActiveStageId("creating-workspace");
      setShowStagedPanel(true);

      const timeoutMs = input?.timeoutMs ?? REVIEW_CREATION_PROGRESS_TIMEOUT_MS;
      const startedAtMs = Date.now();

      elapsedIntervalIdRef.current = window.setInterval(() => {
        setElapsedMs(Date.now() - startedAtMs);
      }, REVIEW_CREATION_ELAPSED_TICK_MS);

      // Hitting this ceiling means we gave up waiting, not that the server failed.
      activityTimeoutIdRef.current = window.setTimeout(() => {
        activityTimeoutIdRef.current = null;
        settle();
        setOutcome({ kind: "unresolved" });
      }, timeoutMs);

      if (hasTemplateStage) {
        timerIdsRef.current.push(
          window.setTimeout(() => {
            setActiveStageId("applying-template");
          }, 500),
        );
      }
    },
    [clearTimers, isActive, settle],
  );

  const markPreparingQuestions = useCallback(() => {
    setActiveStageId("preparing-questions");
  }, []);

  const markOpeningReview = useCallback(() => {
    setActiveStageId("opening-review");
  }, []);

  /**
   * The server accepted the work. Disarm the watchdog but keep the progress chrome up: a slow
   * navigation must not trip the ceiling and report an already-created review as unresolved.
   */
  const succeed = useCallback(() => {
    clearTimers();
    setOutcome(null);
  }, [clearTimers]);

  const fail = useCallback(
    (message?: string) => {
      settle();
      setOutcome({ kind: "failed", message: message ?? REVIEW_START_CREATION_FAILED_MESSAGE });
    },
    [settle],
  );

  const stages = useMemo(() => resolveReviewStartStages(hasTemplate), [hasTemplate]);

  const loadingLabel = useMemo(() => {
    if (activeStageId === "opening-review") {
      return REVIEW_START_OPENING_LABEL;
    }

    if (activeStageId === "preparing-questions" || activeStageId === "applying-template") {
      return REVIEW_START_PREPARING_LABEL;
    }

    return REVIEW_START_PREPARING_LABEL;
  }, [activeStageId]);

  const waitCopy: LongOperationWaitCopy | null = useMemo(() => {
    if (!isActive) {
      return null;
    }

    return buildLongOperationWaitCopy({
      operationLabel: REVIEW_START_WAIT_OPERATION_LABEL,
      stageLabel: loadingLabel,
      elapsedMs,
    });
  }, [elapsedMs, isActive, loadingLabel]);

  return {
    begin,
    markPreparingQuestions,
    markOpeningReview,
    succeed,
    fail,
    reset,
    isActive,
    activeStageId,
    showStagedPanel: showStagedPanel && isActive,
    stages,
    loadingLabel,
    outcome,
    elapsedMs,
    waitCopy,
  };
}

/** Progress surface shared by wizard footers and the shared create-run submit path. */
export type ReviewCreationProgress = ReturnType<typeof useReviewCreationProgress>;
