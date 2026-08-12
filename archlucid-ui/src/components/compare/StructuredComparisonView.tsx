import { cn } from "@/lib/utils";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import type { ReactNode } from "react";

import {
  BUYER_COMPARE_STRUCTURED_HEADING,
  BUYER_COMPARE_STRUCTURED_LEAD,
} from "@/lib/buyer/buyer-polish-copy";
import { decisionKeyDisplay } from "@/lib/compare-decision-key-display";
import { partitionDecisionDeltas } from "@/lib/compare-decision-delta-material";
import { formatCompareCostEstimateCell } from "@/lib/compare-cost-estimate-format";
import { sortGoldenManifestComparison } from "@/lib/compare-display-sort";
import type { DecisionDelta, GoldenManifestComparison } from "@/types/comparison";
import type { RunSummary } from "@/types/authority";

const cellCls = "border border-neutral-200 px-2.5 py-2 text-left align-top dark:border-neutral-700";
const sectionBoxCls = "mt-5 rounded-lg border border-neutral-200 bg-white p-4 dark:border-neutral-700 dark:bg-neutral-950";

function DecisionDeltasTable(props: { rows: DecisionDelta[] }) {
  if (props.rows.length === 0) {
    return null;
  }

  return (
    <table className={cn("mt-2 w-full border-collapse", OPERATOR_TYPOGRAPHY.body)}>
      <thead>
        <tr className="bg-neutral-50/90 dark:bg-neutral-900/50">
          <th className={cellCls}>Decision</th>
          <th className={cellCls}>Baseline</th>
          <th className={cellCls}>Updated</th>
          <th className={cellCls}>Change</th>
        </tr>
      </thead>
      <tbody>
        {props.rows.map((d, i) => (
          <tr key={`${d.decisionKey}-${i}`}>
            <td className={cellCls}>
              <div className="font-medium text-neutral-900 dark:text-neutral-100">
                {d.displayLabel?.trim() ? d.displayLabel.trim() : decisionKeyDisplay(d.decisionKey)}
              </div>
              {d.displayLabel?.trim() ? (
                <details className={cn("mt-1 text-neutral-500 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>
                  <summary className="cursor-pointer select-none">Technical key</summary>
                  <code className={cn("mt-0.5 block font-mono", OPERATOR_TYPOGRAPHY.helper)}>{d.decisionKey}</code>
                </details>
              ) : (
                <div className={cn("mt-0.5 font-mono text-neutral-500 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>
                  {d.decisionKey}
                </div>
              )}
            </td>
            <td className={cellCls}>{d.baseValue ?? "—"}</td>
            <td className={cellCls}>{d.targetValue ?? "—"}</td>
            <td className={cellCls}>{d.changeType}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

/** Card-style collapsible bucket for structured compare output. */
function ComparisonFoldSection(props: {
  title: string;
  countBadge: number;
  defaultOpen: boolean;
  children: ReactNode;
}) {
  return (
    <details className={sectionBoxCls} open={props.defaultOpen}>
      <summary className={cn("cursor-pointer list-none font-semibold text-neutral-900 marker:content-none dark:text-neutral-100 [&::-webkit-details-marker]:hidden", OPERATOR_TYPOGRAPHY.helper)}>
        <span className={cn("mr-2 inline-flex items-center rounded-full bg-neutral-200 px-2 py-0 font-bold text-neutral-800 dark:bg-neutral-800 dark:text-neutral-200", OPERATOR_TYPOGRAPHY.helper)}>
          {props.countBadge}
        </span>
        {props.title}
      </summary>
      <div className="mt-3">{props.children}</div>
    </details>
  );
}

/**
 * Golden-manifest structured comparison: tables and stable column order for operator review.
 */
export function StructuredComparisonView(props: {
  golden: GoldenManifestComparison;
  baselinePickedSummary?: RunSummary | null;
  updatedPickedSummary?: RunSummary | null;
  /** Buyer-polished compare: collapse supplemental fold sections by default (summary stays open when present). */
  buyerCompareUi?: boolean;
  /** Highlights already surfaced in the verdict summary — omit from the fold to avoid duplication. */
  summaryHighlightsForFold?: readonly string[];
}) {
  const golden = sortGoldenManifestComparison(props.golden);
  const foldDefaultOpen = props.buyerCompareUi !== true;
  const summaryHighlights = props.summaryHighlightsForFold ?? golden.summaryHighlights;

  const noMaterialDeltaSections =
    golden.decisionChanges.length === 0 &&
    golden.requirementChanges.length === 0 &&
    golden.securityChanges.length === 0 &&
    golden.topologyChanges.length === 0 &&
    golden.costChanges.length === 0;
  const costFormattedRows = golden.costChanges.map((c) => ({
    base: formatCompareCostEstimateCell(c.baseCost),
    target: formatCompareCostEstimateCell(c.targetCost),
  }));
  const costHasUnitUnknown = costFormattedRows.some((row) => row.base.unitUnknown || row.target.unitUnknown);

  return (
    <section id="compare-structured" className="mt-7">
      <h2 className={cn("mb-2 text-al-text-primary", OPERATOR_TYPOGRAPHY.sectionTitle)}>{BUYER_COMPARE_STRUCTURED_HEADING}</h2>
      <p className={cn("mb-3 font-medium leading-relaxed text-neutral-800 dark:text-neutral-100", OPERATOR_TYPOGRAPHY.body)}>
        {BUYER_COMPARE_STRUCTURED_LEAD}
      </p>
      <p className={cn("mb-4 mt-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
        Export comparison reports from the action bar above when results are loaded.
      </p>

      {summaryHighlights.length > 0 ? (
        <ComparisonFoldSection title="Summary highlights" countBadge={summaryHighlights.length} defaultOpen>
          <ul className="m-0 pl-5 leading-normal">
            {summaryHighlights.map((h, i) => (
              <li key={`highlight-${i}`}>{h}</li>
            ))}
          </ul>
        </ComparisonFoldSection>
      ) : null}

      {noMaterialDeltaSections ? (
        <div
          className={cn("mt-4 rounded-md border border-neutral-200 bg-neutral-50/80 px-3 py-2 text-neutral-800 dark:border-neutral-700 dark:bg-neutral-900/40 dark:text-neutral-200", OPERATOR_TYPOGRAPHY.body)}
          role="status"
          data-testid="compare-no-material-deltas"
        >
          <strong className="font-semibold">No other material changes</strong>
          <span className="text-neutral-600 dark:text-neutral-400">
            {" "}
            — no decision, requirement, security posture, architecture structure, or modeled cost changes in this comparison payload.
          </span>
        </div>
      ) : (
        <div className="grid gap-4 xl:grid-cols-2">
          {golden.decisionChanges.length > 0 ? (
            <ComparisonFoldSection title="Decision changes" countBadge={golden.decisionChanges.length} defaultOpen={foldDefaultOpen}>
              {(() => {
                const { material, metadata } = partitionDecisionDeltas(golden.decisionChanges);

                return (
                  <>
                    {material.length > 0 ? (
                      <div className="space-y-2">
                        <p className={cn("m-0 font-semibold uppercase tracking-wide text-neutral-700 dark:text-neutral-300", OPERATOR_TYPOGRAPHY.helper)}>
                          Material architecture deltas
                        </p>
                        <DecisionDeltasTable rows={material} />
                      </div>
                    ) : null}
                    {metadata.length > 0 ? (
                      <div className={material.length > 0 ? "mt-5 space-y-2 border-t border-neutral-200 pt-4 dark:border-neutral-700" : "space-y-2"}>
                        <p className={cn("m-0 font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>
                          Metadata / bookkeeping
                        </p>
                        <p className={cn("m-0 max-w-prose text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>
                          Identifier, hash, and timestamp fields may move without changing sponsor-facing posture.
                        </p>
                        <DecisionDeltasTable rows={metadata} />
                      </div>
                    ) : null}
                  </>
                );
              })()}
            </ComparisonFoldSection>
          ) : null}

          {golden.requirementChanges.length > 0 ? (
            <ComparisonFoldSection
              title="Requirement changes"
              countBadge={golden.requirementChanges.length}
              defaultOpen={foldDefaultOpen}
            >
              <table className={cn("mt-2 w-full border-collapse", OPERATOR_TYPOGRAPHY.body)}>
                <thead>
                  <tr className="bg-neutral-50/90 dark:bg-neutral-900/50">
                    <th className={cellCls}>Requirement</th>
                    <th className={cellCls}>Change</th>
                  </tr>
                </thead>
                <tbody>
                  {golden.requirementChanges.map((r) => (
                    <tr key={`${r.requirementName}:${r.changeType}`}>
                      <td className={cellCls}>{r.requirementName}</td>
                      <td className={cellCls}>{r.changeType}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </ComparisonFoldSection>
          ) : null}

          {golden.securityChanges.length > 0 ? (
            <ComparisonFoldSection
              title="Finding / posture delta"
              countBadge={golden.securityChanges.length}
              defaultOpen={foldDefaultOpen}
            >
              <table className={cn("mt-2 w-full border-collapse", OPERATOR_TYPOGRAPHY.body)}>
                <thead>
                  <tr className="bg-neutral-50/90 dark:bg-neutral-900/50">
                    <th className={cellCls}>Control</th>
                    <th className={cellCls}>Baseline</th>
                    <th className={cellCls}>Updated</th>
                  </tr>
                </thead>
                <tbody>
                  {golden.securityChanges.map((s, i) => (
                    <tr key={i}>
                      <td className={cellCls}>{s.controlName}</td>
                      <td className={cellCls}>{s.baseStatus ?? "—"}</td>
                      <td className={cellCls}>{s.targetStatus ?? "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </ComparisonFoldSection>
          ) : null}

          {golden.topologyChanges.length > 0 ? (
            <ComparisonFoldSection
              title="Architecture structure / footprint"
              countBadge={golden.topologyChanges.length}
              defaultOpen={foldDefaultOpen}
            >
              <table className={cn("mt-2 w-full border-collapse", OPERATOR_TYPOGRAPHY.body)}>
                <thead>
                  <tr className="bg-neutral-50/90 dark:bg-neutral-900/50">
                    <th className={cellCls}>Resource</th>
                    <th className={cellCls}>Change</th>
                  </tr>
                </thead>
                <tbody>
                  {golden.topologyChanges.map((t) => (
                    <tr key={`${t.resource}:${t.changeType}`}>
                      <td className={cellCls}>{t.resource}</td>
                      <td className={cellCls}>{t.changeType}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </ComparisonFoldSection>
          ) : null}

          {golden.costChanges.length > 0 ? (
            <ComparisonFoldSection
              title="Projected cost impact"
              countBadge={golden.costChanges.length}
              defaultOpen={foldDefaultOpen}
            >
              <table className={cn("mt-2 w-full border-collapse", OPERATOR_TYPOGRAPHY.body)}>
                <thead>
                  <tr className="bg-neutral-50/90 dark:bg-neutral-900/50">
                    <th className={cellCls}>Baseline cost estimate</th>
                    <th className={cellCls}>Updated cost estimate</th>
                  </tr>
                </thead>
                <tbody>
                  {golden.costChanges.map((c, i) => (
                    <tr key={`${String(c.baseCost ?? "n")}-${String(c.targetCost ?? "n")}-${i}`}>
                      <td className={cellCls}>{costFormattedRows[i]?.base.display ?? "—"}</td>
                      <td className={cellCls}>{costFormattedRows[i]?.target.display ?? "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {costHasUnitUnknown ? (
                <p className={cn("mt-2 max-w-prose text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>
                  Numeric values are shown as returned by the comparison payload — currency and billing period were not
                  declared, so no unit is inferred.
                </p>
              ) : null}
              <p className={cn("mt-2 max-w-prose text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>
                Cost estimates are derived from the review pipeline cost model when the payload includes units. Validate
                against your FinOps baseline before using in budget planning.
                Use &ldquo;{props.buyerCompareUi === true ? "Summarize for leadership" : "Summarize for sponsor"}
                &rdquo; to include this delta in an executive narrative.
              </p>
            </ComparisonFoldSection>
          ) : null}
        </div>
      )}
    </section>
  );
}
