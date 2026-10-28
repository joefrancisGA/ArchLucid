"use client";

import { cn } from "@/lib/utils";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import type { ReactElement } from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";

import { CollapsibleSection } from "@/components/CollapsibleSection";
import { FieldHelpTooltip } from "@/components/FieldHelpTooltip";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  EnterpriseTable,
  EnterpriseTableBody,
  EnterpriseTableCell,
  EnterpriseTableHead,
  EnterpriseTableHeadRow,
  EnterpriseTableHeaderCell,
  EnterpriseTableRow,
} from "@/components/ui/enterprise-table";
import { buyerLabelForAgentType } from "@/lib/agent-type-buyer-label";
import { commitHrefIfChanged } from "@/lib/navigation/replace-if-href-changed";
import {
  parseRunAgentExecutionLogOpenFromSearch,
  RUN_AGENT_EXECUTION_LOG_OPEN_PARAM,
  runAgentExecutionLogDisclosureHrefFromSearch,
} from "@/lib/runs/run-agent-execution-log-disclosure-url";

export const RUN_AGENT_EXECUTION_LOG_DISCLOSURE_TEST_ID = "run-agent-execution-log-disclosure";
import type { RunDetailAgentResult } from "@/types/authority";
import { formatAgentExecutionConfidenceLabel } from "@/lib/reviews/agent-confidence-display";
import { formatAgentExecutionLimitationCodeLabel } from "@/lib/reviews/agent-execution-degradation-display";

import { runDetailSectionHeadingClass } from "@/app/(operator)/architecture/reviews/[reviewId]/_sections/run-detail-section-heading";

function formatAgentExecutionArrayCount(values: readonly unknown[] | null | undefined): string {
  if (values === null || values === undefined) {
    return "Not returned";
  }

  return String(values.length);
}

export type ReviewAgentExecutionLogSectionProps = {
  readonly results: readonly RunDetailAgentResult[] | null | undefined;
};

/**
 * Collapsed execution log for each agent that ran in this review.
 * Architects reviewing AI-generated findings can inspect what ran, its
 * confidence, and whether it produced warnings or degradation.
 */
