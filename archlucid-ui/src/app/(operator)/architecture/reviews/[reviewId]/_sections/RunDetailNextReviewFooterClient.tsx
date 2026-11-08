"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { listRunsByProjectPaged } from "@/lib/api";
import { buyerFacingReviewTitleFromSummary } from "@/lib/buyer/buyer-facing-review-title";
import { coerceRunSummaryPaged } from "@/lib/operator/operator-response-guards";
import { getEffectiveBrowserProxyScopeHeaders } from "@/lib/operator/operator-scope-storage";
import { projectIdFromScopeHeaders } from "@/lib/operator/operator-resource-scope";
import { tryShowcaseSpineRunSummariesPaged } from "@/lib/operator/operator-static-demo";
import { enrichRunsListWithStaticDemoFallback } from "@/lib/operator/operator-runs-list-with-demo-fallback";
import { shouldSkipLiveAuthorityRunScopedApi } from "@/lib/operator-static-demo/run-scoped-live-api";
import { resolveNextRunsListRow } from "@/lib/resolve-next-runs-list-row";
import type { RunSummary } from "@/types/authority";

import { RunDetailNextReviewFooter } from "./RunDetailNextReviewFooter";

export type RunDetailNextReviewFooterClientProps = {
  readonly runId: string;
};

/** Loads reviews list context and renders the next-review footer when available. */
export function RunDetailNextReviewFooterClient(
  props: RunDetailNextReviewFooterClientProps,
): React.JSX.Element | null {
  const [runs, setRuns] = useState<readonly RunSummary[]>([]);
  const mountedRef = useRef(true);

  const loadRuns = useCallback(async () => {
    const scopeHeaders = getEffectiveBrowserProxyScopeHeaders();
    const projectId = projectIdFromScopeHeaders(scopeHeaders);

    if (projectId === undefined || projectId.trim().length === 0) {
      if (mountedRef.current) {
        setRuns([]);
      }

      return;
    }

    const trimmedProjectId = projectId.trim();

    if (shouldSkipLiveAuthorityRunScopedApi(props.runId)) {
      const showcaseSpinePaged = tryShowcaseSpineRunSummariesPaged(trimmedProjectId, props.runId);

      if (showcaseSpinePaged !== null) {
        if (mountedRef.current) {
          setRuns(showcaseSpinePaged.items);
        }

        return;
      }
    }

    try {
      const raw: unknown = await listRunsByProjectPaged(trimmedProjectId, 1, 100, { scopeHeaders });
      const coerced = coerceRunSummaryPaged(raw, { page: 1 });

      if (!coerced.ok) {
        if (mountedRef.current) {
          setRuns([]);
        }

        return;
      }

      if (mountedRef.current) {
        setRuns(enrichRunsListWithStaticDemoFallback(coerced.value.items, trimmedProjectId));
      }
    } catch {
      if (mountedRef.current) {
        setRuns([]);
      }
    }
  }, [props.runId]);

  useEffect(() => {
    mountedRef.current = true;

    void loadRuns();

    return () => {
      mountedRef.current = false;
    };
  }, [loadRuns]);

  const nextReview = useMemo(() => {
    const target = resolveNextRunsListRow(runs, props.runId);

    if (target === null) {
      return null;
    }

    const match = runs.find((run) => run.runId === target.runId);

    if (match !== undefined) {
      return {
        ...target,
        reviewTitle: buyerFacingReviewTitleFromSummary(match),
      };
    }

    return target;
  }, [props.runId, runs]);

  if (nextReview === null) {
    return null;
  }

  return <RunDetailNextReviewFooter target={nextReview} />;
}
