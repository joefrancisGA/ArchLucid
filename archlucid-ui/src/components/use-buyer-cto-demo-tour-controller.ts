"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { runBuyerCtoDemoSmokeCheck, type CtoDemoSmokeCheckResult } from "@/lib/buyer/buyer-cto-demo-smoke-check";
import { findCtoDemoStory } from "@/lib/buyer/buyer-cto-demo-story-registry";
import {
  ARCHLUCID_BUYER_CTO_DEMO_TOUR_START_EVENT,
  ARCHLUCID_CTO_DEMO_STORY_CHANGED_EVENT,
  BUYER_CTO_DEMO_TOUR_QUERY_PARAM,
  buyerCtoDemoRemainingBudgetMinutes,
  buyerCtoDemoStepBudgetSeconds,
  formatCtoDemoStepTimer,
  readBuyerCtoDemoAutoplay,
  readBuyerCtoDemoExploreMode,
  readBuyerCtoDemoPreflightAcknowledged,
  readBuyerCtoDemoStoryId,
  readBuyerCtoDemoTourActive,
  readBuyerCtoDemoTourCollapsed,
  readBuyerCtoDemoPresenterNotesFullScript,
  readBuyerCtoDemoPresenterNotesVisible,
  readBuyerCtoDemoVisitedSteps,
  readBuyerCtoDemoPresenterLayerVisible,
  resolveBuyerCtoDemoTourNavigation,
  writeBuyerCtoDemoAutoplay,
  writeBuyerCtoDemoExploreMode,
  writeBuyerCtoDemoPreflightAcknowledged,
  writeBuyerCtoDemoTourActive,
  writeBuyerCtoDemoTourCollapsed,
  writeBuyerCtoDemoPresenterLayerVisible,
  writeBuyerCtoDemoVisitedStep,
} from "@/lib/buyer/buyer-cto-demo-tour";
import { BUYER_GOLDEN_JOURNEY_STEP_DEFINITIONS } from "@/lib/buyer/buyer-golden-journey-nav";
import { buyerCtoDemoRemainingMinutesLabel } from "@/lib/buyer/buyer-polish-copy";
import { emitDemoJourneyTelemetry } from "@/lib/demo-journey-telemetry";
import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";
import { readOperatorDemoPanicOffline } from "@/lib/operator/operator-static-demo";
import { useBuyerCtoDemoTourKeyboard } from "@/hooks/useBuyerCtoDemoTourKeyboard";

