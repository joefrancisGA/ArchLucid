import type { StructuralExecutionModeInput } from "@/lib/structural-execution-mode";
import { StructuralExecutionModeWire, formatStructuralExecutionModeLabel } from "@/lib/structural-execution-mode";
import { LONG_OPERATION_HOME_PAGE_STATUS_HINT } from "@/lib/operations/long-operation-wait-copy";

/** Default client watchdog before extended tenant p90 estimates (TB-2149). */
export const REVIEW_PIPELINE_DEFAULT_POLL_MAX_MS = 180_000;

/** Hard cap aligned with Tier C server allowance (15 minutes). */
export const REVIEW_PIPELINE_POLL_MAX_CAP_MS = 900_000;

export const REVIEW_PIPELINE_BACKGROUND_SAFETY_MESSAGE =
  `You can leave this page — analysis continues on the server and your review will keep running. ${LONG_OPERATION_HOME_PAGE_STATUS_HINT}`;

export const REVIEW_PIPELINE_BACKGROUND_SAFETY_SIMULATOR_MESSAGE =
  `You can leave this page — simulator analysis continues on the server until the pipeline finishes. ${LONG_OPERATION_HOME_PAGE_STATUS_HINT}`;

export const REVIEW_PIPELINE_DURATION_ESTIMATE_DISCLAIMER =
  "Typical duration is based on your workspace's recent finalized reviews, not a guaranteed SLA.";

export const REVIEW_PIPELINE_ENABLE_NOTIFICATIONS_LABEL = "Enable browser notifications";

export const REVIEW_PIPELINE_COMPLETION_NOTIFICATION_TITLE = "Architecture review analysis finished";

export const REVIEW_PIPELINE_COMPLETION_TOAST_TITLE = "Architecture review analysis finished";

export function resolveReviewPipelineBackgroundSafetyMessage(
  mode: StructuralExecutionModeInput,
): string {
  const label = formatStructuralExecutionModeLabel(mode);

  if (label === "Simulator") {
    return REVIEW_PIPELINE_BACKGROUND_SAFETY_SIMULATOR_MESSAGE;
  }

  return REVIEW_PIPELINE_BACKGROUND_SAFETY_MESSAGE;
}

export function shouldShowReviewPipelineBackgroundSafety(mode: StructuralExecutionModeInput): boolean {
  const normalized =
    mode === StructuralExecutionModeWire.Real
    || mode === StructuralExecutionModeWire.Fallback
    || mode === StructuralExecutionModeWire.Mixed
    || mode === StructuralExecutionModeWire.Simulator
    || mode === 0
    || mode === 1
    || mode === 2
    || mode === 3;

  return normalized || mode === null || mode === undefined;
}

export function resolveReviewPipelinePollMaxMs(p90Seconds: number | null | undefined): number {
  if (p90Seconds === null || p90Seconds === undefined || !Number.isFinite(p90Seconds) || p90Seconds <= 180) {
    return REVIEW_PIPELINE_DEFAULT_POLL_MAX_MS;
  }

  const extendedMs = Math.ceil(p90Seconds * 1000 * 1.15);

  return Math.min(Math.max(extendedMs, REVIEW_PIPELINE_DEFAULT_POLL_MAX_MS), REVIEW_PIPELINE_POLL_MAX_CAP_MS);
}

/**
 * Reaching the watchdog ceiling means the browser stopped refreshing, not that the server failed.
 * Same distinction `useReviewCreationProgress` draws between `failed` and `unresolved`, and the same
 * reason it matters: framing a still-running analysis as a failure is what prompts duplicate work.
 */
export const REVIEW_PIPELINE_WATCHDOG_NOTHING_CANCELED_CLAUSE =
  "nothing was canceled and analysis is still running on the server";

/** Re-arms client polling only; deliberately not "Retry", which reads as re-running the analysis. */
export const REVIEW_PIPELINE_KEEP_WATCHING_CTA = "Keep watching";

export const REVIEW_PIPELINE_ASSESSMENT_WATCHDOG_MESSAGE =
  `We stopped refreshing this page — ${REVIEW_PIPELINE_WATCHDOG_NOTHING_CANCELED_CLAUSE}. Keep watching or open Reviews for the latest status.`;

export function resolveReviewPipelineTimeoutMessage(options: {
  readonly buyerPolished: boolean;
  readonly runId: string;
  readonly p90Seconds: number | null | undefined;
}): string {
  const extended = (options.p90Seconds ?? 0) > 180;
  const longerThanUsual = extended
    ? " Recent reviews in your workspace often take longer than a few minutes."
    : "";

  if (options.buyerPolished) {
    return `We're still preparing this review — ${REVIEW_PIPELINE_WATCHDOG_NOTHING_CANCELED_CLAUSE}.${longerThanUsual} Keep watching or open Reviews for the latest status.`;
  }

  return `We stopped refreshing this page — ${REVIEW_PIPELINE_WATCHDOG_NOTHING_CANCELED_CLAUSE} (review ${options.runId}).${longerThanUsual} Keep watching, refresh this page, or check Reviews for status.`;
}
