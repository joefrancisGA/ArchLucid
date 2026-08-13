"use client";
import { cn } from "@/lib/utils";
import { DESIGN_TOKENS, OPERATOR_TYPE_SCALE, OPERATOR_TYPOGRAPHY, operatorSemanticBadge } from "@/lib/design-tokens";

import Link from "next/link";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { CtoDemoHowItWorksTrigger } from "@/components/cto-demo/CtoDemoHowItWorksTrigger";
import { CtoDemoCustomerPreflightGate } from "@/components/cto-demo/CtoDemoCustomerPreflightGate";
import { CtoDemoRecapCard } from "@/components/cto-demo/CtoDemoRecapCard";
import { CtoDemoSoftRestartButton } from "@/components/cto-demo/CtoDemoSoftRestartButton";
import { CtoDemoStorySelector } from "@/components/cto-demo/CtoDemoStorySelector";

import { Button } from "@/components/ui/button";
import { StatusTag } from "@/components/ui/status-tag";

import { CTO_DEMO_QUESTIONS } from "@/lib/buyer/buyer-cto-demo-cto-questions";
import { buildCtoDemoProofHref } from "@/lib/buyer/buyer-cto-demo-proof-href";
import { runBuyerCtoDemoSmokeCheck, type CtoDemoSmokeCheckResult } from "@/lib/buyer/buyer-cto-demo-smoke-check";
import { findCtoDemoStory } from "@/lib/buyer/buyer-cto-demo-story-registry";

import {

  ARCHLUCID_BUYER_CTO_DEMO_TOUR_START_EVENT,
  ARCHLUCID_CTO_DEMO_STORY_CHANGED_EVENT,
  BUYER_CTO_DEMO_TOUR_QUERY_PARAM,
  buyerCtoDemoRemainingBudgetMinutes,
  buyerCtoDemoStepBudgetSeconds,
  formatCtoDemoStepBudgetLabel,
  formatCtoDemoStepTimer,
  getStartCtoDemoTourHref,
  readBuyerCtoDemoAutoplay,
  readBuyerCtoDemoExploreMode,
  readBuyerCtoDemoPreflightAcknowledged,
  readBuyerCtoDemoStoryId,
  readBuyerCtoDemoTourActive,
  readBuyerCtoDemoTourCollapsed,
  readBuyerCtoDemoPresenterNotesFullScript,
  readBuyerCtoDemoPresenterNotesVisible,
  readBuyerCtoDemoVisitedSteps,
  readCtoDemoPresenterLayerVisible,
  resolveBuyerCtoDemoTourNavigation,
  writeBuyerCtoDemoAutoplay,
  writeBuyerCtoDemoExploreMode,
  writeBuyerCtoDemoPreflightAcknowledged,
  writeBuyerCtoDemoTourActive,
  writeBuyerCtoDemoTourCollapsed,
  writeBuyerCtoDemoPresenterNotesFullScript,
  writeBuyerCtoDemoPresenterNotesVisible,
  writeBuyerCtoDemoVisitedStep,
  writeCtoDemoPresenterLayerVisible,
} from "@/lib/buyer/buyer-cto-demo-tour";

import { BUYER_CTO_DEMO_COMPARE_HREF, BUYER_GOLDEN_JOURNEY_STEP_DEFINITIONS } from "@/lib/buyer/buyer-golden-journey-nav";
import { emitDemoJourneyTelemetry } from "@/lib/demo-journey-telemetry";

