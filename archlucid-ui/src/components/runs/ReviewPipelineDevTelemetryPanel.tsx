"use client";

import { useMemo } from "react";

import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { formatInstantForLocale } from "@/lib/locale-datetime";
import { formatStructuralExecutionModeLabel } from "@/lib/structural-execution-mode";
import {
  deriveReviewPipelineStallDiagnosis,
  type ReviewPipelineDiagnosticContext,
} from "@/lib/review-pipeline-stall-diagnosis";
import type { RunSummaryStreamPhase } from "@/lib/runs/run-summary-stream-poll-policy";
import type { RunSummary } from "@/types/authority";
import type { StageTimelineSummary } from "@/types/stage-timeline";
import { cn } from "@/lib/utils";

export type ReviewPipelineDevTelemetrySnapshot = {
  readonly runId: string;
  readonly summary: RunSummary | null;
  readonly initialSummary: RunSummary | null;
  readonly diagnosticContext?: ReviewPipelineDiagnosticContext | null;
  readonly stageTimeline: readonly StageTimelineSummary[];
  readonly streamPhase: RunSummaryStreamPhase;
  readonly sseConnected: boolean;
  readonly clientPhase: "polling" | "complete" | "timeout";
  readonly pollSession: number;
  readonly pollMaxMs: number;
  readonly pollCount: number;
  readonly lastPollAtIso: string | null;
  readonly lastPollError: string | null;
  readonly lastSummaryChangeAtIso: string | null;
};

function elapsedMinutesFromCreated(createdUtc: string | null | undefined, nowMs: number): number {
  if (createdUtc === null || createdUtc === undefined || createdUtc.trim().length === 0) {
    return 0;
  }

  const startedMs = Date.parse(createdUtc);

  if (Number.isNaN(startedMs)) {
    return 0;
  }

  return Math.floor(Math.max(0, nowMs - startedMs) / 60_000);
}

function transportLabel(snapshot: ReviewPipelineDevTelemetrySnapshot): "live stream" | "polling" | "idle" {
  if (snapshot.clientPhase !== "polling") {
    return "idle";
  }

  return snapshot.sseConnected ? "live stream" : "polling";
}

function JsonBlock(props: { readonly value: unknown }): React.JSX.Element {
  return (
    <pre
      className={cn(
        "m-0 max-h-48 overflow-auto whitespace-pre-wrap break-all rounded bg-neutral-100 p-2 font-mono text-[11px] dark:bg-neutral-800",
        OPERATOR_TYPOGRAPHY.micro,
      )}
    >
      {JSON.stringify(props.value, null, 2)}
    </pre>
  );
}

