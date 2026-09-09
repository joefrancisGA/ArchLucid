"use client";

import { cn } from "@/lib/utils";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import type { ReactNode } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import {
  EnterpriseTable,
  EnterpriseTableBody,
  EnterpriseTableCell,
  EnterpriseTableHead,
  EnterpriseTableHeadRow,
  EnterpriseTableHeaderCell,
  EnterpriseTableRow,
} from "@/components/ui/enterprise-table";
import { DisclosureTriangleIndicator } from "@/components/DisclosureTriangleIndicator";
import {
  BUYER_COMPARE_STRUCTURED_HEADING,
  BUYER_COMPARE_STRUCTURED_LEAD,
} from "@/lib/buyer/buyer-polish-copy";
import {
  COMPARE_DECISION_TECHNICAL_KEY_PARAM,
  compareDecisionTechnicalDisclosureHrefFromSearch,
  parseCompareDecisionTechnicalKeyFromSearch,
} from "@/lib/compare/compare-decision-technical-disclosure-url";
import {
  COMPARE_STRUCTURED_SECTION_KEY_PARAM,
  compareStructuredSectionDisclosureHrefFromSearch,
  parseCompareStructuredSectionKeyFromSearch,
} from "@/lib/compare/compare-structured-section-disclosure-url";
import { decisionKeyDisplay } from "@/lib/compare-decision-key-display";
import { partitionDecisionDeltas } from "@/lib/compare-decision-delta-material";
import { formatCompareCostEstimateCell } from "@/lib/compare-cost-estimate-format";
import { sortGoldenManifestComparison } from "@/lib/compare-display-sort";
import type { DecisionDelta, GoldenManifestComparison } from "@/types/comparison";
import type { RunSummary } from "@/types/authority";

const cellCls = "border border-neutral-200 px-2.5 py-2 text-left align-top dark:border-neutral-700";
const sectionBoxCls = "mt-5 rounded-lg border border-neutral-200 bg-white p-4 dark:border-neutral-700 dark:bg-neutral-950";

const COMPARE_STRUCTURED_SECTION_KEYS = {
  summaryHighlights: "summary-highlights",
  decisionChanges: "decision-changes",
  requirementChanges: "requirement-changes",
  findingPostureDelta: "finding-posture-delta",
  architectureStructureFootprint: "architecture-structure-footprint",
  projectedCostImpact: "projected-cost-impact",
} as const;

