"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";

import {
  REVIEW_START_NAVIGATION_FAILED_MESSAGE,
  REVIEW_START_OPENING_LABEL,
  REVIEW_START_PREPARING_LABEL,
  REVIEW_START_STAGED_PANEL_DELAY_MS,
} from "@/lib/review-start-progress-copy";
import {
  resolveReviewStartStages,
  type ReviewStartStageId,
} from "@/lib/review-start-progress-stages";

export type ReviewIntakeNavigationInput = {
  readonly href: string;
  readonly hasTemplate?: boolean;
};

export function useReviewIntakeNavigation() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [activeStageId, setActiveStageId] = useState<ReviewStartStageId | null>(null);
  const [showStagedPanel, setShowStagedPanel] = useState(false);
  const [hasTemplate, setHasTemplate] = useState(false);
  const timerIdsRef = useRef<number[]>([]);

  const clearTimers = useCallback(() => {
    for (const timerId of timerIdsRef.current) {
      window.clearTimeout(timerId);
    }

    timerIdsRef.current = [];
  }, []);

  const reset = useCallback(() => {
    clearTimers();
    setError(null);
    setActiveStageId(null);
    setShowStagedPanel(false);
    setHasTemplate(false);
  }, [clearTimers]);

  useEffect(() => {
    return () => {
      clearTimers();
    };
  }, [clearTimers]);

  const navigate = useCallback(
    (input: ReviewIntakeNavigationInput) => {
      if (isPending || activeStageId !== null) {
        return;
      }

      clearTimers();
      setError(null);
      setHasTemplate(input.hasTemplate === true);
      setActiveStageId("creating-workspace");
      setShowStagedPanel(false);

      void router.prefetch(input.href);

      timerIdsRef.current.push(
        window.setTimeout(() => {
          setShowStagedPanel(true);
        }, REVIEW_START_STAGED_PANEL_DELAY_MS),
      );

      if (input.hasTemplate === true) {
        timerIdsRef.current.push(
          window.setTimeout(() => {
            setActiveStageId("applying-template");
          }, 500),
        );
        timerIdsRef.current.push(
          window.setTimeout(() => {
            setActiveStageId("preparing-questions");
          }, 1200),
        );
      } else {
        timerIdsRef.current.push(
          window.setTimeout(() => {
            setActiveStageId("preparing-questions");
          }, 700),
        );
      }

      startTransition(() => {
        setActiveStageId("opening-review");

        try {
          router.push(input.href);
        } catch {
          reset();
          setError(REVIEW_START_NAVIGATION_FAILED_MESSAGE);
        }
      });
    },
    [activeStageId, clearTimers, isPending, reset, router],
  );

  useEffect(() => {
    if (isPending || activeStageId === null) {
      return;
    }

    if (activeStageId === "opening-review" && error === null) {
      const resetTimer = window.setTimeout(() => {
        reset();
      }, 400);

      return () => {
        window.clearTimeout(resetTimer);
      };
    }

    return undefined;
  }, [activeStageId, error, isPending, reset]);

  const isNavigating = isPending || activeStageId !== null;

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
    navigate,
    reset,
    isNavigating,
    isPending,
    activeStageId,
    showStagedPanel: showStagedPanel && isNavigating,
    stages,
    loadingLabel,
    error,
  };
}
