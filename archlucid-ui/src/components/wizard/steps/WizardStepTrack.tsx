"use client";

import { cn } from "@/lib/utils";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { GlossaryTooltip } from "@/components/GlossaryTooltip";
import { Button } from "@/components/ui/button";
import { StatusTag } from "@/components/ui/status-tag";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { WizardStepPanel } from "@/components/wizard/WizardStepPanel";
import { useWorkspaceReviewDurationEstimate } from "@/hooks/use-workspace-review-duration-estimate";
import { comparePageHrefAdaptive } from "@/lib/compare-url-query-params";
import { OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";
import { recordReviewGenerationHandoff, reviewDetailHrefAfterGeneration } from "@/lib/review-generation-handoff";
import {
  resolveReviewPipelinePollMaxMs,
  resolveReviewPipelineTimeoutMessage,
} from "@/lib/review-execution-background-safety-copy";
import { SIGNED_MANIFEST_LABEL } from "@/lib/usability/canonical-product-terms";
import type { RunSummary } from "@/types/authority";

export type WizardStepTrackProps = {
  runId: string;
  pollSummary: RunSummary | null;
  /** Bumps the parent run-summary stream retry token when the operator retries after a stall. */
  onRetryPolling?: () => void;
};

function stageDone(flag: boolean | undefined): boolean {
  return flag === true;
}

function allStagesReady(summary: RunSummary | null): boolean {
  if (summary === null) {
    return false;
  }

  return (
    stageDone(summary.hasContextSnapshot) &&
    stageDone(summary.hasGraphSnapshot) &&
    stageDone(summary.hasFindingsSnapshot) &&
    stageDone(summary.hasGoldenManifest)
  );
}

/**
 * Step 7: poll review summary and visualize review-package stages.
 */
export function WizardStepTrack({ runId, pollSummary, onRetryPolling }: WizardStepTrackProps) {
  const buyerPolished = isBuyerPolishedOperatorShellEnv();
  const ctx = stageDone(pollSummary?.hasContextSnapshot);
  const graph = stageDone(pollSummary?.hasGraphSnapshot);
  const findings = stageDone(pollSummary?.hasFindingsSnapshot);
  const manifest = stageDone(pollSummary?.hasGoldenManifest);
  const pollEnabled = !manifest;

  const [clientPhase, setClientPhase] = useState<"polling" | "complete" | "timeout">(() =>
    manifest ? "complete" : "polling",
  );
  const [pollSession, setPollSession] = useState(0);

  const { estimate: durationEstimate, loading: durationLoading } = useWorkspaceReviewDurationEstimate(
    pollEnabled && clientPhase === "polling",
  );
  const pollMaxMs = useMemo(
    () => resolveReviewPipelinePollMaxMs(durationEstimate?.p90Seconds),
    [durationEstimate?.p90Seconds],
  );

  useEffect(() => {
    if (manifest || allStagesReady(pollSummary)) {
      setClientPhase("complete");
    }
  }, [manifest, pollSummary]);

  useEffect(() => {
    if (!pollEnabled || clientPhase !== "polling" || durationLoading) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setClientPhase("timeout");
    }, pollMaxMs);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [clientPhase, durationLoading, pollEnabled, pollMaxMs, pollSession]);

  const completedStages = [ctx, graph, findings, manifest].filter(Boolean).length;
  const progressValue = (completedStages / 4) * 100;

  const waitingMessage = useMemo(() => {
    if (clientPhase === "timeout") {
      return resolveReviewPipelineTimeoutMessage({
        buyerPolished,
        runId,
        p90Seconds: durationEstimate?.p90Seconds,
      });
    }

    return `Waiting for ${SIGNED_MANIFEST_LABEL.toLowerCase()}… (updates stream for up to several minutes; you can open review detail anytime.)`;
  }, [buyerPolished, clientPhase, durationEstimate?.p90Seconds, runId]);

  return (
    <WizardStepPanel
      title="Track review progress"
      description="Review stages run asynchronously. This view streams live updates when available, with HTTP polling as a fallback."
    >
      <p className={cn("text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.body)}>
        <strong>Review ID:</strong>{" "}
        <code className={cn("rounded bg-neutral-100 px-1 py-0.5 dark:bg-neutral-800", OPERATOR_TYPOGRAPHY.helper)}>{runId}</code>
      </p>

      <div className="mt-4 space-y-2">
        <div className={cn("flex justify-between text-neutral-500", OPERATOR_TYPOGRAPHY.helper)}>
          <span>Review progress</span>
          <span>{completedStages} / 4 stages</span>
        </div>
        <Progress value={progressValue} className="h-2" />
      </div>

      <Separator className="my-6" />

      <ul className="m-0 flex flex-col gap-3 p-0 list-none">
        <li className="flex flex-wrap items-center gap-2">
          <span className={cn("w-36 font-medium", OPERATOR_TYPOGRAPHY.body)}>
            <GlossaryTooltip termKey="context_snapshot">Source context captured</GlossaryTooltip>
          </span>
          <StatusTag kind={ctx ? "ready" : "in-progress"} label={ctx ? "Complete" : "Pending"} />
        </li>
        <li className="flex flex-wrap items-center gap-2">
          <span className={cn("w-36 font-medium", OPERATOR_TYPOGRAPHY.body)}>
            <GlossaryTooltip termKey="knowledge_graph">Evidence graph ready</GlossaryTooltip>
          </span>
          <StatusTag kind={graph ? "ready" : "in-progress"} label={graph ? "Complete" : "Pending"} />
        </li>
        <li className="flex flex-wrap items-center gap-2">
          <span className={cn("w-36 font-medium", OPERATOR_TYPOGRAPHY.body)}>
            <GlossaryTooltip termKey="findings">Findings complete</GlossaryTooltip>
          </span>
          <StatusTag kind={findings ? "ready" : "in-progress"} label={findings ? "Complete" : "Pending"} />
        </li>
        <li className="flex flex-wrap items-center gap-2">
          <span className={cn("w-36 font-medium", OPERATOR_TYPOGRAPHY.body)}>
            <GlossaryTooltip termKey="golden_manifest">{SIGNED_MANIFEST_LABEL} ready</GlossaryTooltip>
          </span>
          <StatusTag kind={manifest ? "ready" : "in-progress"} label={manifest ? "Complete" : "Pending"} />
        </li>
      </ul>

      {pollSummary?.description ? (
        <p className={cn("mt-4 text-neutral-700 dark:text-neutral-300", OPERATOR_TYPOGRAPHY.body)}>{pollSummary.description}</p>
      ) : null}

      {manifest ? (
        <div className="rounded-md border border-neutral-200 bg-al-surface-raised dark:border-neutral-800 mt-6 p-4">
          <p className={cn("m-0 font-semibold text-teal-900 dark:text-teal-100", OPERATOR_TYPOGRAPHY.body)}>{SIGNED_MANIFEST_LABEL} is available.</p>
          <nav className={cn("mt-3 flex flex-wrap gap-x-3 gap-y-2", OPERATOR_TYPOGRAPHY.body)}>
            <Link
              className={OPERATOR_LINK.nav}
              href={reviewDetailHrefAfterGeneration(runId)}
              onClick={() => {
                recordReviewGenerationHandoff(runId, "wizard-track");
              }}
            >
              Open review detail
            </Link>
            <Link
              className={OPERATOR_LINK.nav}
              href={comparePageHrefAdaptive(runId)}
            >
              Compare two reviews
            </Link>
            <Link className={OPERATOR_LINK.nav} href={`/architecture/reviews/${runId}/provenance`}>
              View provenance
            </Link>
          </nav>
        </div>
      ) : (
        <div className="mt-4 space-y-3" data-testid="wizard-step-track-waiting">
          <p
            aria-live="polite"
            className={cn("m-0 text-neutral-500", OPERATOR_TYPOGRAPHY.helper)}
          >
            {waitingMessage}
          </p>
          {pollEnabled && clientPhase === "timeout" ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setClientPhase("polling");
                setPollSession((session) => session + 1);
                onRetryPolling?.();
              }}
            >
              Retry polling
            </Button>
          ) : null}
        </div>
      )}
    </WizardStepPanel>
  );
}
