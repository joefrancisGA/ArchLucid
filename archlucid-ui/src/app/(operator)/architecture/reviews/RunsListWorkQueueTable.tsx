"use client";

import type { KeyboardEvent, MouseEvent } from "react";

import Link from "next/link";

import { ArchitecturePackageOriginBadge } from "@/components/operator-home/runs-dashboard-helpers";
import { RunProvenanceInline } from "@/components/runs/RunProvenanceInline";
import { RunsRowBaselineMenu } from "@/components/runs/RunsRowBaselineMenu";
import { RunTableRowErrorBoundary } from "@/components/runs/RunTableRowErrorBoundary";
import { RunStatusBadge } from "@/components/runs/RunStatusBadge";
import {
  EnterpriseTable,
  EnterpriseTableBody,
  EnterpriseTableCell,
  EnterpriseTableHead,
  EnterpriseTableHeadRow,
  EnterpriseTableHeaderCell,
  EnterpriseTableRow,
} from "@/components/ui/enterprise-table";
import { getBuyerSafeReviewsTableLink, getBuyerSafeReviewsTableLinkForRun, getBuyerSafeSignedManifestTableLink } from "@/lib/buyer/buyer-safe-review-navigation";
import { buyerDemoPackageCardMeta } from "@/lib/buyer/buyer-demo-package-card-meta";
import { isRunCommittedForBaseline } from "@/lib/compare-baseline-run";
import { OPERATOR_LINK, OPERATOR_NAV_GROUP_LABEL, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import {
  runWorkQueueAttentionPartition,
  workQueueSectionHeading,
  type RunWorkQueueSection,
} from "@/lib/runs/run-work-queue-groups";
import { formatOperatorProjectIdDisplay } from "@/lib/operator/operator-project-display";
import { cn } from "@/lib/utils";
import type { RunSummary } from "@/types/authority";

import {
  displayRelativeCreated,
  runListPrimaryTitle,
  runRowAccessibleDescription,
  runRowExplicitCountsLine,
  runRowOutputReadinessLine,
  runRowOutputReadinessLineBuyer,
} from "./runs-list-row-presentation";

export type RunsListWorkQueueTableProps = {
  readonly sections: readonly RunWorkQueueSection[];
  readonly projectId: string;
  readonly buyerPolished: boolean;
  readonly buyerPipelineLabels: boolean;
  readonly showCompareSelection: boolean;
  readonly compareSelection: readonly string[];
  readonly selectedRun: RunSummary | null;
  readonly onRowActivate: (run: RunSummary, event: MouseEvent<HTMLTableRowElement>) => void;
  readonly toggleCompareSelection: (runId: string) => void;
};

function activateRowKeyboard(
  e: KeyboardEvent<HTMLTableRowElement>,
  run: RunSummary,
  onActivate: (run: RunSummary, event: MouseEvent<HTMLTableRowElement>) => void,
) {
  if (e.key !== "Enter" && e.key !== " ") {
    return;
  }

  if ((e.target as HTMLElement).closest("a")) {
    return;
  }

  if ((e.target as HTMLElement).closest('input[type="checkbox"]')) {
    return;
  }

  e.preventDefault();
  onActivate(run, e as unknown as MouseEvent<HTMLTableRowElement>);
}

export function RunsListWorkQueueTable(props: RunsListWorkQueueTableProps): React.JSX.Element {
  return (
    <>
      {props.sections.map((section) => {
        const headingId = `runs-queue-${section.groupId}`;

        return (
          <section
            key={section.groupId}
            aria-labelledby={headingId}
            className="space-y-2"
            data-testid={headingId}
            data-attention-partition={runWorkQueueAttentionPartition(section.groupId)}
          >
            <h3
              id={headingId}
              className={cn("m-0", OPERATOR_NAV_GROUP_LABEL)}
            >
              {workQueueSectionHeading(section.groupId, props.buyerPipelineLabels)}
            </h3>
            <EnterpriseTable ariaLabel={workQueueSectionHeading(section.groupId, props.buyerPipelineLabels)}>
              <EnterpriseTableHead>
                <EnterpriseTableHeadRow>
                  {props.showCompareSelection ? (
                    <EnterpriseTableHeaderCell className="w-10">
                      <span className="sr-only">Compare</span>
                    </EnterpriseTableHeaderCell>
                  ) : null}
                  <EnterpriseTableHeaderCell>Architecture review</EnterpriseTableHeaderCell>
                  <EnterpriseTableHeaderCell>Created</EnterpriseTableHeaderCell>
                  <EnterpriseTableHeaderCell>Actions</EnterpriseTableHeaderCell>
                </EnterpriseTableHeadRow>
              </EnterpriseTableHead>
              <EnterpriseTableBody>
                {section.runs.map((run) => {
                  const createdLabel = new Date(run.createdUtc).toLocaleString();
                  const isSelected = props.selectedRun?.runId === run.runId;
                  const title = runListPrimaryTitle(run);
                  const countsLine = runRowExplicitCountsLine(run, props.buyerPolished);
                  const primaryExplore = props.buyerPolished
                    ? getBuyerSafeReviewsTableLinkForRun(run)
                    : getBuyerSafeReviewsTableLink(run.runId);
                  const signedManifestExplore = props.buyerPolished
                    ? getBuyerSafeSignedManifestTableLink(run.runId)
                    : null;
                  const describeRow = runRowAccessibleDescription(run, props.projectId, countsLine, props.buyerPolished);

                  return (
                    <RunTableRowErrorBoundary key={run.runId} runId={run.runId}>
                      <EnterpriseTableRow
                        data-testid={`runs-row-${run.runId}`}
                        tabIndex={0}
                        aria-label={describeRow}
                        selected={isSelected}
                        className={cn(
                          "cursor-pointer focus-visible:ring-2 focus-visible:ring-[var(--al-accent-border-focus)] focus-visible:ring-offset-2",
                        )}
                        onClick={(e) => {
                          props.onRowActivate(run, e);
                        }}
                        onKeyDown={(e) => {
                          activateRowKeyboard(e, run, props.onRowActivate);
                        }}
                      >
                        {props.showCompareSelection ? (
                          <EnterpriseTableCell className="w-10 align-top">
                            <input
                              type="checkbox"
                              className="h-4 w-4 rounded border-neutral-300 text-teal-700 focus:ring-teal-600"
                              checked={props.compareSelection.includes(run.runId)}
                              aria-label={`Select ${title} for comparison`}
                              onChange={() => {
                                props.toggleCompareSelection(run.runId);
                              }}
                              onClick={(e) => {
                                e.stopPropagation();
                              }}
                            />
                          </EnterpriseTableCell>
                        ) : null}
                        <EnterpriseTableCell className="max-w-[min(100vw,28rem)]">
                          <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
                            <ArchitecturePackageOriginBadge
                              run={run}
                              buyerPolishedShell={props.buyerPolished}
                              className="text-[0.6rem]"
                            />
                            {/* Status badge leads the row so ARB scanners see state before reading the title */}
                            <RunStatusBadge run={run} />
                            <span className={cn("min-w-0 font-semibold text-neutral-900 dark:text-neutral-100", OPERATOR_TYPOGRAPHY.body)}>
                              {title}
                            </span>
                          </div>
                          {props.buyerPolished ? (() => {
                            const meta = buyerDemoPackageCardMeta(run.runId);

                            if (meta === null) return null;

                            return (
                              <div className="mt-1.5 space-y-0.5">
                                <p className={cn("m-0 font-medium text-neutral-800 dark:text-neutral-200", OPERATOR_TYPOGRAPHY.micro)}>
                                  {meta.decisionSummary}
                                </p>
                                <p className={cn("m-0", OPERATOR_TYPOGRAPHY.micro)}>
                                  Authority: {meta.approvalAuthority}
                                </p>
                              </div>
                            );
                          })() : (
                            <code className={cn("mt-1 block break-all font-mono text-neutral-500 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.micro)}>
                              {run.runId}
                            </code>
                          )}
                          {run.projectId !== props.projectId ? (
                            <p className={cn("m-0 mt-0.5", OPERATOR_TYPOGRAPHY.helper)}>
                              Project{" "}
                              <span className="font-mono">{formatOperatorProjectIdDisplay(run.projectId)}</span>
                            </p>
                          ) : null}
                          <div className="mt-1.5">
                            <RunProvenanceInline run={run} buyerPolished={props.buyerPolished} summaryOnly={props.buyerPolished} />
                          </div>
                          {countsLine !== null ? (
                            <p
                              className={cn("m-0 mt-1 font-medium text-neutral-700 dark:text-neutral-300", OPERATOR_TYPOGRAPHY.micro)}
                              data-testid={`runs-row-counts-${run.runId}`}
                            >
                              {countsLine}
                            </p>
                          ) : null}
                          <p
                            className={cn("m-0 mt-1", OPERATOR_TYPOGRAPHY.micro)}
                            data-testid={`runs-row-readiness-${run.runId}`}
                          >
                            {props.buyerPolished ? runRowOutputReadinessLineBuyer(run) : runRowOutputReadinessLine(run)}
                          </p>
                        </EnterpriseTableCell>
                        <EnterpriseTableCell
                          className={cn("whitespace-nowrap text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}
                          title={createdLabel}
                        >
                          {displayRelativeCreated(run)}
                        </EnterpriseTableCell>
                        <EnterpriseTableCell className="whitespace-nowrap">
                          <div className="flex flex-col items-start gap-1.5">
                            <Link
                              href={primaryExplore.href}
                              data-testid={`runs-row-primary-explore-${run.runId}`}
                              className={OPERATOR_LINK.nav}
                              onClick={(e) => {
                                e.stopPropagation();
                              }}
                            >
                              {primaryExplore.label}
                            </Link>
                            {!props.buyerPolished && signedManifestExplore !== null ? (
                              <Link
                                href={signedManifestExplore.href}
                                className={OPERATOR_LINK.nav}
                                onClick={(e) => {
                                  e.stopPropagation();
                                }}
                              >
                                {signedManifestExplore.label}
                              </Link>
                            ) : null}
                            {!props.buyerPolished && isRunCommittedForBaseline(run) ? (
                              <RunsRowBaselineMenu runId={run.runId} />
                            ) : null}
                          </div>
                        </EnterpriseTableCell>
                      </EnterpriseTableRow>
                    </RunTableRowErrorBoundary>
                  );
                })}
              </EnterpriseTableBody>
            </EnterpriseTable>
          </section>
        );
      })}
    </>
  );
}
