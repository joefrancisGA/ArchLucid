"use client";

import { CtoDemoHowItWorksTrigger } from "@/components/cto-demo/CtoDemoHowItWorksTrigger";
import {
  CtoDemoTourCollapsedPill,
  CtoDemoTourExploreResumePill,
  CtoDemoTourNavigationFooter,
  CtoDemoTourStepIndicators,
} from "@/components/cto-demo/CtoDemoTourNavigationPanel";
import { CtoDemoTourPreflightPanel } from "@/components/cto-demo/CtoDemoTourPreflightPanel";
import { CtoDemoTourPresenterNotesPanel } from "@/components/cto-demo/CtoDemoTourPresenterNotesPanel";
import { Button } from "@/components/ui/button";
import { StatusTag } from "@/components/ui/status-tag";
import {
  BUYER_CTO_DEMO_TOUR_ARIA,
  BUYER_CTO_DEMO_TOUR_AUTOPLAY_BADGE,
  BUYER_CTO_DEMO_TOUR_COLLAPSE_CTA,
  BUYER_CTO_DEMO_TOUR_HEADING,
} from "@/lib/buyer/buyer-polish-copy";
import { writeBuyerCtoDemoTourCollapsed } from "@/lib/buyer/buyer-cto-demo-tour";
import { OPERATOR_TYPE_SCALE, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";
import type { BuyerCtoDemoTourControllerState } from "@/components/use-buyer-cto-demo-tour-controller";

export type BuyerCtoDemoTourShellProps = BuyerCtoDemoTourControllerState;

export function BuyerCtoDemoTourShell(state: BuyerCtoDemoTourShellProps): React.JSX.Element | null {
  if (!state.shouldRender) {
    return null;
  }

  if (state.exploreMode) {
    return <CtoDemoTourExploreResumePill onResume={state.toggleExploreMode} />;
  }

  if (state.collapsed) {
    return (
      <CtoDemoTourCollapsedPill
        currentStepNumber={state.currentStepNumber}
        stepCount={state.stepCount}
        onExpand={() => {
          state.setCollapsed(false);
        }}
      />
    );
  }

  if (!state.preflightAcknowledged) {
    return (
      <CtoDemoTourPreflightPanel
        onAcknowledged={() => {
          state.setPreflightAcknowledged(true);
        }}
        onCollapse={() => {
          state.setCollapsed(true);
        }}
        onEndTour={state.endTour}
      />
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
            <p className={cn("m-0 mt-1", OPERATOR_TYPE_SCALE.cardTitle, "text-al-text-primary")}>{state.stepLabel}</p>
            {state.remainingMinutesLabel !== null ? (
              <p className={cn("m-0 mt-0.5", OPERATOR_TYPOGRAPHY.badge, "text-neutral-500 dark:text-neutral-400")}>
                {state.remainingMinutesLabel}
              </p>
            ) : null}
            {state.autoplay ? (
              <div className="mt-1">
                <StatusTag kind="needs-attention" label={BUYER_CTO_DEMO_TOUR_AUTOPLAY_BADGE} />
              </div>
            ) : null}
          </div>

          <div className="flex shrink-0 flex-wrap items-center gap-1">
            <CtoDemoHowItWorksTrigger />
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-8 px-2"
              data-testid="cto-demo-explore-toggle"
              onClick={state.toggleExploreMode}
            >
              Explore
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-8 px-2"
              data-testid="cto-demo-presenter-layer-toggle"
              onClick={state.togglePresenterLayer}
            >
              {state.presenterLayerVisible ? "Audience view" : "Presenter"}
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-8 shrink-0 px-2 text-neutral-600 dark:text-neutral-400"
              aria-label={BUYER_CTO_DEMO_TOUR_COLLAPSE_CTA}
              onClick={() => {
                state.setCollapsed(true);
                writeBuyerCtoDemoTourCollapsed(true);
              }}
            >
              {BUYER_CTO_DEMO_TOUR_COLLAPSE_CTA}
            </Button>
          </div>
        </div>

        <CtoDemoTourPresenterNotesPanel
          showPresenterLayer={state.presenterLayerVisible}
          navigation={state.navigation}
          stepTimer={state.stepTimer}
          presenterNotesText={state.presenterNotesText}
          presenterNotesVisible={state.presenterNotesVisible}
          presenterNotesFullScript={state.presenterNotesFullScript}
          ctoQuestionsVisible={state.ctoQuestionsVisible}
          autoplay={state.autoplay}
          panicEnabled={state.panicEnabled}
          storyId={state.storyId}
          selectedStory={state.selectedStory}
          smokeBusy={state.smokeBusy}
          smokeResults={state.smokeResults}
          onPresenterNotesVisibleChange={state.setPresenterNotesVisible}
          onPresenterNotesFullScriptChange={state.setPresenterNotesFullScript}
          onCtoQuestionsVisibleChange={state.setCtoQuestionsVisible}
          onAutoplayChange={state.setAutoplay}
          onPanicEnabledChange={state.setPanicEnabled}
          onStoryIdChange={state.setStoryId}
          onRunSmokeCheck={() => {
            void state.runSmokeCheck();
          }}
        />

        <CtoDemoTourStepIndicators navigation={state.navigation} visitedSteps={state.visitedSteps} />

        <CtoDemoTourNavigationFooter navigation={state.navigation} onEndTour={state.endTour} />
      </div>
    </aside>
  );
}
