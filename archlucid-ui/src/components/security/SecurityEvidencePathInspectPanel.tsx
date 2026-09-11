"use client";

import Link from "next/link";
import type { Ref } from "react";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";

import { StatusTag } from "@/components/ui/status-tag";
import {
  EnterpriseTable,
  EnterpriseTableBody,
  EnterpriseTableCell,
  EnterpriseTableHead,
  EnterpriseTableHeaderCell,
  EnterpriseTableRow,
} from "@/components/ui/enterprise-table";
import { useOperationalSecurityFindingDetailQuery } from "@/hooks/use-operational-security-finding-detail-query";
import { useSecurityEvidencePathDetailQuery } from "@/hooks/use-security-evidence-path-detail-query";
import { useSecurityEvidencePathRankQuery } from "@/hooks/use-security-evidence-path-rank-query";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens-shell-typography";
import { buildRemediationWorkbenchHref } from "@/lib/infra-evidence/infra-evidence-workbench-url";
import { fetchRemediationInstances } from "@/lib/infra-evidence/infra-evidence-remediation-api";
import {
  SECURENOW_PATH_INSPECT_ADVISORY_INSTANCE_LINK,
  SECURENOW_PATH_INSPECT_ARCHITECT_SENTENCE_TITLE,
  SECURENOW_PATH_INSPECT_CUT_POINTS_TITLE,
  SECURENOW_PATH_INSPECT_EMPTY_NO_PATH,
  SECURENOW_PATH_INSPECT_ERROR,
  SECURENOW_PATH_INSPECT_EXPLANATION_BUTTON,
  SECURENOW_PATH_INSPECT_EXPLANATION_ERROR,
  SECURENOW_PATH_INSPECT_EXPLANATION_LEAD,
  SECURENOW_PATH_INSPECT_EXPLANATION_LOADING,
  SECURENOW_PATH_INSPECT_EXPLANATION_SIMULATOR_TAG,
  SECURENOW_PATH_INSPECT_EXPLANATION_TITLE,
  SECURENOW_PATH_INSPECT_HOPS_TITLE,
  SECURENOW_PATH_INSPECT_LOADING,
  SECURENOW_PATH_INSPECT_PANEL_LEAD,
  SECURENOW_PATH_INSPECT_PANEL_TITLE,
  SECURENOW_PATH_INSPECT_RANK_LOADING,
  SECURENOW_PATH_INSPECT_RANK_TITLE,
  SECURENOW_PATH_INSPECT_RANK_UNAVAILABLE,
  SECURENOW_PATH_INSPECT_ROUTING_TITLE,
  SECURENOW_PATH_INSPECT_SELECT_FINDING_HINT,
  SECURENOW_PATH_INSPECT_WEAKEST_HOP_TITLE,
} from "@/lib/product-line/securenow-path-inspect-copy";
import {
  OPERATOR_QUERY_GC_MS,
  OPERATOR_QUERY_STALE_MS,
} from "@/lib/query/operator-query-stale-time";
import {
  formatSecurityEvidencePathConfidenceBandLabel,
  formatSecurityEvidenceProvenanceKindLabel,
  securityEvidencePathConfidenceBandStatusKind,
} from "@/lib/security-evidence-path-presentation";
import { buildSecurityEvidencePathExplanation } from "@/lib/security-evidence-path-api";
import type {
  SecurityEvidencePathExplanation,
  SecurityEvidencePathHop,
  SecurityEvidencePathRankDetail,
} from "@/lib/security-evidence-path-types";
import { cn } from "@/lib/utils";

