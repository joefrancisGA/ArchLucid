"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { SOFT_NAVIGATION_TIMEOUT_MS } from "@/hooks/use-soft-navigation-loading";
import {
  REVIEW_START_CREATION_FAILED_MESSAGE,
  REVIEW_START_OPENING_LABEL,
  REVIEW_START_PREPARING_LABEL,
  REVIEW_START_STAGED_PANEL_DELAY_MS,
} from "@/lib/review-start-progress-copy";
import {
  resolveReviewStartStages,
  type ReviewStartStageId,
} from "@/lib/review-start-progress-stages";

/** Create-run API + soft-nav can exceed pure soft-nav budget; keep CTA recoverable. */
export const REVIEW_CREATION_PROGRESS_TIMEOUT_MS = SOFT_NAVIGATION_TIMEOUT_MS + 45_000;

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
  const [error, setError] = useState<string | null>(null);
  const timerIdsRef = useRef<number[]>([]);
  const activityTimeoutIdRef = useRef<number | null>(null);

  const clearTimers = useCallback(() => {
    for (const timerId of timerIdsRef.current) {
      window.clearTimeout(timerId);
    }

    timerIdsRef.current = [];

    if (activityTimeoutIdRef.current !== null) {
      window.clearTimeout(activityTimeoutIdRef.current);
      activityTimeoutIdRef.current = null;
    }
  }, []);

  const reset = useCallback(() => {
    clearTimers();
    setIsActive(false);
    setHasTemplate(false);
    setActiveStageId(null);
    setShowStagedPanel(false);
    setError(null);
  }, [clearTimers]);

  useEffect(() => {
    return () => {
      clearTimers();
    };
  }, [clearTimers]);

  const begin = useCallback(
    (input: ReviewCreationProgressBeginInput) => {
      if (isActive) {
        return;
      }

      clearTimers();
      setError(null);
      setIsActive(true);
      setHasTemplate(input.hasTemplate);
      setActiveStageId("creating-workspace");
      setShowStagedPanel(false);

      const timeoutMs = input.timeoutMs ?? REVIEW_CREATION_PROGRESS_TIMEOUT_MS;

      activityTimeoutIdRef.current = window.setTimeout(() => {
        clearTimers();
        setIsActive(false);
        setHasTemplate(false);
        setActiveStageId(null);
        setShowStagedPanel(false);
        setError(REVIEW_START_CREATION_FAILED_MESSAGE);
        activityTimeoutIdRef.current = null;
      }, timeoutMs);

      timerIdsRef.current.push(
        window.setTimeout(() => {
          setShowStagedPanel(true);
        }, REVIEW_START_STAGED_PANEL_DELAY_MS),
      );

      if (input.hasTemplate) {
        timerIdsRef.current.push(
          window.setTimeout(() => {
            setActiveStageId("applying-template");
          }, 500),
        );
      }
    },
    [clearTimers, isActive],
  );

  const markPreparingQuestions = useCallback(() => {
    setActiveStageId("preparing-questions");
  }, []);

  const markOpeningReview = useCallback(() => {
    setActiveStageId("opening-review");
  }, []);

  const fail = useCallback(
    (message?: string) => {
      clearTimers();
      setIsActive(false);
      setHasTemplate(false);
      setActiveStageId(null);
      setShowStagedPanel(false);
      setError(message ?? REVIEW_START_CREATION_FAILED_MESSAGE);
    },
    [clearTimers],
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

  return {
    begin,
    markPreparingQuestions,
    markOpeningReview,
    fail,
    reset,
    isActive,
    activeStageId,
    showStagedPanel: showStagedPanel && isActive,
    stages,
    loadingLabel,
    error,
  };
}
