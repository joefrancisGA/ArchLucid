"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import type { Ref } from "react";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";

import { EnterpriseCompactEmptyState } from "@/components/EnterpriseCompactEmptyState";
import type { EnterpriseCompactEmptyStateProps } from "@/components/EnterpriseCompactEmptyState";
import { Button } from "@/components/ui/button";
import { StatusTag } from "@/components/ui/status-tag";
import { OperatorAdvisorySimulatorProvenanceBlock } from "@/components/usability/OperatorAdvisorySimulatorProvenanceBlock";
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
import { OPERATOR_TYPOGRAPHY, OPERATOR_LINK } from "@/lib/design-tokens-shell-typography";
import type { RemediationPrioritizedFinding } from "@/lib/remediation-factory-types";
import {
  infraRemediationFindingIdDisclosureHrefFromSearch,
  parseInfraRemediationFindingIdDisclosureOpenFromSearch,
} from "@/lib/infra-evidence/infra-remediation-finding-id-disclosure-url";
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
  explainSecurityEvidenceProvenanceKind,
  formatSecurityEvidenceProvenanceKindLabel,
  securityEvidencePathConfidenceBandStatusKind,
} from "@/lib/security-evidence-path-presentation";
import { buildSecurityEvidencePathExplanation } from "@/lib/security-evidence-path-api";
import { buildPathDecisionReadiness } from "@/lib/security-evidence-path-decision-readiness";
import type {
  SecurityEvidencePathDetail,
  SecurityEvidencePathExplanation,
  SecurityEvidencePathHop,
  SecurityEvidencePathRankDetail,
  SecurityEvidencePathRankSummary,
} from "@/lib/security-evidence-path-types";
import { cn } from "@/lib/utils";
import { InlineGlossaryChip } from "@/components/InlineGlossaryChip";

function PathHopsTable(props: {
  readonly hops: ReadonlyArray<SecurityEvidencePathHop>;
  readonly weakestHopOrdinal: number;
}) {
  const bandMeaning = (band: string): string | null => {
    switch (band) {
      case "Confirmed":
        return "The evidence for this hop is confirmed.";
      case "HighlyLikely":
        return "The evidence for this hop is highly likely.";
      case "Probable":
        return "The evidence for this hop is probable.";
      case "Possible":
        return "The control plane allows this hop. No traffic was seen.";
      case "InsufficientEvidence":
        return "This hop does not have enough evidence.";
      default:
        return null;
    }
  };

  return (
    <EnterpriseTable ariaLabel={SECURENOW_PATH_INSPECT_HOPS_TITLE}>
      <EnterpriseTableHead>
        <EnterpriseTableRow>
          <EnterpriseTableHeaderCell>#</EnterpriseTableHeaderCell>
          <EnterpriseTableHeaderCell>Hop</EnterpriseTableHeaderCell>
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
              <EnterpriseTableCell>
                <p className={cn("m-0", OPERATOR_TYPOGRAPHY.body)}>
                  {hop.fromNodeLabel} to {hop.toNodeLabel} by {hop.edgeType}. Source:{" "}
                  {formatSecurityEvidenceProvenanceKindLabel(hop.provenanceKind)}.
                </p>
              </EnterpriseTableCell>
              <EnterpriseTableCell>{hop.fromNodeLabel}</EnterpriseTableCell>
              <EnterpriseTableCell>{hop.toNodeLabel}</EnterpriseTableCell>
              <EnterpriseTableCell>{hop.edgeType}</EnterpriseTableCell>
              <EnterpriseTableCell data-testid="security-evidence-path-hop-provenance">
                {formatSecurityEvidenceProvenanceKindLabel(hop.provenanceKind)}
                {hop.hopOrdinal === 1 && explainSecurityEvidenceProvenanceKind(hop.provenanceKind) != null ? (
                  <p className={cn("m-0 mt-1", OPERATOR_TYPOGRAPHY.helper)}>
                    {explainSecurityEvidenceProvenanceKind(hop.provenanceKind)}
                  </p>
                ) : null}
              </EnterpriseTableCell>
              <EnterpriseTableCell>
                <StatusTag
                  kind={securityEvidencePathConfidenceBandStatusKind(hop.hopConfidenceBand)}
                  label={formatSecurityEvidencePathConfidenceBandLabel(hop.hopConfidenceBand)}
                />
                {bandMeaning(hop.hopConfidenceBand) != null ? (
                  <p className={cn("m-0 mt-1", OPERATOR_TYPOGRAPHY.helper)}>
                    {bandMeaning(hop.hopConfidenceBand)}
                  </p>
                ) : null}
              </EnterpriseTableCell>
            </EnterpriseTableRow>
          );
        })}
      </EnterpriseTableBody>
    </EnterpriseTable>
  );
}

