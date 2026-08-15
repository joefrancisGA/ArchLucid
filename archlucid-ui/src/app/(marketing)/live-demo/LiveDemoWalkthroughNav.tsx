"use client";

import { FileText, GitBranch, History, ShieldCheck, Stamp } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, type ReactElement } from "react";

import { Button } from "@/components/ui/button";
import {
  LIVE_DEMO_NEXT_STEP,
  LIVE_DEMO_PREVIOUS_STEP,
  LIVE_DEMO_RETURN_TO_GUIDED,
  LIVE_DEMO_STEPPER_LABEL,
  LIVE_DEMO_VALUE_PROPOSITION,
  LIVE_DEMO_VIEW_FULL_WALKTHROUGH,
} from "@/lib/live-demo-page-copy";
import {
  LIVE_DEMO_WALKTHROUGH_STEPS,
  liveDemoWalkthroughStepIndex,
  type LiveDemoWalkthroughStepId,
} from "@/lib/live-demo-walkthrough-steps";
import { trackLiveDemoStepViewed, trackLiveDemoWalkthroughStarted } from "@/lib/live-demo-telemetry";
import { MARKETING_PRIMARY_FILL_CLASS, MARKETING_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

import { LiveDemoSampleStatusLine } from "./LiveDemoPageHeader";

const STEP_ICONS = {
  sponsor: FileText,
  "signed-record": Stamp,
  evidence: GitBranch,
  governance: ShieldCheck,
  "audit-trail": History,
} as const;

type LiveDemoWalkthroughNavProps = {
  readonly activeStepId: LiveDemoWalkthroughStepId;
  readonly continuousMode: boolean;
  readonly onContinuousModeChange: (enabled: boolean) => void;
};

function stepHref(pathname: string, stepId: LiveDemoWalkthroughStepId): string {
  const params = new URLSearchParams();
  params.set("step", stepId);

  return `${pathname}?${params.toString()}`;
}

export function LiveDemoWalkthroughNav(props: LiveDemoWalkthroughNavProps): ReactElement {
  const router = useRouter();
  const pathname = usePathname();
  const startedRef = useRef(false);
  const activeIndex = liveDemoWalkthroughStepIndex(props.activeStepId);
  const activeStep = LIVE_DEMO_WALKTHROUGH_STEPS[activeIndex];

  useEffect(() => {
    if (startedRef.current) {
      return;
    }

    startedRef.current = true;
    trackLiveDemoWalkthroughStarted();
  }, []);

  useEffect(() => {
    trackLiveDemoStepViewed(props.activeStepId);
  }, [props.activeStepId]);

  const navigateToStep = useCallback(
    (stepId: LiveDemoWalkthroughStepId) => {
      router.replace(stepHref(pathname, stepId), { scroll: false });
    },
    [pathname, router],
  );

  const goPrevious = useCallback(() => {
    if (activeIndex <= 0) {
      return;
    }

    const previousStep = LIVE_DEMO_WALKTHROUGH_STEPS[activeIndex - 1];

    if (previousStep !== undefined) {
      navigateToStep(previousStep.id);
    }
  }, [activeIndex, navigateToStep]);

  const goNext = useCallback(() => {
    if (activeIndex >= LIVE_DEMO_WALKTHROUGH_STEPS.length - 1) {
      return;
    }

    const nextStep = LIVE_DEMO_WALKTHROUGH_STEPS[activeIndex + 1];

    if (nextStep !== undefined) {
      navigateToStep(nextStep.id);
    }
  }, [activeIndex, navigateToStep]);

  const onStepKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLButtonElement>, stepId: LiveDemoWalkthroughStepId) => {
      if (event.key !== "Enter" && event.key !== " ") {
        return;
      }

      event.preventDefault();
      navigateToStep(stepId);
    },
    [navigateToStep],
  );

  return (
    <div className="space-y-4" data-testid="live-demo-walkthrough-nav">
      <LiveDemoSampleStatusLine />

      <p className={cn("m-0 max-w-3xl text-neutral-700 dark:text-neutral-300", MARKETING_TYPOGRAPHY.body)}>
        {LIVE_DEMO_VALUE_PROPOSITION}
      </p>

      <nav aria-label={LIVE_DEMO_STEPPER_LABEL} data-testid="live-demo-stepper">
        <ol className="m-0 flex list-none flex-wrap gap-2 p-0">
          {LIVE_DEMO_WALKTHROUGH_STEPS.map((step) => {
            const Icon = STEP_ICONS[step.id];
            const isActive = step.id === props.activeStepId;

            return (
              <li key={step.id}>
                <button
                  type="button"
                  className={cn(
                    "inline-flex items-center gap-2 rounded-lg border px-2.5 py-2 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 focus-visible:ring-offset-2",
                    isActive
                      ? "border-teal-600/50 bg-teal-50/80 ring-1 ring-teal-600/20 dark:border-teal-400/40 dark:bg-teal-950/30"
                      : "border-neutral-200 bg-white hover:border-teal-600/30 dark:border-neutral-800 dark:bg-neutral-950 dark:hover:border-teal-400/30",
                  )}
                  aria-current={isActive ? "step" : undefined}
                  aria-label={`Step ${step.number}: ${step.title}`}
                  data-testid={`live-demo-stepper-${step.id}`}
                  onClick={() => navigateToStep(step.id)}
                  onKeyDown={(event) => onStepKeyDown(event, step.id)}
                >
                  <span
                    className={cn(
                      "inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold",
                      isActive
                        ? MARKETING_PRIMARY_FILL_CLASS
                        : "bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-200",
                    )}
                    aria-hidden
                  >
                    {step.number}
                  </span>
                  <Icon className="h-4 w-4 shrink-0 text-teal-800 dark:text-teal-300" aria-hidden />
                  <span className={cn("font-medium text-neutral-900 dark:text-neutral-50", MARKETING_TYPOGRAPHY.meta)}>
                    {step.shortLabel}
                  </span>
                </button>
              </li>
            );
          })}
        </ol>
      </nav>

      <div className="flex flex-wrap items-center gap-3">
        <Button
          type="button"
          variant="outline"
          size="sm"
          data-testid="live-demo-toggle-continuous"
          onClick={() => props.onContinuousModeChange(!props.continuousMode)}
        >
          {props.continuousMode ? LIVE_DEMO_RETURN_TO_GUIDED : LIVE_DEMO_VIEW_FULL_WALKTHROUGH}
        </Button>
      </div>

      {!props.continuousMode ? (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Button
            type="button"
            variant="outline"
            data-testid="live-demo-previous"
            disabled={activeIndex <= 0}
            onClick={goPrevious}
          >
            {LIVE_DEMO_PREVIOUS_STEP}
          </Button>
          <p className={cn("m-0 text-neutral-600 dark:text-neutral-400", MARKETING_TYPOGRAPHY.meta)}>
            Step {activeStep.number} of {LIVE_DEMO_WALKTHROUGH_STEPS.length}
          </p>
          <Button
            type="button"
            variant="primary"
            data-testid="live-demo-next"
            disabled={activeIndex >= LIVE_DEMO_WALKTHROUGH_STEPS.length - 1}
            onClick={goNext}
          >
            {LIVE_DEMO_NEXT_STEP}
          </Button>
        </div>
      ) : null}
    </div>
  );
}
