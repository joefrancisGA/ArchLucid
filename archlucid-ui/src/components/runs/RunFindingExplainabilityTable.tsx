"use client";

import { cn } from "@/lib/utils";
import { getFindingEvidenceTraceHref } from "@/lib/findings/finding-evidence-navigation";
import { useVirtualizer } from "@tanstack/react-virtual";
import Link from "next/link";
import { useMemo, useRef, useState } from "react";

import { CopyTraceRowWorkItemButton } from "@/components/CopyFindingAsWorkItemButton";
import { AiOutputGovernanceLabel } from "@/components/AiOutputGovernanceLabel";
import { FieldHelpTooltip } from "@/components/FieldHelpTooltip";
import { FindingPolicyRuleBadge } from "@/components/findings/FindingPolicyRuleBadge";
import { ItsmOutboundQuickActions } from "@/components/itsm/ItsmOutboundQuickActions";
import { FindingAiReasoningDialog } from "@/components/findings/FindingAiReasoningDialog";
import { FindingConfidenceBadge } from "@/components/findings/FindingConfidenceBadge";
import { FindingEvidenceLinkChip } from "@/components/usability/FindingEvidenceLinkChip";
import { FindingExplainabilityDialog } from "@/components/findings/FindingExplainabilityDialog";
import { ProductLearningFeedbackControls } from "@/components/ProductLearningFeedbackControls";
import { Button } from "@/components/ui/button";
import { graphTrailHrefWithOptionalNode } from "@/lib/graph-finding-deep-links";
import { preferredGraphNodeIdForFindingDeepLink } from "@/lib/findings/finding-inspect-graph-evidence";
import {
  defaultManifestIdForShowcaseFinding,
  primaryFindingEvidenceNavigationHref,
  runDetailSectionHref,
} from "@/lib/findings/finding-source-evidence-links";
import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { usePrefetchItsmFindingCorrelations } from "@/lib/use-itsm-finding-correlations";
import type { FindingWireSnapshot } from "@/lib/quick-decision-summary-derive";
import type { FindingTraceConfidenceDto } from "@/types/explanation";
import { normalizeFindingConfidenceLevel, traceCompletenessPercent } from "@/types/explanation";

export type RunFindingExplainabilityTableProps = {
  runId: string;
  rows: FindingTraceConfidenceDto[];
  /** Wire snapshots from run detail findings (optional); used for View AI reasoning. */
  findingWireSnapshots?: Record<string, FindingWireSnapshot> | null;
};

function gapsSummary(row: FindingTraceConfidenceDto): string {
  const m = row.missingTraceFields?.filter((s) => s.trim().length > 0) ?? [];

  if (m.length === 0) {
    return " — ";
  }

  if (m.length <= 2) {
    return m.join(", ");
  }

  return `${m[0]}, ${m[1]} +${m.length - 2}`;
}

function confidenceRank(level: FindingTraceConfidenceDto["confidenceLevel"]): number {
  const normalized = normalizeFindingConfidenceLevel(level);

  if (normalized === "High") return 0;

  if (normalized === "Medium") return 1;

  if (normalized === "Low") return 2;

  return 3;
}

function compareFindingConfidenceRows(
  a: FindingTraceConfidenceDto,
  b: FindingTraceConfidenceDto,
  reversed: boolean,
): number {
  const ra = confidenceRank(a.confidenceLevel);
  const rb = confidenceRank(b.confidenceLevel);

  if (ra === 3 && rb === 3) return a.findingId.localeCompare(b.findingId);

  if (ra === 3) return 1;

  if (rb === 3) return -1;

  const primary = reversed ? rb - ra : ra - rb;

  if (primary !== 0) return primary;

  return a.findingId.localeCompare(b.findingId);
}

const rowGridLayout =
  "grid w-full min-w-[46rem] grid-cols-[minmax(10rem,1.4fr)_minmax(6rem,1fr)_4.5rem_minmax(5rem,0.9fr)_4.5rem_minmax(9rem,1fr)_minmax(7rem,1fr)_minmax(11rem,auto)] gap-x-2 border-b border-neutral-100 px-1 py-2 last:border-b-0 dark:border-neutral-800";

function rowGridClassName(extra?: string): string {
  return cn(rowGridLayout, OPERATOR_TYPOGRAPHY.body, extra);
}

/**
 * Lists findings with trace completeness from the aggregate explanation payload; opens per-finding explainability.
 */
