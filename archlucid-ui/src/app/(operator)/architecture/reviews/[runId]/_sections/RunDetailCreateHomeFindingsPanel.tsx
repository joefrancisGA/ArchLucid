import Link from "next/link";
import type { ReactElement, ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { buildArchitectureWorkspaceTabHref } from "@/lib/architecture/architecture-workspace-tabs";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import {
  RUN_DETAIL_CREATE_HOME_FINDINGS_ACTIVITY_CTA_LABEL,
  RUN_DETAIL_CREATE_HOME_FINDINGS_ORIENTATION_LEAD,
} from "@/lib/runs/run-detail-create-home-findings-copy";
import { cn } from "@/lib/utils";

export type RunDetailCreateHomeFindingsPanelProps = {
  readonly runId: string;
  readonly packageCommitted: boolean;
  readonly children: ReactNode;
};

/** Create-home Findings archTab — pre-finalize orientation before deferred explanation UI (TB-1852). */
export function RunDetailCreateHomeFindingsPanel(props: RunDetailCreateHomeFindingsPanelProps): ReactElement {
  const activityHref = buildArchitectureWorkspaceTabHref(props.runId, "activity", {
    includeCreateIntent: true,
  });

  return (
    <div className="space-y-4" data-testid="run-detail-create-home-findings">
      {!props.packageCommitted ? (
        <div
          className="flex flex-col gap-2 rounded-md border border-neutral-200 bg-al-surface-raised p-3 sm:flex-row sm:items-center sm:justify-between dark:border-neutral-800"
          data-testid="run-detail-create-home-findings-orientation"
        >
          <p className={cn("m-0 text-neutral-700 dark:text-neutral-300", OPERATOR_TYPOGRAPHY.body)}>
            {RUN_DETAIL_CREATE_HOME_FINDINGS_ORIENTATION_LEAD}
          </p>
          <Button type="button" variant="outline" size="sm" className="shrink-0" asChild>
            <Link href={activityHref}>{RUN_DETAIL_CREATE_HOME_FINDINGS_ACTIVITY_CTA_LABEL}</Link>
          </Button>
        </div>
      ) : null}
      {props.children}
    </div>
  );
}
