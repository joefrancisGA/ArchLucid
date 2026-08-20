import type { ReactElement, ReactNode } from "react";

import {
  RUN_DETAIL_CREATE_HOME_FINDINGS_ORIENTATION_LEAD,
} from "@/lib/runs/run-detail-create-home-findings-copy";

export type RunDetailCreateHomeFindingsPanelProps = {
  readonly runId: string;
  readonly packageCommitted: boolean;
  readonly children: ReactNode;
};

/** Create-home Findings archTab — pre-finalize orientation before deferred explanation UI (TB-1852). */
export function RunDetailCreateHomeFindingsPanel(props: RunDetailCreateHomeFindingsPanelProps): ReactElement {
  return (
    <div className="space-y-4" data-testid="run-detail-create-home-findings">
      {!props.packageCommitted ? (
        <div
          className="rounded-md border border-neutral-200 bg-al-surface-raised p-3 dark:border-neutral-800"
          data-testid="run-detail-create-home-findings-orientation"
        >
          <p className="m-0 text-neutral-700 dark:text-neutral-300">{RUN_DETAIL_CREATE_HOME_FINDINGS_ORIENTATION_LEAD}</p>
        </div>
      ) : null}
      {props.children}
    </div>
  );
}
