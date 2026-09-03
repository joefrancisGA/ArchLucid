"use client";

import { ArchitectureDraftListShell } from "@/components/architecture/ArchitectureDraftListShell";
import { useArchitectureDraftList } from "@/components/architecture/use-architecture-draft-list";

/** Client-side architecture draft registry — search, filter, and sort saved drafts. */
export function ArchitectureDraftListClient(): React.JSX.Element {
  const controller = useArchitectureDraftList();

  return <ArchitectureDraftListShell controller={controller} />;
}