import {

  BUYER_CTO_DEMO_COMPARE_DRIFT_CTA,

  BUYER_CTO_DEMO_COMPARE_DRIFT_LABEL,

  BUYER_CTO_DEMO_PANIC_ENABLE_CTA,

  BUYER_CTO_DEMO_PANIC_ENABLED_LABEL,

  BUYER_CTO_DEMO_PANIC_SCRIPT_BODY,

  BUYER_CTO_DEMO_PANIC_SCRIPT_HEADING,

  BUYER_CTO_DEMO_QUESTIONS_HIDE_CTA,

  BUYER_CTO_DEMO_QUESTIONS_SHOW_CTA,

  BUYER_CTO_DEMO_SMOKE_CHECK_CTA,

  BUYER_CTO_DEMO_SMOKE_CHECK_RECHECK_CTA,

  BUYER_CTO_DEMO_TOUR_ARIA,

  BUYER_CTO_DEMO_TOUR_AUTOPLAY_BADGE,

  BUYER_CTO_DEMO_TOUR_AUTOPLAY_OFF_CTA,

  BUYER_CTO_DEMO_TOUR_AUTOPLAY_ON_CTA,

  BUYER_CTO_DEMO_TOUR_BACK_CTA,

  BUYER_CTO_DEMO_TOUR_COLLAPSE_CTA,

  BUYER_CTO_DEMO_TOUR_END_CTA,

  BUYER_CTO_DEMO_TOUR_EXPAND_CTA,

  BUYER_CTO_DEMO_TOUR_HEADING,

  BUYER_CTO_DEMO_TOUR_KEYBOARD_HINT,

  BUYER_CTO_DEMO_TOUR_NEXT_CTA,

  BUYER_CTO_DEMO_TOUR_NOTES_FULL_CTA,

  BUYER_CTO_DEMO_TOUR_NOTES_HIDE_CTA,

  BUYER_CTO_DEMO_TOUR_NOTES_SHOW_CTA,

  BUYER_CTO_DEMO_TOUR_NOTES_SUMMARY_CTA,

  buyerCtoDemoRemainingMinutesLabel,

} from "@/lib/buyer/buyer-polish-copy";

import { useBuyerCtoDemoTourKeyboard } from "@/hooks/useBuyerCtoDemoTourKeyboard";

import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";
import {
  ARCHLUCID_CTO_DEMO_PANIC_CHANGED_EVENT,
  readOperatorDemoPanicOffline,
  writeOperatorDemoPanicOffline,
} from "@/lib/operator/operator-static-demo";

/**

 * Persistent presenter rail for the five-step buyer golden journey — Back/Next without hunting the layer strip.

 */

