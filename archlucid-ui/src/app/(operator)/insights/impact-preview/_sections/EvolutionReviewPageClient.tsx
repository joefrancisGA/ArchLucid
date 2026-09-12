"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";

import { IMPACT_PREVIEW_PATH } from "@/lib/impact-preview-route";

import { EvolutionReviewPageView } from "./EvolutionReviewPageView";
import type { EvolutionReviewPageServerLoad } from "./load-evolution-review-page-data";
import { useEvolutionReviewPage } from "./use-evolution-review-page";

type Props = {
  readonly loaded: EvolutionReviewPageServerLoad;
  readonly basePathname?: string;
  readonly pinnedArchitectureId?: string;
  readonly nestedPolicyEnvelopeEntry?: boolean;
};

function resolveImpactPreviewScopedRunId(searchParams: URLSearchParams): string {
  const runId = searchParams.get("runId")?.trim() ?? "";
  const baselineRunId = searchParams.get("baselineRunId")?.trim() ?? "";

  if (runId.length > 0) {
    return runId;
  }

  if (baselineRunId.length > 0) {
    return baselineRunId;
  }

  return "";
}

/** Client root for evolution review; data is prefetched in `page.tsx` when not in demo mode. */
export function EvolutionReviewPageClient(props: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const scopedRunId = resolveImpactPreviewScopedRunId(searchParams);
  const scopedRunFilterActive = scopedRunId.length > 0;

  const basePathname = props.basePathname?.trim() ?? IMPACT_PREVIEW_PATH;
  const pinnedArchitectureId = props.pinnedArchitectureId?.trim() ?? "";
  const model = useEvolutionReviewPage(props.loaded, scopedRunId, { basePathname });

  const onPickReviewForSimulating = useCallback(
    (reviewId: string) => {
      const trimmed = reviewId.trim();

      if (trimmed.length === 0) {
        return;
      }

      const params = new URLSearchParams(searchParams.toString());
      params.set("runId", trimmed);

      router.replace(`${basePathname}?${params.toString()}`, { scroll: false });
    },
    [basePathname, router, searchParams],
  );

  return (
    <EvolutionReviewPageView
      model={model}
      scopedRunId={scopedRunId}
      scopedRunFilterActive={scopedRunFilterActive}
      onPickReviewForSimulating={onPickReviewForSimulating}
      basePathname={basePathname}
      pinnedArchitectureId={pinnedArchitectureId.length > 0 ? pinnedArchitectureId : null}
      nestedPolicyEnvelopeEntry={props.nestedPolicyEnvelopeEntry === true}
    />
  );
}
