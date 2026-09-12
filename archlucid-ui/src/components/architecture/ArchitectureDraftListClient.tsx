"use client";

import { ArchitectureDraftListShell } from "@/components/architecture/ArchitectureDraftListShell";
import { useArchitectureDraftList } from "@/components/architecture/use-architecture-draft-list";

export type ArchitectureDraftListPresentation = "default" | "working-portfolio";

type ArchitectureDraftListClientProps = {
  readonly presentation?: ArchitectureDraftListPresentation;
};

/** Client-side architecture draft registry — search, filter, and sort saved drafts. */
export function ArchitectureDraftListClient(
  props: ArchitectureDraftListClientProps = {},
): React.JSX.Element {
  const controller = useArchitectureDraftList();
  const presentation = props.presentation ?? "default";

  return <ArchitectureDraftListShell controller={controller} presentation={presentation} />;
}
