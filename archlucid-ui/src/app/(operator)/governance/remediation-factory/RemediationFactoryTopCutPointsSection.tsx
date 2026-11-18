"use client";

import Link from "next/link";

import { CopyIdButton } from "@/components/CopyIdButton";
import { Button } from "@/components/ui/button";
import { OperatorErrorRecoveryContract } from "@/components/usability/OperatorErrorRecoveryContract";
import { RefreshButton } from "@/components/ui/refresh-button";
import { EnterpriseCompactEmptyState } from "@/components/EnterpriseCompactEmptyState";
import { OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens-shell-typography";
import { remediationFactoryTopCutPointsErrorRecovery } from "@/lib/remediation-factory/remediation-factory-error-recovery";
import { formatCutPointHeadline } from "@/lib/security-evidence-path-cut-point-presentation";
import type { SecurityEvidencePathCutPoint } from "@/lib/security-evidence-path-types";
import { cn } from "@/lib/utils";
import { STANDARDS_CUT_POINT_FRAMEWORK_THEME_NOT_CONTROL_PASS_LINE } from "@/lib/governance/standards-cut-point-framework-theme-copy";
import {
  PATH_INSPECT_LONG_PATH_ID_OVERFLOW_LINE,
  shouldShowPathInspectLongPathIdHonesty,
} from "@/lib/product-line/path-inspect-long-path-id-honesty-copy";
import { formatAttackPathReportPathChipLabel } from "@/lib/remediation-factory/attack-path-report-path-chip-label";

import { RemediationFactoryBorderedSection } from "./RemediationFactoryBorderedSection";
import {
  REMEDIATION_FACTORY_TOP_CUT_POINTS_EMPTY,
  REMEDIATION_FACTORY_TOP_CUT_POINTS_LEAD,
  REMEDIATION_FACTORY_TOP_CUT_POINTS_LOADING,
  REMEDIATION_FACTORY_TOP_CUT_POINTS_PATTERN_PREFIX,
  REMEDIATION_FACTORY_TOP_CUT_POINTS_SUGGESTED_PATTERN_NOT_STORED,
  REMEDIATION_FACTORY_TOP_CUT_POINTS_TITLE,
  REMEDIATION_FACTORY_TOP_CUT_POINTS_VIEW_PATH,
} from "./remediation-factory-top-cut-points-copy";

function firstCollapsedPathId(cutPoint: SecurityEvidencePathCutPoint): string | null {
  const first = cutPoint.collapsedPathIds[0]?.trim();

  if (first == null || first.length === 0) {
    return null;
  }

  return first;
}

export function RemediationFactoryTopCutPointsSection(props: {
  readonly cutPoints: ReadonlyArray<SecurityEvidencePathCutPoint>;
  readonly isLoading: boolean;
  readonly isError: boolean;
  readonly isFetching: boolean;
  readonly isSuccess: boolean;
  readonly refetch: () => Promise<unknown>;
  readonly selectedPathId: string | null;
  readonly onSelectPath: (pathId: string) => void;
}) {
  if (props.isLoading) {
    return (
      <RemediationFactoryBorderedSection
        title={REMEDIATION_FACTORY_TOP_CUT_POINTS_TITLE}
        testId="remediation-factory-top-cut-points"
      >
        <p className={OPERATOR_TYPOGRAPHY.helper}>{REMEDIATION_FACTORY_TOP_CUT_POINTS_LOADING}</p>
      </RemediationFactoryBorderedSection>
    );
  }

  if (props.isError) {
    return (
      <RemediationFactoryBorderedSection
        title={REMEDIATION_FACTORY_TOP_CUT_POINTS_TITLE}
        testId="remediation-factory-top-cut-points"
      >
        <OperatorErrorRecoveryContract
          presentation={remediationFactoryTopCutPointsErrorRecovery()}
          testId="remediation-top-cut-points-error-recovery"
        />
        <RefreshButton
          busy={props.isFetching}
          label="Refresh cut points"
          onClick={() => void props.refetch()}
        />
      </RemediationFactoryBorderedSection>
    );
  }

  if (!props.isSuccess) {
    return null;
  }

  return (
    <RemediationFactoryBorderedSection
      title={REMEDIATION_FACTORY_TOP_CUT_POINTS_TITLE}
      testId="remediation-factory-top-cut-points"
      headerAside={
        <RefreshButton
          busy={props.isFetching}
          label="Refresh cut points"
          onClick={() => void props.refetch()}
        />
      }
    >
      <p className={cn("m-0", OPERATOR_TYPOGRAPHY.helper)}>{REMEDIATION_FACTORY_TOP_CUT_POINTS_LEAD}</p>
      <p
        className={cn("m-0", OPERATOR_TYPOGRAPHY.helper)}
        data-testid="remediation-factory-top-cut-points-framework-theme"
      >
        {STANDARDS_CUT_POINT_FRAMEWORK_THEME_NOT_CONTROL_PASS_LINE}
      </p>

      {props.cutPoints.length === 0 ? (
        <EnterpriseCompactEmptyState
          title={REMEDIATION_FACTORY_TOP_CUT_POINTS_EMPTY}
          description="Run path ranking on a snapshot with architect paths to see leverage-ordered cuts."
        />
      ) : (
        <ol className="m-0 list-none space-y-3 p-0">
          {props.cutPoints.map((cutPoint) => {
            const highlightPathId = firstCollapsedPathId(cutPoint);
            const patternKey = cutPoint.suggestedPatternKey?.trim() ?? "";

            return (
              <li
                key={cutPoint.cutPointId}
                className="rounded border border-border p-3"
                data-testid={`remediation-factory-top-cut-point-${cutPoint.cutOrder ?? "not-stored"}`}
              >
                <p className={cn("m-0", OPERATOR_TYPOGRAPHY.body)}>
                  <span className="font-mono text-muted-foreground">
                    #{cutPoint.cutOrder ?? "not stored"}
                  </span>
                  {" "}
                  {formatCutPointHeadline(cutPoint)}
                </p>
                <p className={cn("m-0 mt-1", OPERATOR_TYPOGRAPHY.helper)}>{cutPoint.explanationSummary}</p>
                <p className={cn("m-0 mt-1", OPERATOR_TYPOGRAPHY.helper)}>
                  {patternKey.length > 0 ? (
                    <>
                      {REMEDIATION_FACTORY_TOP_CUT_POINTS_PATTERN_PREFIX}{" "}
                      <Link
                        href={`/insights/patterns/${encodeURIComponent(patternKey)}`}
                        className={OPERATOR_LINK.inline}
                      >
                        {patternKey}
                      </Link>
                    </>
                  ) : (
                    REMEDIATION_FACTORY_TOP_CUT_POINTS_SUGGESTED_PATTERN_NOT_STORED
                  )}
                </p>
                {(cutPoint.toNodeLabel?.trim().length ?? 0) > 0 ? (
                  <p className={cn("m-0 mt-2 inline-flex flex-wrap items-center gap-1", OPERATOR_TYPOGRAPHY.helper)}>
                    Resource id: <span className="font-mono text-xs">{cutPoint.toNodeLabel ?? ""}</span>
                    <CopyIdButton value={cutPoint.toNodeLabel ?? ""} aria-label="Copy cut-point resource id" />
                  </p>
                ) : null}
                {highlightPathId != null ? (
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      aria-pressed={props.selectedPathId === highlightPathId}
                      onClick={() => props.onSelectPath(highlightPathId)}
                    >
                      {REMEDIATION_FACTORY_TOP_CUT_POINTS_VIEW_PATH}
                    </Button>
                    <span className={cn("inline-flex items-center gap-1 break-all font-mono text-xs", OPERATOR_TYPOGRAPHY.helper)}>
                      {highlightPathId}
                      <CopyIdButton value={highlightPathId} aria-label="Copy path id for this cut point" />
                    </span>
                    {shouldShowPathInspectLongPathIdHonesty(highlightPathId) ? (
                      <p className={cn("m-0", OPERATOR_TYPOGRAPHY.helper)} data-testid="remediation-factory-cut-point-path-id-overflow">
                        {PATH_INSPECT_LONG_PATH_ID_OVERFLOW_LINE}
                      </p>
                    ) : null}
                  </div>
                ) : null}
                {cutPoint.collapsedPathIds.length > 1 ? (
                  <div
                    className="mt-2 flex flex-wrap gap-2"
                    data-testid={`remediation-factory-cut-point-collapsed-chips-${cutPoint.cutPointId}`}
                  >
                    {cutPoint.collapsedPathIds.map((pathId) => (
                      <span key={pathId} className={cn("font-mono text-xs", OPERATOR_TYPOGRAPHY.helper)} title={pathId}>
                        {formatAttackPathReportPathChipLabel(pathId)}
                      </span>
                    ))}
                  </div>
                ) : null}
              </li>
            );
          })}
        </ol>
      )}
    </RemediationFactoryBorderedSection>
  );
}
