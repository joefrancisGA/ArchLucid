"use client";

import Link from "next/link";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";

import { Button } from "@/components/ui/button";
import { toDocsBlobUrl } from "@/lib/contextual-help-content";
import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";
import {
  ARCHLUCID_ONBOARDING_TOUR_START_EVENT,
  readOnboardingTourCompleted,
  writeOnboardingTourCompleted,
} from "@/lib/onboarding-tour";

type TourStep = {
  id: string;
  title: string;
  body: string;
  /** CSS selector; missing element shows spotlight off but the card still guides. */
  targetSelector?: string;
};

const OPERATOR_ONBOARDING_STEPS: TourStep[] = [
  {
    id: "welcome",
    title: "Welcome to ArchLucid",
    body:
      "This checklist is your Core Pilot path — from an architecture request to a reviewed, exportable package. Complete the steps in order, or jump ahead when you are comfortable.",
    targetSelector: '[data-onboarding="tour-core-pilot"]',
  },
  {
    id: "new-run",
    title: "Create your first architecture review",
    body:
      "Each review starts as an architecture request. Use New request in the sidebar (desktop) or the navigation menu on small screens to open the guided wizard.",
    targetSelector: '[data-onboarding="tour-new-run"]',
  },
  {
    id: "runs",
    title: "Review your architecture reviews",
    body:
      "Finalized reviews produce a manifest you can export. Track recent activity here and open the full list when you need every review in the workspace.",
    targetSelector: '[data-onboarding="tour-runs-dashboard"]',
  },
  {
    id: "disclose",
    title: "Explore deeper",
    body:
      "Use Sidebar layout to reveal extended analysis links and Enterprise Controls when you are ready — Pilot stays the default path until you opt in.",
    targetSelector: '[data-onboarding="tour-nav-settings"]',
  },
  {
    id: "help",
    title: "Get help",
    body:
      "The Help page links to the product guide and documentation index. You can take this tour again anytime from Help.",
    targetSelector: '[data-onboarding="tour-help"]',
  },
  {
    id: "done",
    title: "You are ready",
    body:
      "Follow the Core Pilot checklist for your first manifest, then explore Operate capabilities when your team needs them. The pilot guide in the repo has the full narrative.",
  },
];

function onboardingTourSteps(): TourStep[] {
  if (!isBuyerPolishedOperatorShellEnv()) {
    return OPERATOR_ONBOARDING_STEPS;
  }

  return OPERATOR_ONBOARDING_STEPS.map((s) => {
    if (s.id === "welcome") {
      return {
        ...s,
        body:
          "Explore how governed architecture reviews produce audit-ready packages—walk the checklist in order, or jump ahead when you already know the destination.",
      };
    }

    if (s.id === "new-run") {
      return {
        ...s,
        body:
          "Authoring starts from captured architecture context. New request stays in the sidebar when you enable full operator workflows; polished demos emphasize opening completed packages first.",
      };
    }

    if (s.id === "runs") {
      return {
        ...s,
        body:
          "Finalized reviews expose manifest summaries, traceability, governance posture, and exports—open the reviews list when you need every package in the workspace.",
      };
    }

    if (s.id === "disclose") {
      return {
        ...s,
        body:
          "Use Sidebar layout to reveal deeper analysis when stakeholders ask for it—the default path stays buyer-safe until you opt into extended controls.",
      };
    }

    if (s.id === "done") {
      return {
        ...s,
        body:
          "You can revisit this tour from Help anytime. When operators enable the full shell, follow the Core Pilot checklist for first-live manifests.",
      };
    }

    return s;
  });
}

function shouldSuppressAutoStart(): boolean {
  if (typeof window === "undefined") {
    return true;
  }

  if (process.env.NEXT_PUBLIC_SUPPRESS_ONBOARDING_TOUR === "1") {
    return true;
  }

  const nav = window.navigator as Navigator & { webdriver?: boolean };

  if (nav.webdriver === true) {
    return true;
  }

  return false;
}

type Rect = { top: number; left: number; width: number; height: number };

/**
 * Lightweight first-visit tour: spotlight via box-shadow, no third-party library.
 * Auto-opens on operator home when not completed; Help dispatches a start event.
 */
export function OnboardingTour() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [highlight, setHighlight] = useState<Rect | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const steps = onboardingTourSteps();
  const step = steps[Math.min(stepIndex, steps.length - 1)];

  const stepCount = steps.length;

  const targetSelector = step.targetSelector;

  const closeAndPersist = useCallback(() => {
    writeOnboardingTourCompleted();
    setOpen(false);
    setStepIndex(0);
    setHighlight(null);
  }, []);

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
  }, []);

  useEffect(() => {
    if (pathname !== "/") {
      return;
    }

    if (isBuyerPolishedOperatorShellEnv()) {
      return;
    }

    if (shouldSuppressAutoStart()) {
      return;
    }

    if (readOnboardingTourCompleted()) {
      return;
    }

    const t = window.setTimeout(() => {
      setStepIndex(0);
      setOpen(true);
    }, 400);

    return () => {
      window.clearTimeout(t);
    };
  }, [pathname]);

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

  if (!open) {
    return null;
  }

  const corePilotGuideHref = toDocsBlobUrl("/docs/CORE_PILOT.md");

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
          className="pointer-events-none fixed z-[10001] rounded-md ring-2 ring-teal-500 ring-offset-2 ring-offset-transparent dark:ring-teal-400"
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
          <p className="m-0 text-[11px] font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
            {stepIndex + 1} of {stepCount}
          </p>
          <h2 id="onboarding-tour-title" className="m-0 mt-1 text-sm font-semibold text-al-text-primary">
            {step.title}
          </h2>
          <p className="m-0 mt-2 text-sm leading-relaxed text-neutral-600 dark:text-neutral-400">{step.body}</p>
          {step.id === "done" ? (
            <p className="m-0 mt-3 text-sm">
              <Link
                className="font-semibold text-teal-800 underline dark:text-teal-300"
                href={corePilotGuideHref}
                target="_blank"
                rel="noopener noreferrer"
              >
                Open Core Pilot guide
              </Link>
            </p>
          ) : null}
          <div className="mt-4 flex flex-wrap items-center justify-end gap-2">
            <Button
              type="button"
              variant="ghost"
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
