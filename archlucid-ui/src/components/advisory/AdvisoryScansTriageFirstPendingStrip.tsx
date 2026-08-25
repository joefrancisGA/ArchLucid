"use client";

import { useCallback, useEffect, useState } from "react";

import { DismissControl } from "@/components/usability/DismissControl";
import { Button } from "@/components/ui/button";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import type { AdvisoryScansTriageFirstPendingTarget } from "@/lib/advisory/resolve-advisory-scans-triage-first-pending";
import { cn } from "@/lib/utils";

const STORAGE_KEY = "archlucid_advisory_scans_triage_first_pending_strip_dismissed_v1";

export type AdvisoryScansTriageFirstPendingStripProps = {
  readonly target: AdvisoryScansTriageFirstPendingTarget;
  readonly onReviewRecommendation: (recommendationId: string) => void;
};

/** Dismissible strip routing operators to the oldest pending advisory recommendation. */
export function AdvisoryScansTriageFirstPendingStrip(
  props: AdvisoryScansTriageFirstPendingStripProps,
): React.JSX.Element | null {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      setVisible(window.localStorage.getItem(STORAGE_KEY) !== "1");
    } catch {
      setVisible(true);
    }
  }, []);

  const onDismiss = useCallback(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, "1");
    } catch {
      /* ignore */
    }

    setVisible(false);
  }, []);

  const scrollToRecommendation = useCallback((): void => {
    document
      .querySelector(`[data-testid="advisory-recommendation-${props.target.recommendationId}"]`)
      ?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [props.target.recommendationId]);

  if (!visible) {
    return null;
  }

  return (
    <div
      className={cn(
        "mb-3 flex flex-wrap items-start justify-between gap-3 rounded-md border border-neutral-200 bg-al-surface-raised px-3 py-3 dark:border-neutral-800",
        OPERATOR_TYPOGRAPHY.body,
      )}
      data-testid="advisory-scans-triage-first-pending-strip"
      role="note"
    >
      <div className="min-w-0 flex-1">
        <p className="m-0 font-medium text-al-text-primary">Start with the oldest pending recommendation</p>
        <p className={cn("m-0 mt-1 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
          <span className="font-medium text-al-text-primary">{props.target.title}</span>
        </p>
      </div>
      <div className="flex shrink-0 flex-wrap items-center gap-2">
        <Button
          type="button"
          variant="primary"
          size="sm"
          data-testid="advisory-scans-triage-first-pending-open"
          onClick={scrollToRecommendation}
        >
          Open recommendation
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          data-testid="advisory-scans-triage-first-pending-review"
          onClick={() => {
            scrollToRecommendation();
            props.onReviewRecommendation(props.target.recommendationId);
          }}
        >
          Review disposition
        </Button>
        <DismissControl className="h-7" onDismiss={onDismiss} />
      </div>
    </div>
  );
}