/** Dev-only collapsible telemetry for review pipeline polling (remove when no longer needed). */
export function ReviewPipelineDevTelemetryPanel(props: {
  readonly snapshot: ReviewPipelineDevTelemetrySnapshot;
}): React.JSX.Element {
  const nowMs = Date.now();
  const activeSummary = props.snapshot.summary ?? props.snapshot.initialSummary;
  const createdUtc = activeSummary?.createdUtc ?? props.snapshot.initialSummary?.createdUtc ?? null;
  const elapsedMinutes = elapsedMinutesFromCreated(createdUtc, nowMs);

  const diagnosis = useMemo(
    () =>
      deriveReviewPipelineStallDiagnosis({
        summary: activeSummary,
        diagnosticContext: props.snapshot.diagnosticContext,
        stageTimeline: props.snapshot.stageTimeline,
        elapsedMinutes,
        transport: transportLabel(props.snapshot),
        clientPhase: props.snapshot.clientPhase,
      }),
    [activeSummary, elapsedMinutes, props.snapshot],
  );

  const rows: ReadonlyArray<{ readonly label: string; readonly value: string }> = [
    { label: "Run id", value: props.snapshot.runId },
    { label: "Created", value: createdUtc !== null ? formatInstantForLocale(createdUtc) : "(unknown)" },
    { label: "Elapsed", value: `${elapsedMinutes} min` },
    {
      label: "Legacy status",
      value: (props.snapshot.diagnosticContext?.legacyRunStatus ?? "").trim() || "(not loaded)",
    },
    {
      label: "Dead lettered",
      value: props.snapshot.diagnosticContext?.isDeadLettered === true ? "yes" : "no",
    },
    {
      label: "Execution mode",
      value: formatStructuralExecutionModeLabel(activeSummary?.structuralExecutionMode ?? null),
    },
    {
      label: "Stage flags",
      value: [
        `ctx=${activeSummary?.hasContextSnapshot === true}`,
        `graph=${activeSummary?.hasGraphSnapshot === true}`,
        `findings=${activeSummary?.hasFindingsSnapshot === true}`,
        `manifest=${activeSummary?.hasGoldenManifest === true}`,
      ].join(", "),
    },
    { label: "Transport", value: transportLabel(props.snapshot) },
    { label: "Stream phase", value: props.snapshot.streamPhase },
    { label: "Client phase", value: props.snapshot.clientPhase },
    { label: "Poll session", value: String(props.snapshot.pollSession) },
    { label: "Poll max (ms)", value: String(props.snapshot.pollMaxMs) },
    { label: "Poll count", value: String(props.snapshot.pollCount) },
    {
      label: "Last poll",
      value:
        props.snapshot.lastPollAtIso !== null
          ? formatInstantForLocale(props.snapshot.lastPollAtIso)
          : "(none yet)",
    },
    {
      label: "Last summary change",
      value:
        props.snapshot.lastSummaryChangeAtIso !== null
          ? formatInstantForLocale(props.snapshot.lastSummaryChangeAtIso)
          : "(none yet)",
    },
    {
      label: "Otel trace id",
      value:
        (props.snapshot.diagnosticContext?.otelTraceId ?? activeSummary?.otelTraceId ?? "").trim() || "(none)",
    },
    {
      label: "Retry count",
      value: String(props.snapshot.diagnosticContext?.retryCount ?? activeSummary?.retryCount ?? 0),
    },
  ];

  return (
    <details
      className="mt-4 rounded-md border border-dashed border-amber-600/60 bg-amber-50/40 p-3 dark:border-amber-500/50 dark:bg-amber-950/20"
      data-testid="review-pipeline-dev-telemetry"
    >
      <summary className={cn("cursor-pointer font-semibold text-amber-950 dark:text-amber-100", OPERATOR_TYPOGRAPHY.body)}>
        Pipeline dev telemetry (NEXT_PUBLIC_REVIEW_PIPELINE_DEBUG)
      </summary>
      <div className="mt-3 space-y-3">
        {diagnosis !== null ? (
          <div
            className="rounded-md border border-neutral-200 bg-white/80 p-3 dark:border-neutral-700 dark:bg-neutral-900/50"
            data-testid="review-pipeline-dev-diagnosis"
          >
            <p className={cn("m-0 font-medium", OPERATOR_TYPOGRAPHY.body)}>{diagnosis.headline}</p>
            <p className={cn("m-0 mt-2 text-neutral-700 dark:text-neutral-300", OPERATOR_TYPOGRAPHY.helper)}>
              {diagnosis.detail}
            </p>
          </div>
        ) : null}

        {(props.snapshot.diagnosticContext?.lastFailureReason ?? "").trim().length > 0 ? (
          <p className={cn("m-0", OPERATOR_TYPOGRAPHY.helper)}>
            <strong>Last failure:</strong> {props.snapshot.diagnosticContext?.lastFailureReason}
          </p>
        ) : null}

        {props.snapshot.lastPollError !== null ? (
          <p className={cn("m-0 text-rose-800 dark:text-rose-300", OPERATOR_TYPOGRAPHY.helper)}>
            <strong>Last poll error:</strong> {props.snapshot.lastPollError}
          </p>
        ) : null}

        <dl className={cn("m-0 grid gap-2 sm:grid-cols-2", OPERATOR_TYPOGRAPHY.helper)}>
          {rows.map((row) => (
            <div key={row.label}>
              <dt className="font-medium text-neutral-600 dark:text-neutral-400">{row.label}</dt>
              <dd className="m-0 break-all font-mono text-[11px] text-neutral-900 dark:text-neutral-100">{row.value}</dd>
            </div>
          ))}
        </dl>

        <div>
          <p className={cn("m-0 mb-1 font-medium", OPERATOR_TYPOGRAPHY.body)}>Live summary JSON</p>
          <JsonBlock value={activeSummary} />
        </div>

        <div>
          <p className={cn("m-0 mb-1 font-medium", OPERATOR_TYPOGRAPHY.body)}>Stage timeline JSON</p>
          <JsonBlock value={props.snapshot.stageTimeline} />
        </div>
      </div>
    </details>
  );
}
