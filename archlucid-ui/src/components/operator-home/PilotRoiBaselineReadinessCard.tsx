"use client";

import Link from "next/link";
import { X } from "lucide-react";
import { useCallback, useEffect, useLayoutEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { usePilotRoiBaselineCompleteness } from "@/hooks/use-pilot-roi-baseline-completeness";
import { isNextPublicDemoMode } from "@/lib/demo-ui-env";
import {
  dismissPilotRoiBaselineReadinessCard,
  isPilotRoiBaselineReadinessCardDismissed,
} from "@/lib/pilot-roi-baseline-readiness-card";
import { suppressPilotRoiBaselineChrome } from "@/lib/pilot-roi-baseline-chrome";
import {
  PILOT_BASELINE_WIZARD_OPEN_EVENT,
  PILOT_BASELINE_WIZARD_SAVED_EVENT,
} from "@/lib/pilot-baseline-wizard-events";

function openPilotBaselineWizard(): void {
  window.dispatchEvent(new Event(PILOT_BASELINE_WIZARD_OPEN_EVENT));
}

/** Non-blocking Home prompt when tenant ROI baselines are missing — opens the guided wizard on demand. */
export function PilotRoiBaselineReadinessCard(): React.JSX.Element | null {
  const demoMode = isNextPublicDemoMode();
  const { loading, complete, reload } = usePilotRoiBaselineCompleteness();
  const [dismissed, setDismissed] = useState(false);
  const [chromeSuppressed, setChromeSuppressed] = useState(false);

  useLayoutEffect(() => {
    setDismissed(isPilotRoiBaselineReadinessCardDismissed());
    setChromeSuppressed(suppressPilotRoiBaselineChrome());
  }, []);

  useEffect(() => {
    function onSaved(): void {
      void reload();
    }

    window.addEventListener(PILOT_BASELINE_WIZARD_SAVED_EVENT, onSaved);

    return () => {
      window.removeEventListener(PILOT_BASELINE_WIZARD_SAVED_EVENT, onSaved);
    };
  }, [reload]);

  const dismissPrompt = useCallback(() => {
    dismissPilotRoiBaselineReadinessCard();
    setDismissed(true);
  }, []);

  if (demoMode || chromeSuppressed || loading || complete !== false) {
    return null;
  }

  const bannerClass =
    "flex flex-wrap items-center gap-x-3 gap-y-1.5 rounded-lg border px-3 py-2 text-sm";

  if (dismissed) {
    return (
      <section
        aria-label="ROI baseline readiness"
        className={`${bannerClass} border-neutral-200 bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-900/50`}
        data-testid="pilot-roi-baseline-readiness-compact"
      >
        <p className="m-0 font-medium text-neutral-800 dark:text-neutral-200">ROI baseline not set</p>
        <p className="m-0 text-neutral-600 dark:text-neutral-400">
          Set a baseline to estimate time saved after your first review.
        </p>
        <Button type="button" size="sm" variant="outline" className="h-7 shrink-0" onClick={openPilotBaselineWizard}>
          Set baseline
        </Button>
      </section>
    );
  }

  return (
    <section
      aria-label="ROI baseline readiness"
      className={`${bannerClass} border-amber-600/30 bg-amber-50/60 dark:border-amber-700/40 dark:bg-amber-950/20`}
      data-testid="pilot-roi-baseline-readiness-card"
    >
      <p className="m-0 font-medium text-amber-950 dark:text-amber-100">ROI baseline not set</p>
      <p className="m-0 text-amber-900/80 dark:text-amber-200/80">
        Set a baseline to estimate time saved after your first review.
      </p>
      <div className="flex shrink-0 flex-wrap items-center gap-2">
        <Button
          type="button"
          size="sm"
          variant="primary"
          className="h-7"
          data-testid="pilot-roi-baseline-readiness-set"
          onClick={openPilotBaselineWizard}
        >
          Set baseline
        </Button>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          className="h-7"
          data-testid="pilot-roi-baseline-readiness-skip"
          onClick={dismissPrompt}
        >
          Skip
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-7 w-7 shrink-0 text-amber-800/60 hover:text-amber-950 dark:text-amber-200/60 dark:hover:text-amber-100"
          aria-label="Dismiss ROI baseline prompt"
          data-testid="pilot-roi-baseline-readiness-dismiss"
          onClick={dismissPrompt}
        >
          <X className="h-3.5 w-3.5" aria-hidden />
        </Button>
      </div>
    </section>
  );
}
