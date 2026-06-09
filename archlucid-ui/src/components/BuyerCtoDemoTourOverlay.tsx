"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  ARCHLUCID_BUYER_CTO_DEMO_TOUR_START_EVENT,
  BUYER_CTO_DEMO_TOUR_QUERY_PARAM,
  readBuyerCtoDemoTourActive,
  readBuyerCtoDemoTourCollapsed,
  resolveBuyerCtoDemoTourNavigation,
  writeBuyerCtoDemoTourActive,
  writeBuyerCtoDemoTourCollapsed,
} from "@/lib/buyer-cto-demo-tour";
import { BUYER_GOLDEN_JOURNEY_STEP_DEFINITIONS } from "@/lib/buyer-golden-journey-nav";
import {
  BUYER_CTO_DEMO_TOUR_ARIA,
  BUYER_CTO_DEMO_TOUR_BACK_CTA,
  BUYER_CTO_DEMO_TOUR_COLLAPSE_CTA,
  BUYER_CTO_DEMO_TOUR_END_CTA,
  BUYER_CTO_DEMO_TOUR_EXPAND_CTA,
  BUYER_CTO_DEMO_TOUR_HEADING,
  BUYER_CTO_DEMO_TOUR_NEXT_CTA,
} from "@/lib/buyer-polish-copy";
import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";
import { OPERATOR_TYPOGRAPHY, OPERATOR_TYPE_SCALE, operatorSemanticBadge } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

/**
 * Persistent presenter rail for the five-step buyer golden journey — Back/Next without hunting the layer strip.
 */
export function BuyerCtoDemoTourOverlay(): React.JSX.Element | null {
  const pathname = usePathname() ?? "/";
  const searchParams = useSearchParams();
  const router = useRouter();
  const [active, setActive] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [mounted, setMounted] = useState(false);

  const activateTour = useCallback(() => {
    writeBuyerCtoDemoTourActive(true);
    setActive(true);
    setCollapsed(false);
    writeBuyerCtoDemoTourCollapsed(false);
  }, []);

  const endTour = useCallback(() => {
    writeBuyerCtoDemoTourActive(false);
    setActive(false);
    setCollapsed(false);
    writeBuyerCtoDemoTourCollapsed(false);
  }, []);

  useEffect(() => {
    setMounted(true);
    setActive(readBuyerCtoDemoTourActive());
    setCollapsed(readBuyerCtoDemoTourCollapsed());
  }, []);

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

  if (!isBuyerPolishedOperatorShellEnv() || !mounted || !active) {
    return null;
  }

  const navigation = resolveBuyerCtoDemoTourNavigation(pathname);
  const stepCount = navigation.stepCount;
  const currentStepNumber = navigation.stepIndex !== null ? navigation.stepIndex + 1 : null;
  const stepLabel =
    currentStepNumber !== null ? `Step ${currentStepNumber} of ${stepCount}` : navigation.summaryLine;

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
          </div>
          <Button
            type="button"
            variant="ghost"
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

        <p className={cn("m-0 mt-2", OPERATOR_TYPE_SCALE.body, "text-neutral-600 dark:text-neutral-400")}>
          {navigation.presenterLine}
        </p>

        {navigation.stepIndex !== null ? (
          <ol
            className="m-0 mt-3 flex list-none flex-wrap gap-1.5 p-0"
            aria-label="CTO demo journey steps"
            data-testid="buyer-cto-demo-tour-step-indicators"
          >
            {BUYER_GOLDEN_JOURNEY_STEP_DEFINITIONS.map((def, idx) => {
              const current = navigation.stepIndex === idx;
              const done = navigation.stepIndex !== null && idx < navigation.stepIndex;

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
                      title={def.chipTooltip}
                      className={cn(
                        "inline-flex min-h-7 items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium",
                        chipClass,
                      )}
                    >
                      <span className="tabular-nums">{def.step}.</span>
                      <span>{def.label}</span>
                    </span>
                  ) : (
                    <Link
                      href={def.href}
                      title={def.chipTooltip}
                      className={cn(
                        "inline-flex min-h-7 items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium no-underline transition hover:opacity-95",
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

        <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
          <Button type="button" variant="ghost" size="sm" className="text-neutral-600 dark:text-neutral-400" onClick={endTour}>
            {BUYER_CTO_DEMO_TOUR_END_CTA}
          </Button>
          <div className="flex flex-wrap items-center gap-2">
            {navigation.prev !== null ? (
              <Button type="button" variant="outline" size="sm" asChild>
                <Link href={navigation.prev.href} data-testid="buyer-cto-demo-tour-back">
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
                <Link href={navigation.next.href} data-testid="buyer-cto-demo-tour-next">
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
