"use client";

import Link from "next/link";

import { Button } from "@/components/ui/button";
import { OperatorErrorRecoveryContract } from "@/components/usability/OperatorErrorRecoveryContract";
import { RefreshButton } from "@/components/ui/refresh-button";
import { EnterpriseCompactEmptyState } from "@/components/EnterpriseCompactEmptyState";
import { OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens-shell-typography";
import { remediationFactoryTopCutPointsErrorRecovery } from "@/lib/remediation-factory/remediation-factory-error-recovery";
import type { SecurityEvidencePathCutPoint } from "@/lib/security-evidence-path-types";
import { cn } from "@/lib/utils";

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

function formatCutPointHeadline(cutPoint: SecurityEvidencePathCutPoint): string {
  const fromLabel = cutPoint.fromNodeLabel?.trim() ?? "";
  const toLabel = cutPoint.toNodeLabel?.trim() ?? "";

  if (fromLabel.length === 0 && toLabel.length === 0) {
    return `${cutPoint.cutKind} · Cut endpoints were not stored.`;
  }

  if (fromLabel.length === 0) {
    return `${cutPoint.cutKind} · Source endpoint was not stored → ${toLabel}`;
  }

  if (toLabel.length === 0) {
    return `${cutPoint.cutKind} · ${fromLabel} → Destination endpoint was not stored`;
  }

  return `${cutPoint.cutKind} · ${fromLabel} → ${toLabel}`;
}

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
                data-testid={`remediation-factory-top-cut-point-${cutPoint.cutOrder}`}
              >
                <p className={cn("m-0", OPERATOR_TYPOGRAPHY.body)}>
                  <span className="font-mono text-muted-foreground">#{cutPoint.cutOrder}</span>
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
                {highlightPathId != null ? (
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    className="mt-2"
                    aria-pressed={props.selectedPathId === highlightPathId}
                    onClick={() => props.onSelectPath(highlightPathId)}
                  >
                    {REMEDIATION_FACTORY_TOP_CUT_POINTS_VIEW_PATH}
                  </Button>
                ) : null}
              </li>
            );
          })}
        </ol>
      )}
    </RemediationFactoryBorderedSection>
  );
}
