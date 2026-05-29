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

/** Serialized step-done flags for external-store snapshots (client). */
export function getCorePilotChecklistStorageSnapshot(): string {
  if (typeof window === "undefined") {
    return "";
  }

  try {
    const parts: string[] = [];

    for (let i = 0; i < CORE_PILOT_STEP_COUNT; i++) {
      parts.push(window.localStorage.getItem(corePilotStepDoneStorageKey(i)) === "1" ? "1" : "0");
    }

    return parts.join("");
  } catch {
    return "";
  }
}

/** SSR / hydration fallback for {@link getCorePilotChecklistStorageSnapshot}. */
export function getCorePilotChecklistStorageServerSnapshot(): string {
  return "";
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

/** Full panel state (step checks + hide UI); legacy per-step keys stay in sync for other Home surfaces. */
export const PILOT_CHECKLIST_PANEL_STORAGE_KEY = "archlucid-pilot-checklist";

export type PilotChecklistPanelPersisted = {
  steps: boolean[];
  hidden: boolean;
};

function defaultPilotChecklistPanelState(): PilotChecklistPanelPersisted {
  return { steps: Array.from({ length: CORE_PILOT_STEP_COUNT }, () => false), hidden: false };
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

  return { steps, hidden: false };
}

export function writePilotChecklistPanelState(state: PilotChecklistPanelPersisted): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(PILOT_CHECKLIST_PANEL_STORAGE_KEY, JSON.stringify(state));

    for (let i = 0; i < CORE_PILOT_STEP_COUNT; i++) {
      window.localStorage.setItem(corePilotStepDoneStorageKey(i), state.steps[i] ? "1" : "0");
    }

    emitCorePilotChecklistChanged();
  } catch {
    /* ignore */
  }
}

/** True when every checklist step has localStorage value "1". */
export function readCorePilotChecklistAllDone(): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  try {
    for (let i = 0; i < CORE_PILOT_STEP_COUNT; i++) {
      if (window.localStorage.getItem(corePilotStepDoneStorageKey(i)) !== "1") {
        return false;
      }
    }

    return true;
  } catch {
    return false;
  }
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