export function BuyerCtoDemoTourOverlay(): React.JSX.Element | null {

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

    setPresenterLayerVisible(readCtoDemoPresenterLayerVisible());

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

      writeCtoDemoPresenterLayerVisible(next);

      return next;
    });
  }, []);

  useBuyerCtoDemoTourKeyboard(active, {
    onExploreToggle: toggleExploreMode,
    onPresenterLayerToggle: togglePresenterLayer,
  });

  const navigation = useMemo(() => resolveBuyerCtoDemoTourNavigation(pathname), [pathname]);

  useEffect(() => {

    if (!mounted || !active) {

      return;

    }

    if (navigation.stepIndex === null) {

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

  if (!isBuyerPolishedOperatorShellEnv() || !mounted || !active) {

    return null;

  }

  if (exploreMode) {
    return (
      <div className="pointer-events-none fixed bottom-4 right-4 z-[9990] print:hidden" data-testid="cto-demo-explore-resume-pill">
        <Button
          type="button"
          size="sm"
          className="pointer-events-auto h-7 min-w-[3.25rem] px-2 shadow-sm"
          aria-label="Resume CTO demo tour"
          onClick={toggleExploreMode}
        >
          Tour
        </Button>
      </div>
    );
  }

  const stepCount = navigation.stepCount;
  const showPresenterLayer = presenterLayerVisible;

  const currentStepNumber = navigation.stepIndex !== null ? navigation.stepIndex + 1 : null;

  const stepLabel =

    currentStepNumber !== null ? `Step ${currentStepNumber} of ${stepCount}` : navigation.summaryLine;

  const remainingMinutes =

    navigation.stepIndex !== null ? buyerCtoDemoRemainingBudgetMinutes(navigation.stepIndex) : null;

  const stepBudgetSeconds =

    navigation.stepIndex !== null ? buyerCtoDemoStepBudgetSeconds(navigation.stepIndex) : null;

  const stepTimer =

    stepBudgetSeconds !== null

      ? formatCtoDemoStepTimer(stepBudgetSeconds - elapsedSecondsOnStep)

      : null;

  const presenterNotesText = presenterNotesFullScript ? navigation.presenterScript : navigation.presenterLine;

  if (collapsed) {

    return (

      <div

        className="pointer-events-none fixed bottom-4 right-4 z-[9990] print:hidden"

        data-testid="buyer-cto-demo-tour-overlay-collapsed"

      >

        <Button

          type="button"

          size="sm"

          className="pointer-events-auto shadow-md"

          aria-label={BUYER_CTO_DEMO_TOUR_EXPAND_CTA}

          onClick={() => {

            setCollapsed(false);

            writeBuyerCtoDemoTourCollapsed(false);

          }}

        >

          {BUYER_CTO_DEMO_TOUR_HEADING}

          {currentStepNumber !== null ? ` · ${currentStepNumber}/${stepCount}` : ""}

        </Button>

      </div>

    );

  }

  if (!preflightAcknowledged) {
    return (
      <aside
        aria-label={BUYER_CTO_DEMO_TOUR_ARIA}
        className="pointer-events-none fixed bottom-4 right-4 z-[9990] w-[min(22rem,calc(100vw-2rem))] print:hidden"
        data-testid="buyer-cto-demo-tour-overlay"
      >
        <div className="pointer-events-auto rounded-lg border border-neutral-200 bg-white p-4 shadow-lg dark:border-neutral-700 dark:bg-neutral-900">
          <div className="flex items-start justify-between gap-2">
            <p className={cn("m-0", OPERATOR_TYPOGRAPHY.badge, "text-neutral-500 dark:text-neutral-400")}>
              {BUYER_CTO_DEMO_TOUR_HEADING}
            </p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-8 shrink-0 px-2 text-neutral-600 dark:text-neutral-400"
              aria-label={BUYER_CTO_DEMO_TOUR_COLLAPSE_CTA}
              onClick={() => {
                setCollapsed(true);
                writeBuyerCtoDemoTourCollapsed(true);
              }}
            >
              {BUYER_CTO_DEMO_TOUR_COLLAPSE_CTA}
            </Button>
          </div>
          <CtoDemoCustomerPreflightGate
            onAcknowledged={() => {
              setPreflightAcknowledged(true);

              if (!readBuyerCtoDemoPreflightAcknowledged()) {
                return;
              }

              const destination = getStartCtoDemoTourHref();
              const destinationPath = destination.split("?")[0] ?? destination;

              if (pathname !== destinationPath) {
                router.push(destination);
              }
            }}
          />
          <div className="mt-3">
            <Button type="button" variant="outline" size="sm" className="text-neutral-600 dark:text-neutral-400" onClick={endTour}>
              {BUYER_CTO_DEMO_TOUR_END_CTA}
            </Button>
          </div>
        </div>
      </aside>
    );
  }

  return (

    <aside

      aria-label={BUYER_CTO_DEMO_TOUR_ARIA}

      className="pointer-events-none fixed bottom-4 right-4 z-[9990] w-[min(22rem,calc(100vw-2rem))] print:hidden"

      data-testid="buyer-cto-demo-tour-overlay"

    >

      <div className="pointer-events-auto rounded-lg border border-neutral-200 bg-white p-4 shadow-lg dark:border-neutral-700 dark:bg-neutral-900">

        <div className="flex items-start justify-between gap-2">

          <div className="min-w-0">

            <p className={cn("m-0", OPERATOR_TYPOGRAPHY.badge, "text-neutral-500 dark:text-neutral-400")}>

              {BUYER_CTO_DEMO_TOUR_HEADING}

            </p>

            <p className={cn("m-0 mt-1", OPERATOR_TYPE_SCALE.cardTitle, "text-al-text-primary")}>{stepLabel}</p>

            {remainingMinutes !== null ? (

              <p className={cn("m-0 mt-0.5", OPERATOR_TYPOGRAPHY.badge, "text-neutral-500 dark:text-neutral-400")}>

                {buyerCtoDemoRemainingMinutesLabel(remainingMinutes)}

              </p>

            ) : null}

            {autoplay ? (

              <div className="mt-1">

                <StatusTag kind="needs-attention" label={BUYER_CTO_DEMO_TOUR_AUTOPLAY_BADGE} />

              </div>

            ) : null}

          </div>

          <div className="flex shrink-0 flex-wrap items-center gap-1">
            <CtoDemoHowItWorksTrigger />
            <Button type="button" variant="outline" size="sm" className="h-8 px-2" data-testid="cto-demo-explore-toggle" onClick={toggleExploreMode}>
              Explore
            </Button>
            <Button type="button" variant="outline" size="sm" className="h-8 px-2" data-testid="cto-demo-presenter-layer-toggle" onClick={togglePresenterLayer}>
              {presenterLayerVisible ? "Audience view" : "Presenter"}
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-8 shrink-0 px-2 text-neutral-600 dark:text-neutral-400"
              aria-label={BUYER_CTO_DEMO_TOUR_COLLAPSE_CTA}
              onClick={() => {
                setCollapsed(true);
                writeBuyerCtoDemoTourCollapsed(true);
              }}
            >
              {BUYER_CTO_DEMO_TOUR_COLLAPSE_CTA}
            </Button>
          </div>

        </div>

        {showPresenterLayer && navigation.stepIndex !== null && stepTimer !== null ? (
          <div className="mt-2" data-testid="buyer-cto-demo-tour-step-budget">
            <p className={cn("m-0", OPERATOR_TYPOGRAPHY.badge, "text-neutral-500 dark:text-neutral-400")}>
              {formatCtoDemoStepBudgetLabel(navigation.stepIndex)}
            </p>
            <p
              className={cn(
                "m-0 mt-0.5 tabular-nums",
                OPERATOR_TYPOGRAPHY.badge,
                stepTimer.isOvertime
                  ? "font-medium text-amber-700 dark:text-amber-300"
                  : "text-neutral-500 dark:text-neutral-400",
              )}
              data-testid="buyer-cto-demo-tour-step-timer"
            >
              {stepTimer.display}
            </p>
          </div>
        ) : null}

        {showPresenterLayer && presenterNotesVisible ? (

          <p className={cn("m-0 mt-2", OPERATOR_TYPE_SCALE.body, "text-neutral-600 dark:text-neutral-400")}>

            {presenterNotesText}

          </p>

        ) : null}

        {showPresenterLayer && presenterNotesVisible && navigation.stepIndex === 2 ? (
          <p className={cn("m-0 mt-2 text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)} data-testid="cto-demo-compare-drift-beat">
            {BUYER_CTO_DEMO_COMPARE_DRIFT_LABEL}:{" "}
            <Link
              href={BUYER_CTO_DEMO_COMPARE_HREF}
              className="text-teal-800 underline underline-offset-2 dark:text-teal-300"
              data-testid="cto-demo-compare-drift-link"
            >
              {BUYER_CTO_DEMO_COMPARE_DRIFT_CTA}
            </Link>
          </p>
        ) : null}

        {showPresenterLayer && presenterNotesVisible ? (
          <div
            className={cn("mt-2", DESIGN_TOKENS.callout.warn)}
            data-testid="cto-demo-panic-script-section"
          >
            <p className={cn("m-0 font-semibold uppercase tracking-wide text-amber-900 dark:text-amber-200", OPERATOR_TYPOGRAPHY.helper)}>Presenter only</p>
            <p className={cn("m-0 mt-2 font-semibold text-amber-900 dark:text-amber-200", OPERATOR_TYPOGRAPHY.helper)}>
              {BUYER_CTO_DEMO_PANIC_SCRIPT_HEADING}
            </p>
            <p className={cn("m-0 mt-1 text-neutral-700 dark:text-neutral-300", OPERATOR_TYPOGRAPHY.helper)}>{BUYER_CTO_DEMO_PANIC_SCRIPT_BODY}</p>
            <div className="mt-2">
              {panicEnabled ? (
                <StatusTag kind="ready" label={BUYER_CTO_DEMO_PANIC_ENABLED_LABEL} />
              ) : (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-8"
                  data-testid="cto-demo-panic-enable-btn"
                  onClick={() => {
                    writeOperatorDemoPanicOffline(true);
                    window.dispatchEvent(
                      new CustomEvent(ARCHLUCID_CTO_DEMO_PANIC_CHANGED_EVENT, { detail: { on: true } }),
                    );
                    setPanicEnabled(true);
                  }}
                >
                  {BUYER_CTO_DEMO_PANIC_ENABLE_CTA}
                </Button>
              )}
            </div>
          </div>
        ) : null}

        {showPresenterLayer && navigation.stepIndex === 0 ? (

          <>

            <CtoDemoStorySelector

              selectedStoryId={storyId}

              onStoryChange={(story) => {

                setStoryId(story.id);

              }}

            />

            {storyId !== "healthcare" ? (

              <p className={cn("m-0 mt-2", OPERATOR_TYPOGRAPHY.badge, "text-neutral-600 dark:text-neutral-400")}>

                Story: {selectedStory.label} · {selectedStory.policyPackLabel}

              </p>

            ) : null}

            <div className="mt-2">

              <Button

                type="button"

                variant="outline"

                size="sm"

                disabled={smokeBusy}

                data-testid="cto-demo-smoke-check-trigger"

                onClick={() => void runSmokeCheck()}

              >

                {smokeBusy

                  ? "Checking…"

                  : smokeResults === null

                    ? BUYER_CTO_DEMO_SMOKE_CHECK_CTA

                    : BUYER_CTO_DEMO_SMOKE_CHECK_RECHECK_CTA}

              </Button>

              {smokeResults !== null ? (

                <ul className={cn("m-0 mt-2 list-none space-y-1 p-0", OPERATOR_TYPOGRAPHY.helper)} data-testid="cto-demo-smoke-check-results">

                  {smokeResults.map((row) => (

                    <li key={row.stepLabel} className="flex items-center gap-1.5">

                      <span

                        className={cn(

                          "inline-block h-2 w-2 rounded-full",

                          row.ok ? "bg-teal-600" : "bg-red-600",

                        )}

                        aria-hidden

                      />

                      <span>

                        {row.stepLabel}

                        {!row.ok && row.statusCode !== null ? ` (${row.statusCode})` : ""}

                      </span>

                    </li>

                  ))}

                </ul>

              ) : null}

            </div>

          </>

        ) : null}

        {showPresenterLayer ? (
          <p className={cn("m-0 mt-2 text-neutral-500 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>{BUYER_CTO_DEMO_TOUR_KEYBOARD_HINT}</p>
        ) : null}

        {showPresenterLayer ? (
        <div className="mt-2 flex flex-wrap gap-1">

          <Button

            type="button"

            variant="outline"

            size="sm"

            className="h-8 px-2 text-neutral-600 dark:text-neutral-400"

            data-testid="buyer-cto-demo-tour-notes-toggle"

            onClick={() => {

              const next = !presenterNotesVisible;

              setPresenterNotesVisible(next);

              writeBuyerCtoDemoPresenterNotesVisible(next);

            }}

          >

            {presenterNotesVisible ? BUYER_CTO_DEMO_TOUR_NOTES_HIDE_CTA : BUYER_CTO_DEMO_TOUR_NOTES_SHOW_CTA}

          </Button>

          {presenterNotesVisible ? (

            <Button

              type="button"

              variant="outline"

              size="sm"

              className="h-8 px-2 text-neutral-600 dark:text-neutral-400"

              data-testid="buyer-cto-demo-tour-notes-mode-toggle"

              onClick={() => {

                const next = !presenterNotesFullScript;

                setPresenterNotesFullScript(next);

                writeBuyerCtoDemoPresenterNotesFullScript(next);

              }}

            >

              {presenterNotesFullScript ? BUYER_CTO_DEMO_TOUR_NOTES_SUMMARY_CTA : BUYER_CTO_DEMO_TOUR_NOTES_FULL_CTA}

            </Button>

          ) : null}

          <Button

            type="button"

            variant="outline"

            size="sm"

            className="h-8 px-2 text-neutral-600 dark:text-neutral-400"

            data-testid="buyer-cto-demo-tour-cto-questions-toggle"

            onClick={() => {

              setCtoQuestionsVisible((previous) => !previous);

            }}

          >

            {ctoQuestionsVisible ? BUYER_CTO_DEMO_QUESTIONS_HIDE_CTA : BUYER_CTO_DEMO_QUESTIONS_SHOW_CTA}

          </Button>

          <Button

            type="button"

            variant="outline"

            size="sm"

            className="h-8 px-2 text-neutral-600 dark:text-neutral-400"

            data-testid="cto-demo-autoplay-toggle"

            onClick={() => {

              const next = !autoplay;

              setAutoplay(next);

              writeBuyerCtoDemoAutoplay(next);

            }}

          >

            {autoplay ? BUYER_CTO_DEMO_TOUR_AUTOPLAY_OFF_CTA : BUYER_CTO_DEMO_TOUR_AUTOPLAY_ON_CTA}

          </Button>

        </div>
        ) : null}

        {showPresenterLayer && ctoQuestionsVisible ? (

          <ol

            className={cn("m-0 mt-2 list-decimal space-y-2 pl-4 text-neutral-700 dark:text-neutral-300", OPERATOR_TYPOGRAPHY.helper)}

            data-testid="buyer-cto-demo-tour-cto-questions"

          >

            {CTO_DEMO_QUESTIONS.map((row) => (

              <li key={row.id}>

                <p className="m-0 font-semibold text-neutral-900 dark:text-neutral-100">{row.question}</p>

                <p className="m-0 mt-0.5 text-neutral-600 dark:text-neutral-400">{row.answer}</p>

                <Link

                  href={buildCtoDemoProofHref(row)}

                  className="mt-0.5 inline-block text-teal-800 underline underline-offset-2 dark:text-teal-300"

                >

                  {row.proofLabel}

                </Link>

              </li>

            ))}

          </ol>

        ) : null}

        {navigation.stepIndex !== null ? (

          <ol

            className="m-0 mt-3 flex list-none flex-wrap gap-1.5 p-0"

            aria-label="CTO demo journey steps"

            data-testid="buyer-cto-demo-tour-step-indicators"

          >

            {BUYER_GOLDEN_JOURNEY_STEP_DEFINITIONS.map((def, idx) => {

              const current = navigation.stepIndex === idx;

              const done = visitedSteps.has(idx) && !current;

              const chipClass = done

                ? operatorSemanticBadge("ready")

                : current

                  ? cn(operatorSemanticBadge("current"), "font-semibold ring-2 ring-[var(--al-accent-border-focus)]/40")

                  : "border border-neutral-200 bg-white text-al-text-secondary dark:border-neutral-700 dark:bg-neutral-900";

              return (

                <li key={`${def.step}-${def.href}`}>

                  {current ? (

                    <span

                      aria-current="step"

                      aria-label={`Step ${def.step}: ${def.label}. ${def.chipTooltip}`}

                      className={cn("inline-flex min-h-7 items-center gap-1 rounded-full border px-2 py-0.5 font-medium", OPERATOR_TYPOGRAPHY.helper,

                        chipClass,

                      )}

                    >

                      <span className="tabular-nums">{def.step}.</span>

                      <span>{def.label}</span>

                    </span>

                  ) : (

                    <Link

                      href={def.href}

                      prefetch

                      aria-label={`Step ${def.step}: ${def.label}. ${def.chipTooltip}`}

                      className={cn("inline-flex min-h-7 items-center gap-1 rounded-full border px-2 py-0.5 font-medium no-underline transition hover:opacity-95", OPERATOR_TYPOGRAPHY.helper,

                        chipClass,

                      )}

                    >

                      <span className="tabular-nums">{def.step}.</span>

                      <span>{def.label}</span>

                    </Link>

                  )}

                </li>

              );

            })}

          </ol>

        ) : null}

        {navigation.stepIndex === 4 ? <CtoDemoRecapCard /> : null}

        <div className="mt-4 flex flex-wrap items-center justify-between gap-2">

          <Button type="button" variant="outline" size="sm" className="text-neutral-600 dark:text-neutral-400" onClick={endTour}>

            {BUYER_CTO_DEMO_TOUR_END_CTA}

          </Button>

          {navigation.stepIndex !== null && navigation.stepIndex > 0 ? <CtoDemoSoftRestartButton /> : null}

          <div className="flex flex-wrap items-center gap-2">

            {navigation.prev !== null ? (

              <Button type="button" variant="outline" size="sm" asChild>

                <Link href={navigation.prev.href} prefetch data-testid="buyer-cto-demo-tour-back">

                  {BUYER_CTO_DEMO_TOUR_BACK_CTA}: {navigation.prev.label}

                </Link>

              </Button>

            ) : (

              <Button type="button" variant="outline" size="sm" disabled data-testid="buyer-cto-demo-tour-back">

                {BUYER_CTO_DEMO_TOUR_BACK_CTA}

              </Button>

            )}

            {navigation.next !== null ? (

              <Button type="button" size="sm" asChild>

                <Link href={navigation.next.href} prefetch data-testid="buyer-cto-demo-tour-next">

                  {BUYER_CTO_DEMO_TOUR_NEXT_CTA}: {navigation.next.label}

                </Link>

              </Button>

            ) : (

              <Button type="button" size="sm" disabled data-testid="buyer-cto-demo-tour-next">

                {BUYER_CTO_DEMO_TOUR_NEXT_CTA}

              </Button>

            )}

          </div>

        </div>

      </div>

    </aside>

  );

}

