"use client";

import { cn } from "@/lib/utils";
import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { CollapsibleSection } from "@/components/CollapsibleSection";
import { commitHrefIfChanged, readWindowLocationSearch } from "@/lib/navigation/replace-if-href-changed";
import {
  EnterpriseTable,
  EnterpriseTableBody,
  EnterpriseTableCell,
  EnterpriseTableHead,
  EnterpriseTableHeadRow,
  EnterpriseTableHeaderCell,
  EnterpriseTableRow,
} from "@/components/ui/enterprise-table";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { formatInstantForLocale } from "@/lib/locale-datetime";
import type { ApiLoadFailureState } from "@/lib/api-load-failure";
import type {
  RunRetrievalGroundingPayload,
  RunRetrievalGroundingRow,
} from "@/types/agent-forensics";
import { OperatorApiProblem } from "@/components/operator/OperatorApiProblem";
import {
  parseRunRetrievalGroundingOpenFromSearch,
  runRetrievalGroundingDisclosureHrefFromSearch,
} from "@/lib/runs/run-retrieval-grounding-disclosure-url";
import {
  formatRunRetrievalCitationCoverage,
  formatRunRetrievalGroundingScoresLabel,
} from "@/lib/runs/run-retrieval-grounding-display";

type RunRetrievalGroundingPanelProps = {
  payload: RunRetrievalGroundingPayload | null;
  failure: ApiLoadFailureState | null;
  blockedReason?: string | null;
  sectionId?: string;
  title?: string;
};

function optionalNumber(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value))
    return "-";

  return String(value);
}

function graphRagSummary(row: RunRetrievalGroundingRow): string {
  const neighbors = row.graphRagNeighborsAdded;
  const seeds = row.graphRagSeedHits;
  const latency = row.graphRagExpansionLatencyMs;

  if ((neighbors === null || neighbors === undefined || neighbors === 0)
    && (seeds === null || seeds === undefined || seeds === 0)
    && (latency === null || latency === undefined))
    return "-";

  const parts: string[] = [];

  if (typeof neighbors === "number")
    parts.push(`${neighbors} nbr`);

  if (typeof seeds === "number" && seeds > 0)
    parts.push(`${seeds} seed`);

  if (typeof latency === "number" && !Number.isNaN(latency))
    parts.push(`${Math.round(latency)} ms`);

  return parts.length > 0 ? parts.join(" · ") : "-";
}

