/**
 * Shared keys and helpers for the Core Pilot checklist on Home
 * (OperatorFirstRunWorkflowPanel). Used by hints that react when all steps are marked done.
 */

import { CORE_PILOT_STEP_COUNT } from "@/lib/core-pilot-steps";

export { CORE_PILOT_STEP_COUNT };

export const CORE_PILOT_CHECKLIST_CHANGED_EVENT = "archlucid-core-pilot-checklist-changed";

const corePilotChecklistStoreListeners = new Set<() => void>();

/** `useSyncExternalStore` subscription — avoids setState in custom-event handlers during sibling renders. */
export function subscribeCorePilotChecklist(onStoreChange: () => void): () => void {
  corePilotChecklistStoreListeners.add(onStoreChange);

  return () => {
    corePilotChecklistStoreListeners.delete(onStoreChange);
  };
}

/** @deprecated Manual step-done keys are ignored — progress is derived from tenant/review state. */
export function getCorePilotChecklistStorageSnapshot(): string {
  return getCorePilotOptionalSkipSnapshot();
}

/** SSR / hydration fallback for {@link getCorePilotChecklistStorageSnapshot}. */
export function getCorePilotChecklistStorageServerSnapshot(): string {
  return getCorePilotOptionalSkipServerSnapshot();
}

/** When set to `"1"`, `AfterCorePilotChecklistHint` stays hidden (operator dismissed the "what's next" panel). */
export const AFTER_CORE_PILOT_WHATS_NEXT_DISMISSED_KEY = "archlucid_after_core_pilot_whats_next_dismissed_v1";

export function readAfterCorePilotWhatsNextDismissed(): boolean {
  if (typeof window === "undefined") {
    return false;
  }
  try {
    return window.localStorage.getItem(AFTER_CORE_PILOT_WHATS_NEXT_DISMISSED_KEY) === "1";
  } catch {
    return false;
  }
}

export function corePilotStepDoneStorageKey(index: number): string {
  return `archlucid_onboarding_step_${index}_done`;
}

/** Optional-step skip flag — only indices 3–6 honor skip persistence. */
export function corePilotOptionalStepSkippedStorageKey(index: number): string {
  return `archlucid_core_pilot_step_${index}_skipped`;
}

export function readCorePilotOptionalStepSkipped(index: number): boolean {
  if (!isCorePilotStepOptionalIndex(index) || typeof window === "undefined") {
    return false;
  }

  try {
    return window.localStorage.getItem(corePilotOptionalStepSkippedStorageKey(index)) === "1";
  } catch {
    return false;
  }
}

export function writeCorePilotOptionalStepSkipped(index: number, skipped: boolean): void {
  if (!isCorePilotStepOptionalIndex(index) || typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(corePilotOptionalStepSkippedStorageKey(index), skipped ? "1" : "0");
    emitCorePilotChecklistChanged();
  } catch {
    /* ignore */
  }
}

function isCorePilotStepOptionalIndex(index: number): boolean {
  return index >= 3 && index < CORE_PILOT_STEP_COUNT;
}

/** Bitmap of optional-step skip flags for external-store subscribers. */
export function getCorePilotOptionalSkipSnapshot(): string {
  if (typeof window === "undefined") {
    return "";
  }

  try {
    const parts: string[] = [];

    for (let index = 0; index < CORE_PILOT_STEP_COUNT; index++) {
      if (!isCorePilotStepOptionalIndex(index)) {
        parts.push("0");
        continue;
      }

      parts.push(readCorePilotOptionalStepSkipped(index) ? "1" : "0");
    }

    return parts.join("");
  } catch {
    return "";
  }
}

export function getCorePilotOptionalSkipServerSnapshot(): string {
  return "";
}

/** Full panel state (step checks + hide UI); legacy per-step keys stay in sync for other Home surfaces. */
export const PILOT_CHECKLIST_PANEL_STORAGE_KEY = "archlucid-pilot-checklist";

export type PilotChecklistPanelPersisted = {
  steps: boolean[];
  hidden: boolean;
};

function defaultPilotChecklistPanelState(): PilotChecklistPanelPersisted {
  return { steps: Array.from({ length: CORE_PILOT_STEP_COUNT }, () => false), hidden: true };
}

/** Hydration-safe read: prefers `PILOT_CHECKLIST_PANEL_STORAGE_KEY`, else migrates from `corePilotStepDoneStorageKey`. */
export function readPilotChecklistPanelState(): PilotChecklistPanelPersisted {
  if (typeof window === "undefined") {
    return defaultPilotChecklistPanelState();
  }

  try {
    const raw = window.localStorage.getItem(PILOT_CHECKLIST_PANEL_STORAGE_KEY);

    if (raw) {
      const parsed = JSON.parse(raw) as { steps?: unknown; hidden?: unknown };

      if (Array.isArray(parsed.steps) && parsed.steps.length === CORE_PILOT_STEP_COUNT) {
        return {
          steps: parsed.steps.map((s) => s === true),
          hidden: parsed.hidden === true,
        };
      }
    }
  } catch {
    /* fall through */
  }

  const steps: boolean[] = [];

  for (let i = 0; i < CORE_PILOT_STEP_COUNT; i++) {
    steps.push(window.localStorage.getItem(corePilotStepDoneStorageKey(i)) === "1");
  }

  return { steps, hidden: true };
}

export function writePilotChecklistPanelState(state: PilotChecklistPanelPersisted): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(
      PILOT_CHECKLIST_PANEL_STORAGE_KEY,
      JSON.stringify({ steps: state.steps, hidden: state.hidden }),
    );

    emitCorePilotChecklistChanged();
  } catch {
    /* ignore */
  }
}

/**
 * Required-step completion is derived from tenant/review lifecycle — callers should use
 * {@link useCorePilotDerivedStepStatus} or pass commit context into step-status helpers.
 */
export function readCorePilotChecklistAllDone(): boolean {
  return false;
}

/** Defer so listeners never run during another component's render or passive-effect flush. */
export function emitCorePilotChecklistChanged(): void {
  if (typeof window === "undefined") {
    return;
  }

  setTimeout(() => {
    try {
      for (const listener of corePilotChecklistStoreListeners) {
        listener();
      }

      window.dispatchEvent(new CustomEvent(CORE_PILOT_CHECKLIST_CHANGED_EVENT));
    } catch {
      /* ignore */
    }
  }, 0);
}
