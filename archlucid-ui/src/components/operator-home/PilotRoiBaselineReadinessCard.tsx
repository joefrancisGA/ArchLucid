"use client";

import { cn } from "@/lib/utils";
import { useCallback, useEffect, useLayoutEffect, useState } from "react";

import { useNavCommittedArchitectureReview } from "@/components/operator/OperatorNavAuthorityProvider";
import { Button } from "@/components/ui/button";
import { DismissControl } from "@/components/usability/DismissControl";
import { usePilotRoiBaselineCompleteness } from "@/hooks/use-pilot-roi-baseline-completeness";
import {
  OPERATOR_ROI_ESTIMATE_ADD_CTA,
  OPERATOR_ROI_ESTIMATE_DISMISS_CTA,
  OPERATOR_ROI_ESTIMATE_PENDING_BODY,
  OPERATOR_ROI_ESTIMATE_PENDING_HEADLINE,
} from "@/lib/buyer/buyer-home-status-copy";
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
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

function openPilotBaselineWizard(): void {
  window.dispatchEvent(new Event(PILOT_BASELINE_WIZARD_OPEN_EVENT));
}

/** Non-blocking Home prompt when tenant ROI baselines are missing — opens the guided wizard on demand. */
export function PilotRoiBaselineReadinessCard(): React.JSX.Element | null {
  const demoMode = isNextPublicDemoMode();
  const hasCommittedArchitectureReview = useNavCommittedArchitectureReview();
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

  if (demoMode || chromeSuppressed || loading || complete !== false || !hasCommittedArchitectureReview) {
    return null;
  }

  const bannerClass = cn(
    "flex flex-wrap items-center gap-x-3 gap-y-1.5 rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2 dark:border-neutral-700 dark:bg-neutral-900/50",
    OPERATOR_TYPOGRAPHY.body,
  );

  if (dismissed) {
    return (
      <section
        aria-label="ROI baseline readiness"
        className={bannerClass}
        data-testid="pilot-roi-baseline-readiness-compact"
      >
        <p className="m-0 font-medium text-neutral-800 dark:text-neutral-200">{OPERATOR_ROI_ESTIMATE_PENDING_HEADLINE}</p>
        <p className="m-0 text-neutral-600 dark:text-neutral-400">{OPERATOR_ROI_ESTIMATE_PENDING_BODY}</p>
        <Button type="button" size="sm" variant="outline" className="h-7 shrink-0" onClick={openPilotBaselineWizard}>
          {OPERATOR_ROI_ESTIMATE_ADD_CTA}
        </Button>
      </section>
    );
  }

  return (
    <section
      aria-label="ROI baseline readiness"
      className={bannerClass}
      data-testid="pilot-roi-baseline-readiness-card"
    >
      <p className="m-0 font-medium text-neutral-800 dark:text-neutral-200">{OPERATOR_ROI_ESTIMATE_PENDING_HEADLINE}</p>
      <p className="m-0 text-neutral-600 dark:text-neutral-400">{OPERATOR_ROI_ESTIMATE_PENDING_BODY}</p>
      <div className="flex shrink-0 flex-wrap items-center gap-2">
        <Button
          type="button"
          size="sm"
          variant="primary"
          className="h-7"
          data-testid="pilot-roi-baseline-readiness-set"
          onClick={openPilotBaselineWizard}
        >
          {OPERATOR_ROI_ESTIMATE_ADD_CTA}
        </Button>
        <DismissControl
          className="h-7"
          label={OPERATOR_ROI_ESTIMATE_DISMISS_CTA}
          data-testid="pilot-roi-baseline-readiness-skip"
          onDismiss={dismissPrompt}
        />
        <DismissControl
          iconOnly
          ariaLabel="Dismiss ROI baseline prompt"
          className="h-7 w-7 text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100"
          data-testid="pilot-roi-baseline-readiness-dismiss"
          onDismiss={dismissPrompt}
        />
      </div>
    </section>
  );
}
