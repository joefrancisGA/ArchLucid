"use client";

import { useCallback, useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { OPERATOR_SHELL_MAX_WIDTH_CLASS } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

const DISMISS_KEY = "archlucid_executive_shell_orientation_dismissed_v1";

export type ExecutiveShellOrientationCalloutProps = {
  readonly className?: string;
};

/** One-time orientation for the three executive destinations. */
export function ExecutiveShellOrientationCallout(props: ExecutiveShellOrientationCalloutProps) {
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
      data-testid="executive-shell-orientation-callout"
      role="status"
    >
      <div className={cn(OPERATOR_SHELL_MAX_WIDTH_CLASS, "border-b border-neutral-200 bg-neutral-100 px-4 py-3 dark:border-neutral-800 dark:bg-neutral-900/60 lg:px-6")}>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-1 text-sm text-neutral-700 dark:text-neutral-300">
            <p className="m-0 font-medium text-neutral-900 dark:text-neutral-100">Executive view</p>
            <p className="m-0 leading-relaxed">
              <strong className="font-medium">Dashboard</strong> — portfolio ROI and compliance drift.{" "}
              <strong className="font-medium">Risk reviews</strong> — finalized review packages and findings.{" "}
              <strong className="font-medium">Scorecard</strong> — value metrics and recommended actions.
            </p>
          </div>
          <Button type="button" variant="outline" size="sm" className="shrink-0 self-start" onClick={dismiss}>
            Dismiss
          </Button>
        </div>
      </div>
    </div>
  );
}
