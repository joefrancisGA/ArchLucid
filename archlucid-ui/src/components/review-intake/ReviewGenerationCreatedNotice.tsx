"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

import { DESIGN_TOKENS } from "@/lib/design-tokens";
import { REVIEW_PIPELINE_BACKGROUND_SAFETY_MESSAGE } from "@/lib/review-execution-background-safety-copy";
import {
  REVIEW_START_CREATED_CONFIRMATION,
} from "@/lib/review-start-progress-copy";
import { FROM_GENERATION_QUERY_KEY } from "@/lib/review-generation-handoff";
import { cn } from "@/lib/utils";

export const REVIEW_CREATED_SUCCESS_MESSAGE = "Architecture package created — analysis is starting.";

export const REVIEW_CREATED_ANALYSIS_IN_PROGRESS_MESSAGE = "Architecture package created — analysis in progress.";

export type ReviewGenerationCreatedNoticeProps = {
  /** When true, analysis pipeline is still running — show in-progress confirmation. */
  readonly analysisInProgress?: boolean;
  /** Hide the transient receipt when approval is blocked. */
  readonly approvalBlocked?: boolean;
  /** Hide once the architecture package is finalized. */
  readonly packageFinalized?: boolean;
};

/** Brief confirmation after redirecting to a newly created architecture review. */
export function ReviewGenerationCreatedNotice(
  props: ReviewGenerationCreatedNoticeProps,
): React.ReactElement | null {
  const searchParams = useSearchParams();
  const [visible, setVisible] = useState(false);
  const analysisInProgress = props.analysisInProgress === true;
  const suppressed = props.approvalBlocked === true || props.packageFinalized === true;

  useEffect(() => {
    const fromGeneration = searchParams?.get(FROM_GENERATION_QUERY_KEY);

    if (fromGeneration !== "1") {
      return;
    }

    setVisible(true);
  }, [searchParams]);

  useEffect(() => {
    if (!visible || analysisInProgress || suppressed) {
      return;
    }

    const timerId = window.setTimeout(() => {
      setVisible(false);
    }, 12000);

    return () => {
      window.clearTimeout(timerId);
    };
  }, [visible, analysisInProgress, suppressed]);

  if (!visible || suppressed) {
    return null;
  }

  const label = analysisInProgress
    ? REVIEW_CREATED_ANALYSIS_IN_PROGRESS_MESSAGE
    : REVIEW_CREATED_SUCCESS_MESSAGE || REVIEW_START_CREATED_CONFIRMATION;

  return (
    <div
      className={cn("mb-3", DESIGN_TOKENS.callout.info)}
      data-testid="review-generation-created-notice"
      role="status"
      aria-live="polite"
    >
      <p className="m-0 text-sm text-al-text-primary">{label}</p>
      {analysisInProgress ? (
        <p
          className="m-0 mt-2 text-sm text-al-text-primary"
          data-testid="review-generation-background-safety"
        >
          {REVIEW_PIPELINE_BACKGROUND_SAFETY_MESSAGE}
        </p>
      ) : null}
    </div>
  );
}
