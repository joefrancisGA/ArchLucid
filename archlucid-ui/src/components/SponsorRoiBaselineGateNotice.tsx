"use client";

import { cn } from "@/lib/utils";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { usePilotRoiBaselineCompleteness } from "@/hooks/use-pilot-roi-baseline-completeness";
import { OPERATOR_CALLOUT_WARN_CLASS, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { PILOT_BASELINE_WIZARD_OPEN_EVENT, PILOT_BASELINE_WIZARD_SAVED_EVENT } from "@/lib/pilot-baseline-wizard-events";
import {
  resolveSponsorRoiBaselineGate,
  shouldShowSponsorRoiBaselineGateNotice,
  SPONSOR_ROI_BASELINE_GATE_BODY,
  SPONSOR_ROI_BASELINE_GATE_CAPTURE_CTA,
  SPONSOR_ROI_BASELINE_GATE_HEADLINE,
  SPONSOR_ROI_BASELINE_GATE_SEND_ANYWAY_CTA,
  SPONSOR_ROI_BASELINE_SCORECARD_HREF,
} from "@/lib/sponsor-roi-baseline-gate";

export type SponsorRoiBaselineGateNoticeProps = {
  /** Finalized signed review record — gate is not-applicable until true. */
  readonly isFinalized: boolean;
  readonly className?: string;
};

/**
 * Soft H8 warning before sponsor export: baselines missing, exports stay enabled (TB-2204).
 */
export function SponsorRoiBaselineGateNotice(
  props: SponsorRoiBaselineGateNoticeProps,
): React.JSX.Element | null {
  const { loading, complete, reload } = usePilotRoiBaselineCompleteness();
  const [sendAnyway, setSendAnyway] = useState(false);

  useEffect(() => {
    function onSaved(): void {
      void reload();
    }

    window.addEventListener(PILOT_BASELINE_WIZARD_SAVED_EVENT, onSaved);

    return () => {
      window.removeEventListener(PILOT_BASELINE_WIZARD_SAVED_EVENT, onSaved);
    };
  }, [reload]);

  const acknowledgeSendAnyway = useCallback(() => {
    setSendAnyway(true);
  }, []);

  const openBaselineWizard = useCallback(() => {
    window.dispatchEvent(new Event(PILOT_BASELINE_WIZARD_OPEN_EVENT));
  }, []);

  if (loading || complete === null || sendAnyway) {
    return null;
  }

  const status = resolveSponsorRoiBaselineGate({
    hasBaselines: complete,
    isFinalized: props.isFinalized,
  });

  if (!shouldShowSponsorRoiBaselineGateNotice(status)) {
    return null;
  }

  return (
    <div
      role="status"
      data-testid="sponsor-roi-baseline-gate-notice"
      className={cn(
        "mt-3 rounded-md border px-3 py-2",
        OPERATOR_CALLOUT_WARN_CLASS,
        OPERATOR_TYPOGRAPHY.body,
        props.className,
      )}
    >
      <p className="m-0 font-semibold text-neutral-900 dark:text-neutral-100">
        {SPONSOR_ROI_BASELINE_GATE_HEADLINE}
      </p>
      <p className={cn("m-0 mt-1 text-neutral-700 dark:text-neutral-300", OPERATOR_TYPOGRAPHY.helper)}>
        {SPONSOR_ROI_BASELINE_GATE_BODY}
      </p>
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <Button type="button" size="sm" variant="primary" className="h-7" asChild>
          <Link
            href={SPONSOR_ROI_BASELINE_SCORECARD_HREF}
            data-testid="sponsor-roi-baseline-gate-capture"
          >
            {SPONSOR_ROI_BASELINE_GATE_CAPTURE_CTA}
          </Link>
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="h-7"
          data-testid="sponsor-roi-baseline-gate-wizard"
          onClick={openBaselineWizard}
        >
          Guided baseline wizard
        </Button>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          className="h-7"
          data-testid="sponsor-roi-baseline-gate-send-anyway"
          onClick={acknowledgeSendAnyway}
        >
          {SPONSOR_ROI_BASELINE_GATE_SEND_ANYWAY_CTA}
        </Button>
      </div>
    </div>
  );
}
