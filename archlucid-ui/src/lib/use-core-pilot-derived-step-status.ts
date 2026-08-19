"use client";

import { useMemo, useSyncExternalStore } from "react";

import { useCorePilotCommitContextQuery } from "@/hooks/use-core-pilot-commit-context-query";
import type { CorePilotCommitContext } from "@/lib/core-pilot-commit-context";
import {
  getCorePilotOptionalSkipServerSnapshot,
  getCorePilotOptionalSkipSnapshot,
  subscribeCorePilotChecklist,
} from "@/lib/core-pilot-checklist-storage";
import {
  buildCorePilotProgressFromStatuses,
  buildCorePilotStepStatusContext,
  resolveCorePilotNextStepIndex,
  resolveCorePilotStepStatuses,
  type CorePilotStepDerivedStatus,
} from "@/lib/core-pilot-step-status";
import type { CorePilotProgressSnapshot } from "@/lib/usability/core-pilot-progress-tracker";

export type CorePilotDerivedStepStatusState = {
  readonly isPending: boolean;
  readonly statuses: readonly CorePilotStepDerivedStatus[];
  readonly progress: CorePilotProgressSnapshot;
  readonly nextStepIndex: number | null;
};

const emptyOptionalSkips = Array.from({ length: 7 }, () => false);

const emptyCommitContext: CorePilotCommitContext = {
  hasCommittedManifest: false,
  committedReviewCount: 0,
  latestRunId: null,
  firstCommittedRunId: null,
  secondCommittedRunId: null,
  latestRunReadyToFinalize: false,
};

export function useCorePilotDerivedStepStatus(): CorePilotDerivedStepStatusState {
  const query = useCorePilotCommitContextQuery();
  const optionalSkipSnapshot = useSyncExternalStore(
    subscribeCorePilotChecklist,
    getCorePilotOptionalSkipSnapshot,
    getCorePilotOptionalSkipServerSnapshot,
  );

  return useMemo((): CorePilotDerivedStepStatusState => {
    const commitContext =
      query.isPending || query.isError || query.data === undefined
        ? emptyCommitContext
        : query.data;
    const optionalStepsSkipped = optionalSkipSnapshot
      .split("")
      .map((flag) => flag === "1")
      .concat(emptyOptionalSkips)
      .slice(0, 7);
    const statusContext = buildCorePilotStepStatusContext(commitContext, optionalStepsSkipped);
    const statuses = resolveCorePilotStepStatuses(statusContext);
    const progress = buildCorePilotProgressFromStatuses(statuses);

    return {
      isPending: query.isPending,
      statuses,
      progress,
      nextStepIndex: resolveCorePilotNextStepIndex(statuses),
    };
  }, [optionalSkipSnapshot, query.data, query.isError, query.isPending]);
}
