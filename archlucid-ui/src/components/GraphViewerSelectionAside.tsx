"use client";

import Link from "next/link";
import { Fragment } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { GraphNodeKindLegendChips } from "@/components/GraphNodeKindLegendChips";
import { ReasoningTraceReadMore } from "@/components/ReasoningTraceReadMore";
import { canonicalizeDemoRunId } from "@/lib/demo-run-canonical";
import {
  BUYER_EVIDENCE_GRAPH_TECHNICAL_APPENDIX_HELPER,
  BUYER_TECHNICAL_APPENDIX_LABEL,
  BUYER_VIEW_SIGNED_RECORD_CTA,
} from "@/lib/buyer/buyer-polish-copy";
import { getShowcaseManifestHref } from "@/lib/buyer/buyer-safe-review-navigation";
import { fetchProvenanceNodeExplanationViaProxy } from "@/lib/fetch-provenance-node-explanation";
import {
  findingIdForGraphDeepLink,
  graphFindingDetailHref,
} from "@/lib/graph-finding-deep-links";
import {
  graphBuyerTrailDispositionLine,
  graphBuyerTrailMetadataLines,
  graphBuyerTrailPanelTitle,
  graphBuyerTrailRecordTypeLine,
  visibleBuyerTrailTechnicalAppendixLines,
} from "@/lib/graph-buyer-node-detail";
import { signedRecordDetailPath } from "@/lib/signed-records-paths";
import {
  BUYER_COMPARE_OPEN_SIGNED_REVIEW_RECORD_CTA,
  BUYER_EVIDENCE_GRAPH_OPEN_DECISION_RECORD_CTA,
  BUYER_EVIDENCE_GRAPH_OPEN_FINDING_DETAIL_CTA,
} from "@/lib/buyer/buyer-polish-copy";
import {
  OPERATOR_CALLOUT_WARN_CLASS,
  OPERATOR_DISCLOSURE_TRIGGER_CLASS,
  OPERATOR_LINK,
  OPERATOR_NAV_GROUP_LABEL,
  OPERATOR_TYPOGRAPHY,
} from "@/lib/design-tokens";
import { cn } from "@/lib/utils";
import type { GraphEdgeVm, GraphNodeVm } from "@/types/graph";

export type GraphViewerSelectionAsideProps = {
  readonly buyerTrailPanel: boolean;
  readonly compactChrome: boolean;
  readonly interactiveSurfaceReady: boolean;
  readonly isAdvanced: boolean;
  readonly onToggleAdvanced: () => void;
  readonly edgeInferenceThreshold: string;
  readonly onEdgeInferenceThresholdChange: (value: string) => void;
  readonly selectedEdge: GraphEdgeVm | null;
  readonly selectedNode: GraphNodeVm | null;
  readonly selectionBreadcrumb: readonly string[];
  readonly runId: string;
  readonly explainStatusLine: string;
  readonly onExplainStatusLineChange: (value: string) => void;
  readonly explainAggregateHref: string | null;
  readonly onExplainAggregateHrefChange: (value: string | null) => void;
};

