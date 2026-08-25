"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { listRunsByProjectPaged } from "@/lib/api";
import { buyerFacingReviewTitleFromSummary } from "@/lib/buyer/buyer-facing-review-title";
import { coerceRunSummaryPaged } from "@/lib/operator/operator-response-guards";
import { getEffectiveBrowserProxyScopeHeaders } from "@/lib/operator/operator-scope-storage";
import { projectIdFromScopeHeaders } from "@/lib/operator/operator-resource-scope";
import { tryStaticDemoRunSummariesPaged } from "@/lib/operator/operator-static-demo";
import { resolveNextRunsListRow } from "@/lib/resolve-next-runs-list-row";
import type { RunSummary } from "@/types/authority";

import {
  GovernanceFindingsQueueNextReviewFooter,
  governanceFindingsQueueNextReviewHref,
} from "./GovernanceFindingsQueueNextReviewFooter";

export type GovernanceFindingsQueueNextReviewFooterClientProps = {
  readonly runId: string;
};

/** Loads reviews list context and renders the next-review findings queue footer when available. */
export function GovernanceFindingsQueueNextReviewFooterClient(
  props: GovernanceFindingsQueueNextReviewFooterClientProps,
): React.JSX.Element | null {
  const [runs, setRuns] = useState<readonly RunSummary[]>([]);

  const loadRuns = useCallback(async () => {
    const scopeHeaders = getEffectiveBrowserProxyScopeHeaders();
    const projectId = projectIdFromScopeHeaders(scopeHeaders) ?? "default";

    try {
      const raw: unknown = await listRunsByProjectPaged(projectId, 1, 100, { scopeHeaders });
      const coerced = coerceRunSummaryPaged(raw, { page: 1 });

      if (!coerced.ok) {
        setRuns([]);

        return;
      }

      let items = coerced.value.items;
      const staticFallback = tryStaticDemoRunSummariesPaged(projectId);

      if (items.length === 0 && staticFallback !== null) {
        items = staticFallback.items;
      }

      setRuns(items);
    } catch {
      setRuns([]);
    }
  }, []);

  useEffect(() => {
    void loadRuns();
  }, [loadRuns]);

  const nextReview = useMemo(() => {
    const target = resolveNextRunsListRow(runs, props.runId);

    if (target === null) {
      return null;
    }

    const match = runs.find((run) => run.runId === target.runId);
    const reviewTitle =
      match !== undefined ? buyerFacingReviewTitleFromSummary(match) : target.reviewTitle;

    return {
      runId: target.runId,
      reviewTitle,
      href: governanceFindingsQueueNextReviewHref(target.runId),
    };
  }, [props.runId, runs]);

  if (nextReview === null) {
    return null;
  }

  return <GovernanceFindingsQueueNextReviewFooter target={nextReview} />;
}
