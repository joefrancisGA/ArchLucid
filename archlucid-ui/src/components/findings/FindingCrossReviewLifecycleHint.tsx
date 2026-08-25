"use client";

import Link from "next/link";
import { useMemo } from "react";

import {
  buildCompareFindingLifecycleStatusSentence,
  coerceCompareFindingLifecycleRecords,
  comparePageHrefWithLifecycleAnchor,
  type CompareFindingLifecycleRecord,
} from "@/lib/compare-finding-lifecycle";
import { useCompareRunsEndToEndQuery } from "@/hooks/use-compare-runs-end-to-end-query";
import { DESIGN_TOKENS, OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

export type FindingCrossReviewLifecycleHintProps = {
  readonly runId: string;
  readonly findingId: string;
  readonly priorRunId: string | null;
  readonly laterRunId: string | null;
};

function findLifecycleRecord(
  records: readonly CompareFindingLifecycleRecord[],
  runId: string,
  findingId: string,
  priorRunId: string,
  laterRunId: string,
): CompareFindingLifecycleRecord | null {
  const normalizedFindingId = findingId.trim().toLowerCase();
  const normalizedRunId = runId.trim().toLowerCase();
  const normalizedPrior = priorRunId.trim().toLowerCase();
  const normalizedLater = laterRunId.trim().toLowerCase();

  for (const record of records) {
    if (
      normalizedRunId === normalizedLater &&
      record.currentFindingId !== null &&
      record.currentFindingId.trim().toLowerCase() === normalizedFindingId
    ) {
      return record;
    }

    if (
      normalizedRunId === normalizedPrior &&
      record.priorFindingId !== null &&
      record.priorFindingId.trim().toLowerCase() === normalizedFindingId
    ) {
      return record;
    }
  }

  return null;
}

/** Soft-loads pairwise lifecycle for this finding when compare query params are present (TB-2194). */
export function FindingCrossReviewLifecycleHint(props: FindingCrossReviewLifecycleHintProps): React.ReactElement | null {
  const { runId, findingId, priorRunId, laterRunId } = props;

  const comparePair = useMemo(() => {
    const trimmedRunId = runId.trim();
    const trimmedFindingId = findingId.trim();
    const trimmedPrior = priorRunId?.trim() ?? "";
    const trimmedLater = laterRunId?.trim() ?? "";

    let baselineRunId = "";
    let targetRunId = "";

    if (trimmedPrior.length > 0 && trimmedRunId.toLowerCase() !== trimmedPrior.toLowerCase()) {
      baselineRunId = trimmedPrior;
      targetRunId = trimmedRunId;
    } else if (trimmedLater.length > 0 && trimmedRunId.toLowerCase() !== trimmedLater.toLowerCase()) {
      baselineRunId = trimmedRunId;
      targetRunId = trimmedLater;
    }

    return {
      baselineRunId,
      targetRunId,
      trimmedRunId,
      trimmedFindingId,
      enabled:
        baselineRunId.length > 0 && targetRunId.length > 0 && trimmedFindingId.length > 0,
    };
  }, [findingId, laterRunId, priorRunId, runId]);

  const compareQuery = useCompareRunsEndToEndQuery(comparePair.baselineRunId, comparePair.targetRunId, {
    enabled: comparePair.enabled,
  });

  const { statusSentence, compareHref } = useMemo(() => {
    if (!comparePair.enabled || !compareQuery.isSuccess || compareQuery.data === undefined) {
      return { statusSentence: null, compareHref: null };
    }

    const records = coerceCompareFindingLifecycleRecords(
      compareQuery.data.report?.findingLifecycleRecords ?? null,
    );
    const match = findLifecycleRecord(
      records,
      comparePair.trimmedRunId,
      comparePair.trimmedFindingId,
      comparePair.baselineRunId,
      comparePair.targetRunId,
    );

    return {
      statusSentence: match === null ? null : buildCompareFindingLifecycleStatusSentence(match),
      compareHref: comparePageHrefWithLifecycleAnchor(comparePair.baselineRunId, comparePair.targetRunId),
    };
  }, [comparePair, compareQuery.data, compareQuery.isSuccess]);

  if (statusSentence === null) {
    return null;
  }

  return (
    <div
      className={cn("rounded-lg border p-4", DESIGN_TOKENS.callout.info)}
      data-testid="finding-cross-review-lifecycle-hint"
    >
      <p className={cn("m-0 text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}>{statusSentence}</p>
      {compareHref !== null ? (
        <p className={cn("mt-2 mb-0", OPERATOR_TYPOGRAPHY.helper)}>
          <Link href={compareHref} className={OPERATOR_LINK.inline}>
            Open compare view
          </Link>
        </p>
      ) : null}
    </div>
  );
}
