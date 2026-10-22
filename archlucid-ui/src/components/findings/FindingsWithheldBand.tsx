"use client";

import Link from "next/link";
import type { ReactElement } from "react";

import { useWorkspaceMode } from "@/components/WorkspaceModeProvider";
import { OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import {
  buildWithheldFindingDeepLink,
  formatWithheldFindingReasonLabel,
  type WithheldFindingRow,
} from "@/lib/findings/findings-withheld-band";
import { cn } from "@/lib/utils";

export type FindingsWithheldBandProps = {
  readonly runId: string;
  readonly withheld: readonly WithheldFindingRow[];
};

/** Working findings band for emission-stripped and merge-dropped rows (DR-02). */
export function FindingsWithheldBand(props: FindingsWithheldBandProps): ReactElement | null {
  const { isWorkingMode } = useWorkspaceMode();

  if (!isWorkingMode || props.withheld.length === 0) {
    return null;
  }

  return (
    <section
      className="rounded-md border border-amber-200 bg-amber-50/70 px-3 py-2 dark:border-amber-900 dark:bg-amber-950/30"
      data-testid="findings-withheld-band"
      aria-label="Needs attention — withheld findings"
    >
      <p className={cn("m-0 font-semibold text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}>
        Needs attention — withheld from record ({props.withheld.length})
      </p>
      <ul className="m-0 mt-2 list-none space-y-2 p-0">
        {props.withheld.map((row) => (
          <li key={row.withheldFindingId} data-testid={`findings-withheld-row-${row.withheldFindingId}`}>
            <p className={cn("m-0 text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}>{row.title}</p>
            <p className={cn("m-0 mt-0.5 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
              {formatWithheldFindingReasonLabel(row.reason)} · {row.originEngineType}
              {row.originAgentType !== null ? ` · ${row.originAgentType}` : ""}
            </p>
            <p className={cn("m-0 mt-1", OPERATOR_TYPOGRAPHY.helper)}>
              <Link className={OPERATOR_LINK.nav} href={buildWithheldFindingDeepLink(props.runId, row)}>
                Open trace or conflict resolution
              </Link>
            </p>
          </li>
        ))}
      </ul>
    </section>
  );
}
