"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { useSoftNavigationLoading } from "@/hooks/use-soft-navigation-loading";
import {
  REVIEW_START_NAVIGATION_STALL_TIMEOUT_MS,
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

/** Stage advance schedule while the route loads — cosmetic ordering, never a percentage. */
const APPLYING_TEMPLATE_DELAY_MS = 500;
const PREPARING_QUESTIONS_WITH_TEMPLATE_DELAY_MS = 1200;
const PREPARING_QUESTIONS_DELAY_MS = 700;
const OPENING_REVIEW_WITH_TEMPLATE_DELAY_MS = 2000;
const OPENING_REVIEW_DELAY_MS = 1500;

/**
 * Staged feedback for CTAs that soft-navigate to the review start page.
 *
 * Progress is released when the App Router commits the target pathname, not on a wall-clock timer:
 * clearing the chrome mid-flight leaves an idle CTA on an unchanged page. Passing the ceiling is
 * reported as {@link ReviewIntakeNavigation.stalled} rather than a failure, because the navigation
 * is still outstanding and telling the operator it failed invites a pointless retry.
 */
export function useReviewIntakeNavigation() {
  const [activeStageId, setActiveStageId] = useState<ReviewStartStageId | null>(null);
  const [showStagedPanel, setShowStagedPanel] = useState(false);
  const [hasTemplate, setHasTemplate] = useState(false);
  const [stalled, setStalled] = useState(false);
  const [stalledHref, setStalledHref] = useState<string | null>(null);
  const timerIdsRef = useRef<number[]>([]);
  const pendingHrefRef = useRef<string | null>(null);

  const clearStageTimers = useCallback(() => {
    for (const timerId of timerIdsRef.current) {
      window.clearTimeout(timerId);
    }

    timerIdsRef.current = [];
  }, []);

  const handleNavigationTimeout = useCallback(() => {
    clearStageTimers();
    setShowStagedPanel(false);
    setStalled(true);
    setStalledHref(pendingHrefRef.current);
  }, [clearStageTimers]);

  const {
    navigate: navigateSoft,
    reset: resetNavigation,
    isNavigating,
    error,
  } = useSoftNavigationLoading({
    timeoutMs: REVIEW_START_NAVIGATION_STALL_TIMEOUT_MS,
    // Aborting a working transition in favour of a full page load can be slower; the operator
    // chooses via the stall notice instead.
    hardNavigateOnTimeout: false,
    onTimeout: handleNavigationTimeout,
  });

  const clearStagedChrome = useCallback(() => {
    clearStageTimers();
    setActiveStageId(null);
    setShowStagedPanel(false);
    setHasTemplate(false);
    pendingHrefRef.current = null;
  }, [clearStageTimers]);

  const reset = useCallback(() => {
    resetNavigation();
    clearStagedChrome();
    setStalled(false);
    setStalledHref(null);
  }, [clearStagedChrome, resetNavigation]);

  useEffect(() => {
    return () => {
      clearStageTimers();
    };
  }, [clearStageTimers]);

  // The router committed the target pathname (or threw) — tear the staged chrome down. A stall keeps
  // its notice up, so it is excluded here.
  useEffect(() => {
    if (isNavigating || stalled || activeStageId === null) {
      return;
    }

    clearStagedChrome();
  }, [activeStageId, clearStagedChrome, isNavigating, stalled]);

  const navigate = useCallback(
    (input: ReviewIntakeNavigationInput) => {
      if (isNavigating) {
        return;
      }

      const withTemplate = input.hasTemplate === true;

      clearStageTimers();
      resetNavigation();
      setStalled(false);
      setStalledHref(null);
      setHasTemplate(withTemplate);
      setActiveStageId("creating-workspace");
      setShowStagedPanel(false);
      pendingHrefRef.current = input.href;

      timerIdsRef.current.push(
        window.setTimeout(() => {
          setShowStagedPanel(true);
        }, REVIEW_START_STAGED_PANEL_DELAY_MS),
      );

      if (withTemplate) {
        timerIdsRef.current.push(
          window.setTimeout(() => {
            setActiveStageId("applying-template");
          }, APPLYING_TEMPLATE_DELAY_MS),
        );
        timerIdsRef.current.push(
          window.setTimeout(() => {
            setActiveStageId("preparing-questions");
          }, PREPARING_QUESTIONS_WITH_TEMPLATE_DELAY_MS),
        );
        timerIdsRef.current.push(
          window.setTimeout(() => {
            setActiveStageId("opening-review");
          }, OPENING_REVIEW_WITH_TEMPLATE_DELAY_MS),
        );
      } else {
        timerIdsRef.current.push(
          window.setTimeout(() => {
            setActiveStageId("preparing-questions");
          }, PREPARING_QUESTIONS_DELAY_MS),
        );
        timerIdsRef.current.push(
          window.setTimeout(() => {
            setActiveStageId("opening-review");
          }, OPENING_REVIEW_DELAY_MS),
        );
      }

      navigateSoft(input.href);
    },
    [clearStageTimers, isNavigating, navigateSoft, resetNavigation],
  );

  const stages = useMemo(() => resolveReviewStartStages(hasTemplate), [hasTemplate]);

  const loadingLabel = useMemo(
    () => (activeStageId === "opening-review" ? REVIEW_START_OPENING_LABEL : REVIEW_START_PREPARING_LABEL),
    [activeStageId],
  );

  return {
    navigate,
    reset,
    isNavigating,
    isPending: isNavigating,
    activeStageId,
    showStagedPanel: showStagedPanel && isNavigating,
    stages,
    loadingLabel,
    stalled,
    stalledHref,
    error,
  };
}

export type ReviewIntakeNavigation = ReturnType<typeof useReviewIntakeNavigation>;
