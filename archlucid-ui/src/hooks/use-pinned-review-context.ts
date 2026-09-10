"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo } from "react";

import { usePinnedReviewExplanationQuery } from "@/hooks/use-pinned-review-explanation-query";
import { useRunSummaryQuery } from "@/hooks/use-run-summary-query";
import { isApiNotFoundFailure, toApiLoadFailure } from "@/lib/api-load-failure";
import { traceRowsForRun } from "@/components/governance/findings/governance-findings-row-mappers";
import {
  isValidPinRunId,
  readPinRunIdFromSearchParams,
  reviewPinRunHrefFromSearch,
  writePinRunIdToUrl,
} from "@/lib/reviews/review-pin-run-url";
import { resolveReviewPinStampStatus } from "@/lib/reviews/review-pin-stamp-status";
import { useWorkspaceMode } from "@/components/WorkspaceModeProvider";
import type { GovernanceFindingQueueRow } from "@/app/(operator)/governance/findings/governance-finding-queue-row";
import type { RunSummary } from "@/types/authority";

export type UsePinnedReviewContextResult = {
  readonly isOpen: boolean;
  readonly pinRunId: string | null;
  readonly summary: RunSummary | null;
  readonly findings: readonly GovernanceFindingQueueRow[];
  readonly findingsCount: number | null;
  readonly stampStatusLine: string | null;
  readonly loading: boolean;
  readonly notFound: boolean;
  readonly closePin: () => void;
};

export function usePinnedReviewContext(primaryRunId: string): UsePinnedReviewContextResult {
  const { isWorkingMode } = useWorkspaceMode();
  const router = useRouter();
  const pathname = usePathname() ?? "";
  const searchParams = useSearchParams();
  const pinRunId = readPinRunIdFromSearchParams(searchParams);
  const pinEnabled = isWorkingMode && isValidPinRunId(primaryRunId, pinRunId);
  const effectivePinRunId = pinEnabled ? pinRunId : null;

  const summaryQuery = useRunSummaryQuery(effectivePinRunId ?? "", {
    enabled: effectivePinRunId !== null,
  });
  const explanationQuery = usePinnedReviewExplanationQuery(effectivePinRunId ?? "", {
    enabled: effectivePinRunId !== null && summaryQuery.data !== undefined,
  });

  const closePin = useCallback(() => {
    writePinRunIdToUrl(null);
    router.replace(reviewPinRunHrefFromSearch(searchParams.toString(), null, pathname), { scroll: false });
  }, [pathname, router, searchParams]);

  const summaryFailure = summaryQuery.error !== null && summaryQuery.error !== undefined
    ? toApiLoadFailure(summaryQuery.error)
    : null;
  const notFound = isApiNotFoundFailure(summaryFailure);

  useEffect(() => {
    if (!pinEnabled || !notFound) {
      return;
    }

    closePin();
  }, [closePin, notFound, pinEnabled]);

  const findings = useMemo((): readonly GovernanceFindingQueueRow[] => {
    if (summaryQuery.data === undefined || summaryQuery.data === null) {
      return [];
    }

    const traces = explanationQuery.data?.findingTraceConfidences ?? [];

    return traceRowsForRun(summaryQuery.data, traces);
  }, [explanationQuery.data, summaryQuery.data]);

  const stampStatusLine = useMemo(() => {
    if (summaryQuery.data === undefined || summaryQuery.data === null) {
      return null;
    }

    const status = resolveReviewPinStampStatus(summaryQuery.data);

    return `${status.sealed ? "Sealed" : status.lifecycleStage} · ${status.overallStatus}`;
  }, [summaryQuery.data]);

  const findingsCount = useMemo(() => {
    if (findings.length > 0) {
      return findings.length;
    }

    const fromSummary = summaryQuery.data?.findingCount;

    if (typeof fromSummary === "number" && Number.isFinite(fromSummary)) {
      return Math.trunc(fromSummary);
    }

    const fromExplanation = explanationQuery.data?.findingCount;

    if (typeof fromExplanation === "number" && Number.isFinite(fromExplanation)) {
      return Math.trunc(fromExplanation);
    }

    return null;
  }, [explanationQuery.data?.findingCount, findings.length, summaryQuery.data?.findingCount]);

  const loading =
    pinEnabled
    && (summaryQuery.isLoading || (summaryQuery.data !== undefined && explanationQuery.isLoading));

  return {
    isOpen: pinEnabled,
    pinRunId: effectivePinRunId,
    summary: summaryQuery.data ?? null,
    findings,
    findingsCount,
    stampStatusLine,
    loading,
    notFound,
    closePin,
  };
}
