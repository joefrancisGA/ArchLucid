"use client";

import Link from "next/link";
import { useCallback, useEffect, useLayoutEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { usePilotRoiBaselineCompleteness } from "@/hooks/use-pilot-roi-baseline-completeness";
import { isNextPublicDemoMode } from "@/lib/demo-ui-env";
import {
  dismissPilotRoiBaselineReadinessCardForSession,
  isPilotRoiBaselineReadinessCardDismissedForSession,
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
  const [dismissedForSession, setDismissedForSession] = useState(false);
  const [chromeSuppressed, setChromeSuppressed] = useState(false);

  useLayoutEffect(() => {
    setDismissedForSession(isPilotRoiBaselineReadinessCardDismissedForSession());
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

  const skipForNow = useCallback(() => {
    dismissPilotRoiBaselineReadinessCardForSession();
    setDismissedForSession(true);
  }, []);

  if (demoMode || chromeSuppressed || loading || complete !== false || dismissedForSession) {
    return null;
  }

  return (
    <section
      aria-labelledby="pilot-roi-baseline-readiness-heading"
      className="rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-950/40"
      data-testid="pilot-roi-baseline-readiness-card"
    >
      <h2
        id="pilot-roi-baseline-readiness-heading"
        className="m-0 text-sm font-semibold text-amber-950 dark:text-amber-100"
      >
        ROI baseline not set
      </h2>

      <p className="m-0 mt-2 max-w-3xl text-sm leading-relaxed text-amber-950/90 dark:text-amber-100/90">
        Set a review-cycle baseline to enable sponsor-facing ROI reporting. Enter a rough estimate now, or skip and add
        it later in{" "}
        <Link href="/settings/baseline" className="font-medium text-teal-800 underline underline-offset-2 dark:text-teal-300">
          Settings → Baseline
        </Link>
        .
      </p>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <Button
          type="button"
          size="sm"
          variant="primary"
          data-testid="pilot-roi-baseline-readiness-set"
          onClick={openPilotBaselineWizard}
        >
          Set baseline
        </Button>

        <Button
          type="button"
          size="sm"
          variant="outline"
          data-testid="pilot-roi-baseline-readiness-skip"
          onClick={skipForNow}
        >
          Skip for now
        </Button>
      </div>
    </section>
  );
}
