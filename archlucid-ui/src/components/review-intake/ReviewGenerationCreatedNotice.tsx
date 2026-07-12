"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

import { StatusTag } from "@/components/ui/status-tag";
import {
  REVIEW_START_CREATED_CONFIRMATION,
} from "@/lib/review-start-progress-copy";
import { FROM_GENERATION_QUERY_KEY } from "@/lib/review-generation-handoff";

export const REVIEW_CREATED_SUCCESS_MESSAGE = "Architecture review created successfully.";

export const REVIEW_CREATED_ANALYSIS_IN_PROGRESS_MESSAGE = "Review created — analysis in progress.";

export type ReviewGenerationCreatedNoticeProps = {
  /** When true, analysis pipeline is still running — show in-progress confirmation. */
  readonly analysisInProgress?: boolean;
};

/** Brief confirmation after redirecting to a newly created architecture review. */
export function ReviewGenerationCreatedNotice(
  props: ReviewGenerationCreatedNoticeProps,
): React.ReactElement | null {
  const searchParams = useSearchParams();
  const [visible, setVisible] = useState(false);
  const analysisInProgress = props.analysisInProgress === true;

  useEffect(() => {
    const fromGeneration = searchParams?.get(FROM_GENERATION_QUERY_KEY);

    if (fromGeneration !== "1") {
      return;
    }

    setVisible(true);
  }, [searchParams]);

  useEffect(() => {
    if (!visible || analysisInProgress) {
      return;
    }

    const timerId = window.setTimeout(() => {
      setVisible(false);
    }, 12000);

    return () => {
      window.clearTimeout(timerId);
    };
  }, [visible, analysisInProgress]);

  if (!visible) {
    return null;
  }

  const label = analysisInProgress
    ? REVIEW_CREATED_ANALYSIS_IN_PROGRESS_MESSAGE
    : REVIEW_CREATED_SUCCESS_MESSAGE || REVIEW_START_CREATED_CONFIRMATION;

  return (
    <div
      className="mb-3"
      data-testid="review-generation-created-notice"
      role="status"
      aria-live="polite"
    >
      <StatusTag kind={analysisInProgress ? "in-progress" : "ready"} label={label} />
    </div>
  );
}