/** Redaction-safe forensic panel: chunk ids and metadata only, never raw prompt or retrieved text. */
export function RunRetrievalGroundingPanel(props: RunRetrievalGroundingPanelProps) {
  const { payload, failure } = props;
  const pathname = usePathname() ?? "/";
  const [open, setOpenState] = useState(() =>
    parseRunRetrievalGroundingOpenFromSearch(null),
  );
  const openRef = useRef(open);
  openRef.current = open;
  const sectionId = props.sectionId ?? "retrieval-grounding";
  const sectionTitle = props.title ?? "Retrieval grounding (diagnostics)";
  const rowsNotReturned = payload !== null && payload !== undefined && !Array.isArray(payload.rows);
  const rows = Array.isArray(payload?.rows) ? payload.rows : [];
  const degraded = payload?.hasDegradedMetadata === true || rows.some((r) => r.scoreMetadataMalformed || r.documentMetadataMalformed);

  const syncOpenToUrl = useCallback(
    (detailsOpen: boolean) => {
      commitHrefIfChanged(
        runRetrievalGroundingDisclosureHrefFromSearch(readWindowLocationSearch(), detailsOpen, pathname),
        { notify: false },
      );
    },
    [pathname],
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
      const next = parseRunRetrievalGroundingOpenFromSearch(
        new URLSearchParams(window.location.search).get("runRetrievalGroundingOpen"),
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

  return (
    <div id={sectionId} className="scroll-mt-24">
      <CollapsibleSection title={sectionTitle} open={open} onToggle={setOpen}>
        <p className={cn("mt-0 max-w-3xl text-neutral-500 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.body)}>
          Each row is one agent retrieval trace. Citation coverage and scores apply to that trace only — not whole-review completeness.
          Raw prompts and retrieved content stay redacted at this edge.
        </p>

        {failure ? (
          <>
            <p className={cn("mb-2 font-semibold", OPERATOR_TYPOGRAPHY.body)}>Retrieval grounding could not be loaded.</p>
            {props.blockedReason !== null && props.blockedReason !== undefined ? (
              <p
                role="alert"
                className={cn("mb-2 text-rose-700 dark:text-rose-300", OPERATOR_TYPOGRAPHY.helper)}
                data-testid="run-retrieval-grounding-blocked-reason"
              >
                {props.blockedReason}
              </p>
            ) : null}
            <OperatorApiProblem
              problem={failure.problem}
              fallbackMessage={failure.message}
              correlationId={failure.correlationId}
              variant="warning"
            />
          </>
        ) : null}

        {!failure && rowsNotReturned ? (
          <p
            className={cn("text-neutral-500 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.body)}
            data-testid="run-retrieval-grounding-rows-not-returned"
          >
            Retrieval rows not returned for this review.
          </p>
        ) : null}

        {!failure && !rowsNotReturned && rows.length === 0 ? (
          <p className={cn("text-neutral-500 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.body)}>
            No retrieval grounding recorded for this review. This is expected for simulator-only reviews or agents that did not
            use retrieval.
          </p>
        ) : null}

        {!failure && degraded ? (
          <div
            role="status"
            className={cn(
              "mb-3 rounded-md border border-amber-600/40 bg-al-surface-raised px-3 py-2.5 text-al-text-primary dark:border-amber-700/50",
              OPERATOR_TYPOGRAPHY.body,
            )}
          >
            Some persisted retrieval metadata could not be parsed. Chunk ids and coverage remain available where recorded.
          </div>
        ) : null}

        {!failure && rows.length > 0 ? (
          <EnterpriseTable ariaLabel="Retrieval grounding traces" className={OPERATOR_TYPOGRAPHY.body}>
            <EnterpriseTableHead>
              <EnterpriseTableHeadRow>
                <EnterpriseTableHeaderCell>
                  <span>Agent</span>
                  <span className={cn("ml-2 font-normal", OPERATOR_TYPOGRAPHY.helper)}>
                    The agent that produced this retrieval trace.
                  </span>
                </EnterpriseTableHeaderCell>
                <EnterpriseTableHeaderCell>
                  <span>Corpus</span>
                  <span className={cn("ml-2 font-normal", OPERATOR_TYPOGRAPHY.helper)}>
                    The evidence corpus searched for this trace.
                  </span>
                </EnterpriseTableHeaderCell>
                <EnterpriseTableHeaderCell>
                  <span>Chunks</span>
                  <span className={cn("ml-2 font-normal", OPERATOR_TYPOGRAPHY.helper)}>
                    The recorded chunk identifiers returned by retrieval.
                  </span>
                </EnterpriseTableHeaderCell>
                <EnterpriseTableHeaderCell>
                  <span>Documents</span>
                  <span className={cn("ml-2 font-normal", OPERATOR_TYPOGRAPHY.helper)}>
                    The documents associated with the retrieved chunks.
                  </span>
                </EnterpriseTableHeaderCell>
                <EnterpriseTableHeaderCell>
                  <span>Scores</span>
                  <span className={cn("ml-2 font-normal", OPERATOR_TYPOGRAPHY.helper)}>
                    The retrieval scores recorded for returned results. They are ranking signals, not review confidence percentages.
                  </span>
                </EnterpriseTableHeaderCell>
                <EnterpriseTableHeaderCell>
                  <span>Coverage</span>
                  <span className={cn("ml-2 font-normal", OPERATOR_TYPOGRAPHY.helper)}>
                    The recorded share of cited material covered by this trace. It is not overall review completeness.
                  </span>
                </EnterpriseTableHeaderCell>
                <EnterpriseTableHeaderCell>
                  <span>Tokens</span>
                  <span className={cn("ml-2 font-normal", OPERATOR_TYPOGRAPHY.helper)}>
                    The recorded input and output token counts for this trace.
                  </span>
                </EnterpriseTableHeaderCell>
                <EnterpriseTableHeaderCell>
                  <span>Graph-RAG</span>
                  <span className={cn("ml-2 font-normal", OPERATOR_TYPOGRAPHY.helper)}>
                    Whether graph-based retrieval metadata was recorded for this trace.
                  </span>
                </EnterpriseTableHeaderCell>
                <EnterpriseTableHeaderCell>
                  <span>Trace</span>
                  <span className={cn("ml-2 font-normal", OPERATOR_TYPOGRAPHY.helper)}>
                    The identifier for the agent execution trace associated with this retrieval.
                  </span>
                </EnterpriseTableHeaderCell>
                <EnterpriseTableHeaderCell>Recorded</EnterpriseTableHeaderCell>
              </EnterpriseTableHeadRow>
            </EnterpriseTableHead>
            <EnterpriseTableBody>
              {rows.map((row) => (
                <EnterpriseTableRow key={row.traceId}>
                  <EnterpriseTableCell className="whitespace-nowrap">{row.agentName?.trim() || "Unknown"}</EnterpriseTableCell>
                  <EnterpriseTableCell className="whitespace-nowrap">{row.corpusKind?.trim() || "-"}</EnterpriseTableCell>
                  <EnterpriseTableCell className={cn("max-w-[14rem] break-all font-mono", OPERATOR_TYPOGRAPHY.micro)}>
                    {row.retrievedChunkIds.length > 0 ? row.retrievedChunkIds.join(", ") : "-"}
                  </EnterpriseTableCell>
                  <EnterpriseTableCell className={cn("max-w-[12rem] break-all font-mono", OPERATOR_TYPOGRAPHY.micro)}>
                    {row.documentMetadataMalformed ? "degraded" : row.documentIds.length > 0 ? row.documentIds.join(", ") : "-"}
                  </EnterpriseTableCell>
                  <EnterpriseTableCell className={cn("max-w-[12rem] font-mono", OPERATOR_TYPOGRAPHY.micro)}>
                    {formatRunRetrievalGroundingScoresLabel(row.scoreMetadataMalformed, row.scoreSummaries)}
                  </EnterpriseTableCell>
                  <EnterpriseTableCell className="whitespace-nowrap">
                    {formatRunRetrievalCitationCoverage(row.citationCoverage)}
                  </EnterpriseTableCell>
                  <EnterpriseTableCell className="whitespace-nowrap">
                    {optionalNumber(row.tokensIn)} in / {optionalNumber(row.tokensOut)} out
                  </EnterpriseTableCell>
                  <EnterpriseTableCell className={cn("whitespace-nowrap", OPERATOR_TYPOGRAPHY.helper)}>{graphRagSummary(row)}</EnterpriseTableCell>
                  <EnterpriseTableCell className={cn("max-w-[12rem] break-all font-mono", OPERATOR_TYPOGRAPHY.micro)}>
                    {row.agentExecutionTraceId?.trim() || row.traceId}
                  </EnterpriseTableCell>
                  <EnterpriseTableCell className={cn("whitespace-nowrap text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>
                    {formatInstantForLocale(row.createdUtc)}
                  </EnterpriseTableCell>
                </EnterpriseTableRow>
              ))}
            </EnterpriseTableBody>
          </EnterpriseTable>
        ) : null}
      </CollapsibleSection>
    </div>
  );
}
