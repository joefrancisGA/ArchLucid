"use client";

import { cn } from "@/lib/utils";
import { useCallback, useEffect, useState } from "react";

import { DismissControl } from "@/components/usability/DismissControl";
import {
  OPERATOR_SHELL_CONTENT_PADDING_X_CLASS,
  OPERATOR_SHELL_MAX_WIDTH_CLASS,
  OPERATOR_TYPOGRAPHY,
} from "@/lib/design-tokens";

const DISMISS_KEY = "archlucid_executive_shell_orientation_dismissed_v1";

export type SponsorShellOrientationCalloutProps = {
  readonly className?: string;
};

/** One-time orientation for the three sponsor destinations. */
export function SponsorShellOrientationCallout(props: SponsorShellOrientationCalloutProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    if (window.localStorage.getItem(DISMISS_KEY) === "1") {
      return;
    }

    setVisible(true);
  }, []);

  const dismiss = useCallback(() => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(DISMISS_KEY, "1");
    }

    setVisible(false);
  }, []);

  if (!visible) {
    return null;
  }

  return (
    <div
      className={props.className}
      data-testid="sponsor-shell-orientation-callout"
      role="status"
    >
      <div className={cn(OPERATOR_SHELL_MAX_WIDTH_CLASS, OPERATOR_SHELL_CONTENT_PADDING_X_CLASS, "border-b border-neutral-200 bg-al-surface-raised py-3 shadow-sm dark:border-neutral-800")}>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className={cn("space-y-1 text-neutral-700 dark:text-neutral-300", OPERATOR_TYPOGRAPHY.body)}>
            <p className="m-0 font-medium text-neutral-900 dark:text-neutral-100">Sponsor view</p>
            <p className="m-0 leading-relaxed">
              <strong className="font-medium">Dashboard</strong> — portfolio ROI and compliance drift.{" "}
              <strong className="font-medium">Risk reviews</strong> — finalized reviews and findings.{" "}
              <strong className="font-medium">Scorecard</strong> — value metrics and recommended actions.
            </p>
          </div>
          <DismissControl className="self-start" onDismiss={dismiss} />
        </div>
      </div>
    </div>
  );
}