export function useBuyerCtoDemoTourController() {
  const pathname = usePathname() ?? "/";
  const searchParams = useSearchParams();
  const router = useRouter();

  const [active, setActive] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [exploreMode, setExploreMode] = useState(false);
  const [presenterLayerVisible, setPresenterLayerVisible] = useState(false);
  const [presenterNotesVisible, setPresenterNotesVisible] = useState(true);
  const [presenterNotesFullScript, setPresenterNotesFullScript] = useState(true);
  const [ctoQuestionsVisible, setCtoQuestionsVisible] = useState(false);
  const [visitedSteps, setVisitedSteps] = useState<ReadonlySet<number>>(new Set<number>());
  const [mounted, setMounted] = useState(false);
  const [elapsedSecondsOnStep, setElapsedSecondsOnStep] = useState(0);
  const [autoplay, setAutoplay] = useState(false);
  const [storyId, setStoryId] = useState("healthcare");
  const [smokeResults, setSmokeResults] = useState<readonly CtoDemoSmokeCheckResult[] | null>(null);
  const [smokeBusy, setSmokeBusy] = useState(false);
  const [panicEnabled, setPanicEnabled] = useState(false);
  const [preflightAcknowledged, setPreflightAcknowledged] = useState(false);

  const advancedForStepRef = useRef<number | null>(null);
  const telemetryStepIndexRef = useRef<number | null>(null);
  const telemetryElapsedRef = useRef(0);

  const activateTour = useCallback(() => {
    writeBuyerCtoDemoTourActive(true);
    setActive(true);
    setCollapsed(false);
    writeBuyerCtoDemoTourCollapsed(false);
  }, []);

  const endTour = useCallback(() => {
    emitDemoJourneyTelemetry({
      kind: "tour_ended",
      stepsVisitedCount: readBuyerCtoDemoVisitedSteps().size,
    });

    writeBuyerCtoDemoTourActive(false);
    writeBuyerCtoDemoExploreMode(false);
    writeBuyerCtoDemoPreflightAcknowledged(false);

    setActive(false);
    setPreflightAcknowledged(false);
    setExploreMode(false);
    setCollapsed(false);
    writeBuyerCtoDemoTourCollapsed(false);
  }, []);

  useEffect(() => {
    setMounted(true);
    setActive(readBuyerCtoDemoTourActive());
    setCollapsed(readBuyerCtoDemoTourCollapsed());
    setPresenterNotesVisible(readBuyerCtoDemoPresenterNotesVisible());
    setPresenterNotesFullScript(readBuyerCtoDemoPresenterNotesFullScript());
    setVisitedSteps(readBuyerCtoDemoVisitedSteps());
    setAutoplay(readBuyerCtoDemoAutoplay());
    setStoryId(readBuyerCtoDemoStoryId());
    setPanicEnabled(readOperatorDemoPanicOffline());
    setExploreMode(readBuyerCtoDemoExploreMode());
    setPresenterLayerVisible(readBuyerCtoDemoPresenterLayerVisible());
    setPreflightAcknowledged(readBuyerCtoDemoPreflightAcknowledged());
  }, []);

  const toggleExploreMode = useCallback(() => {
    setExploreMode((previous) => {
      const next = !previous;
      writeBuyerCtoDemoExploreMode(next);
      return next;
    });
  }, []);

  const togglePresenterLayer = useCallback(() => {
    setPresenterLayerVisible((previous) => {
      const next = !previous;
      writeBuyerCtoDemoPresenterLayerVisible(next);
      return next;
    });
  }, []);

  useBuyerCtoDemoTourKeyboard(active, {
    onExploreToggle: toggleExploreMode,
    onPresenterLayerToggle: togglePresenterLayer,
  });

  const navigation = useMemo(() => resolveBuyerCtoDemoTourNavigation(pathname), [pathname]);

  useEffect(() => {
    if (!mounted || !active || navigation.stepIndex === null) {
      return;
    }

    const previousStepIndex = telemetryStepIndexRef.current;

    if (previousStepIndex !== null && previousStepIndex !== navigation.stepIndex) {
      emitDemoJourneyTelemetry({
        kind: "step_exited",
        stepIndex: previousStepIndex,
        dwellSeconds: telemetryElapsedRef.current,
      });
    }

    if (previousStepIndex !== navigation.stepIndex) {
      const stepDef = BUYER_GOLDEN_JOURNEY_STEP_DEFINITIONS[navigation.stepIndex];

      emitDemoJourneyTelemetry({
        kind: "step_entered",
        stepIndex: navigation.stepIndex,
        stepLabel: stepDef.label,
      });

      telemetryStepIndexRef.current = navigation.stepIndex;
      telemetryElapsedRef.current = 0;
    }

    writeBuyerCtoDemoVisitedStep(navigation.stepIndex);
    setVisitedSteps(readBuyerCtoDemoVisitedSteps());
  }, [active, mounted, navigation.stepIndex]);

  useEffect(() => {
    setElapsedSecondsOnStep(0);
    advancedForStepRef.current = null;
  }, [navigation.stepIndex]);

  useEffect(() => {
    function onStoryChanged(event: Event): void {
      const detail = (event as CustomEvent<{ storyId?: string }>).detail;

      if (detail?.storyId !== undefined && detail.storyId.length > 0) {
        setStoryId(detail.storyId);
      } else {
        setStoryId(readBuyerCtoDemoStoryId());
      }
    }

    window.addEventListener(ARCHLUCID_CTO_DEMO_STORY_CHANGED_EVENT, onStoryChanged);

    return () => {
      window.removeEventListener(ARCHLUCID_CTO_DEMO_STORY_CHANGED_EVENT, onStoryChanged);
    };
  }, []);

  useEffect(() => {
    if (!mounted || !active || !autoplay || navigation.stepIndex === null) {
      return;
    }

    const budgetSeconds = buyerCtoDemoStepBudgetSeconds(navigation.stepIndex);

    if (elapsedSecondsOnStep < budgetSeconds) {
      return;
    }

    if (advancedForStepRef.current === navigation.stepIndex) {
      return;
    }

    advancedForStepRef.current = navigation.stepIndex;

    if (navigation.next !== null) {
      router.push(navigation.next.href);
      return;
    }

    setAutoplay(false);
    writeBuyerCtoDemoAutoplay(false);
  }, [active, autoplay, elapsedSecondsOnStep, mounted, navigation.next, navigation.stepIndex, router]);

  const runSmokeCheck = useCallback(async () => {
    setSmokeBusy(true);

    try {
      const results = await runBuyerCtoDemoSmokeCheck();
      setSmokeResults(results);
    } finally {
      setSmokeBusy(false);
    }
  }, []);

  const selectedStory = useMemo(() => findCtoDemoStory(storyId), [storyId]);

  useEffect(() => {
    if (!mounted || !active || navigation.stepIndex === null) {
      return;
    }

    const intervalId = window.setInterval(() => {
      setElapsedSecondsOnStep((previous) => {
        const next = previous + 1;
        telemetryElapsedRef.current = next;
        return next;
      });
    }, 1000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [active, mounted, navigation.stepIndex]);

  useEffect(() => {
    if (!mounted) {
      return;
    }

    const tourQuery = searchParams.get(BUYER_CTO_DEMO_TOUR_QUERY_PARAM);

    if (tourQuery === "1" || tourQuery === "true") {
      activateTour();

      const params = new URLSearchParams(searchParams.toString());
      params.delete(BUYER_CTO_DEMO_TOUR_QUERY_PARAM);

      const query = params.toString();
      const nextUrl = query.length > 0 ? `${pathname}?${query}` : pathname;

      router.replace(nextUrl, { scroll: false });
    }
  }, [activateTour, mounted, pathname, router, searchParams]);

  useEffect(() => {
    function onStartTour(): void {
      activateTour();
    }

    window.addEventListener(ARCHLUCID_BUYER_CTO_DEMO_TOUR_START_EVENT, onStartTour);

    return () => {
      window.removeEventListener(ARCHLUCID_BUYER_CTO_DEMO_TOUR_START_EVENT, onStartTour);
    };
  }, [activateTour]);

  useEffect(() => {
    if (!mounted || !active) {
      return;
    }

    for (const step of BUYER_GOLDEN_JOURNEY_STEP_DEFINITIONS) {
      router.prefetch(step.href);
    }
  }, [active, mounted, router]);

  const stepCount = navigation.stepCount;
  const currentStepNumber = navigation.stepIndex !== null ? navigation.stepIndex + 1 : null;
  const stepLabel =
    currentStepNumber !== null ? `Step ${currentStepNumber} of ${stepCount}` : navigation.summaryLine;
  const remainingMinutes =
    navigation.stepIndex !== null ? buyerCtoDemoRemainingBudgetMinutes(navigation.stepIndex) : null;
  const stepBudgetSeconds =
    navigation.stepIndex !== null ? buyerCtoDemoStepBudgetSeconds(navigation.stepIndex) : null;
  const stepTimer =
    stepBudgetSeconds !== null ? formatCtoDemoStepTimer(stepBudgetSeconds - elapsedSecondsOnStep) : null;
  const presenterNotesText = presenterNotesFullScript ? navigation.presenterScript : navigation.presenterLine;
  const remainingMinutesLabel =
    remainingMinutes !== null ? buyerCtoDemoRemainingMinutesLabel(remainingMinutes) : null;

  const shouldRender =
    isBuyerPolishedOperatorShellEnv() && mounted && active;

  return {
    shouldRender,
    exploreMode,
    collapsed,
    preflightAcknowledged,
    navigation,
    stepCount,
    currentStepNumber,
    stepLabel,
    remainingMinutesLabel,
    stepTimer,
    presenterNotesText,
    autoplay,
    presenterLayerVisible,
    presenterNotesVisible,
    presenterNotesFullScript,
    ctoQuestionsVisible,
    panicEnabled,
    storyId,
    selectedStory,
    smokeBusy,
    smokeResults,
    visitedSteps,
    toggleExploreMode,
    togglePresenterLayer,
    endTour,
    setCollapsed,
    setPreflightAcknowledged,
    setPresenterNotesVisible,
    setPresenterNotesFullScript,
    setCtoQuestionsVisible,
    setAutoplay,
    setPanicEnabled,
    setStoryId,
    runSmokeCheck,
  };
}

export type BuyerCtoDemoTourControllerState = ReturnType<typeof useBuyerCtoDemoTourController>;
