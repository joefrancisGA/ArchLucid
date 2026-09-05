"use client";
import { cn } from "@/lib/utils";
import { OPERATOR_BODY_INLINE_LINK_CLASS, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useLayoutEffect, useRef, useState, type SetStateAction } from "react";

import { Button } from "@/components/ui/button";
import {
  ONBOARDING_TOUR_DONE_LINK_HREF,
  ONBOARDING_TOUR_DONE_LINK_LABEL,
  OPERATOR_ONBOARDING_TOUR_STEPS,
} from "@/lib/operator/operator-onboarding-tour-steps";
import { isWelcomeModalVisible } from "@/lib/operator/operator-onboarding-coordination";
import {
  ARCHLUCID_ONBOARDING_TOUR_START_EVENT,
  writeOnboardingTourCompleted,
} from "@/lib/onboarding-tour";
import {
  onboardingTourOverlayHrefFromSearch,
  parseOnboardingTourOpenFromSearch,
  parseOnboardingTourStepFromSearch,
} from "@/lib/tour/onboarding-tour-overlay-url";

type Rect = { top: number; left: number; width: number; height: number };

/**
 * Guided operator tour: spotlight via box-shadow. Starts from the welcome modal, Help, or registration handoff — never
 * alongside the welcome modal.
 */
