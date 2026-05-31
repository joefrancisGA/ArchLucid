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

  if (dismissed) {
    return (
      <section
        aria-label="ROI baseline readiness"
        className="flex flex-wrap items-center gap-2 rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900/50"
        data-testid="pilot-roi-baseline-readiness-compact"
      >
        <p className="m-0 font-medium text-neutral-800 dark:text-neutral-200">ROI baseline not set</p>
        <Link
          href="/settings/baseline"
          className="font-medium text-teal-800 underline underline-offset-2 dark:text-teal-300"
        >
          Settings → Baseline
        </Link>
        <Button type="button" size="sm" variant="outline" className="h-8" onClick={openPilotBaselineWizard}>
          Set baseline
        </Button>
      </section>
    );
  }

  return (
    <section
      aria-labelledby="pilot-roi-baseline-readiness-heading"
      className="rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-950/40"
      data-testid="pilot-roi-baseline-readiness-card"
    >
      <div className="flex items-start justify-between gap-3">
        <h2
          id="pilot-roi-baseline-readiness-heading"
          className="m-0 text-sm font-semibold text-amber-950 dark:text-amber-100"
        >
          ROI baseline not set
        </h2>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8 shrink-0 text-amber-800/70 hover:text-amber-950 dark:text-amber-200/70 dark:hover:text-amber-100"
          aria-label="Dismiss ROI baseline prompt"
          data-testid="pilot-roi-baseline-readiness-dismiss"
          onClick={dismissPrompt}
        >
          <X className="h-4 w-4" aria-hidden />
        </Button>
      </div>

      <p className="m-0 mt-2 max-w-3xl text-sm leading-relaxed text-amber-950/90 dark:text-amber-100/90">
        Set a review-cycle baseline so ArchLucid can estimate time saved after your first review package. Enter a rough
        estimate now, or skip and add it later in{" "}
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
          onClick={dismissPrompt}
        >
          Skip for now
        </Button>
      </div>
    </section>
  );
}
