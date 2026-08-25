"use client";

import Link from "next/link";

import { CtoDemoRecapCard } from "@/components/cto-demo/CtoDemoRecapCard";
import { CtoDemoSoftRestartButton } from "@/components/cto-demo/CtoDemoSoftRestartButton";
import { Button } from "@/components/ui/button";
import type { resolveBuyerCtoDemoTourNavigation } from "@/lib/buyer/buyer-cto-demo-tour";
import { writeBuyerCtoDemoTourCollapsed } from "@/lib/buyer/buyer-cto-demo-tour";
import { BUYER_GOLDEN_JOURNEY_STEP_DEFINITIONS } from "@/lib/buyer/buyer-golden-journey-nav";
import {
  BUYER_CTO_DEMO_TOUR_BACK_CTA,
  BUYER_CTO_DEMO_TOUR_END_CTA,
  BUYER_CTO_DEMO_TOUR_EXPAND_CTA,
  BUYER_CTO_DEMO_TOUR_HEADING,
  BUYER_CTO_DEMO_TOUR_NEXT_CTA,
} from "@/lib/buyer/buyer-polish-copy";
import { OPERATOR_TYPOGRAPHY, operatorSemanticBadge } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

type TourNavigation = ReturnType<typeof resolveBuyerCtoDemoTourNavigation>;

type CtoDemoTourExploreResumePillProps = {
  onResume: () => void;
};

export function CtoDemoTourExploreResumePill({ onResume }: CtoDemoTourExploreResumePillProps): React.JSX.Element {
  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-[9990] print:hidden" data-testid="cto-demo-explore-resume-pill">
      <Button
        type="button"
        size="sm"
        className="pointer-events-auto h-7 min-w-[3.25rem] px-2 shadow-sm"
        aria-label="Resume CTO demo tour"
        onClick={onResume}
      >
        Tour
      </Button>
    </div>
  );
}

type CtoDemoTourCollapsedPillProps = {
  currentStepNumber: number | null;
  stepCount: number;
  onExpand: () => void;
};

export function CtoDemoTourCollapsedPill({
  currentStepNumber,
  stepCount,
  onExpand,
}: CtoDemoTourCollapsedPillProps): React.JSX.Element {
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
          onExpand();
          writeBuyerCtoDemoTourCollapsed(false);
        }}
      >
        {BUYER_CTO_DEMO_TOUR_HEADING}
        {currentStepNumber !== null ? ` · ${currentStepNumber}/${stepCount}` : ""}
      </Button>
    </div>
  );
}

type CtoDemoTourStepIndicatorsProps = {
  navigation: TourNavigation;
  visitedSteps: ReadonlySet<number>;
};

export function CtoDemoTourStepIndicators({
  navigation,
  visitedSteps,
}: CtoDemoTourStepIndicatorsProps): React.JSX.Element | null {
  if (navigation.stepIndex === null) {
    return null;
  }

  return (
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
                className={cn(
                  "inline-flex min-h-7 items-center gap-1 rounded-full border px-2 py-0.5 font-medium",
                  OPERATOR_TYPOGRAPHY.helper,
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
                className={cn(
                  "inline-flex min-h-7 items-center gap-1 rounded-full border px-2 py-0.5 font-medium no-underline transition hover:opacity-95",
                  OPERATOR_TYPOGRAPHY.helper,
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
  );
}

type CtoDemoTourNavigationFooterProps = {
  navigation: TourNavigation;
  onEndTour: () => void;
};

export function CtoDemoTourNavigationFooter({
  navigation,
  onEndTour,
}: CtoDemoTourNavigationFooterProps): React.JSX.Element {
  return (
    <>
      {navigation.stepIndex === 4 ? <CtoDemoRecapCard /> : null}

      <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
        <Button type="button" variant="outline" size="sm" className="text-neutral-600 dark:text-neutral-400" onClick={onEndTour}>
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
    </>
  );
}
