"use client";

import type { ReactElement } from "react";

import { useCorePilotCommitContextQuery } from "@/hooks/use-core-pilot-commit-context-query";
import { deriveCorePilotCommitProgressState } from "@/lib/core-pilot-commit-progress";

import {
  CorePilotNextStepsCommittedState,
  CorePilotNextStepsHasRunState,
  CorePilotNextStepsNoRunState,
} from "./CorePilotNextStepsCardStates";

/**
 * Core Pilot first-session status panel for operator home.
 *
 * Derives which of the four pilot steps is active from commit-context signals and renders:
 * - Current step indicator (Step N of 4)
 * - Next action CTA
 * - "Skip for now" note naming advanced features to ignore
 * - Rescue link when blocked
 * - Run ID for support correlation when available
 *
 * Operate links remain secondary: only offered after a manifest is committed.
 */
export function CorePilotNextStepsCard(): ReactElement | null {
  const { data, isPending, isError } = useCorePilotCommitContextQuery();

  if (isPending) {
    return null;
  }

  const hasCommit = !isError && data.hasCommittedManifest;
  const latestRunId = isError ? null : data.latestRunId;
  const firstCommittedRunId = isError ? null : data.firstCommittedRunId;
  const latestRunReadyToFinalize = !isError && data.latestRunReadyToFinalize;

  const pilotState = deriveCorePilotCommitProgressState(hasCommit, latestRunId);

  const stateProps = {
    pilotState,
    latestRunId,
    firstCommittedRunId,
    latestRunReadyToFinalize,
  };

  if (pilotState === "committed") {
    return <CorePilotNextStepsCommittedState {...stateProps} />;
  }

  if (pilotState === "has-run") {
    return <CorePilotNextStepsHasRunState {...stateProps} />;
  }

  return <CorePilotNextStepsNoRunState {...stateProps} />;
}
