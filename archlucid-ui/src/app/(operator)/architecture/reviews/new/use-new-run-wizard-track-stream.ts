"use client";

import { useMemo, useState } from "react";

import { useRunSummaryStream } from "@/hooks/useRunSummaryStream";

import { TRACK_STEP_INDEX } from "./new-run-wizard-steps";
import type { NewRunWizardMode } from "./use-new-run-wizard-mode";

function snapshotStatusWord(flag: boolean | undefined): string {
  if (flag === true) {
    return "ready";
  }

  if (flag === false) {
    return "pending";
  }

  return "status was not stored";
}

function snapshotStatusPhrase(label: string, flag: boolean | undefined): string {
  if (flag === undefined) {
    return `${label} snapshot status was not stored`;
  }

  return `${label} ${snapshotStatusWord(flag)}`;
}

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
      const manifestPhrase =
        pollSummary.hasGoldenManifest === undefined
          ? "Finalized review record status was not stored"
          : `Finalized review record ${pollSummary.hasGoldenManifest ? "ready" : "pending"}`;

      return `Review ${runId} polled: ${snapshotStatusPhrase("context", pollSummary.hasContextSnapshot)}, ${snapshotStatusPhrase("graph", pollSummary.hasGraphSnapshot)}, ${snapshotStatusPhrase("findings", pollSummary.hasFindingsSnapshot)}, ${manifestPhrase}.`;
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
