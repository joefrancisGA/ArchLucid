import { useEffect } from "react";

import type { ArchitectureScopeUnderstandingCheckPanelProps } from "@/components/architecture/ArchitectureScopeUnderstandingCheckPanel";

/** Opens the TB-2176 scope gate immediately so intake wizard tests can submit without UI interaction. */
export function ArchitectureScopeUnderstandingCheckPanelVitestMock(
  props: ArchitectureScopeUnderstandingCheckPanelProps,
): null {
  useEffect(() => {
    props.onGateChange?.(true);
  }, [props.onGateChange]);

  return null;
}
