"use client";

import { useEffect, useState } from "react";

import {
  listArchitectureDraftRegistryEntries,
  type ArchitectureDraftRegistryEntry,
} from "@/lib/architecture-draft-registry";

/** Client-only snapshot of saved architecture drafts (local registry). */
export function useArchitectureDraftRegistryEntries(): readonly ArchitectureDraftRegistryEntry[] {
  const [entries, setEntries] = useState<readonly ArchitectureDraftRegistryEntry[]>([]);

  useEffect(() => {
    setEntries(listArchitectureDraftRegistryEntries());
  }, []);

  return entries;
}
