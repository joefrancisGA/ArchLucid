import { useEffect, type JSX } from "react";

import type { ArchitectureScopeUnderstandingCheckPanelProps } from "@/components/architecture/ArchitectureScopeUnderstandingCheckPanel";

/** Opens the TB-2176 scope gate immediately and exposes the confirm control intake wizard tests click. */
export function ArchitectureScopeUnderstandingCheckPanelVitestMock(
  props: ArchitectureScopeUnderstandingCheckPanelProps,
): JSX.Element {
  useEffect(() => {
    props.onGateChange?.(true);
  }, [props.onGateChange]);

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