function PathHopsTable(props: {
  readonly hops: ReadonlyArray<SecurityEvidencePathHop>;
  readonly weakestHopOrdinal: number;
}) {
  return (
    <EnterpriseTable ariaLabel={SECURENOW_PATH_INSPECT_HOPS_TITLE}>
      <EnterpriseTableHead>
        <EnterpriseTableRow>
          <EnterpriseTableHeaderCell>#</EnterpriseTableHeaderCell>
          <EnterpriseTableHeaderCell>From</EnterpriseTableHeaderCell>
          <EnterpriseTableHeaderCell>To</EnterpriseTableHeaderCell>
          <EnterpriseTableHeaderCell>Edge</EnterpriseTableHeaderCell>
          <EnterpriseTableHeaderCell>Provenance</EnterpriseTableHeaderCell>
          <EnterpriseTableHeaderCell>Band</EnterpriseTableHeaderCell>
        </EnterpriseTableRow>
      </EnterpriseTableHead>
      <EnterpriseTableBody>
        {props.hops.map((hop) => {
          const isWeakest = hop.hopOrdinal === props.weakestHopOrdinal;

          return (
            <EnterpriseTableRow
              key={`${hop.hopOrdinal}-${hop.fromNodeLabel}-${hop.toNodeLabel}`}
              data-testid={isWeakest ? "security-evidence-path-weakest-hop-row" : undefined}
              className={isWeakest ? "bg-muted/50 ring-1 ring-inset ring-border" : undefined}
              aria-current={isWeakest ? "true" : undefined}
            >
              <EnterpriseTableCell>{hop.hopOrdinal}</EnterpriseTableCell>
              <EnterpriseTableCell>{hop.fromNodeLabel}</EnterpriseTableCell>
              <EnterpriseTableCell>{hop.toNodeLabel}</EnterpriseTableCell>
              <EnterpriseTableCell>{hop.edgeType}</EnterpriseTableCell>
              <EnterpriseTableCell data-testid="security-evidence-path-hop-provenance">
                {formatSecurityEvidenceProvenanceKindLabel(hop.provenanceKind)}
              </EnterpriseTableCell>
              <EnterpriseTableCell>
                <StatusTag
                  kind={securityEvidencePathConfidenceBandStatusKind(hop.hopConfidenceBand)}
                  label={formatSecurityEvidencePathConfidenceBandLabel(hop.hopConfidenceBand)}
                />
              </EnterpriseTableCell>
            </EnterpriseTableRow>
          );
        })}
      </EnterpriseTableBody>
    </EnterpriseTable>
  );
}

function PathRankSection(props: { readonly rank: SecurityEvidencePathRankDetail }) {
  return (
    <div className="rounded border border-border bg-muted/30 p-3" data-testid="security-evidence-path-rank">
      <div className="flex flex-wrap items-center gap-2">
        <h3 className={OPERATOR_TYPOGRAPHY.cardTitle}>{SECURENOW_PATH_INSPECT_RANK_TITLE}</h3>
        <StatusTag kind="neutral" label={`Rank ${props.rank.rankOrder}`} />
      </div>
      <p className={cn("m-0 mt-2", OPERATOR_TYPOGRAPHY.body)}>
        Composite score {props.rank.compositeSortScore.toFixed(4)} · {props.rank.explanationSummary}
      </p>
      {props.rank.dimensionProse.overall.trim().length > 0 ? (
        <p className={cn("m-0 mt-2", OPERATOR_TYPOGRAPHY.helper)}>{props.rank.dimensionProse.overall}</p>
      ) : null}
    </div>
  );
}

