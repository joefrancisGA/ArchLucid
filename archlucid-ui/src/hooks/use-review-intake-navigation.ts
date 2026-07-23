"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";

import { SOFT_NAVIGATION_TIMEOUT_MS } from "@/hooks/use-soft-navigation-loading";
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
  const [isNavigating, setIsNavigating] = useState(false);
  const timerIdsRef = useRef<number[]>([]);
  const timeoutIdRef = useRef<number | null>(null);
  const wasPendingRef = useRef(false);

  const clearTimers = useCallback(() => {
    for (const timerId of timerIdsRef.current) {
      window.clearTimeout(timerId);
    }

    timerIdsRef.current = [];

    if (timeoutIdRef.current !== null) {
      window.clearTimeout(timeoutIdRef.current);
      timeoutIdRef.current = null;
    }
  }, []);

  const reset = useCallback(() => {
    clearTimers();
    setError(null);
    setActiveStageId(null);
    setShowStagedPanel(false);
    setHasTemplate(false);
    setIsNavigating(false);
    wasPendingRef.current = false;
  }, [clearTimers]);

  useEffect(() => {
    return () => {
      clearTimers();
    };
  }, [clearTimers]);

  useEffect(() => {
    if (isPending) {
      wasPendingRef.current = true;

      return;
    }

    // Clear stages when soft-nav settles — any stage id (staged timers can overwrite opening-review).
    if (wasPendingRef.current && isNavigating) {
      wasPendingRef.current = false;
      const settleTimer = window.setTimeout(() => {
        reset();
      }, 400);

      return () => {
        window.clearTimeout(settleTimer);
      };
    }

    return undefined;
  }, [isNavigating, isPending, reset]);

  const navigate = useCallback(
    (input: ReviewIntakeNavigationInput) => {
      if (isPending || isNavigating) {
        return;
      }

      clearTimers();
      setError(null);
      setHasTemplate(input.hasTemplate === true);
      setActiveStageId("creating-workspace");
      setShowStagedPanel(false);
      setIsNavigating(true);
      wasPendingRef.current = false;

      timeoutIdRef.current = window.setTimeout(() => {
        clearTimers();
        setActiveStageId(null);
        setShowStagedPanel(false);
        setHasTemplate(false);
        setIsNavigating(false);
        setError(REVIEW_START_NAVIGATION_FAILED_MESSAGE);
        timeoutIdRef.current = null;
      }, SOFT_NAVIGATION_TIMEOUT_MS);

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
    [clearTimers, isNavigating, isPending, reset, router],
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