export function GraphViewerSelectionAside({
  buyerTrailPanel,
  compactChrome,
  interactiveSurfaceReady,
  isAdvanced,
  onToggleAdvanced,
  edgeInferenceThreshold,
  onEdgeInferenceThresholdChange,
  selectedEdge,
  selectedNode,
  selectionBreadcrumb,
  runId,
  explainStatusLine,
  onExplainStatusLineChange,
  explainAggregateHref,
  onExplainAggregateHrefChange,
}: GraphViewerSelectionAsideProps): React.ReactElement {
  return (
    <aside
      aria-label="Graph settings and selection details"
      className={
        buyerTrailPanel
          ? "max-h-[min(88vh,960px)] flex min-h-[520px] flex-col gap-4 overflow-auto rounded-lg border border-neutral-200 bg-white p-4 dark:border-neutral-700 dark:bg-neutral-950"
          : compactChrome
            ? "max-h-[min(55vh,520px)] flex flex-col gap-4 overflow-auto rounded-lg border border-neutral-200 bg-white p-4 dark:border-neutral-700 dark:bg-neutral-950 lg:max-h-[min(55vh,520px)]"
            : "max-h-[70vh] flex flex-col gap-4 overflow-auto rounded-lg border border-neutral-200 bg-white p-4 dark:border-neutral-700 dark:bg-neutral-950"
      }
    >
      {interactiveSurfaceReady ? (
        <div
          className={cn(
            "rounded-md border border-slate-200 bg-slate-50/90 p-3 dark:border-slate-700 dark:bg-slate-900/40",
            OPERATOR_TYPOGRAPHY.body,
          )}
          data-testid="graph-canvas-legend"
        >
          <GraphNodeKindLegendChips />
        </div>
      ) : null}
      {!buyerTrailPanel && !compactChrome ? (
        <div>
          <div className="mb-4 flex items-center justify-between">
            <h3 className="m-0">Graph Settings</h3>
            <div className="flex items-center gap-1">
              <Button
                type="button"
                variant={isAdvanced ? "outline" : "default"}
                size="sm"
                className={cn("h-7 px-2", OPERATOR_TYPOGRAPHY.button)}
                onClick={() => {
                  if (isAdvanced) {
                    onToggleAdvanced();
                  }
                }}
              >
                Basic
              </Button>
              <Button
                type="button"
                variant={isAdvanced ? "default" : "outline"}
                size="sm"
                className={cn("h-7 px-2", OPERATOR_TYPOGRAPHY.button)}
                onClick={() => {
                  if (!isAdvanced) {
                    onToggleAdvanced();
                  }
                }}
              >
                Advanced
              </Button>
            </div>
          </div>

          {isAdvanced ? (
            <div className="space-y-2 rounded-md border border-neutral-200 bg-neutral-50 p-3 dark:border-neutral-800 dark:bg-neutral-900/50">
              <Label htmlFor="edge-inference-threshold" className={OPERATOR_TYPOGRAPHY.helper}>
                Edge Inference Threshold
              </Label>
              <Input
                id="edge-inference-threshold"
                type="number"
                step="0.05"
                min="0"
                max="1"
                value={edgeInferenceThreshold}
                onChange={(event) => onEdgeInferenceThresholdChange(event.target.value)}
                className={cn("h-8", OPERATOR_TYPOGRAPHY.body)}
              />
              <p className={cn("text-neutral-500", OPERATOR_TYPOGRAPHY.helper)}>
                Minimum confidence score required to render inferred edges between nodes.
              </p>
            </div>
          ) : null}
        </div>
      ) : null}

      <div className="flex-1">
        {!selectedEdge && !selectedNode && !interactiveSurfaceReady ? (
          <p className={cn("text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.body)}>Rendering graph…</p>
        ) : null}

        {!selectedEdge && !selectedNode && interactiveSurfaceReady && !buyerTrailPanel ? (
          <p>Select a node or inferred edge on the canvas to inspect reasoning and metadata.</p>
        ) : null}

        {!selectedEdge && !selectedNode && interactiveSurfaceReady && buyerTrailPanel ? (
          <p className={cn("text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.body)}>
            Select a node or edge on the canvas to see technical details.
          </p>
        ) : null}

        {selectedEdge ? (
          <div className="space-y-3">
            <h3 className="mt-0">Edge detail</h3>
            {!buyerTrailPanel ? (
              <>
                {selectedEdge.id !== undefined &&
                selectedEdge.id !== null &&
                String(selectedEdge.id).trim().length > 0 ? (
                  <p className="m-0">
                    <strong>ID:</strong> {String(selectedEdge.id)}
                  </p>
                ) : null}
                <p className="m-0">
                  <strong>From:</strong> {selectedEdge.source}
                </p>
                <p className="m-0">
                  <strong>To:</strong> {selectedEdge.target}
                </p>
                <p className="m-0">
                  <strong>Relationship:</strong> {selectedEdge.type}
                </p>
                {selectedEdge.label !== undefined &&
                selectedEdge.label !== null &&
                String(selectedEdge.label).trim().length > 0 ? (
                  <p className="m-0">
                    <strong>Label:</strong> {String(selectedEdge.label)}
                  </p>
                ) : null}
                {selectedEdge.inferenceSource !== undefined &&
                selectedEdge.inferenceSource !== null &&
                selectedEdge.inferenceSource.trim().length > 0 ? (
                  <p className="m-0">
                    <strong>Inference rule:</strong> {selectedEdge.inferenceSource.trim()}
                  </p>
                ) : null}
              </>
            ) : (
              <p className={cn("text-neutral-700 dark:text-neutral-300", OPERATOR_TYPOGRAPHY.body)}>
                <strong>Edge:</strong> {selectedEdge.source} → {selectedEdge.target} ({selectedEdge.type})
              </p>
            )}
            {selectedEdge.reasoningTrace !== undefined &&
            selectedEdge.reasoningTrace !== null &&
            selectedEdge.reasoningTrace.trim().length > 0 ? (
              <div className="border-t border-neutral-200 pt-3 dark:border-neutral-700">
                <ReasoningTraceReadMore heading="Reasoning trace" trace={selectedEdge.reasoningTrace} />
              </div>
            ) : (
              !buyerTrailPanel && (
                <p className={cn("m-0 text-neutral-500 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>
                  No reasoning narration was persisted for this edge.
                </p>
              )
            )}
          </div>
        ) : null}

        {selectedNode ? (
          <>
            {buyerTrailPanel ? (
              <div className="space-y-3">
                {selectionBreadcrumb.length > 0 ? (
                  <p
                    className={cn("m-0 text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}
                    data-testid="graph-selection-breadcrumb"
                    aria-label="Path context for selected node"
                  >
                    {selectionBreadcrumb.join(" → ")}
                  </p>
                ) : null}
                <h3 className={cn("m-0", OPERATOR_TYPOGRAPHY.sectionTitle)}>
                  {graphBuyerTrailPanelTitle(selectedNode)}
                </h3>
                {(() => {
                  const recordType = graphBuyerTrailRecordTypeLine(selectedNode);

                  return recordType.secondary !== null ? (
                    <p className={cn("m-0", OPERATOR_TYPOGRAPHY.body)}>
                      <span className="font-semibold text-neutral-800 dark:text-neutral-200">
                        {recordType.secondary.label}:
                      </span>{" "}
                      <span className="text-neutral-600 dark:text-neutral-400">{recordType.secondary.value}</span>
                    </p>
                  ) : null;
                })()}
              </div>
            ) : (
              <>
                <h3 className="mt-0">Node detail</h3>
                <p>
                  <strong>ID:</strong> {selectedNode.id}
                </p>
                <p>
                  <strong>Label:</strong> {selectedNode.label}
                </p>
              </>
            )}

            {!buyerTrailPanel ? (
              <p>
                <strong>Type:</strong> {selectedNode.type}
              </p>
            ) : null}

            {buyerTrailPanel
              ? (() => {
                  const dispositionLine = graphBuyerTrailDispositionLine(
                    selectedNode.type,
                    selectedNode.metadata,
                  );

                  if (dispositionLine === null) {
                    return null;
                  }

                  return (
                    <p className={cn("m-0 mt-2 rounded-md border leading-snug", OPERATOR_CALLOUT_WARN_CLASS, OPERATOR_TYPOGRAPHY.body)}>
                      <span className="font-semibold text-neutral-900 dark:text-neutral-100">Decision:</span>{" "}
                      {dispositionLine}
                    </p>
                  );
                })()
              : null}

            {buyerTrailPanel && runId.trim().length > 0 && selectedNode.type === "GoldenManifest" ? (
              <div className="mt-3 flex flex-col gap-2">
                <Button type="button" variant="default" size="sm" className="h-9 w-full justify-center" asChild>
                  <Link href={signedRecordDetailPath(selectedNode.id.trim())}>
                    {BUYER_COMPARE_OPEN_SIGNED_REVIEW_RECORD_CTA}
                  </Link>
                </Button>
              </div>
            ) : null}

            {buyerTrailPanel && runId.trim().length > 0 && selectedNode.type === "Decision" ? (
              <div className="mt-3 flex flex-col gap-2">
                <Button type="button" variant="outline" size="sm" className="h-9 w-full justify-center" asChild>
                  <Link
                    href={`/architecture/reviews/${encodeURIComponent(canonicalizeDemoRunId(runId.trim()))}#run-explanation`}
                  >
                    {BUYER_EVIDENCE_GRAPH_OPEN_DECISION_RECORD_CTA}
                  </Link>
                </Button>
              </div>
            ) : null}

            {buyerTrailPanel && runId.trim().length > 0 && selectedNode.type === "Finding" ? (
              <div className="mt-3 flex flex-col gap-2">
                {(() => {
                  const fid = findingIdForGraphDeepLink(selectedNode);

                  if (fid === null) {
                    return (
                      <p className={cn("m-0 text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>
                        Finding-level pages need a persisted finding reference on this node.
                      </p>
                    );
                  }

                  const rid = canonicalizeDemoRunId(runId.trim());

                  return (
                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                      <Button type="button" variant="default" size="sm" className="h-9 w-full justify-center" asChild>
                        <Link href={getShowcaseManifestHref()}>{BUYER_VIEW_SIGNED_RECORD_CTA}</Link>
                      </Button>
                      <Button type="button" variant="outline" size="sm" className="h-9 w-full justify-center" asChild>
                        <Link href={graphFindingDetailHref(rid, fid)}>{BUYER_EVIDENCE_GRAPH_OPEN_FINDING_DETAIL_CTA}</Link>
                      </Button>
                    </div>
                  );
                })()}
              </div>
            ) : null}

            {!buyerTrailPanel ? (
              <>
                <h4>Metadata</h4>
                {selectedNode.metadata && Object.keys(selectedNode.metadata).length > 0 ? (
                  <ul>
                    {Object.entries(selectedNode.metadata).map(([key, value]) => (
                      <li key={key}>
                        <strong>{key}:</strong> {String(value)}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p>No metadata available.</p>
                )}
              </>
            ) : selectedNode.metadata && Object.keys(selectedNode.metadata).length > 0 ? (
              (() => {
                const { summaryLines, technicalLines } = graphBuyerTrailMetadataLines(selectedNode.metadata);
                const appendixLines = visibleBuyerTrailTechnicalAppendixLines(technicalLines);

                return (
                  <>
                    {summaryLines.length > 0 ? (
                      <div className="rounded-md border border-neutral-200 bg-al-surface-raised dark:border-neutral-800 p-3">
                        <p className={cn("m-0 font-semibold text-teal-700 dark:text-teal-400", OPERATOR_NAV_GROUP_LABEL)}>
                          At a glance
                        </p>
                        <dl
                          className={cn(
                            "m-0 mt-2 grid grid-cols-[minmax(7.5rem,auto)_1fr] items-start gap-x-3 gap-y-2",
                            OPERATOR_TYPOGRAPHY.helper,
                          )}
                          data-testid="graph-at-a-glance-summary"
                        >
                          {summaryLines.map((row, index) => (
                            <Fragment key={`${row.label}-${index}`}>
                              <dt className="font-semibold text-neutral-600 dark:text-neutral-400">{row.label}</dt>
                              <dd className="m-0 min-w-0 leading-snug text-neutral-800 dark:text-neutral-200">
                                {row.value}
                              </dd>
                            </Fragment>
                          ))}
                        </dl>
                      </div>
                    ) : null}
                    {appendixLines.length > 0 ? (
                      <details className="mt-2 rounded-md border border-neutral-200 bg-neutral-50/80 dark:border-neutral-700 dark:bg-neutral-900/50">
                        <summary className={cn(
                          "cursor-pointer select-none px-3 py-2 font-semibold text-neutral-800 dark:text-neutral-200",
                          OPERATOR_DISCLOSURE_TRIGGER_CLASS,
                        )}>
                          {BUYER_TECHNICAL_APPENDIX_LABEL}
                        </summary>
                        <p className={cn("m-0 px-3 pt-2 text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>
                          {BUYER_EVIDENCE_GRAPH_TECHNICAL_APPENDIX_HELPER}
                        </p>
                        <ul className={cn("m-0 list-none space-y-1 px-3 pb-3 pt-2", OPERATOR_TYPOGRAPHY.helper)}>
                          {appendixLines.map((row) => (
                            <li key={`${row.label}-${row.value}`}>
                              <span className="font-medium text-neutral-700 dark:text-neutral-300">{row.label}:</span>{" "}
                              <span className="break-all text-neutral-600 dark:text-neutral-400">{row.value}</span>
                            </li>
                          ))}
                        </ul>
                      </details>
                    ) : null}
                  </>
                );
              })()
            ) : null}

            {selectedNode.reasoningTrace !== undefined &&
            selectedNode.reasoningTrace !== null &&
            selectedNode.reasoningTrace.trim().length > 0 ? (
              <div className="mt-3 border-t border-neutral-200 pt-3 dark:border-neutral-700">
                <ReasoningTraceReadMore heading="Reasoning trace" trace={selectedNode.reasoningTrace} />
              </div>
            ) : null}

            {runId.trim().length > 0 && selectedNode !== null && !buyerTrailPanel && !compactChrome ? (
              <div className="mt-3 border-t border-neutral-200 pt-3 dark:border-neutral-700">
                <h4 className="mt-0">Explain this node</h4>
                <p className={cn("text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>
                  Per-node summaries are not supported. The API returns guidance and a link to the run-level aggregate
                  explanation (Standard tier).
                </p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-8"
                  onClick={async () => {
                    const result = await fetchProvenanceNodeExplanationViaProxy(runId.trim(), selectedNode.id);
                    onExplainStatusLineChange(result.message);
                    onExplainAggregateHrefChange(result.aggregateProxyHref);
                  }}
                >
                  Request explanation
                </Button>
                {explainStatusLine ? (
                  <p className={cn("mt-2 text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)} aria-live="polite">
                    {explainStatusLine}
                  </p>
                ) : null}
                {explainAggregateHref ? (
                  <p className={cn("mt-1", OPERATOR_TYPOGRAPHY.helper)}>
                    <a
                      className={OPERATOR_LINK.nav}
                      href={explainAggregateHref}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Open review-level summary
                    </a>
                  </p>
                ) : null}
              </div>
            ) : null}
          </>
        ) : null}
      </div>
    </aside>
  );
}
