"use client";

import { cn } from "@/lib/utils";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { useMemo } from "react";

import {
  EnterpriseTable,
  EnterpriseTableBody,
  EnterpriseTableCell,
  EnterpriseTableRow,
} from "@/components/ui/enterprise-table";
import { useInpOffloadTask } from "@/lib/workers/inp-offload-client";
import { buildArchitectureManifestUnifiedLines } from "@/lib/architecture/architecture-manifest-line-diff";
import type { ArchitectureManifestUnifiedLine } from "@/lib/architecture/architecture-manifest-line-diff";

function rowClass(line: ArchitectureManifestUnifiedLine): string {
  if (line.kind === "add") {
    return "bg-emerald-100/80 text-emerald-950 dark:bg-emerald-950/50 dark:text-emerald-100";
  }

  if (line.kind === "remove") {
    return "bg-red-100/80 text-red-950 dark:bg-red-950/45 dark:text-red-100";
  }

  return "bg-white text-neutral-900 dark:bg-neutral-950 dark:text-neutral-100";
}

export type ArchitectureManifestUnifiedDiffViewProps = {
  baselineLabel: string;
  updatedLabel: string;
  beforeText: string;
  afterText: string;
};

/**
 * Unified line diff (Git-style prefixes) with scroll clipping for large manifest JSON.
 */
export function ArchitectureManifestUnifiedDiffView(props: ArchitectureManifestUnifiedDiffViewProps) {
  const offloadPayload = useMemo(
    () => ({
      beforeText: props.beforeText,
      afterText: props.afterText,
    }),
    [props.afterText, props.beforeText],
  );

  const offloadKey = `${props.beforeText.length}:${props.afterText.length}`;
  const { result: offloadedRows, pending } = useInpOffloadTask("manifestLineDiff", offloadPayload, offloadKey);

  const rows =
    offloadedRows ??
    buildArchitectureManifestUnifiedLines(props.beforeText, props.afterText);

  if (pending && offloadedRows === null) {
    return (
      <p className={cn("m-0 text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.body)} role="status">
        Building review record diff…
      </p>
    );
  }

  return (
    <div className="rounded-lg border border-neutral-200 bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-900/40">
      <p className={cn("m-0 border-b border-neutral-200 px-3 py-2 text-neutral-600 dark:border-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>
        <span className="font-medium text-neutral-800 dark:text-neutral-200">{props.baselineLabel}</span>
        <span aria-hidden="true" className="mx-2 text-neutral-400">
          →
        </span>
        <span className="font-medium text-neutral-800 dark:text-neutral-200">{props.updatedLabel}</span>
      </p>
      <div
        className="max-h-[min(70vh,36rem)] overflow-auto overscroll-contain focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-neutral-900"
        tabIndex={0}
        role="region"
        aria-label="Unified line diff of baseline and updated review record JSON"
      >
        <EnterpriseTable
          ariaLabel="Unified line diff of baseline and updated review record JSON"
          className={cn("w-full text-left font-mono leading-snug", OPERATOR_TYPOGRAPHY.helper)}
        >
          <caption className="sr-only">
            Lines prefixed with minus were removed from the baseline review record; lines prefixed with plus were added in
            the updated review record; blank prefix lines are unchanged context.
          </caption>
          <EnterpriseTableBody>
            {rows.map((line, index) => (
              <EnterpriseTableRow key={index} className={cn("align-top", rowClass(line))}>
                <EnterpriseTableCell className={cn("w-8 shrink-0 select-none whitespace-nowrap py-px pr-1 pl-2 text-right text-neutral-500 dark:text-neutral-500", OPERATOR_TYPOGRAPHY.badge)}>
                  {index + 1}
                </EnterpriseTableCell>
                <EnterpriseTableCell className="w-5 shrink-0 select-none whitespace-nowrap py-px text-center font-semibold text-neutral-600 dark:text-neutral-400">
                  {line.prefix}
                </EnterpriseTableCell>
                <EnterpriseTableCell className="min-w-[12rem] whitespace-pre-wrap break-all py-px pr-3">{line.text}</EnterpriseTableCell>
              </EnterpriseTableRow>
            ))}
          </EnterpriseTableBody>
        </EnterpriseTable>
      </div>
    </div>
  );
}
