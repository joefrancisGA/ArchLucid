"use client";

import { useMemo, useState } from "react";

import { useRunSummaryStream } from "@/hooks/useRunSummaryStream";

import { TRACK_STEP_INDEX } from "./new-run-wizard-steps";
import type { NewRunWizardMode } from "./use-new-run-wizard-mode";

export function useNewRunWizardTrackStream(options: {
  readonly runId: string | null;
  readonly wizardMode: NewRunWizardMode;
  readonly stepIndex: number;
}) {
  const { runId, wizardMode, stepIndex } = options;
  const [trackPollSession, setTrackPollSession] = useState(0);

  const { summary: pollSummary } = useRunSummaryStream(runId, {
    enabled: runId !== null && (wizardMode === "quick" ? true : stepIndex === TRACK_STEP_INDEX),
    retryToken: trackPollSession,
  });

  const liveMessage = useMemo(() => {
    if (runId === null) {
      return "No review started yet.";
    }

    if (pollSummary) {
      return `Review ${runId} polled: context ${pollSummary.hasContextSnapshot ? "ready" : "pending"}, graph ${pollSummary.hasGraphSnapshot ? "ready" : "pending"}, findings ${pollSummary.hasFindingsSnapshot ? "ready" : "pending"}, Finalized review record ${pollSummary.hasGoldenManifest ? "ready" : "pending"}.`;
    }

    return `Review ${runId} created; loading summary.`;
  }, [pollSummary, runId]);

  const retryTrackPolling = () => {
    setTrackPollSession((session) => session + 1);
  };

  return {
    pollSummary,
    liveMessage,
    retryTrackPolling,
  };
}
