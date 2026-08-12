"use client";

import { useSyncExternalStore } from "react";

import {
  getArchitectureDraftRegistryServerSnapshot,
  getArchitectureDraftRegistrySnapshot,
  subscribeArchitectureDraftRegistry,
  type ArchitectureDraftRegistryEntry,
} from "@/lib/architecture/architecture-draft-registry";

function subscribeArchitectureDraftRegistryHydration(_onStoreChange: () => void): () => void {
  return () => {};
}

function getArchitectureDraftRegistryHydratedSnapshot(): boolean {
  return true;
}

function getArchitectureDraftRegistryHydrationServerSnapshot(): boolean {
  return false;
}

/** Client-only snapshot of saved architecture drafts (local registry). */
export function useArchitectureDraftRegistryEntries(): readonly ArchitectureDraftRegistryEntry[] {
  return useSyncExternalStore(
    subscribeArchitectureDraftRegistry,
    getArchitectureDraftRegistrySnapshot,
    getArchitectureDraftRegistryServerSnapshot,
  );
}

/** False during SSR / pre-hydration so lists can avoid a false empty state (TB-1450). */
export function useArchitectureDraftRegistryHydrated(): boolean {
  return useSyncExternalStore(
    subscribeArchitectureDraftRegistryHydration,
    getArchitectureDraftRegistryHydratedSnapshot,
    getArchitectureDraftRegistryHydrationServerSnapshot,
  );
}
