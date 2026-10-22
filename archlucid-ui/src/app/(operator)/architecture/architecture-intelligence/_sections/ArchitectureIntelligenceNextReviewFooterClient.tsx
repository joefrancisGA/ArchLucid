"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { listRunsByProjectPaged } from "@/lib/api";
import { buyerFacingReviewTitleFromSummary } from "@/lib/buyer/buyer-facing-review-title";
import { coerceRunSummaryPaged } from "@/lib/operator/operator-response-guards";
import { getEffectiveBrowserProxyScopeHeaders } from "@/lib/operator/operator-scope-storage";
import { projectIdFromScopeHeaders } from "@/lib/operator/operator-resource-scope";
import { enrichRunsListWithStaticDemoFallback } from "@/lib/operator/operator-runs-list-with-demo-fallback";
import { resolveNextRunsListRow } from "@/lib/resolve-next-runs-list-row";
import type { RunSummary } from "@/types/authority";

import {
  ArchitectureIntelligenceNextReviewFooter,
  architectureIntelligenceNextReviewHref,
} from "./ArchitectureIntelligenceNextReviewFooter";

export type ArchitectureIntelligenceNextReviewFooterClientProps = {
  readonly runId: string;
};

/** Loads reviews list context and renders the next-review architecture intelligence footer when available. */
export function ArchitectureIntelligenceNextReviewFooterClient(
  props: ArchitectureIntelligenceNextReviewFooterClientProps,
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

      setRuns(enrichRunsListWithStaticDemoFallback(coerced.value.items, projectId));
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
      href: architectureIntelligenceNextReviewHref(target.runId),
    };
  }, [props.runId, runs]);

  if (nextReview === null) {
    return null;
  }

  return <ArchitectureIntelligenceNextReviewFooter target={nextReview} />;
}