function DecisionDeltasTable(props: {
  rows: DecisionDelta[];
  openTechnicalKey: string;
  onTechnicalKeyOpenChange: (decisionKey: string | null) => void;
}) {
  if (props.rows.length === 0) {
    return null;
  }

  return (
    <EnterpriseTable ariaLabel="Decision comparison deltas" className={cn("mt-2", OPERATOR_TYPOGRAPHY.body)}>
      <EnterpriseTableHead>
        <EnterpriseTableHeadRow className="bg-neutral-50/90 dark:bg-neutral-900/50">
          <EnterpriseTableHeaderCell className={cellCls}>Decision</EnterpriseTableHeaderCell>
          <EnterpriseTableHeaderCell className={cellCls}>Baseline</EnterpriseTableHeaderCell>
          <EnterpriseTableHeaderCell className={cellCls}>Updated</EnterpriseTableHeaderCell>
          <EnterpriseTableHeaderCell className={cellCls}>Change</EnterpriseTableHeaderCell>
        </EnterpriseTableHeadRow>
      </EnterpriseTableHead>
      <EnterpriseTableBody>
        {props.rows.map((d, i) => (
          <EnterpriseTableRow key={`${d.decisionKey}-${i}`}>
            <EnterpriseTableCell className={cellCls}>
              <div className="font-medium text-neutral-900 dark:text-neutral-100">
                {d.displayLabel?.trim() ? d.displayLabel.trim() : decisionKeyDisplay(d.decisionKey)}
              </div>
              {d.displayLabel?.trim() ? (
                <details
                  className={cn("mt-1 text-neutral-500 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}
                  open={props.openTechnicalKey === d.decisionKey}
                  onToggle={(event) =>
                    props.onTechnicalKeyOpenChange(event.currentTarget.open ? d.decisionKey : null)
                  }
                >
                  <summary className="cursor-pointer select-none">Technical key</summary>
                  <code className={cn("mt-0.5 block font-mono", OPERATOR_TYPOGRAPHY.helper)}>{d.decisionKey}</code>
                </details>
              ) : (
                <div className={cn("mt-0.5 font-mono text-neutral-500 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>
                  {d.decisionKey}
                </div>
              )}
            </EnterpriseTableCell>
            <EnterpriseTableCell className={cellCls}>{d.baseValue ?? " — "}</EnterpriseTableCell>
            <EnterpriseTableCell className={cellCls}>{d.targetValue ?? " — "}</EnterpriseTableCell>
            <EnterpriseTableCell className={cellCls}>{d.changeType}</EnterpriseTableCell>
          </EnterpriseTableRow>
        ))}
      </EnterpriseTableBody>
    </EnterpriseTable>
  );
}

/** Card-style collapsible bucket for structured compare output. */
function ComparisonFoldSection(props: {
  title: string;
  countBadge: number;
  sectionKey: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: ReactNode;
}) {
  return (
    <details
      className={cn(sectionBoxCls, "group")}
      open={props.open}
      onToggle={(event) => props.onOpenChange(event.currentTarget.open)}
    >
      <summary className={cn("flex cursor-pointer list-none items-center gap-2 font-semibold text-neutral-900 marker:content-none dark:text-neutral-100 [&::-webkit-details-marker]:hidden", OPERATOR_TYPOGRAPHY.helper)}>
        <DisclosureTriangleIndicator />
        <span className={cn("inline-flex items-center rounded-full bg-neutral-200 px-2 py-0 font-bold text-neutral-800 dark:bg-neutral-800 dark:text-neutral-200", OPERATOR_TYPOGRAPHY.helper)}>
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
  const router = useRouter();
  const pathname = usePathname() ?? "/";
  const searchParams = useSearchParams();
  const compareDecisionTechnicalKeyParam = searchParams.get(COMPARE_DECISION_TECHNICAL_KEY_PARAM);
  const compareStructuredSectionKeyParam = searchParams.get(COMPARE_STRUCTURED_SECTION_KEY_PARAM);
  const [openTechnicalKey, setOpenTechnicalKeyState] = useState(() =>
    parseCompareDecisionTechnicalKeyFromSearch(compareDecisionTechnicalKeyParam),
  );
  const [openStructuredSectionKey, setOpenStructuredSectionKeyState] = useState(() =>
    parseCompareStructuredSectionKeyFromSearch(compareStructuredSectionKeyParam),
  );
  const syncOpenTechnicalKeyToUrl = useCallback(
    (decisionKey: string | null) => {
      router.replace(
        compareDecisionTechnicalDisclosureHrefFromSearch(searchParams.toString(), decisionKey, pathname),
        { scroll: false },
      );
    },
    [pathname, router, searchParams],
  );
  const setOpenTechnicalKey = useCallback(
    (decisionKey: string | null) => {
      setOpenTechnicalKeyState(decisionKey ?? "");
      syncOpenTechnicalKeyToUrl(decisionKey);
    },
    [syncOpenTechnicalKeyToUrl],
  );
  const syncOpenStructuredSectionKeyToUrl = useCallback(
    (sectionKey: string | null) => {
      router.replace(
        compareStructuredSectionDisclosureHrefFromSearch(searchParams.toString(), sectionKey, pathname),
        { scroll: false },
      );
    },
    [pathname, router, searchParams],
  );
  const setOpenStructuredSectionKey = useCallback(
    (sectionKey: string | null) => {
      setOpenStructuredSectionKeyState(sectionKey ?? "");
      syncOpenStructuredSectionKeyToUrl(sectionKey);
    },
    [syncOpenStructuredSectionKeyToUrl],
  );
  const golden = sortGoldenManifestComparison(props.golden);
  const foldDefaultOpen = props.buyerCompareUi !== true;
  const summaryHighlights = props.summaryHighlightsForFold ?? golden.summaryHighlights;

  const isStructuredSectionOpen = useCallback(
    (sectionKey: string, defaultOpen: boolean) => {
      if (openStructuredSectionKey.length > 0) {
        return openStructuredSectionKey === sectionKey;
      }

      return defaultOpen;
    },
    [openStructuredSectionKey],
  );

  useEffect(() => {
    setOpenTechnicalKeyState(parseCompareDecisionTechnicalKeyFromSearch(compareDecisionTechnicalKeyParam));
  }, [compareDecisionTechnicalKeyParam]);

  useEffect(() => {
    setOpenStructuredSectionKeyState(parseCompareStructuredSectionKeyFromSearch(compareStructuredSectionKeyParam));
  }, [compareStructuredSectionKeyParam]);

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
        <ComparisonFoldSection
          title="Summary highlights"
          countBadge={summaryHighlights.length}
          sectionKey={COMPARE_STRUCTURED_SECTION_KEYS.summaryHighlights}
          open={isStructuredSectionOpen(COMPARE_STRUCTURED_SECTION_KEYS.summaryHighlights, true)}
          onOpenChange={(open) =>
            setOpenStructuredSectionKey(open ? COMPARE_STRUCTURED_SECTION_KEYS.summaryHighlights : null)
          }
        >
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
            <ComparisonFoldSection
              title="Decision changes"
              countBadge={golden.decisionChanges.length}
              sectionKey={COMPARE_STRUCTURED_SECTION_KEYS.decisionChanges}
              open={isStructuredSectionOpen(COMPARE_STRUCTURED_SECTION_KEYS.decisionChanges, foldDefaultOpen)}
              onOpenChange={(open) =>
                setOpenStructuredSectionKey(open ? COMPARE_STRUCTURED_SECTION_KEYS.decisionChanges : null)
              }
            >
              {(() => {
                const { material, metadata } = partitionDecisionDeltas(golden.decisionChanges);

                return (
                  <>
                    {material.length > 0 ? (
                      <div className="space-y-2">
                        <p className={cn("m-0 font-semibold uppercase tracking-wide text-neutral-700 dark:text-neutral-300", OPERATOR_TYPOGRAPHY.helper)}>
                          Material architecture deltas
                        </p>
                        <DecisionDeltasTable
                          rows={material}
                          openTechnicalKey={openTechnicalKey}
                          onTechnicalKeyOpenChange={setOpenTechnicalKey}
                        />
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
                        <DecisionDeltasTable
                          rows={metadata}
                          openTechnicalKey={openTechnicalKey}
                          onTechnicalKeyOpenChange={setOpenTechnicalKey}
                        />
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
              sectionKey={COMPARE_STRUCTURED_SECTION_KEYS.requirementChanges}
              open={isStructuredSectionOpen(COMPARE_STRUCTURED_SECTION_KEYS.requirementChanges, foldDefaultOpen)}
              onOpenChange={(open) =>
                setOpenStructuredSectionKey(open ? COMPARE_STRUCTURED_SECTION_KEYS.requirementChanges : null)
              }
            >
              <EnterpriseTable ariaLabel="Requirement changes" className={cn("mt-2", OPERATOR_TYPOGRAPHY.body)}>
                <EnterpriseTableHead>
                  <EnterpriseTableHeadRow className="bg-neutral-50/90 dark:bg-neutral-900/50">
                    <EnterpriseTableHeaderCell className={cellCls}>Requirement</EnterpriseTableHeaderCell>
                    <EnterpriseTableHeaderCell className={cellCls}>Change</EnterpriseTableHeaderCell>
                  </EnterpriseTableHeadRow>
                </EnterpriseTableHead>
                <EnterpriseTableBody>
                  {golden.requirementChanges.map((r) => (
                    <EnterpriseTableRow key={`${r.requirementName}:${r.changeType}`}>
                      <EnterpriseTableCell className={cellCls}>{r.requirementName}</EnterpriseTableCell>
                      <EnterpriseTableCell className={cellCls}>{r.changeType}</EnterpriseTableCell>
                    </EnterpriseTableRow>
                  ))}
                </EnterpriseTableBody>
              </EnterpriseTable>
            </ComparisonFoldSection>
          ) : null}

          {golden.securityChanges.length > 0 ? (
            <ComparisonFoldSection
              title="Finding / posture delta"
              countBadge={golden.securityChanges.length}
              sectionKey={COMPARE_STRUCTURED_SECTION_KEYS.findingPostureDelta}
              open={isStructuredSectionOpen(COMPARE_STRUCTURED_SECTION_KEYS.findingPostureDelta, foldDefaultOpen)}
              onOpenChange={(open) =>
                setOpenStructuredSectionKey(open ? COMPARE_STRUCTURED_SECTION_KEYS.findingPostureDelta : null)
              }
            >
              <EnterpriseTable ariaLabel="Finding and posture deltas" className={cn("mt-2", OPERATOR_TYPOGRAPHY.body)}>
                <EnterpriseTableHead>
                  <EnterpriseTableHeadRow className="bg-neutral-50/90 dark:bg-neutral-900/50">
                    <EnterpriseTableHeaderCell className={cellCls}>Control</EnterpriseTableHeaderCell>
                    <EnterpriseTableHeaderCell className={cellCls}>Baseline</EnterpriseTableHeaderCell>
                    <EnterpriseTableHeaderCell className={cellCls}>Updated</EnterpriseTableHeaderCell>
                  </EnterpriseTableHeadRow>
                </EnterpriseTableHead>
                <EnterpriseTableBody>
                  {golden.securityChanges.map((s, i) => (
                    <EnterpriseTableRow key={i}>
                      <EnterpriseTableCell className={cellCls}>{s.controlName}</EnterpriseTableCell>
                      <EnterpriseTableCell className={cellCls}>{s.baseStatus ?? " — "}</EnterpriseTableCell>
                      <EnterpriseTableCell className={cellCls}>{s.targetStatus ?? " — "}</EnterpriseTableCell>
                    </EnterpriseTableRow>
                  ))}
                </EnterpriseTableBody>
              </EnterpriseTable>
            </ComparisonFoldSection>
          ) : null}

          {golden.topologyChanges.length > 0 ? (
            <ComparisonFoldSection
              title="Architecture structure / footprint"
              countBadge={golden.topologyChanges.length}
              sectionKey={COMPARE_STRUCTURED_SECTION_KEYS.architectureStructureFootprint}
              open={isStructuredSectionOpen(
                COMPARE_STRUCTURED_SECTION_KEYS.architectureStructureFootprint,
                foldDefaultOpen,
              )}
              onOpenChange={(open) =>
                setOpenStructuredSectionKey(open ? COMPARE_STRUCTURED_SECTION_KEYS.architectureStructureFootprint : null)
              }
            >
              <EnterpriseTable ariaLabel="Architecture structure changes" className={cn("mt-2", OPERATOR_TYPOGRAPHY.body)}>
                <EnterpriseTableHead>
                  <EnterpriseTableHeadRow className="bg-neutral-50/90 dark:bg-neutral-900/50">
                    <EnterpriseTableHeaderCell className={cellCls}>Resource</EnterpriseTableHeaderCell>
                    <EnterpriseTableHeaderCell className={cellCls}>Change</EnterpriseTableHeaderCell>
                  </EnterpriseTableHeadRow>
                </EnterpriseTableHead>
                <EnterpriseTableBody>
                  {golden.topologyChanges.map((t) => (
                    <EnterpriseTableRow key={`${t.resource}:${t.changeType}`}>
                      <EnterpriseTableCell className={cellCls}>{t.resource}</EnterpriseTableCell>
                      <EnterpriseTableCell className={cellCls}>{t.changeType}</EnterpriseTableCell>
                    </EnterpriseTableRow>
                  ))}
                </EnterpriseTableBody>
              </EnterpriseTable>
            </ComparisonFoldSection>
          ) : null}

          {golden.costChanges.length > 0 ? (
            <ComparisonFoldSection
              title="Projected cost impact"
              countBadge={golden.costChanges.length}
              sectionKey={COMPARE_STRUCTURED_SECTION_KEYS.projectedCostImpact}
              open={isStructuredSectionOpen(COMPARE_STRUCTURED_SECTION_KEYS.projectedCostImpact, foldDefaultOpen)}
              onOpenChange={(open) =>
                setOpenStructuredSectionKey(open ? COMPARE_STRUCTURED_SECTION_KEYS.projectedCostImpact : null)
              }
            >
              <EnterpriseTable ariaLabel="Projected cost impact" className={cn("mt-2", OPERATOR_TYPOGRAPHY.body)}>
                <EnterpriseTableHead>
                  <EnterpriseTableHeadRow className="bg-neutral-50/90 dark:bg-neutral-900/50">
                    <EnterpriseTableHeaderCell className={cellCls}>Baseline cost estimate</EnterpriseTableHeaderCell>
                    <EnterpriseTableHeaderCell className={cellCls}>Updated cost estimate</EnterpriseTableHeaderCell>
                  </EnterpriseTableHeadRow>
                </EnterpriseTableHead>
                <EnterpriseTableBody>
                  {golden.costChanges.map((c, i) => (
                    <EnterpriseTableRow key={`${String(c.baseCost ?? "n")}-${String(c.targetCost ?? "n")}-${i}`}>
                      <EnterpriseTableCell className={cellCls}>{costFormattedRows[i]?.base.display ?? " — "}</EnterpriseTableCell>
                      <EnterpriseTableCell className={cellCls}>{costFormattedRows[i]?.target.display ?? " — "}</EnterpriseTableCell>
                    </EnterpriseTableRow>
                  ))}
                </EnterpriseTableBody>
              </EnterpriseTable>
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
                &rdquo; to include this delta in an sponsor narrative.
              </p>
            </ComparisonFoldSection>
          ) : null}
        </div>
      )}
    </section>
  );
}