function PathConfidenceWhy(props: { readonly band: string }): React.JSX.Element | null {
  if (props.band !== "InsufficientEvidence" && props.band !== "Possible") {
    return null;
  }

  const message =
    props.band === "InsufficientEvidence"
      ? "This result stays open because the cited evidence does not support a stronger band."
      : "The control plane allows this path. No observed traffic is claimed.";

  return (
    <details className="text-sm" data-testid="security-evidence-path-confidence-why">
      <summary className="cursor-pointer text-al-link underline-offset-2 hover:underline">
        Why am I seeing this?
      </summary>
      <p className={cn("m-0 mt-1", OPERATOR_TYPOGRAPHY.helper)}>{message}</p>
    </details>
  );
}

function PathRankSection(props: { readonly rank: SecurityEvidencePathRankDetail }) {
  const dimensionEntries = [
    { key: "technicalExposure", label: "Technical exposure", value: props.rank.dimensionProse.technicalExposure },
    { key: "privilegeDepth", label: "Privilege depth", value: props.rank.dimensionProse.privilegeDepth },
    { key: "blastRadius", label: "Blast radius", value: props.rank.dimensionProse.blastRadius },
    { key: "businessConsequence", label: "Business consequence", value: props.rank.dimensionProse.businessConsequence },
    { key: "confidenceBand", label: "Confidence band", value: props.rank.dimensionProse.confidenceBand },
  ].filter((entry) => entry.value.trim().length > 0);

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
      {dimensionEntries.length > 0 ? (
        <ul
          className="m-0 mt-2 list-disc space-y-1 pl-5"
          data-testid="security-evidence-path-rank-dimensions"
        >
          {dimensionEntries.map((entry) => (
            <li
              key={entry.key}
              className={OPERATOR_TYPOGRAPHY.helper}
              data-testid={`security-evidence-path-rank-dimension-${entry.key}`}
            >
              <span className="font-medium text-foreground">{entry.label}:</span> {entry.value}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

function PathExplanationSection(props: {
  readonly pathId: string;
  readonly targetLabel: string;
  readonly explanation: SecurityEvidencePathExplanation | null;
  readonly explanationError: string | null;
  readonly isGenerating: boolean;
  readonly generatedAt: Date | null;
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
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={props.isGenerating}
        onClick={props.onGenerate}
        data-testid="security-evidence-path-explanation-button"
      >
        {props.isGenerating ? SECURENOW_PATH_INSPECT_EXPLANATION_LOADING : SECURENOW_PATH_INSPECT_EXPLANATION_BUTTON}
      </Button>
      {props.explanationError != null ? (
        <StatusTag kind="needs-attention" label={props.explanationError} />
      ) : null}
      {props.explanation != null ? (
        <OperatorAdvisorySimulatorProvenanceBlock
          title={SECURENOW_PATH_INSPECT_EXPLANATION_TITLE}
          simulatorTag={SECURENOW_PATH_INSPECT_EXPLANATION_SIMULATOR_TAG}
          ruleVersion={props.explanation.simulatorLabel}
          generatedAt={props.generatedAt}
          targetLabel={props.targetLabel}
          body={[
            props.explanation.executiveSummary,
            ...props.explanation.businessImpactHypotheses,
            props.explanation.proposedRemediation.recommendedChange.trim().length > 0
              ? `Recommended change: ${props.explanation.proposedRemediation.recommendedChange}`
              : "",
            props.explanation.citedEvidenceRefs.length > 0
              ? `Cited evidence: ${props.explanation.citedEvidenceRefs.join(", ")}`
              : "",
          ]
            .filter((line) => line.trim().length > 0)
            .join("\n\n")}
          auditTrailRecorded={false}
          testId="security-evidence-path-explanation-output"
        />
      ) : null}
    </div>
  );
}

function RecommendedActionSection(props: {
  readonly path: SecurityEvidencePathDetail;
  readonly rank: SecurityEvidencePathRankDetail | null;
}): React.JSX.Element {
  const firstCutPoint = props.path.relatedCutPoints[0];
  const firstRoute = props.path.routing[0];
  const lines = [
    {
      label: "Problem",
      value:
        props.path.explanationTemplate?.architectSentence?.trim() ||
        props.rank?.explanationSummary?.trim() ||
        "Not cited.",
    },
    {
      label: "Evidence",
      value:
        props.path.weakestHop?.reason?.trim() ||
        props.path.hops[0]?.evidenceReference?.trim() ||
        "Not cited.",
    },
    {
      label: "Consequence",
      value: props.rank?.dimensionProse.blastRadius?.trim() || "Not cited.",
    },
    {
      label: "Recommended change",
      value:
        firstCutPoint?.explanationSummary?.trim() ||
        props.path.explanationTemplate?.proposedChange?.trim() ||
        "Not cited.",
    },
    {
      label: "Owner",
      value: firstRoute?.displayName?.trim() || firstRoute?.role?.trim() || "Not cited.",
    },
    {
      label: "Verification",
      value: props.path.explanationTemplate?.verify?.trim() || "Not cited.",
    },
  ];

  return (
    <div className="space-y-2 rounded border border-border bg-muted/30 p-3" data-testid="security-evidence-path-recommended-action">
      <h3 className={OPERATOR_TYPOGRAPHY.cardTitle}>Recommended action</h3>
      <dl className="m-0 space-y-2">
        {lines.map((line) => (
          <div key={line.label}>
            <dt className={cn("font-medium", OPERATOR_TYPOGRAPHY.helper)}>{line.label}</dt>
            <dd className={cn("m-0 mt-0.5", OPERATOR_TYPOGRAPHY.body)}>{line.value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

function InspectSelectionIdentityHeader(props: {
  readonly findingSummary: RemediationPrioritizedFinding | null | undefined;
  readonly pathSummary: SecurityEvidencePathRankSummary | null | undefined;
  readonly findingId: string | null;
  readonly pathId: string | null;
}) {
  const pathname = usePathname() ?? "/governance/remediation-factory";
  const searchParams = useSearchParams();
  const search = searchParams.toString();
  const idsOpen = parseInfraRemediationFindingIdDisclosureOpenFromSearch(
    searchParams.get("infraRemediationFindingIdDisclosureOpen"),
  );

  if (props.pathSummary != null) {
    return (
      <div className="space-y-2" data-testid="security-evidence-path-inspect-identity">
        <p className={cn("m-0", OPERATOR_TYPOGRAPHY.body)}>
          Path rank {props.pathSummary.rankOrder} · score {props.pathSummary.compositeSortScore.toFixed(4)} ·{" "}
          {props.pathSummary.pathKind}
        </p>
        <Link
          href={infraRemediationFindingIdDisclosureHrefFromSearch(search, !idsOpen, pathname)}
          className={OPERATOR_LINK.inline}
          scroll={false}
        >
          {idsOpen ? "Hide identifiers" : "Show identifiers"}
        </Link>
        {idsOpen ? (
          <p className={cn("m-0 font-mono text-xs", OPERATOR_TYPOGRAPHY.helper)} data-testid="security-evidence-path-inspect-path-id">
            Path ID: {props.pathId}
          </p>
        ) : null}
      </div>
    );
  }

  if (props.findingSummary != null) {
    return (
      <div className="space-y-2" data-testid="security-evidence-path-inspect-identity">
        <p className={cn("m-0", OPERATOR_TYPOGRAPHY.body)}>
          <InlineGlossaryChip nounId="finding">Finding</InlineGlossaryChip> rank{" "}
          {props.findingSummary.rankOrder ?? "—"} · control {props.findingSummary.controlId ?? "—"} · score{" "}
          {props.findingSummary.totalScore.toFixed(4)}
          {props.findingSummary.patternKey != null ? ` · ${props.findingSummary.patternKey}` : ""}
        </p>
        <Link
          href={infraRemediationFindingIdDisclosureHrefFromSearch(search, !idsOpen, pathname)}
          className={OPERATOR_LINK.inline}
          scroll={false}
        >
          {idsOpen ? "Hide identifiers" : "Show identifiers"}
        </Link>
        {idsOpen ? (
          <p className={cn("m-0 font-mono text-xs", OPERATOR_TYPOGRAPHY.helper)} data-testid="security-evidence-path-inspect-finding-id">
            Finding ID: {props.findingId}
          </p>
        ) : null}
      </div>
    );
  }

  return null;
}

function resolvePathInspectSubjectLabel(input: {
  readonly findingId: string | null;
  readonly selectedFinding: RemediationPrioritizedFinding | null | undefined;
  readonly selectedPath: SecurityEvidencePathRankSummary | null | undefined;
}): string | null {
  if (input.selectedFinding != null) {
    const rankHint = input.selectedFinding.controlId ?? input.selectedFinding.patternKey ?? input.selectedFinding.findingId;

    return `Finding ${rankHint} · control ${input.selectedFinding.controlId ?? "—"} · pattern ${input.selectedFinding.patternKey ?? "—"}`;
  }

  if (input.selectedPath != null) {
    return `Path ${input.selectedPath.pathKind} · rank ${input.selectedPath.rankOrder} · ${input.selectedPath.pathId}`;
  }

  if (input.findingId != null) {
    return `Finding ${input.findingId}`;
  }

  return null;
}

export function SecurityEvidencePathInspectPanel(props: {
  readonly findingId: string | null;
  readonly pathIdOverride?: string | null;
  readonly panelRef?: Ref<HTMLElement | null>;
  readonly selectedFinding?: RemediationPrioritizedFinding | null;
  readonly selectedPath?: SecurityEvidencePathRankSummary | null;
  readonly selectedFindingSummary?: RemediationPrioritizedFinding | null;
  readonly selectedPathSummary?: SecurityEvidencePathRankSummary | null;
  readonly hasInventoryRows?: boolean;
  readonly selectPromptPreset?: EnterpriseCompactEmptyStateProps;
}) {
  const selectedFinding = props.selectedFinding ?? props.selectedFindingSummary;
  const selectedPath = props.selectedPath ?? props.selectedPathSummary;
  const findingQuery = useOperationalSecurityFindingDetailQuery(props.findingId);
  const resolvedPathId = props.pathIdOverride ?? findingQuery.data?.pathId ?? null;
  const pathQuery = useSecurityEvidencePathDetailQuery(resolvedPathId);
  const pathRankQuery = useSecurityEvidencePathRankQuery(resolvedPathId);
  const [explanation, setExplanation] = useState<SecurityEvidencePathExplanation | null>(null);
  const [explanationError, setExplanationError] = useState<string | null>(null);
  const [isGeneratingExplanation, setIsGeneratingExplanation] = useState(false);
  const [explanationGeneratedAt, setExplanationGeneratedAt] = useState<Date | null>(null);
  const instancesQuery = useQuery({
    queryKey: ["remediation-instances", "by-finding", props.findingId],
    queryFn: () => fetchRemediationInstances({ findingId: props.findingId }),
    enabled: props.findingId != null && props.findingId.trim().length > 0,
    staleTime: OPERATOR_QUERY_STALE_MS,
    gcTime: OPERATOR_QUERY_GC_MS,
    retry: false,
  });
  const advisoryInstance = instancesQuery.data?.[0] ?? null;
  const decisionReadiness = pathQuery.data != null
    ? buildPathDecisionReadiness(pathQuery.data, pathRankQuery.data ?? null, advisoryInstance)
    : null;
  const hasSelection = props.findingId != null || props.pathIdOverride != null;
  const isLoadingFinding = props.findingId != null && findingQuery.isLoading;
  const isLoadingPath = resolvedPathId != null && pathQuery.isLoading;
  const subjectLabel = resolvePathInspectSubjectLabel({
    findingId: props.findingId,
    selectedFinding,
    selectedPath,
  });

  useEffect(() => {
    setExplanation(null);
    setExplanationError(null);
    setIsGeneratingExplanation(false);
    setExplanationGeneratedAt(null);
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
      setExplanationGeneratedAt(new Date());
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
        "space-y-4 rounded-md border border-border border-l-4 border-l-[var(--al-accent-interactive)] bg-muted/20 p-4 outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        hasSelection ? "shadow-sm" : undefined,
      )}
      aria-label={SECURENOW_PATH_INSPECT_PANEL_TITLE}
      data-testid="security-evidence-path-inspect-panel"
    >
      <header className="space-y-1">
        <h2 className={OPERATOR_TYPOGRAPHY.sectionTitle}>{SECURENOW_PATH_INSPECT_PANEL_TITLE}</h2>
        <p className={OPERATOR_TYPOGRAPHY.helper}>{SECURENOW_PATH_INSPECT_PANEL_LEAD}</p>
        {subjectLabel != null ? (
          <p
            className={cn("m-0 font-medium text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}
            aria-live="polite"
            data-testid="security-evidence-path-inspect-subject"
          >
            Selected subject: {subjectLabel}
          </p>
        ) : null}
      </header>

      {hasSelection === false ? (
        props.selectPromptPreset != null ? (
          <EnterpriseCompactEmptyState {...props.selectPromptPreset} />
        ) : (
          <p className={OPERATOR_TYPOGRAPHY.helper} data-testid="security-evidence-path-inspect-select-hint">
            {props.hasInventoryRows === true
              ? SECURENOW_PATH_INSPECT_SELECT_FINDING_HINT
              : "Upload inventory and extract relationships before path inspect can show ranked rows."}
          </p>
        )
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
          <InspectSelectionIdentityHeader
            findingSummary={selectedFinding}
            pathSummary={selectedPath}
            findingId={props.findingId}
            pathId={resolvedPathId}
          />
          <div className="flex flex-wrap items-center gap-2">
            <StatusTag kind="neutral" label={pathQuery.data.pathKind} />
            <StatusTag
              kind={securityEvidencePathConfidenceBandStatusKind(pathQuery.data.pathConfidenceBand)}
              label={formatSecurityEvidencePathConfidenceBandLabel(pathQuery.data.pathConfidenceBand)}
            />
            <PathConfidenceWhy band={pathQuery.data.pathConfidenceBand} />
          </div>

          {decisionReadiness != null ? (
            <div className="space-y-2 rounded border border-border bg-muted/30 p-3" data-testid="security-evidence-path-decision-readiness">
              <h3 className={OPERATOR_TYPOGRAPHY.cardTitle}>Evidence-to-action readiness</h3>
              <StatusTag kind={decisionReadiness.status === "READY_FOR_REVIEW" ? "neutral" : "needs-attention"}
                label={decisionReadiness.status === "READY_FOR_REVIEW" ? "Ready for operator review" : "Verify evidence before action"} />
              {decisionReadiness.issues.length > 0 ? (
                <ul className="list-disc space-y-1 pl-5" data-testid="security-evidence-path-evidence-issues">
                  {decisionReadiness.issues.map((issue) => <li key={issue} className={OPERATOR_TYPOGRAPHY.helper}>{issue}</li>)}
                </ul>
              ) : null}
              <p className={cn("m-0", OPERATOR_TYPOGRAPHY.helper)}>
                Affected assets with resource IDs: {decisionReadiness.affectedAssetIds.length > 0
                  ? decisionReadiness.affectedAssetIds.join(", ") : "none identified in path hops"}
              </p>
              <p className={cn("m-0", OPERATOR_TYPOGRAPHY.helper)} data-testid="security-evidence-path-verification-status">
                {decisionReadiness.verificationStatus}
              </p>
              {props.findingId != null ? (
                <Link className={OPERATOR_LINK.inline} href={buildRemediationWorkbenchHref({
                  findingId: props.findingId, snapshotId: pathQuery.data.snapshotId,
                  instanceId: advisoryInstance?.instanceId,
                })}>Review remediation and verification</Link>
              ) : null}
            </div>
          ) : null}

          {pathRankQuery.isLoading ? (
            <p className={OPERATOR_TYPOGRAPHY.helper}>{SECURENOW_PATH_INSPECT_RANK_LOADING}</p>
          ) : pathRankQuery.isError ? (
            <StatusTag kind="needs-attention" label={SECURENOW_PATH_INSPECT_RANK_UNAVAILABLE} />
          ) : pathRankQuery.data != null ? (
            <PathRankSection rank={pathRankQuery.data} />
          ) : null}

          <RecommendedActionSection path={pathQuery.data} rank={pathRankQuery.data ?? null} />

          <PathExplanationSection
            pathId={resolvedPathId}
            targetLabel={`Path ${resolvedPathId}`}
            explanation={explanation}
            explanationError={explanationError}
            isGenerating={isGeneratingExplanation}
            generatedAt={explanationGeneratedAt}
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

          <div className="space-y-2" data-testid="security-evidence-path-what-could-break">
            <h3 className={OPERATOR_TYPOGRAPHY.cardTitle}>What could break</h3>
            {[
              ...pathQuery.data.relatedCutPoints
                .map((cutPoint) => cutPoint.explanationSummary.trim())
                .filter((summary) => summary.length > 0),
              pathRankQuery.data?.dimensionProse.blastRadius.trim() ?? "",
            ].filter((summary) => summary.length > 0).length > 0 ? (
              <ul className="m-0 list-disc space-y-1 pl-5">
                {[
                  ...pathQuery.data.relatedCutPoints
                    .map((cutPoint) => cutPoint.explanationSummary.trim())
                    .filter((summary) => summary.length > 0),
                  pathRankQuery.data?.dimensionProse.blastRadius.trim() ?? "",
                ]
                  .filter((summary) => summary.length > 0)
                  .map((summary) => (
                    <li key={summary} className={OPERATOR_TYPOGRAPHY.body}>
                      {summary}
                    </li>
                  ))}
              </ul>
            ) : (
              <p className={cn("m-0", OPERATOR_TYPOGRAPHY.helper)}>
                No dependent or shared control is cited for this change.
              </p>
            )}
          </div>

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
            <div className="space-y-1" data-testid="security-evidence-path-workbench-handoff">
              <p className={cn("m-0", OPERATOR_TYPOGRAPHY.helper)}>
                Opens the remediation workbench — draft and execute remediation instances; changes advisory remediation
                state (not sealed review records).
              </p>
              <Link
                className={OPERATOR_LINK.inline}
                href={buildRemediationWorkbenchHref({
                  findingId: props.findingId,
                  instanceId: advisoryInstance.instanceId,
                })}
                data-testid="security-evidence-path-advisory-instance-link"
              >
                {SECURENOW_PATH_INSPECT_ADVISORY_INSTANCE_LINK}
              </Link>
            </div>
          ) : null}
        </>
      )}
    </section>
  );
}
