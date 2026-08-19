"use client";

import { cn } from "@/lib/utils";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { createArchitectureRun, getRunStageTimeline, getRunSummary } from "@/lib/api";
import type { CreateArchitectureRunRequestPayload } from "@/lib/api";
import {
  CTO_DEMO_LIVE_RUN_STAGE_DEFINITIONS,
  mapStageTimelineToLiveRunStages,
  type CtoDemoLiveRunStage,
} from "@/lib/cto-demo-live-run-stages";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

const POLL_INTERVAL_MS = 2000;
const SLOW_RUN_MESSAGE_SECONDS = 25;
/** Stop silent polling after this many consecutive poll failures. */
const MAX_CONSECUTIVE_POLL_FAILURES = 5;

export type CtoDemoLiveRunProgressRailProps = {
  readonly payload: CreateArchitectureRunRequestPayload;
  readonly onCompleteHref?: (runId: string) => string;
};

function StageRow(props: { readonly stage: CtoDemoLiveRunStage }): React.JSX.Element {
  const { stage } = props;
  const marker =
    stage.state === "complete" ? "✓" : stage.state === "running" ? "●" : "○";

  return (
    <li className={cn("flex items-start gap-2 text-neutral-800 dark:text-neutral-200", OPERATOR_TYPOGRAPHY.body)}>
      <span aria-hidden className="tabular-nums text-neutral-500 dark:text-neutral-400">
        {marker}
      </span>
      <span className={stage.state === "running" ? "font-medium" : ""}>{stage.label}</span>
    </li>
  );
}

export function CtoDemoLiveRunProgressRail(props: CtoDemoLiveRunProgressRailProps): React.JSX.Element {
  const { payload, onCompleteHref } = props;
  const [runId, setRunId] = useState<string | null>(null);
  const [stages, setStages] = useState<readonly CtoDemoLiveRunStage[]>(
    mapStageTimelineToLiveRunStages(0, CTO_DEMO_LIVE_RUN_STAGE_DEFINITIONS.length, false),
  );
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [finalized, setFinalized] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pollStalled, setPollStalled] = useState(false);
  const [pollSession, setPollSession] = useState(0);
  const startedAtRef = useRef<number | null>(null);
  const consecutiveFailuresRef = useRef(0);

  useEffect(() => {
    startedAtRef.current = performance.now();

    void createArchitectureRun(payload)
      .then((response) => {
        const id = response.run?.runId ?? null;

        if (id === null || id.trim().length === 0) {
          setError("Review creation returned no identifier.");

          return;
        }

        setRunId(id);
      })
      .catch((caught: unknown) => {
        const message = caught instanceof Error ? caught.message : "Review creation failed.";

        setError(message);
      });
  }, [payload]);

  useEffect(() => {
    if (runId === null) {
      return;
    }

    const intervalId = window.setInterval(() => {
      if (startedAtRef.current !== null) {
        setElapsedSeconds(Math.floor((performance.now() - startedAtRef.current) / 1000));
      }
    }, 1000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [runId]);

  useEffect(() => {
    if (runId === null || finalized || pollStalled) {
      return;
    }

    let canceled = false;
    consecutiveFailuresRef.current = 0;

    const poll = async (): Promise<void> => {
      try {
        const [timeline, summary] = await Promise.all([
          getRunStageTimeline(runId),
          getRunSummary(runId),
        ]);

        if (canceled) {
          return;
        }

        consecutiveFailuresRef.current = 0;

        const completedCount = timeline.filter((row) => (row.completedUtc ?? "").trim().length > 0).length;
        const isFinalized = summary.hasGoldenManifest === true;

        setStages(mapStageTimelineToLiveRunStages(completedCount, CTO_DEMO_LIVE_RUN_STAGE_DEFINITIONS.length, isFinalized));

        if (isFinalized) {
          setFinalized(true);
        }
      } catch {
        if (canceled) {
          return;
        }

        consecutiveFailuresRef.current += 1;

        if (consecutiveFailuresRef.current >= MAX_CONSECUTIVE_POLL_FAILURES) {
          setPollStalled(true);
        }
      }
    };

    void poll();
    const pollId = window.setInterval(() => {
      void poll();
    }, POLL_INTERVAL_MS);

    return () => {
      canceled = true;
      window.clearInterval(pollId);
    };
  }, [finalized, pollSession, pollStalled, runId]);

  const retryPolling = useCallback(() => {
    setPollStalled(false);
    consecutiveFailuresRef.current = 0;
    setPollSession((session) => session + 1);
  }, []);

  if (error !== null) {
    return <p className={cn("m-0 text-red-700 dark:text-red-300", OPERATOR_TYPOGRAPHY.body)}>{error}</p>;
  }

  const completeHref =
    runId !== null
      ? onCompleteHref !== undefined
        ? onCompleteHref(runId)
        : `/architecture/reviews/${encodeURIComponent(runId)}`
      : null;

  return (
    <div className="space-y-3" data-testid="cto-demo-live-run-progress-rail" aria-live="polite">
      <p className={cn("m-0 tabular-nums", OPERATOR_TYPOGRAPHY.badge, "text-neutral-500 dark:text-neutral-400")}>
        Elapsed: {elapsedSeconds}s
      </p>
      <ol className="m-0 list-none space-y-1.5 p-0">
        {stages.map((stage) => (
          <StageRow key={stage.id} stage={stage} />
        ))}
      </ol>
      {pollStalled ? (
        <div className="space-y-2" data-testid="cto-demo-live-run-poll-stalled" role="alert">
          <p className={cn("m-0 text-red-700 dark:text-red-300", OPERATOR_TYPOGRAPHY.body)}>
            Progress updates stalled. The review may still be running — retry status or open the review when ready.
          </p>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={retryPolling}
              data-testid="cto-demo-live-run-retry-poll"
            >
              Retry status
            </Button>
            {completeHref !== null ? (
              <Button type="button" size="sm" variant="outline" asChild>
                <Link href={completeHref}>Open review</Link>
              </Button>
            ) : null}
          </div>
        </div>
      ) : null}
      {!pollStalled && elapsedSeconds >= SLOW_RUN_MESSAGE_SECONDS && !finalized ? (
        <p className={cn("m-0 text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>
          Still working — complex briefs take a moment longer.
        </p>
      ) : null}
      {finalized && completeHref !== null ? (
        <Button type="button" size="sm" asChild data-testid="cto-demo-live-run-view">
          <Link href={completeHref}>Review ready — view it</Link>
        </Button>
      ) : null}
    </div>
  );
}
