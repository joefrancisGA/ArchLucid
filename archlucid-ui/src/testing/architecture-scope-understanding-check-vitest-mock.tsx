import type { JSX } from "react";

import type { ArchitectureScopeUnderstandingCheckPanelProps } from "@/components/architecture/ArchitectureScopeUnderstandingCheckPanel";
import { deriveScopeUnderstandingBullets } from "@/lib/architecture/architecture-scope-understanding-check";

/** Exposes the confirm control intake wizard tests click; gate stays closed until confirm. */
export function ArchitectureScopeUnderstandingCheckPanelVitestMock(
  props: ArchitectureScopeUnderstandingCheckPanelProps,
): JSX.Element {
  return (
    <button
      type="button"
      data-testid="architecture-scope-understanding-confirm"
      onClick={() => {
        const bullets = deriveScopeUnderstandingBullets(props.input);

        props.onBulletsChange?.(bullets.length > 0 ? bullets : [
          {
            id: "vitest-scope-1",
            kind: "custom",
            label: "Primary System or Architecture",
            value: props.input.architectureName?.trim() || "Test system",
            source: "inferred",
          },
        ]);
        props.onGateChange?.(true);
      }}
    >
      Confirm scope understanding
    </button>
  );
}
