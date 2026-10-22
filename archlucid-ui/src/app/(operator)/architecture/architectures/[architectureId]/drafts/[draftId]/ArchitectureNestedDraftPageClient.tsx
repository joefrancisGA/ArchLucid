"use client";

import { ArchitectureDraftWorkspace } from "@/components/architecture/ArchitectureDraftWorkspace";
import { WorkingArchitectureNestedToolShell } from "@/components/architecture/WorkingArchitectureNestedToolShell";

export type ArchitectureNestedDraftPageClientProps = {
  readonly architectureId: string;
  readonly draftId: string;
};

/** Working nested draft editor with resume context and slug wayfinding. */
export function ArchitectureNestedDraftPageClient(
  props: ArchitectureNestedDraftPageClientProps,
): React.JSX.Element {
  const architectureId = props.architectureId.trim();

  return (
    <WorkingArchitectureNestedToolShell architectureId={architectureId} toolLabel="Draft">
      <ArchitectureDraftWorkspace
        draftId={props.draftId}
        parentArchitectureId={architectureId}
        suppressWorkingNestedIdentityAnchors
      />
    </WorkingArchitectureNestedToolShell>
  );
}
