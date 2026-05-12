import type { ReactElement } from "react";

import { GlossaryTooltip } from "@/components/GlossaryTooltip";
import { OperatorEmptyState } from "@/components/OperatorShellMessage";

export function RunDetailPreFinalizedEmptyState(): ReactElement {
  return (
    <OperatorEmptyState title="Review package not ready yet">
      <p className="m-0">
        This architecture review has not been finalized yet. After the pipeline completes and you finalize, the{" "}
        <GlossaryTooltip termKey="golden_manifest">manifest</GlossaryTooltip>, artifacts, and exports will appear here.
      </p>
    </OperatorEmptyState>
  );
}
