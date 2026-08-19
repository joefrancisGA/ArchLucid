import { CORE_PILOT_STEP_COUNT } from "@/lib/core-pilot-steps";
import {
  writeCorePilotOptionalStepSkipped,
} from "@/lib/core-pilot-checklist-storage";

export const CORE_PILOT_PROGRESS_CHANGED_EVENT = "archlucid-core-pilot-progress-changed";

export const FIRST_VALUE_MINUTES_ESTIMATE = 20;

export type CorePilotProgressSnapshot = {
  readonly completedCount: number;
  readonly totalCount: number;
  readonly nextStepIndex: number | null;
  readonly allDone: boolean;
};

/** Pure parser for {@link getCorePilotChecklistStorageSnapshot} — safe for SSR/hydration when snapshot is the server fallback. */
export function parseCorePilotProgressFromSnapshot(snapshot: string): CorePilotProgressSnapshot {
  let completedCount = 0;

  for (let index = 0; index < CORE_PILOT_STEP_COUNT; index++) {
    if (snapshot[index] === "1") {
      completedCount += 1;
    }
  }

  let nextStepIndex: number | null = null;

  for (let index = 0; index < CORE_PILOT_STEP_COUNT; index++) {
    if (snapshot[index] !== "1") {
      nextStepIndex = index;
      break;
    }
  }

  return {
    completedCount,
    totalCount: CORE_PILOT_STEP_COUNT,
    nextStepIndex,
    allDone: completedCount >= CORE_PILOT_STEP_COUNT,
  };
}

export function readCorePilotProgressSnapshot(): CorePilotProgressSnapshot {
  return parseCorePilotProgressFromSnapshot("");
}

export function markCorePilotStepSkipped(index: number): void {
  writeCorePilotOptionalStepSkipped(index, true);
}

export { subscribeCorePilotChecklist } from "@/lib/core-pilot-checklist-storage";
