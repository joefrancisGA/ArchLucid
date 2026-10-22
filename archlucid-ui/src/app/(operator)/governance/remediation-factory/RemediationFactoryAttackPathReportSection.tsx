"use client";

import Link from "next/link";

import { OperatorErrorRecoveryContract } from "@/components/usability/OperatorErrorRecoveryContract";
import { RefreshButton } from "@/components/ui/refresh-button";
import {
  EnterpriseTable,
  EnterpriseTableBody,
  EnterpriseTableCell,
  EnterpriseTableHead,
  EnterpriseTableHeaderCell,
  EnterpriseTableRow,
} from "@/components/ui/enterprise-table";
import { OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens-shell-typography";
import type { SecurityEvidencePathAttackPathReport } from "@/lib/security-evidence-path-types";
import { cn } from "@/lib/utils";

import { RemediationFactoryRankedPathsTable } from "./RemediationFactoryRankedPathsTable";
import {
  ATTACK_PATH_REPORT_NO_SNAPSHOT,
  ATTACK_PATH_REPORT_RANKED_SNAPSHOT_HINT,
} from "./resolve-attack-path-report-snapshot-id";

const REPORT_LEAD =
  "Vulnerable means the recorded band is Confirmed, Highly likely, or Probable. This page does not claim exploitability or observed traffic.";

const VULNERABLE_EMPTY = "No vulnerable attack paths in this snapshot.";
const UNEVALUATED_EMPTY = "No unevaluated areas were recorded for this snapshot.";

const MAX_PATH_LINKS = 5;

export function RemediationFactoryAttackPathReportSection(props: {
  readonly snapshotId: string | null;
  readonly reportQuery: {
    readonly isLoading: boolean;
    readonly isError: boolean;
    readonly isFetching: boolean;
    readonly isSuccess: boolean;
    readonly refetch: () => Promise<unknown>;
    /**
     * TanStack Query data is `TData | undefined`. The report fetch returns `null`
     * for an empty snapshot id, so live `useQuery` results include `null`.
     */
    readonly data: SecurityEvidencePathAttackPathReport | null | undefined;
  };
  readonly selectedPathId: string | null;
  readonly onSelectPath: (pathId: string) => void;
  readonly awaitingRankedSnapshot: boolean;
  readonly showRankedSnapshotHint: boolean;
}) {
  if (props.snapshotId === null) {
    return (
      <section className="space-y-2" aria-label="Attack path report" data-testid="attack-path-report-section">
        <h2 className={OPERATOR_TYPOGRAPHY.sectionTitle}>Attack path report</h2>
        <p className={OPERATOR_TYPOGRAPHY.helper}>{REPORT_LEAD}</p>
        {props.awaitingRankedSnapshot ? (
          <p className={OPERATOR_TYPOGRAPHY.helper} data-testid="attack-path-report-awaiting-ranked">
            Loading attack path report…
          </p>
        ) : (
          <p className={OPERATOR_TYPOGRAPHY.helper} data-testid="attack-path-report-snapshot-required">
            {ATTACK_PATH_REPORT_NO_SNAPSHOT}
          </p>
        )}
      </section>
    );
  }

  return (
    <section className="space-y-4" aria-label="Attack path report" data-testid="attack-path-report-section">
      <header className="space-y-1">
        <h2 className={OPERATOR_TYPOGRAPHY.sectionTitle}>Attack path report</h2>
        <p className={OPERATOR_TYPOGRAPHY.helper}>{REPORT_LEAD}</p>
        {props.showRankedSnapshotHint ? (
          <p className={OPERATOR_TYPOGRAPHY.helper} data-testid="attack-path-report-ranked-snapshot-hint">
            {ATTACK_PATH_REPORT_RANKED_SNAPSHOT_HINT}
          </p>
        ) : null}
      </header>

      {props.reportQuery.isLoading ? (
        <p className={OPERATOR_TYPOGRAPHY.helper}>Loading attack path report…</p>
      ) : props.reportQuery.isError ? (
        <>
          <OperatorErrorRecoveryContract
            presentation={{
              whatFailed: "Attack path report did not load.",
              whatIsIntact: "The snapshot selection and ranked path table stay on this page.",
              nextStep: "Retry the load. This does not change Azure.",
            }}
            testId="attack-path-report-error-recovery"
          />
          <RefreshButton
            busy={props.reportQuery.isFetching}
            label="Retry attack path report"
            data-testid="attack-path-report-retry"
            onClick={() => void props.reportQuery.refetch()}
          />
        </>
      ) : props.reportQuery.isSuccess && props.reportQuery.data ? (
        <>
          <div className="space-y-2">
            <h3 className={OPERATOR_TYPOGRAPHY.cardTitle}>Vulnerable attack paths</h3>
            {props.reportQuery.data.vulnerableAttackPaths.length === 0 ? (
              <p className={OPERATOR_TYPOGRAPHY.helper} data-testid="attack-path-report-vulnerable-empty">
                {VULNERABLE_EMPTY}
              </p>
            ) : (
              <RemediationFactoryRankedPathsTable
                rows={props.reportQuery.data.vulnerableAttackPaths}
                selectedPathId={props.selectedPathId}
                onSelect={props.onSelectPath}
                scopeLabel="Attack path report · vulnerable"
                totalCount={props.reportQuery.data.vulnerableAttackPaths.length}
                page={1}
                pageSize={props.reportQuery.data.vulnerableAttackPaths.length}
                showSortKeyColumn={false}
              />
            )}
          </div>

          <div className="space-y-2">
            <h3 className={OPERATOR_TYPOGRAPHY.cardTitle}>Could not be fully evaluated</h3>
            {props.reportQuery.data.unevaluatedGroups.length === 0 ? (
              <p className={OPERATOR_TYPOGRAPHY.helper} data-testid="attack-path-report-unevaluated-empty">
                {UNEVALUATED_EMPTY}
              </p>
            ) : (
              <EnterpriseTable ariaLabel="Could not be fully evaluated" role="grid">
                <EnterpriseTableHead>
                  <EnterpriseTableRow>
                    <EnterpriseTableHeaderCell>Reason</EnterpriseTableHeaderCell>
                    <EnterpriseTableHeaderCell>Paths</EnterpriseTableHeaderCell>
                  </EnterpriseTableRow>
                </EnterpriseTableHead>
                <EnterpriseTableBody>
                  {props.reportQuery.data.unevaluatedGroups.map((group) => (
                    <EnterpriseTableRow key={`${group.reasonCode}-${group.engineName ?? "paths"}`}>
                      <EnterpriseTableCell>
                        <p className={cn("m-0", OPERATOR_TYPOGRAPHY.body)}>{group.whyText}</p>
                        {group.engineName !== null ? (
                          <p className={cn("m-0 mt-1", OPERATOR_TYPOGRAPHY.helper)}>
                            Engine: {group.engineName}
                            {group.pathsEmitted !== null ? ` · Paths emitted: ${group.pathsEmitted}` : null}
                          </p>
                        ) : null}
                      </EnterpriseTableCell>
                      <EnterpriseTableCell>
                        {group.pathIds.length === 0 ? (
                          <span className={OPERATOR_TYPOGRAPHY.helper}>—</span>
                        ) : (
                          <UnevaluatedPathLinks
                            pathIds={group.pathIds}
                            pathCount={group.pathCount}
                            onSelectPath={props.onSelectPath}
                          />
                        )}
                      </EnterpriseTableCell>
                    </EnterpriseTableRow>
                  ))}
                </EnterpriseTableBody>
              </EnterpriseTable>
            )}
          </div>
        </>
      ) : null}
    </section>
  );
}

function UnevaluatedPathLinks(props: {
  readonly pathIds: ReadonlyArray<string>;
  readonly pathCount: number | null;
  readonly onSelectPath: (pathId: string) => void;
}) {
  const visible = props.pathIds.slice(0, MAX_PATH_LINKS);
  const remaining = (props.pathCount ?? props.pathIds.length) - visible.length;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className={OPERATOR_TYPOGRAPHY.helper}>{props.pathCount ?? props.pathIds.length}</span>
      {visible.map((pathId) => (
        <Link
          key={pathId}
          href={`#path-${pathId}`}
          className={cn(OPERATOR_LINK.inline, "font-mono text-xs")}
          onClick={(event) => {
            event.preventDefault();
            props.onSelectPath(pathId);
          }}
          data-testid={`attack-path-report-path-link-${pathId}`}
        >
          {pathId}
        </Link>
      ))}
      {remaining > 0 ? (
        <span className={OPERATOR_TYPOGRAPHY.helper}>and {remaining} more</span>
      ) : null}
    </div>
  );
}
