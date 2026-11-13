"use client";

import type { ReactNode } from "react";
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
import { remediationFactoryAttackPathReportErrorRecovery } from "@/lib/remediation-factory/remediation-factory-error-recovery";
import type { SecurityEvidencePathAttackPathReport } from "@/lib/security-evidence-path-types";
import { cn } from "@/lib/utils";

import {
  REMEDIATION_FACTORY_ATTACK_PATH_LOADING,
  REMEDIATION_FACTORY_ATTACK_PATH_REPORT_LEAD,
  REMEDIATION_FACTORY_ATTACK_PATH_REPORT_TITLE,
  REMEDIATION_FACTORY_ATTACK_PATH_UNEVALUATED_EMPTY,
  REMEDIATION_FACTORY_ATTACK_PATH_UNEVALUATED_TITLE,
  REMEDIATION_FACTORY_ATTACK_PATH_VULNERABLE_EMPTY,
  REMEDIATION_FACTORY_ATTACK_PATH_VULNERABLE_TITLE,
} from "./remediation-factory-attack-path-report-copy";
import { RemediationFactoryRankedPathsTable } from "./RemediationFactoryRankedPathsTable";
import {
  ATTACK_PATH_REPORT_NO_SNAPSHOT,
  ATTACK_PATH_REPORT_RANKED_SNAPSHOT_HINT,
} from "./resolve-attack-path-report-snapshot-id";

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
      <section className="space-y-2" aria-label={REMEDIATION_FACTORY_ATTACK_PATH_REPORT_TITLE} data-testid="attack-path-report-section">
        <h2 className={OPERATOR_TYPOGRAPHY.sectionTitle}>{REMEDIATION_FACTORY_ATTACK_PATH_REPORT_TITLE}</h2>
        <p className={OPERATOR_TYPOGRAPHY.helper}>{REMEDIATION_FACTORY_ATTACK_PATH_REPORT_LEAD}</p>
        {props.awaitingRankedSnapshot ? (
          <p className={OPERATOR_TYPOGRAPHY.helper} data-testid="attack-path-report-awaiting-ranked">
            {REMEDIATION_FACTORY_ATTACK_PATH_LOADING}
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
    <section className="space-y-4" aria-label={REMEDIATION_FACTORY_ATTACK_PATH_REPORT_TITLE} data-testid="attack-path-report-section">
      <header className="space-y-1">
        <h2 className={OPERATOR_TYPOGRAPHY.sectionTitle}>{REMEDIATION_FACTORY_ATTACK_PATH_REPORT_TITLE}</h2>
        <p className={OPERATOR_TYPOGRAPHY.helper}>{REMEDIATION_FACTORY_ATTACK_PATH_REPORT_LEAD}</p>
        {props.showRankedSnapshotHint ? (
          <p className={OPERATOR_TYPOGRAPHY.helper} data-testid="attack-path-report-ranked-snapshot-hint">
            {ATTACK_PATH_REPORT_RANKED_SNAPSHOT_HINT}
          </p>
        ) : null}
      </header>

      {props.reportQuery.isLoading ? (
        <p className={OPERATOR_TYPOGRAPHY.helper}>{REMEDIATION_FACTORY_ATTACK_PATH_LOADING}</p>
      ) : props.reportQuery.isError ? (
        <>
          <OperatorErrorRecoveryContract
            presentation={remediationFactoryAttackPathReportErrorRecovery()}
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
          <RemediationFactoryAttackPathReportSubsection
            title={REMEDIATION_FACTORY_ATTACK_PATH_VULNERABLE_TITLE}
            emptyTestId="attack-path-report-vulnerable-empty"
            emptyCopy={REMEDIATION_FACTORY_ATTACK_PATH_VULNERABLE_EMPTY}
            isEmpty={props.reportQuery.data.vulnerableAttackPaths.length === 0}
          >
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
          </RemediationFactoryAttackPathReportSubsection>

          <RemediationFactoryAttackPathReportSubsection
            title={REMEDIATION_FACTORY_ATTACK_PATH_UNEVALUATED_TITLE}
            emptyTestId="attack-path-report-unevaluated-empty"
            emptyCopy={REMEDIATION_FACTORY_ATTACK_PATH_UNEVALUATED_EMPTY}
            isEmpty={props.reportQuery.data.unevaluatedGroups.length === 0}
          >
            <EnterpriseTable ariaLabel={REMEDIATION_FACTORY_ATTACK_PATH_UNEVALUATED_TITLE} role="grid">
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
          </RemediationFactoryAttackPathReportSubsection>
        </>
      ) : null}
    </section>
  );
}

function RemediationFactoryAttackPathReportSubsection(props: {
  readonly title: string;
  readonly emptyTestId: string;
  readonly emptyCopy: string;
  readonly isEmpty: boolean;
  readonly children: ReactNode;
}) {
  return (
    <div className="space-y-2">
      <h3 className={OPERATOR_TYPOGRAPHY.cardTitle}>{props.title}</h3>
      {props.isEmpty ? (
        <p className={OPERATOR_TYPOGRAPHY.helper} data-testid={props.emptyTestId}>
          {props.emptyCopy}
        </p>
      ) : (
        props.children
      )}
    </div>
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