export function RunFindingExplainabilityTable({
  runId,
  rows,
  findingWireSnapshots = null,
}: RunFindingExplainabilityTableProps) {
  const [open, setOpen] = useState(false);
  const [activeFindingId, setActiveFindingId] = useState<string | null>(null);
  const [reasoningOpen, setReasoningOpen] = useState(false);
  const [reasoningFindingId, setReasoningFindingId] = useState<string | null>(null);
  const [reasoningTitle, setReasoningTitle] = useState("");
  const [confidenceSortReversed, setConfidenceSortReversed] = useState(false);
  const parentRef = useRef<HTMLDivElement>(null);

  const sortedRows = useMemo(() => {
    const copy = [...rows];
    copy.sort((a, b) => compareFindingConfidenceRows(a, b, confidenceSortReversed));

    return copy;
  }, [rows, confidenceSortReversed]);

  const findingIds = useMemo(
    () => sortedRows.map((row) => row.findingId),
    [sortedRows],
  );
  usePrefetchItsmFindingCorrelations(findingIds);

  const rowVirtualizer = useVirtualizer({
    count: sortedRows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 190,
    overscan: 10,
  });

  const buyerPolishedShell = isBuyerPolishedOperatorShellEnv();

  if (rows.length === 0) {
    return null;
  }

  return (
    <div className="mt-4 rounded-lg border border-neutral-200 bg-neutral-50/80 p-4 dark:border-neutral-700 dark:bg-neutral-900/40">
      <h3 className={cn("m-0 mb-2 text-neutral-900 dark:text-neutral-100", OPERATOR_TYPOGRAPHY.cardTitle)}>
        Per-finding explainability
      </h3>
      <p className={cn("mb-3 text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>
        Open the trace captured for each finding (structured evidence, rules, graph nodes, narrative). Long lists are
        virtualized for smoother scrolling.
      </p>
      <div
        ref={parentRef}
        className="max-h-[min(28rem,70vh)] overflow-auto rounded-lg border border-neutral-200 dark:border-neutral-700"
      >
        <div className={rowGridClassName("sticky top-0 z-[1] bg-neutral-100 font-semibold text-neutral-800 dark:bg-neutral-900/95 dark:text-neutral-200")}>
          <div>Finding</div>
          <div>Rule id</div>
          <div>Refs</div>
          <div>Trace label</div>
          <div>%</div>
          <div className="min-w-0">
            <button
              type="button"
              className="rounded px-1 text-left hover:underline"
              aria-label={
                confidenceSortReversed
                  ? "Sort evaluation confidence: Low to High, absent last"
                  : "Sort evaluation confidence: High to Low, absent last"
              }
              onClick={() => setConfidenceSortReversed((v) => !v)}
            >
              Confidence
              <span aria-hidden className={cn("ml-0.5 font-normal text-neutral-500 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.micro)}>
                {confidenceSortReversed ? "↓" : "↑"}
              </span>
            </button>
          </div>
          <div>Trace gaps</div>
          <div>Action</div>
        </div>
        <div
          className="relative w-full"
          style={{
            height: `${rowVirtualizer.getTotalSize()}px`,
          }}
        >
          {rowVirtualizer.getVirtualItems().map((vi) => {
            const row = sortedRows[vi.index]!;
            const pct = traceCompletenessPercent(row.traceCompletenessRatio) ?? 0;
            const titleFull =
              row.findingTitle !== null &&
              row.findingTitle !== undefined &&
              row.findingTitle.trim().length > 0
                ? row.findingTitle.trim()
                : "(no title)";

            const confidenceLevel = normalizeFindingConfidenceLevel(row.confidenceLevel);

            const confidenceSlot =
              confidenceLevel !== null ? (
                <FindingConfidenceBadge level={confidenceLevel} />
              ) : (
                <span className="text-neutral-400 dark:text-neutral-500">—</span>
              );

            const graphFocusId = preferredGraphNodeIdForFindingDeepLink(runId, row.findingId);
            const manifestId = defaultManifestIdForShowcaseFinding(runId, row.findingId);
            const manifestHref =
              manifestId !== null ? runDetailSectionHref(runId, "manifest-summary") : null;
            const graphHref =
              (typeof row.evidenceRefCount === "number" &&
                Number.isFinite(row.evidenceRefCount) &&
                row.evidenceRefCount > 0) ||
              graphFocusId !== null
                ? graphTrailHrefWithOptionalNode(runId, graphFocusId)
                : null;
            const explainGraphHref =
              primaryFindingEvidenceNavigationHref(
                manifestHref !== null
                  ? [{ kind: "manifestSection", label: "Manifest", detail: null, href: manifestHref }]
                  : graphHref !== null
                    ? [{ kind: "graphNode", label: "Graph", detail: null, href: graphHref }]
                    : [],
              ) ?? graphHref;

            const missingTraceFields =
              row.missingTraceFields?.filter((field) => field.trim().length > 0) ?? [];
            const traceGapsSummary = gapsSummary(row);

            return (
              <div
                key={row.findingId}
                className={rowGridClassName("absolute left-0 top-0 items-start bg-neutral-50/80 dark:bg-neutral-900/30")}
                style={{
                  transform: `translateY(${vi.start}px)`,
                  height: `${vi.size}px`,
                }}
              >
                <div className="min-w-0">
                  <div className={cn("break-all font-mono text-neutral-500 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.micro)}>
                    {row.findingId}
                  </div>
                  <div
                    className={cn("mt-0.5 break-words leading-snug text-neutral-800 dark:text-neutral-200", OPERATOR_TYPOGRAPHY.helper)}
                  >
                    {titleFull}
                  </div>
                  <AiOutputGovernanceLabel findingId={row.findingId} className="mt-1" />
                </div>
                <div className={cn("min-w-0 break-words text-neutral-700 dark:text-neutral-300", OPERATOR_TYPOGRAPHY.helper)}>
                  {row.ruleId && row.ruleId.trim().length > 0 ? (
                    <FindingPolicyRuleBadge policyRuleId={row.ruleId} />
                  ) : (
                    " — "
                  )}
                </div>
                <div className={cn("tabular-nums text-neutral-700 dark:text-neutral-300", OPERATOR_TYPOGRAPHY.helper)}>
                  {explainGraphHref !== null ? (
                    <FindingEvidenceLinkChip
                      href={explainGraphHref}
                      evidenceRefCount={row.evidenceRefCount}
                    />
                  ) : (
                    " — "
                  )}
                </div>
                <div className={cn("min-w-0 text-neutral-700 dark:text-neutral-300", OPERATOR_TYPOGRAPHY.helper)}>{row.traceConfidenceLabel}</div>
                <div className={cn("tabular-nums text-neutral-700 dark:text-neutral-300", OPERATOR_TYPOGRAPHY.helper)}>{pct}</div>
                <div className={cn("min-w-0 text-neutral-700 dark:text-neutral-300", OPERATOR_TYPOGRAPHY.helper)}>{confidenceSlot}</div>
                <div className={cn("min-w-0 text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>
                  {missingTraceFields.length > 2 ? (
                    <span className="inline-flex items-center gap-1">
                      {traceGapsSummary}
                      <FieldHelpTooltip label="Trace gaps" hint={missingTraceFields.join(", ")} />
                    </span>
                  ) : (
                    traceGapsSummary
                  )}
                </div>
                <div className="flex min-w-0 flex-col gap-1.5">
                  <div className="flex min-w-0 flex-wrap gap-1">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className={cn("h-7 px-2", OPERATOR_TYPOGRAPHY.button)}
                      onClick={() => {
                        setActiveFindingId(row.findingId);
                        setOpen(true);
                      }}
                    >
                      View trace
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className={cn("h-7 px-2", OPERATOR_TYPOGRAPHY.button)}
                      onClick={() => {
                        setReasoningFindingId(row.findingId);
                        setReasoningTitle(titleFull === "(no title)" ? "" : titleFull);
                        setReasoningOpen(true);
                      }}
                    >
                      View AI reasoning
                    </Button>
                    <Button type="button" size="sm" variant="outline" className={cn("h-7 px-2", OPERATOR_TYPOGRAPHY.button)} asChild>
                      <Link
                        href={getFindingEvidenceTraceHref(runId, row.findingId)}
                        prefetch={false}
                      >
                        Why?
                      </Link>
                    </Button>
                    <Button type="button" size="sm" variant="outline" className={cn("h-7 px-2", OPERATOR_TYPOGRAPHY.button)} asChild>
                      <Link
                        href={`/architecture/reviews/${encodeURIComponent(runId)}/findings/${encodeURIComponent(row.findingId)}`}
                        prefetch={false}
                      >
                        Explain
                      </Link>
                    </Button>
                  </div>
                  <CopyTraceRowWorkItemButton row={row} runId={runId} />
                  <ItsmOutboundQuickActions findingId={row.findingId} compact />
                  {!buyerPolishedShell ? (
                    <ProductLearningFeedbackControls
                      runId={runId}
                      subjectType="Finding"
                      artifactHint={`finding:${row.findingId}`}
                      patternKey={row.ruleId ? `finding-rule:${row.ruleId}` : "finding"}
                      detail={{
                        findingId: row.findingId,
                        title: row.findingTitle,
                        traceCompletenessRatio: row.traceCompletenessRatio,
                      }}
                      compact
                      title="Useful?"
                    />
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <FindingExplainabilityDialog
        open={open}
        onOpenChange={(next) => {
          setOpen(next);

          if (!next) {
            setActiveFindingId(null);
          }
        }}
        runId={runId}
        findingId={activeFindingId}
      />

      <FindingAiReasoningDialog
        open={reasoningOpen}
        onOpenChange={(next) => {
          setReasoningOpen(next);

          if (!next) {
            setReasoningFindingId(null);
            setReasoningTitle("");
          }
        }}
        findingId={reasoningFindingId}
        findingTitle={reasoningTitle}
        snapshot={
          reasoningFindingId !== null &&
          findingWireSnapshots !== null &&
          findingWireSnapshots !== undefined
            ? findingWireSnapshots[reasoningFindingId] ?? null
            : null
        }
      />
    </div>
  );
}