export function ReviewAgentExecutionLogSection({
  results,
}: ReviewAgentExecutionLogSectionProps): ReactElement | null {
  const pathname = usePathname() ?? "/";
  const searchParams = useSearchParams();
  const urlOpen = parseRunAgentExecutionLogOpenFromSearch(
    searchParams.get(RUN_AGENT_EXECUTION_LOG_OPEN_PARAM),
  );
  const [open, setOpenState] = useState(urlOpen);
  const openRef = useRef(open);
  openRef.current = open;

  const syncOpenToUrl = useCallback(
    (detailsOpen: boolean) => {
      commitHrefIfChanged(
        runAgentExecutionLogDisclosureHrefFromSearch(searchParams.toString(), detailsOpen, pathname),
        { notify: false },
      );
    },
    [pathname, searchParams],
  );

  const setOpen = useCallback(
    (detailsOpen: boolean) => {
      if (openRef.current === detailsOpen) {
        return;
      }

      openRef.current = detailsOpen;
      setOpenState(detailsOpen);
      syncOpenToUrl(detailsOpen);
    },
    [syncOpenToUrl],
  );

  useEffect(() => {
    const syncOpenFromUrl = (): void => {
      const next = parseRunAgentExecutionLogOpenFromSearch(
        new URLSearchParams(window.location.search).get(RUN_AGENT_EXECUTION_LOG_OPEN_PARAM),
      );

      if (openRef.current === next) {
        return;
      }

      openRef.current = next;
      setOpenState(next);
    };

    syncOpenFromUrl();
    window.addEventListener("popstate", syncOpenFromUrl);

    return () => {
      window.removeEventListener("popstate", syncOpenFromUrl);
    };
  }, []);

  useEffect(() => {
    if (openRef.current === urlOpen) {
      return;
    }

    openRef.current = urlOpen;
    setOpenState(urlOpen);
  }, [urlOpen]);

  if (!results || results.length === 0) {
    return null;
  }

  const sorted = [...results].sort((a, b) => {
    const ta = a.createdUtc ?? "";
    const tb = b.createdUtc ?? "";

    return ta.localeCompare(tb);
  });

  return (
    <section id="agent-execution-log" className="scroll-mt-24">
      <Card>
        <CardHeader>
          <h3 className={runDetailSectionHeadingClass}>Agent execution log</h3>
        </CardHeader>
        <CardContent>
          <CollapsibleSection
            title={`${sorted.length} agent${sorted.length === 1 ? "" : "s"} ran`}
            open={open}
            onToggle={setOpen}
            sectionTestId={RUN_AGENT_EXECUTION_LOG_DISCLOSURE_TEST_ID}
          >
            <EnterpriseTable ariaLabel="Agent execution log" className={OPERATOR_TYPOGRAPHY.helper}>
              <EnterpriseTableHead>
                <EnterpriseTableHeadRow>
                  <EnterpriseTableHeaderCell>
                    <span>Agent</span>
                    <span className={cn("ml-2 font-normal", OPERATOR_TYPOGRAPHY.helper)}>
                      The agent that produced this result.
                    </span>
                  </EnterpriseTableHeaderCell>
                  <EnterpriseTableHeaderCell>
                    <span>Confidence</span>
                    <span className={cn("ml-2 font-normal", OPERATOR_TYPOGRAPHY.helper)}>
                      Calibrated vs raw when both are recorded. Not recorded means no confidence was persisted. Neither is a probability the result is correct.
                    </span>
                  </EnterpriseTableHeaderCell>
                  <EnterpriseTableHeaderCell>
                    <span>Findings</span>
                    <span className={cn("ml-2 font-normal", OPERATOR_TYPOGRAPHY.helper)}>
                      Count when returned; Not returned means the API omitted the findings list (not zero findings).
                      Disposition events are not included in this count.
                    </span>
                  </EnterpriseTableHeaderCell>
                  <EnterpriseTableHeaderCell>
                    <span>Evidence refs</span>
                    <span className={cn("ml-2 font-normal", OPERATOR_TYPOGRAPHY.helper)}>
                      Count when returned; Not returned means the API omitted evidence references (not zero refs).
                      Not finalize proof — disposition-only trails are stored separately.
                    </span>
                  </EnterpriseTableHeaderCell>
                  <EnterpriseTableHeaderCell>
                    <span>Status</span>
                    <span className={cn("ml-2 font-normal", OPERATOR_TYPOGRAPHY.helper)}>
                      Whether this agent completed or recorded a limitation.
                    </span>
                  </EnterpriseTableHeaderCell>
                </EnterpriseTableHeadRow>
              </EnterpriseTableHead>
              <EnterpriseTableBody>
                {sorted.map((result) => {
                  const hasDegradation = result.degradationReasonCode !== null && result.degradationReasonCode !== undefined;
                  const limitationLabel = hasDegradation
                    ? formatAgentExecutionLimitationCodeLabel(result.degradationReasonCode)
                    : null;

                  return (
                    <EnterpriseTableRow key={result.resultId}>
                      <EnterpriseTableCell className="font-mono">{buyerLabelForAgentType(result.agentType)}</EnterpriseTableCell>
                      <EnterpriseTableCell className="tabular-nums">
                        {formatAgentExecutionConfidenceLabel(result)}
                      </EnterpriseTableCell>
                      <EnterpriseTableCell className="tabular-nums">
                        {formatAgentExecutionArrayCount(result.findings)}
                      </EnterpriseTableCell>
                      <EnterpriseTableCell className="tabular-nums">
                        {formatAgentExecutionArrayCount(result.evidenceRefs)}
                      </EnterpriseTableCell>
                      <EnterpriseTableCell>
                        {hasDegradation ? (
                          <span
                            className={cn("inline-flex items-center gap-1 rounded border border-amber-300 bg-amber-50 px-1.5 py-0.5 font-medium text-amber-800 dark:border-amber-700 dark:bg-amber-950 dark:text-amber-300", OPERATOR_TYPOGRAPHY.badge)}
                          >
                            Degraded
                            <FieldHelpTooltip
                              label="Degraded"
                              hint={limitationLabel ?? "Limitation code was not stored."}
                            />
                          </span>
                        ) : (
                          <span className={cn("inline-flex rounded border border-neutral-200 bg-neutral-50 px-1.5 py-0.5 font-medium text-neutral-600 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.badge)}>
                            OK
                          </span>
                        )}
                      </EnterpriseTableCell>
                    </EnterpriseTableRow>
                  );
                })}
              </EnterpriseTableBody>
            </EnterpriseTable>
          </CollapsibleSection>
        </CardContent>
      </Card>
    </section>
  );
}
