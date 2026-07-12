"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

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

export type ReviewCreationProgressBeginInput = {
  readonly hasTemplate: boolean;
};

export function useReviewCreationProgress() {
  const [isActive, setIsActive] = useState(false);
  const [hasTemplate, setHasTemplate] = useState(false);
  const [activeStageId, setActiveStageId] = useState<ReviewStartStageId | null>(null);
  const [showStagedPanel, setShowStagedPanel] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const timerIdsRef = useRef<number[]>([]);

  const clearTimers = useCallback(() => {
    for (const timerId of timerIdsRef.current) {
      window.clearTimeout(timerId);
    }

    timerIdsRef.current = [];
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
