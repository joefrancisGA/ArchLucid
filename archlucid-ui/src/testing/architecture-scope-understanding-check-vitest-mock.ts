import type { ArchitectureScopeUnderstandingCheckPanelProps } from "@/components/architecture/ArchitectureScopeUnderstandingCheckPanel";

/** Stub scope gate for intake wizard tests — exposes the confirm affordance without full panel UI. */
export function ArchitectureScopeUnderstandingCheckPanelVitestMock(
  props: ArchitectureScopeUnderstandingCheckPanelProps,
): JSX.Element {
  return (
    <button
      type="button"
      data-testid="architecture-scope-understanding-confirm"
      onClick={() => props.onGateChange?.(true)}
    >
      Confirm scope understanding
    </button>
  );
}