function PathExplanationSection(props: {
  readonly pathId: string;
  readonly explanation: SecurityEvidencePathExplanation | null;
  readonly explanationError: string | null;
  readonly isGenerating: boolean;
  readonly onGenerate: () => void;
}) {
  return (
    <div
      className="space-y-3 rounded border border-dashed border-border p-3"
      data-testid="security-evidence-path-explanation"
    >
      <div className="flex flex-wrap items-center gap-2">
        <h3 className={OPERATOR_TYPOGRAPHY.cardTitle}>{SECURENOW_PATH_INSPECT_EXPLANATION_TITLE}</h3>
        <StatusTag kind="neutral" label={SECURENOW_PATH_INSPECT_EXPLANATION_SIMULATOR_TAG} />
      </div>
      <p className={cn("m-0", OPERATOR_TYPOGRAPHY.helper)}>{SECURENOW_PATH_INSPECT_EXPLANATION_LEAD}</p>
      <button
        type="button"
        className="rounded bg-primary px-3 py-2 text-sm text-primary-foreground disabled:opacity-50"
        disabled={props.isGenerating}
        onClick={props.onGenerate}
        data-testid="security-evidence-path-explanation-button"
      >
        {props.isGenerating ? SECURENOW_PATH_INSPECT_EXPLANATION_LOADING : SECURENOW_PATH_INSPECT_EXPLANATION_BUTTON}
      </button>
      {props.explanationError != null ? (
        <StatusTag kind="needs-attention" label={props.explanationError} />
      ) : null}
      {props.explanation != null ? (
        <div className="space-y-2" data-testid="security-evidence-path-explanation-output">
          <p className={cn("m-0", OPERATOR_TYPOGRAPHY.body)}>{props.explanation.executiveSummary}</p>
          {props.explanation.businessImpactHypotheses.length > 0 ? (
            <ul className="m-0 list-disc space-y-1 pl-5">
              {props.explanation.businessImpactHypotheses.map((hypothesis) => (
                <li key={hypothesis} className={OPERATOR_TYPOGRAPHY.helper}>
                  {hypothesis}
                </li>
              ))}
            </ul>
          ) : null}
          {props.explanation.proposedRemediation.recommendedChange.trim().length > 0 ? (
            <p className={cn("m-0", OPERATOR_TYPOGRAPHY.helper)}>
              Recommended change: {props.explanation.proposedRemediation.recommendedChange}
            </p>
          ) : null}
          {props.explanation.citedEvidenceRefs.length > 0 ? (
            <p className={cn("m-0", OPERATOR_TYPOGRAPHY.helper)}>
              Cited evidence: {props.explanation.citedEvidenceRefs.join(", ")}
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

export function SecurityEvidencePathInspectPanel(props: {
  readonly findingId: string | null;
  readonly pathIdOverride?: string | null;
  readonly panelRef?: Ref<HTMLElement | null>;
}) {
  const findingQuery = useOperationalSecurityFindingDetailQuery(props.findingId);
  const resolvedPathId = props.pathIdOverride ?? findingQuery.data?.pathId ?? null;
  const pathQuery = useSecurityEvidencePathDetailQuery(resolvedPathId);
  const pathRankQuery = useSecurityEvidencePathRankQuery(resolvedPathId);
  const [explanation, setExplanation] = useState<SecurityEvidencePathExplanation | null>(null);
  const [explanationError, setExplanationError] = useState<string | null>(null);
  const [isGeneratingExplanation, setIsGeneratingExplanation] = useState(false);
  const instancesQuery = useQuery({
    queryKey: ["remediation-instances", "by-finding", props.findingId],
    queryFn: () => fetchRemediationInstances({ findingId: props.findingId }),
    enabled: props.findingId != null && props.findingId.trim().length > 0,
    staleTime: OPERATOR_QUERY_STALE_MS,
    gcTime: OPERATOR_QUERY_GC_MS,
    retry: false,
  });
  const advisoryInstance = instancesQuery.data?.[0] ?? null;
  const hasSelection = props.findingId != null || props.pathIdOverride != null;
  const isLoadingFinding = props.findingId != null && findingQuery.isLoading;
  const isLoadingPath = resolvedPathId != null && pathQuery.isLoading;

  useEffect(() => {
    setExplanation(null);
    setExplanationError(null);
    setIsGeneratingExplanation(false);
  }, [resolvedPathId]);

  async function generateExplanation() {
    if (resolvedPathId == null) {
      return;
    }

    setExplanationError(null);
    setIsGeneratingExplanation(true);

    try {
      const result = await buildSecurityEvidencePathExplanation(resolvedPathId, {
        useSimulator: true,
        allowInsufficientEvidence: false,
      });

      if (!result.succeeded || result.explanation == null) {
        setExplanation(null);
        setExplanationError(result.errorMessage ?? SECURENOW_PATH_INSPECT_EXPLANATION_ERROR);
        return;
      }

      setExplanation(result.explanation);
    } catch {
      setExplanation(null);
      setExplanationError(SECURENOW_PATH_INSPECT_EXPLANATION_ERROR);
    } finally {
      setIsGeneratingExplanation(false);
    }
  }

  return (
    <section
      ref={props.panelRef}
      tabIndex={-1}
      className={cn(
        "space-y-4 rounded-md border border-border bg-card p-4 outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
      )}
      aria-label={SECURENOW_PATH_INSPECT_PANEL_TITLE}
      data-testid="security-evidence-path-inspect-panel"
    >
      <header className="space-y-1">
        <h2 className={OPERATOR_TYPOGRAPHY.sectionTitle}>{SECURENOW_PATH_INSPECT_PANEL_TITLE}</h2>
        <p className={OPERATOR_TYPOGRAPHY.helper}>{SECURENOW_PATH_INSPECT_PANEL_LEAD}</p>
      </header>

      {hasSelection === false ? (
        <p className={OPERATOR_TYPOGRAPHY.helper} data-testid="security-evidence-path-inspect-select-hint">
          {SECURENOW_PATH_INSPECT_SELECT_FINDING_HINT}
        </p>
      ) : isLoadingFinding || isLoadingPath ? (
        <p className={OPERATOR_TYPOGRAPHY.helper}>{SECURENOW_PATH_INSPECT_LOADING}</p>
      ) : findingQuery.isError || pathQuery.isError ? (
        <StatusTag kind="needs-attention" label={SECURENOW_PATH_INSPECT_ERROR} />
      ) : resolvedPathId == null ? (
        <p className={OPERATOR_TYPOGRAPHY.body} data-testid="security-evidence-path-inspect-empty">
          {SECURENOW_PATH_INSPECT_EMPTY_NO_PATH}
        </p>
      ) : pathQuery.data == null ? (
        <StatusTag kind="needs-attention" label={SECURENOW_PATH_INSPECT_ERROR} />
      ) : (
        <>
          <div className="flex flex-wrap items-center gap-2">
            <StatusTag kind="neutral" label={pathQuery.data.pathKind} />
            <StatusTag
              kind={securityEvidencePathConfidenceBandStatusKind(pathQuery.data.pathConfidenceBand)}
              label={formatSecurityEvidencePathConfidenceBandLabel(pathQuery.data.pathConfidenceBand)}
            />
          </div>

          {pathRankQuery.isLoading ? (
            <p className={OPERATOR_TYPOGRAPHY.helper}>{SECURENOW_PATH_INSPECT_RANK_LOADING}</p>
          ) : pathRankQuery.isError ? (
            <StatusTag kind="needs-attention" label={SECURENOW_PATH_INSPECT_RANK_UNAVAILABLE} />
          ) : pathRankQuery.data != null ? (
            <PathRankSection rank={pathRankQuery.data} />
          ) : null}

          <PathExplanationSection
            pathId={resolvedPathId}
            explanation={explanation}
            explanationError={explanationError}
            isGenerating={isGeneratingExplanation}
            onGenerate={generateExplanation}
          />

          {pathQuery.data.explanationTemplate?.architectSentence != null
          && pathQuery.data.explanationTemplate.architectSentence.trim().length > 0 ? (
            <div
              className="rounded border border-border bg-muted/30 p-3"
              data-testid="security-evidence-path-architect-sentence"
            >
              <h3 className={OPERATOR_TYPOGRAPHY.cardTitle}>{SECURENOW_PATH_INSPECT_ARCHITECT_SENTENCE_TITLE}</h3>
              <p className={cn("m-0 mt-2", OPERATOR_TYPOGRAPHY.body)}>
                {pathQuery.data.explanationTemplate.architectSentence}
              </p>
            </div>
          ) : null}

          {pathQuery.data.weakestHop != null ? (
            <div
              className="rounded border border-border bg-muted/30 p-3"
              data-testid="security-evidence-path-weakest-hop-callout"
            >
              <h3 className={OPERATOR_TYPOGRAPHY.cardTitle}>{SECURENOW_PATH_INSPECT_WEAKEST_HOP_TITLE}</h3>
              <p className={cn("m-0 mt-1", OPERATOR_TYPOGRAPHY.body)}>
                Hop {pathQuery.data.weakestHop.hopOrdinal}: {pathQuery.data.weakestHop.edgeType}
              </p>
              <p className={cn("m-0 mt-1", OPERATOR_TYPOGRAPHY.helper)}>
                {formatSecurityEvidenceProvenanceKindLabel(pathQuery.data.weakestHop.provenanceKind)} ·{" "}
                {formatSecurityEvidencePathConfidenceBandLabel(pathQuery.data.weakestHop.hopConfidenceBand)}
              </p>
              <p className={cn("m-0 mt-2", OPERATOR_TYPOGRAPHY.body)}>{pathQuery.data.weakestHop.reason}</p>
            </div>
          ) : null}

          {pathQuery.data.hops.length > 0 ? (
            <PathHopsTable hops={pathQuery.data.hops} weakestHopOrdinal={pathQuery.data.weakestHopOrdinal} />
          ) : null}

          {pathQuery.data.relatedCutPoints.length > 0 ? (
            <div className="space-y-2" data-testid="security-evidence-path-cut-points">
              <h3 className={OPERATOR_TYPOGRAPHY.cardTitle}>{SECURENOW_PATH_INSPECT_CUT_POINTS_TITLE}</h3>
              <ul className="space-y-2">
                {pathQuery.data.relatedCutPoints.map((cutPoint) => (
                  <li
                    key={cutPoint.cutPointId}
                    className="rounded border border-border p-3"
                    data-testid={`security-evidence-path-cut-point-${cutPoint.cutPointId}`}
                  >
                    <p className={cn("m-0", OPERATOR_TYPOGRAPHY.body)}>
                      {cutPoint.cutKind}
                      {cutPoint.fromNodeLabel != null && cutPoint.toNodeLabel != null
                        ? ` · ${cutPoint.fromNodeLabel} → ${cutPoint.toNodeLabel}`
                        : ""}
                    </p>
                    <p className={cn("m-0 mt-1", OPERATOR_TYPOGRAPHY.helper)}>{cutPoint.explanationSummary}</p>
                    {cutPoint.suggestedPatternKey != null ? (
                      <p className={cn("m-0 mt-1", OPERATOR_TYPOGRAPHY.helper)}>
                        Pattern: {cutPoint.suggestedPatternKey}
                      </p>
                    ) : null}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {pathQuery.data.routing.length > 0 ? (
            <div className="space-y-2" data-testid="security-evidence-path-routing">
              <h3 className={OPERATOR_TYPOGRAPHY.cardTitle}>{SECURENOW_PATH_INSPECT_ROUTING_TITLE}</h3>
              <EnterpriseTable ariaLabel={SECURENOW_PATH_INSPECT_ROUTING_TITLE}>
                <EnterpriseTableHead>
                  <EnterpriseTableRow>
                    <EnterpriseTableHeaderCell>Role</EnterpriseTableHeaderCell>
                    <EnterpriseTableHeaderCell>Owner</EnterpriseTableHeaderCell>
                    <EnterpriseTableHeaderCell>Provenance</EnterpriseTableHeaderCell>
                  </EnterpriseTableRow>
                </EnterpriseTableHead>
                <EnterpriseTableBody>
                  {pathQuery.data.routing.map((row) => (
                    <EnterpriseTableRow key={`${row.role}-${row.principalId ?? row.displayName ?? row.sourceReference}`}>
                      <EnterpriseTableCell>{row.role}</EnterpriseTableCell>
                      <EnterpriseTableCell>{row.displayName ?? row.principalId ?? "—"}</EnterpriseTableCell>
                      <EnterpriseTableCell>{formatSecurityEvidenceProvenanceKindLabel(row.provenanceKind)}</EnterpriseTableCell>
                    </EnterpriseTableRow>
                  ))}
                </EnterpriseTableBody>
              </EnterpriseTable>
            </div>
          ) : null}

          {advisoryInstance != null && props.findingId != null ? (
            <p className={cn("m-0", OPERATOR_TYPOGRAPHY.helper)}>
              <Link
                className="text-al-link hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                href={buildRemediationWorkbenchHref({
                  findingId: props.findingId,
                  instanceId: advisoryInstance.instanceId,
                })}
                data-testid="security-evidence-path-advisory-instance-link"
              >
                {SECURENOW_PATH_INSPECT_ADVISORY_INSTANCE_LINK}
              </Link>
            </p>
          ) : null}
        </>
      )}
    </section>
  );
}