export function OnboardingTour() {
  const router = useRouter();
  const pathname = usePathname() ?? "/";
  const searchParams = useSearchParams();
  const onboardingTourOpenParam = searchParams.get("onboardingTourOpen");
  const onboardingTourStepParam = searchParams.get("onboardingTourStep");
  const [open, setOpenState] = useState(() => parseOnboardingTourOpenFromSearch(onboardingTourOpenParam));
  const [stepIndex, setStepIndexState] = useState(() => {
    const urlStep = parseOnboardingTourStepFromSearch(onboardingTourStepParam);

    return urlStep ?? 0;
  });
  const [highlight, setHighlight] = useState<Rect | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const steps = OPERATOR_ONBOARDING_TOUR_STEPS;
  const step = steps[Math.min(stepIndex, steps.length - 1)];

  const stepCount = steps.length;

  const targetSelector = step.targetSelector;

  const syncTourToUrl = useCallback(
    (state: { open: boolean; stepIndex: number }) => {
      router.replace(onboardingTourOverlayHrefFromSearch(searchParams.toString(), state, pathname), {
        scroll: false,
      });
    },
    [pathname, router, searchParams],
  );

  const setOpen = useCallback(
    (value: SetStateAction<boolean>) => {
      setOpenState((current) => {
        const next = typeof value === "function" ? value(current) : value;
        syncTourToUrl({ open: next, stepIndex });

        return next;
      });
    },
    [stepIndex, syncTourToUrl],
  );

  const setStepIndex = useCallback(
    (value: SetStateAction<number>) => {
      setStepIndexState((current) => {
        const next = typeof value === "function" ? value(current) : value;
        syncTourToUrl({ open, stepIndex: next });

        return next;
      });
    },
    [open, syncTourToUrl],
  );

  const closeAndPersist = useCallback(() => {
    writeOnboardingTourCompleted();
    setOpen(false);
    setStepIndex(0);
    setHighlight(null);
  }, [setOpen, setStepIndex]);

  const updateHighlight = useCallback(() => {
    if (!targetSelector) {
      setHighlight(null);

      return;
    }

    const el = document.querySelector(targetSelector);

    if (!(el instanceof HTMLElement)) {
      setHighlight(null);

      return;
    }

    const r = el.getBoundingClientRect();
    const pad = 6;

    setHighlight({
      top: r.top - pad,
      left: r.left - pad,
      width: r.width + pad * 2,
      height: r.height + pad * 2,
    });
  }, [targetSelector]);

  useLayoutEffect(() => {
    if (!open) {
      return;
    }

    updateHighlight();
  }, [open, stepIndex, updateHighlight, pathname]);

  useEffect(() => {
    if (!open) {
      return;
    }

    function onResizeOrScroll() {
      updateHighlight();
    }

    window.addEventListener("resize", onResizeOrScroll);
    window.addEventListener("scroll", onResizeOrScroll, true);

    const obs = new ResizeObserver(() => {
      onResizeOrScroll();
    });

    obs.observe(document.body);

    return () => {
      window.removeEventListener("resize", onResizeOrScroll);
      window.removeEventListener("scroll", onResizeOrScroll, true);
      obs.disconnect();
    };
  }, [open, updateHighlight]);

  useEffect(() => {
    if (!open) {
      return;
    }

    const node = cardRef.current?.querySelector<HTMLElement>("button");

    node?.focus();
  }, [open, stepIndex]);

  useEffect(() => {
    function onStart() {
      setStepIndex(0);
      setOpen(true);
    }

    window.addEventListener(ARCHLUCID_ONBOARDING_TOUR_START_EVENT, onStart);

    return () => {
      window.removeEventListener(ARCHLUCID_ONBOARDING_TOUR_START_EVENT, onStart);
    };
  }, [setOpen, setStepIndex]);

  useEffect(() => {
    const urlOpen = parseOnboardingTourOpenFromSearch(onboardingTourOpenParam);

    if (!urlOpen) {
      setOpenState(false);

      return;
    }

    setOpenState(true);
    const urlStep = parseOnboardingTourStepFromSearch(onboardingTourStepParam);

    if (urlStep !== null) {
      setStepIndexState(Math.min(urlStep, steps.length - 1));
    }
  }, [onboardingTourOpenParam, onboardingTourStepParam, steps.length]);

  useEffect(() => {
    if (!open) {
      return;
    }

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        closeAndPersist();
      }
    }

    window.addEventListener("keydown", onKeyDown);

    return () => {
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open, closeAndPersist]);

  if (!open || isWelcomeModalVisible()) {
    return null;
  }

  return (
    <div className="pointer-events-none fixed inset-0 z-[10000]" aria-hidden={false}>
      <button
        type="button"
        className="pointer-events-auto fixed inset-0 border-0 bg-black/45 p-0 dark:bg-black/55"
        onClick={() => {
          closeAndPersist();
        }}
        aria-label="Dismiss tour"
      />

      {highlight !== null ? (
        <div
          className="pointer-events-none fixed z-[10001] rounded-md ring-2 ring-neutral-500 ring-offset-2 ring-offset-transparent dark:ring-neutral-400"
          style={{
            top: highlight.top,
            left: highlight.left,
            width: highlight.width,
            height: highlight.height,
            boxShadow: "0 0 0 9999px rgba(0,0,0,0.45)",
          }}
        />
      ) : null}

      <div
        ref={cardRef}
        className="pointer-events-auto fixed bottom-6 left-1/2 z-[10002] w-[min(22rem,calc(100vw-2rem))] -translate-x-1/2"
        role="dialog"
        aria-modal="true"
        aria-labelledby="onboarding-tour-title"
      >
        <div className="rounded-lg border border-neutral-200 bg-white p-4 shadow-xl dark:border-neutral-700 dark:bg-neutral-900">
          <p className={cn("m-0 font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>
            {stepIndex + 1} of {stepCount}
          </p>
          <h2 id="onboarding-tour-title" className={cn("m-0 mt-1 font-semibold text-al-text-primary", OPERATOR_TYPOGRAPHY.cardTitle)}>
            {step.title}
          </h2>
          <p className={cn("m-0 mt-2 leading-relaxed text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.body)}>{step.body}</p>
          {step.id === "done" ? (
            <p className={cn("m-0 mt-3", OPERATOR_TYPOGRAPHY.body)}>
              <Link
                className={OPERATOR_BODY_INLINE_LINK_CLASS}
                href={ONBOARDING_TOUR_DONE_LINK_HREF}
              >
                {ONBOARDING_TOUR_DONE_LINK_LABEL}
              </Link>
            </p>
          ) : null}
          <div className="mt-4 flex flex-wrap items-center justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="text-neutral-600 dark:text-neutral-400"
              onClick={() => {
                closeAndPersist();
              }}
            >
              Skip
            </Button>
            {stepIndex < stepCount - 1 ? (
              <Button
                type="button"
                size="sm"
                onClick={() => {
                  setStepIndex((i) => Math.min(i + 1, stepCount - 1));
                }}
              >
                Next
              </Button>
            ) : (
              <Button
                type="button"
                size="sm"
                onClick={() => {
                  closeAndPersist();
                }}
              >
                Done
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

