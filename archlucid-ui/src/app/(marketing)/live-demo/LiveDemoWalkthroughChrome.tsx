"use client";

import { useState, type ReactElement, type ReactNode } from "react";

import type { LiveDemoWalkthroughStepId } from "@/lib/live-demo-walkthrough-steps";

import { LiveDemoEarlyConversionCta } from "./LiveDemoEarlyConversionCta";
import { LiveDemoWalkthroughNav } from "./LiveDemoWalkthroughNav";

type LiveDemoWalkthroughChromeProps = {
  readonly activeStepId: LiveDemoWalkthroughStepId;
  readonly guidedPanel: ReactNode;
  readonly continuousPanels: ReactNode;
  readonly conversionCta: ReactNode;
};

export function LiveDemoWalkthroughChrome(props: LiveDemoWalkthroughChromeProps): ReactElement {
  const [continuousMode, setContinuousMode] = useState(false);

  return (
    <div className="space-y-6" data-testid="live-demo-walkthrough-shell">
      <LiveDemoWalkthroughNav
        activeStepId={props.activeStepId}
        continuousMode={continuousMode}
        onContinuousModeChange={setContinuousMode}
      />

      {!continuousMode ? <LiveDemoEarlyConversionCta /> : null}

      <div
        role="region"
        aria-live="polite"
        className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-950"
        data-testid="live-demo-active-panel"
      >
        {continuousMode ? props.continuousPanels : props.guidedPanel}
      </div>

      {props.conversionCta}
    </div>
  );
}
