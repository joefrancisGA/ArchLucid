"use client";

import type { ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import type { ReviewDetailTabId } from "@/lib/review-detail-workspace-tabs";
import { REVIEW_DETAIL_TAB_LABELS } from "@/lib/review-detail-workspace-tabs";
import { cn } from "@/lib/utils";

export const REVIEW_WORKBENCH_LAYOUT_TEST_ID = "review-workbench-layout";

export type ReviewWorkbenchColumnId = "architecture" | "findings" | "evidence";

export type ReviewWorkbenchLayoutProps = {
  readonly architecture: ReactNode;
  readonly findings: ReactNode;
  readonly evidence: ReactNode;
  readonly focusColumn: ReviewWorkbenchColumnId | null;
  readonly onFocusColumn: (column: ReviewWorkbenchColumnId) => void;
  readonly onExitWorkbench?: () => void;
  readonly selectedFindingId?: string | null;
  readonly selectedFindingTitle?: string | null;
  readonly highlightedNodeId?: string | null;
  readonly highlightedNodeLabel?: string | null;
};

function columnLabel(column: ReviewWorkbenchColumnId): string {
  if (column === "architecture") {
    return REVIEW_DETAIL_TAB_LABELS.architecture;
  }

  if (column === "findings") {
    return REVIEW_DETAIL_TAB_LABELS.findings;
  }

  return REVIEW_DETAIL_TAB_LABELS.evidence;
}

/** Working-mode split: architecture, findings, and evidence visible together (TB professional workbench). */
export function ReviewWorkbenchLayout(props: ReviewWorkbenchLayoutProps): React.JSX.Element {
  const columns: ReadonlyArray<{
    id: ReviewWorkbenchColumnId;
    panel: ReactNode;
  }> = [
    { id: "architecture", panel: props.architecture },
    { id: "findings", panel: props.findings },
    { id: "evidence", panel: props.evidence },
  ];

  return (
    <section
      className="space-y-3"
      data-review-workbench-layout=""
      data-testid={REVIEW_WORKBENCH_LAYOUT_TEST_ID}
      aria-label="Review workbench"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
          Workbench keeps architecture, findings, and evidence on screen. Use tabs for other sections.
        </p>
        {props.onExitWorkbench !== undefined ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            data-testid="review-workbench-exit"
            onClick={props.onExitWorkbench}
          >
            Tab-only layout
          </Button>
        ) : null}
      </div>

      <div
        className="grid min-w-0 gap-4 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)_minmax(0,0.9fr)]"
        data-testid="review-workbench-columns"
      >
        {columns.map((column) => {
          const focused = props.focusColumn === column.id;

          return (
            <div
              key={column.id}
              className={cn(
                "min-w-0 rounded-md border p-3",
                focused
                  ? "border-al-primary-action-bg ring-1 ring-al-primary-action-bg/30"
                  : "border-neutral-200 dark:border-neutral-800",
              )}
              data-testid={`review-workbench-column-${column.id}`}
              data-workbench-selected-finding-id={
                column.id === "findings" ? props.selectedFindingId ?? "" : undefined
              }
              data-workbench-highlighted-node-id={
                column.id === "architecture" ? props.highlightedNodeId ?? "" : undefined
              }
              data-workbench-evidence-finding-id={
                column.id === "evidence" ? props.selectedFindingId ?? "" : undefined
              }
            >
              <div className="mb-2 flex items-center justify-between gap-2">
                <h3
                  className={cn(
                    "m-0 font-semibold text-neutral-900 dark:text-neutral-100",
                    OPERATOR_TYPOGRAPHY.cardTitle,
                  )}
                >
                  {columnLabel(column.id)}
                </h3>
                <button
                  type="button"
                  className={cn(OPERATOR_TYPOGRAPHY.helper, "text-al-link underline-offset-2 hover:underline")}
                  data-testid={`review-workbench-focus-${column.id}`}
                  aria-label={`Focus ${columnLabel(column.id)} column`}
                  onClick={() => props.onFocusColumn(column.id)}
                >
                  Focus
                </button>
              </div>
              {column.id === "findings" && (props.selectedFindingTitle?.trim() ?? "").length > 0 ? (
                <p
                  className={cn(
                    "sticky top-0 z-10 -mx-1 mb-2 truncate rounded-md border border-neutral-200 bg-white px-2 py-1 text-al-text-primary dark:border-neutral-700 dark:bg-neutral-950",
                    OPERATOR_TYPOGRAPHY.body,
                  )}
                  data-testid="review-workbench-selected-finding-title"
                  title={props.selectedFindingTitle ?? undefined}
                >
                  {props.selectedFindingTitle}
                </p>
              ) : null}
              {column.id === "architecture" && (props.highlightedNodeLabel?.trim() ?? "").length > 0 ? (
                <p
                  className={cn(
                    "sticky top-0 z-10 -mx-1 mb-2 truncate rounded-md border border-neutral-200 bg-white px-2 py-1 text-al-text-secondary dark:border-neutral-700 dark:bg-neutral-950",
                    OPERATOR_TYPOGRAPHY.helper,
                  )}
                  data-testid="review-workbench-highlighted-node-label"
                  title={props.highlightedNodeLabel ?? undefined}
                >
                  {props.highlightedNodeLabel}
                </p>
              ) : null}
              <div className="min-w-0 max-w-full overflow-x-auto overflow-y-visible">{column.panel}</div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
