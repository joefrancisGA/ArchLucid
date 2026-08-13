"use client";

import { useEffect, useSyncExternalStore } from "react";

import type { HelpPageSituation } from "@/lib/help/help-page-situation";

type HelpPageSituationListener = () => void;

/**
 * Module-level store instead of React context: the Help drawer is mounted by the app
 * shell, a sibling of the page that knows the review state, so a provider would have to
 * wrap the entire shell. `useSyncExternalStore` lets the drawer subscribe from anywhere.
 */
let currentSituation: HelpPageSituation | null = null;

const listeners = new Set<HelpPageSituationListener>();

export function getHelpPageSituation(): HelpPageSituation | null {
  return currentSituation;
}

export function setHelpPageSituation(next: HelpPageSituation | null): void {
  if (currentSituation === next) {
    return;
  }

  currentSituation = next;

  for (const listener of listeners) {
    listener();
  }
}

export function subscribeHelpPageSituation(listener: HelpPageSituationListener): () => void {
  listeners.add(listener);

  return () => {
    listeners.delete(listener);
  };
}

/** Server render has no page situation; the client publishes one after hydration. */
function serverHelpPageSituation(): null {
  return null;
}

export function useHelpPageSituation(): HelpPageSituation | null {
  return useSyncExternalStore(subscribeHelpPageSituation, getHelpPageSituation, serverHelpPageSituation);
}

/** Publishes a situation while the calling component is mounted, clearing it on unmount. */
export function useRegisterHelpPageSituation(situation: HelpPageSituation | null): void {
  useEffect(() => {
    setHelpPageSituation(situation);

    return () => {
      setHelpPageSituation(null);
    };
  }, [situation]);
}
