import type { JSX } from "react";

import type { ArchitectureScopeUnderstandingCheckPanelProps } from "@/components/architecture/ArchitectureScopeUnderstandingCheckPanel";

/** Exposes the confirm control intake wizard tests click; gate stays closed until confirm. */
export function ArchitectureScopeUnderstandingCheckPanelVitestMock(
  props: ArchitectureScopeUnderstandingCheckPanelProps,
): JSX.Element {
  return (
    <button
      type="button"
      data-testid="architecture-scope-understanding-confirm"
      onClick={() => {
        props.onGateChange?.(true);
      }}
    >
      Confirm scope understanding
    </button>
  );
}
