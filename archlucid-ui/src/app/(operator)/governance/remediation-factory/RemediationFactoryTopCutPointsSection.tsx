"use client";

import Link from "next/link";

import { Button } from "@/components/ui/button";
import { OperatorErrorRecoveryContract } from "@/components/usability/OperatorErrorRecoveryContract";
import { RefreshButton } from "@/components/ui/refresh-button";
import { EnterpriseCompactEmptyState } from "@/components/EnterpriseCompactEmptyState";
import { OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens-shell-typography";
import type { SecurityEvidencePathCutPoint } from "@/lib/security-evidence-path-types";
import { cn } from "@/lib/utils";

import {
  REMEDIATION_FACTORY_TOP_CUT_POINTS_EMPTY,
  REMEDIATION_FACTORY_TOP_CUT_POINTS_LEAD,
  REMEDIATION_FACTORY_TOP_CUT_POINTS_LOADING,
  REMEDIATION_FACTORY_TOP_CUT_POINTS_PATTERN_PREFIX,
  REMEDIATION_FACTORY_TOP_CUT_POINTS_TITLE,
  REMEDIATION_FACTORY_TOP_CUT_POINTS_VIEW_PATH,
} from "./remediation-factory-top-cut-points-copy";

const REMEDIATION_FACTORY_CUT_ENDPOINT_NOT_STORED = "Cut endpoint was not stored.";

const REMEDIATION_FACTORY_SUGGESTED_PATTERN_NOT_STORED = "Suggested pattern was not stored.";

function formatCutPointHeadline(cutPoint: SecurityEvidencePathCutPoint): string {
  const fromStored =
    cutPoint.fromNodeLabel != null && cutPoint.fromNodeLabel.trim().length > 0;
  const toStored = cutPoint.toNodeLabel != null && cutPoint.toNodeLabel.trim().length > 0;

  if (fromStored && toStored) {
    return `${cutPoint.cutKind} · ${cutPoint.fromNodeLabel!.trim()} → ${cutPoint.toNodeLabel!.trim()}`;
  }

  if (!fromStored || !toStored) {
    return `${cutPoint.cutKind} · ${REMEDIATION_FACTORY_CUT_ENDPOINT_NOT_STORED}`;
  }

  return cutPoint.cutKind;
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
      <section
        className="space-y-3 rounded border border-border p-4"
        aria-label={REMEDIATION_FACTORY_TOP_CUT_POINTS_TITLE}
        data-testid="remediation-factory-top-cut-points"
      >
        <h2 className={OPERATOR_TYPOGRAPHY.sectionTitle}>{REMEDIATION_FACTORY_TOP_CUT_POINTS_TITLE}</h2>
        <p className={OPERATOR_TYPOGRAPHY.helper}>{REMEDIATION_FACTORY_TOP_CUT_POINTS_LOADING}</p>
      </section>
    );
  }

  if (props.isError) {
    return (
      <section
        className="space-y-3 rounded border border-border p-4"
        aria-label={REMEDIATION_FACTORY_TOP_CUT_POINTS_TITLE}
        data-testid="remediation-factory-top-cut-points"
      >
        <h2 className={OPERATOR_TYPOGRAPHY.sectionTitle}>{REMEDIATION_FACTORY_TOP_CUT_POINTS_TITLE}</h2>
        <OperatorErrorRecoveryContract
          presentation={{
            whatFailed: "Top cut points did not load.",
            whatIsIntact: "The priority queue and ranked paths on this page are unchanged.",
            nextStep: "Retry the load. This does not change Azure.",
          }}
          testId="remediation-top-cut-points-error-recovery"
        />
        <RefreshButton
          busy={props.isFetching}
          label="Refresh cut points"
          onClick={() => void props.refetch()}
        />
      </section>
    );
  }

  if (!props.isSuccess) {
    return null;
  }

  return (
    <section
      className="space-y-3 rounded border border-border p-4"
      aria-label={REMEDIATION_FACTORY_TOP_CUT_POINTS_TITLE}
      data-testid="remediation-factory-top-cut-points"
    >
      <div className="flex flex-wrap items-center gap-2">
        <h2 className={OPERATOR_TYPOGRAPHY.sectionTitle}>{REMEDIATION_FACTORY_TOP_CUT_POINTS_TITLE}</h2>
        <RefreshButton
          busy={props.isFetching}
          label="Refresh cut points"
          onClick={() => void props.refetch()}
        />
      </div>
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
                    REMEDIATION_FACTORY_SUGGESTED_PATTERN_NOT_STORED
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
    </section>
  );
}
