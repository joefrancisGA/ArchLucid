"use client";

import Link from "next/link";
import type { Ref } from "react";
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
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens-shell-typography";
import { buildRemediationWorkbenchHref } from "@/lib/infra-evidence/infra-evidence-workbench-url";
import { fetchRemediationInstances } from "@/lib/infra-evidence/infra-evidence-remediation-api";
import {
  SECURENOW_PATH_INSPECT_ADVISORY_INSTANCE_LINK,
  SECURENOW_PATH_INSPECT_CUT_POINTS_TITLE,
  SECURENOW_PATH_INSPECT_EMPTY_NO_PATH,
  SECURENOW_PATH_INSPECT_ERROR,
  SECURENOW_PATH_INSPECT_HOPS_TITLE,
  SECURENOW_PATH_INSPECT_LOADING,
  SECURENOW_PATH_INSPECT_PANEL_LEAD,
  SECURENOW_PATH_INSPECT_PANEL_TITLE,
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
import type { SecurityEvidencePathHop } from "@/lib/security-evidence-path-types";
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

export function SecurityEvidencePathInspectPanel(props: {
  readonly findingId: string | null;
  readonly panelRef?: Ref<HTMLElement | null>;
}) {
  const findingQuery = useOperationalSecurityFindingDetailQuery(props.findingId);
  const pathId = findingQuery.data?.pathId ?? null;
  const pathQuery = useSecurityEvidencePathDetailQuery(pathId);
  const instancesQuery = useQuery({
    queryKey: ["remediation-instances", "by-finding", props.findingId],
    queryFn: () => fetchRemediationInstances({ findingId: props.findingId }),
    enabled: props.findingId != null && props.findingId.trim().length > 0,
    staleTime: OPERATOR_QUERY_STALE_MS,
    gcTime: OPERATOR_QUERY_GC_MS,
    retry: false,
  });
  const advisoryInstance = instancesQuery.data?.[0] ?? null;

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

      {props.findingId == null ? (
        <p className={OPERATOR_TYPOGRAPHY.helper} data-testid="security-evidence-path-inspect-select-hint">
          {SECURENOW_PATH_INSPECT_SELECT_FINDING_HINT}
        </p>
      ) : findingQuery.isLoading || (pathId != null && pathQuery.isLoading) ? (
        <p className={OPERATOR_TYPOGRAPHY.helper}>{SECURENOW_PATH_INSPECT_LOADING}</p>
      ) : findingQuery.isError || pathQuery.isError ? (
        <StatusTag kind="needs-attention" label={SECURENOW_PATH_INSPECT_ERROR} />
      ) : pathId == null ? (
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

          {advisoryInstance != null ? (
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
