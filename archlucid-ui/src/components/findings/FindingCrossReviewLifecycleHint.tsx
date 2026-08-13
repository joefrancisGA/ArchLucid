"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import {
  buildCompareFindingLifecycleStatusSentence,
  coerceCompareFindingLifecycleRecords,
  comparePageHrefWithLifecycleAnchor,
  type CompareFindingLifecycleRecord,
} from "@/lib/compare-finding-lifecycle";
import { compareRunsEndToEnd } from "@/lib/api/architecture-runs";
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
  const [statusSentence, setStatusSentence] = useState<string | null>(null);
  const [compareHref, setCompareHref] = useState<string | null>(null);

  useEffect(() => {
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

    if (baselineRunId.length === 0 || targetRunId.length === 0 || trimmedFindingId.length === 0) {
      setStatusSentence(null);
      setCompareHref(null);
      return;
    }

    let canceled = false;

    async function load(): Promise<void> {
      try {
        const response = await compareRunsEndToEnd(baselineRunId, targetRunId);
        const records = coerceCompareFindingLifecycleRecords(response.report?.findingLifecycleRecords ?? null);
        const match = findLifecycleRecord(records, trimmedRunId, trimmedFindingId, baselineRunId, targetRunId);

        if (!canceled) {
          setStatusSentence(match === null ? null : buildCompareFindingLifecycleStatusSentence(match));
          setCompareHref(comparePageHrefWithLifecycleAnchor(baselineRunId, targetRunId));
        }
      } catch {
        if (!canceled) {
          setStatusSentence(null);
          setCompareHref(null);
        }
      }
    }

    void load();

    return () => {
      canceled = true;
    };
  }, [findingId, laterRunId, priorRunId, runId]);

  if (statusSentence === null) {
    return null;
  }

  return (
    <div
      className={cn("rounded-lg border p-4", DESIGN_TOKENS.callout.info)}
      data-testid="finding-cross-review-lifecycle-hint"
    >
      <p className={cn("m-0 text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}>
        <strong className="text-al-text-primary">Across reviews:</strong> {statusSentence}
      </p>

      {compareHref !== null ? (
        <Link className={cn("mt-2 inline-block", OPERATOR_LINK.inline)} href={compareHref}>
          View full finding lifecycle compare
        </Link>
      ) : null}
    </div>
  );
}
