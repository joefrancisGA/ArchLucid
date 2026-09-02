import type { CorePilotCommitContext } from "@/lib/core-pilot-commit-context";
import { corePilotStepDoneStorageKey } from "@/lib/core-pilot-checklist-storage";
import { CORE_PILOT_STEPS } from "@/lib/core-pilot-steps";
import { SHOWCASE_STATIC_DEMO_RUN_ID } from "@/lib/showcase-static-demo";

export const OPERATOR_FIRST_RUN_WORKFLOW_MINIMIZED_STORAGE_KEY = "archlucid_operator_workflow_guide_v1";
export const OPERATOR_FIRST_RUN_WORKFLOW_GRADUATED_STORAGE_KEY = "archlucid_checklist_graduated";

export const operatorFirstRunEmptyCommitContext: CorePilotCommitContext = {
  hasCommittedManifest: false,
  committedReviewCount: 0,
  latestRunId: null,
  firstCommittedRunId: null,
  secondCommittedRunId: null,
  latestRunReadyToFinalize: false,
  sealedReviewRecord: null,
};

export const operatorFirstRunShowcaseCommitContext: CorePilotCommitContext = {
  hasCommittedManifest: true,
  committedReviewCount: 1,
  latestRunId: SHOWCASE_STATIC_DEMO_RUN_ID,
  firstCommittedRunId: SHOWCASE_STATIC_DEMO_RUN_ID,
  secondCommittedRunId: null,
  latestRunReadyToFinalize: false,
  sealedReviewRecord: null,
};

export const operatorFirstRunCorePilotSteps = CORE_PILOT_STEPS;

export function readOperatorFirstRunDoneByIndexFromStorage(): boolean[] {
  const nextDone: boolean[] = [];

  for (let i = 0; i < operatorFirstRunCorePilotSteps.length; i++) {
    try {
      if (typeof window !== "undefined" && window.localStorage.getItem(corePilotStepDoneStorageKey(i)) === "1") {
        nextDone.push(true);
      } else {
        nextDone.push(false);
      }
    } catch {
      nextDone.push(false);
    }
  }

  return nextDone;
}

export function readOperatorFirstRunMinimizedFromStorage(): boolean {
  try {
    return typeof window !== "undefined" && window.localStorage.getItem(OPERATOR_FIRST_RUN_WORKFLOW_MINIMIZED_STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

export function readOperatorFirstRunGraduatedFromStorage(allDoneFromStorage: boolean): boolean {
  try {
    if (typeof window !== "undefined") {
      const rawGrad = window.localStorage.getItem(OPERATOR_FIRST_RUN_WORKFLOW_GRADUATED_STORAGE_KEY);

      if (rawGrad === "1" && allDoneFromStorage) {
        return true;
      }

      if (rawGrad === "1" && !allDoneFromStorage) {
        window.localStorage.removeItem(OPERATOR_FIRST_RUN_WORKFLOW_GRADUATED_STORAGE_KEY);
      }
    }
  } catch {
    /* private mode */
  }

  return false;
}

export function persistOperatorFirstRunMinimized(): void {
  try {
    window.localStorage.setItem(OPERATOR_FIRST_RUN_WORKFLOW_MINIMIZED_STORAGE_KEY, "1");
  } catch {
    /* ignore */
  }
}

export function clearOperatorFirstRunMinimized(): void {
  try {
    window.localStorage.removeItem(OPERATOR_FIRST_RUN_WORKFLOW_MINIMIZED_STORAGE_KEY);
  } catch {
    /* ignore */
  }
}

export function persistOperatorFirstRunGraduated(): void {
  try {
    window.localStorage.setItem(OPERATOR_FIRST_RUN_WORKFLOW_GRADUATED_STORAGE_KEY, "1");
  } catch {
    /* private mode */
  }
}

export function clearOperatorFirstRunGraduated(): void {
  try {
    window.localStorage.removeItem(OPERATOR_FIRST_RUN_WORKFLOW_GRADUATED_STORAGE_KEY);
  } catch {
    /* private mode */
  }
}

export function syncOperatorFirstRunDoneByIndexToStorage(merged: readonly boolean[]): void {
  for (let i = 0; i < merged.length; i++) {
    try {
      if (merged[i]) {
        window.localStorage.setItem(corePilotStepDoneStorageKey(i), "1");
      } else {
        window.localStorage.removeItem(corePilotStepDoneStorageKey(i));
      }
    } catch {
      /* private mode */
    }
  }
}
