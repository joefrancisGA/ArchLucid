"use client";

import { useCallback, useState, type ReactElement, type ReactNode } from "react";

import { LIVE_DEMO_CONTINUOUS_TOC_LABEL } from "@/lib/live-demo-page-copy";
import {
  LIVE_DEMO_WALKTHROUGH_STEPS,
  type LiveDemoWalkthroughStepId,
} from "@/lib/live-demo-walkthrough-steps";
import { MARKETING_PRIMARY_FILL_CLASS, MARKETING_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

type LiveDemoContinuousWalkthroughProps = {
  readonly initialStepId: LiveDemoWalkthroughStepId;
  readonly renderStepPanel: (stepId: LiveDemoWalkthroughStepId) => ReactNode;
};

/** TOC + one expanded panel — no five-panel dump on first paint (TB-1269). */
export function LiveDemoContinuousWalkthrough(props: LiveDemoContinuousWalkthroughProps): ReactElement {
  const [expandedStepId, setExpandedStepId] = useState<LiveDemoWalkthroughStepId>(props.initialStepId);

  const onSelectStep = useCallback((stepId: LiveDemoWalkthroughStepId) => {
    setExpandedStepId(stepId);
  }, []);

  const expandedStep =
    LIVE_DEMO_WALKTHROUGH_STEPS.find((step) => step.id === expandedStepId) ?? LIVE_DEMO_WALKTHROUGH_STEPS[0];

  return (
    <div className="space-y-6" data-testid="live-demo-continuous-walkthrough">
      <nav aria-label={LIVE_DEMO_CONTINUOUS_TOC_LABEL} data-testid="live-demo-continuous-toc">
        <ol className="m-0 flex list-none flex-wrap gap-2 p-0">
          {LIVE_DEMO_WALKTHROUGH_STEPS.map((step) => {
            const isExpanded = step.id === expandedStepId;

            return (
              <li key={step.id}>
                <button
                  type="button"
                  className={cn(
                    "inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 focus-visible:ring-offset-2",
                    isExpanded
                      ? "border-teal-600/50 bg-teal-50/80 ring-1 ring-teal-600/20 dark:border-teal-400/40 dark:bg-teal-950/30"
                      : "border-neutral-200 bg-white hover:border-teal-600/30 dark:border-neutral-800 dark:bg-neutral-950 dark:hover:border-teal-400/30",
                  )}
                  aria-current={isExpanded ? "true" : undefined}
                  aria-label={`${step.number}. ${step.title}`}
                  data-testid={`live-demo-continuous-toc-${step.id}`}
                  onClick={() => onSelectStep(step.id)}
                >
                  <span
                    className={cn(
                      "inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold",
                      isExpanded
                        ? MARKETING_PRIMARY_FILL_CLASS
                        : "bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-200",
                    )}
                    aria-hidden
                  >
                    {step.number}
                  </span>
                  <span className={cn("font-medium text-neutral-900 dark:text-neutral-50", MARKETING_TYPOGRAPHY.meta)}>
                    {step.shortLabel}
                  </span>
                </button>
              </li>
            );
          })}
        </ol>
      </nav>

      <div data-testid={`live-demo-continuous-panel-${expandedStep.id}`}>{props.renderStepPanel(expandedStep.id)}</div>
    </div>
  );
}
