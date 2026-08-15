import { useSyncExternalStore } from "react";

import type { ImpactPreviewPageState } from "@/lib/impact-preview-page-types";

type ImpactPreviewShellPageState = ImpactPreviewPageState | "unknown";

let currentPageState: ImpactPreviewShellPageState = "unknown";
const listeners = new Set<() => void>();

function emitImpactPreviewShellPageStateChange(): void {
  for (const listener of listeners) {
    listener();
  }
}

export function getImpactPreviewShellPageState(): ImpactPreviewShellPageState {
  return currentPageState;
}

export function setImpactPreviewShellPageState(pageState: ImpactPreviewShellPageState): void {
  if (currentPageState === pageState) {
    return;
  }

  currentPageState = pageState;
  emitImpactPreviewShellPageStateChange();
}

function subscribeImpactPreviewShellPageState(listener: () => void): () => void {
  listeners.add(listener);

  return () => {
    listeners.delete(listener);
  };
}

export function useImpactPreviewShellPageState(): ImpactPreviewShellPageState {
  return useSyncExternalStore(
    subscribeImpactPreviewShellPageState,
    getImpactPreviewShellPageState,
    () => "unknown" as const,
  );
}
