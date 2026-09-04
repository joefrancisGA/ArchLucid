import {
  buildLongOperationWaitCopy,
  formatLongOperationQueueStatusLine,
  LONG_OPERATION_HOME_PAGE_STATUS_HINT,
  LONG_OPERATION_QUEUE_STATUS_REFRESH_HINT,
  LONG_OPERATION_TIMEOUT_HINT_MS,
  type LongOperationEscalationLevel,
  type LongOperationWaitCopy,
} from "@/lib/operations/long-operation-wait-copy";
import type { OperationState } from "@/lib/operations/operation-state";
import { formatReRunReviewStartedHeadline } from "@/lib/re-run-review-outcome-copy";

export const RE_RUN_REVIEW_WAIT_OPERATION_LABEL = "Re-running architecture review";

/** UI refresh cadence for running re-run notices (escalation still uses 10s / 30s / 60s tiers). */
export const RE_RUN_REVIEW_PROGRESS_TICK_MS = 10_000;

const STALE_HEARTBEAT_THRESHOLD_MS = 45_000;

const STALE_QUEUED_STEP_LABELS = new Set(["Queued", "Execute failed", "In progress"]);

export type ReRunReviewRunningProgressCopy = LongOperationWaitCopy & {
  readonly heartbeatLine: string | null;
  readonly stalled: boolean;
  readonly queueStatusLine: string;
  readonly statusRefreshHint: string;
  readonly homePageHint: string;
};

export function resolveHeartbeatAgeMs(
  heartbeatUtc: string | null | undefined,
  nowMs: number,
): number | null {
  const trimmed = heartbeatUtc?.trim() ?? "";

  if (trimmed.length === 0) {
    return null;
  }

  const parsed = Date.parse(trimmed);

  if (!Number.isFinite(parsed)) {
    return null;
  }

  return Math.max(0, nowMs - parsed);
}

export function formatHeartbeatAgeLine(ageMs: number | null): string | null {
  if (ageMs === null) {
    return null;
  }

  const sec = Math.floor(ageMs / 1000);

  if (sec < 5) {
    return "Server signaled just now.";
  }

  return `Server last signaled ${sec}s ago.`;
}

export function isReRunReviewStageLikelyStalled(args: {
  readonly elapsedMs: number;
  readonly stageLabel: string;
  readonly heartbeatAgeMs: number | null;
  readonly operationState: OperationState | null;
}): boolean {
  if (args.elapsedMs < LONG_OPERATION_TIMEOUT_HINT_MS) {
    return false;
  }

  const label = args.stageLabel.trim();
  const staleLabel = STALE_QUEUED_STEP_LABELS.has(label);
  const staleHeartbeat =
    args.heartbeatAgeMs !== null && args.heartbeatAgeMs >= STALE_HEARTBEAT_THRESHOLD_MS;
  const pending = args.operationState === "Pending";

  return staleLabel && (staleHeartbeat || pending);
}

export function buildReRunReviewRunningProgressCopy(args: {
  readonly attemptNumber: number;
  readonly stageLabel: string;
  readonly elapsedMs: number;
  readonly heartbeatUtc?: string | null;
  readonly operationState?: OperationState | null;
  readonly nowMs?: number;
}): ReRunReviewRunningProgressCopy {
  const nowMs = args.nowMs ?? Date.now();
  const stageLabel = args.stageLabel.trim().length > 0 ? args.stageLabel.trim() : "Queued";
  const wait = buildLongOperationWaitCopy({
    operationLabel: RE_RUN_REVIEW_WAIT_OPERATION_LABEL,
    stageLabel,
    elapsedMs: args.elapsedMs,
  });
  const headline = formatReRunReviewStartedHeadline(args.attemptNumber, stageLabel);
  const heartbeatAgeMs = resolveHeartbeatAgeMs(args.heartbeatUtc, nowMs);
  const heartbeatLine = formatHeartbeatAgeLine(heartbeatAgeMs);
  const stalled = isReRunReviewStageLikelyStalled({
    elapsedMs: args.elapsedMs,
    stageLabel,
    heartbeatAgeMs,
    operationState: args.operationState ?? null,
  });

  let detail = wait.detail;

  if (heartbeatLine !== null) {
    detail = `${detail} ${heartbeatLine}`;
  }

  if (stalled) {
    detail =
      `${detail} Analysis may not have started yet — you can keep waiting, refresh this page, or ask your administrator to verify background workers are running.`;
  }

  return {
    level: wait.level,
    headline,
    detail,
    heartbeatLine,
    stalled,
    queueStatusLine: formatLongOperationQueueStatusLine(stageLabel),
    statusRefreshHint: LONG_OPERATION_QUEUE_STATUS_REFRESH_HINT,
    homePageHint: LONG_OPERATION_HOME_PAGE_STATUS_HINT,
  };
}

export function resolveReRunReviewEscalationLevel(elapsedMs: number): LongOperationEscalationLevel {
  return buildLongOperationWaitCopy({
    operationLabel: RE_RUN_REVIEW_WAIT_OPERATION_LABEL,
    stageLabel: "Queued",
    elapsedMs,
  }).level;
}
