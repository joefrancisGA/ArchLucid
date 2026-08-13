"use client";

import { useAskProjectRunsQuery } from "@/hooks/use-ask-project-runs-query";

export type ImpactPreviewBaselineAvailability = {
  readonly loading: boolean;
  readonly finalizedCount: number;
};

/** Loads committed reviews available as impact preview baselines. */
export function useImpactPreviewBaselineAvailability(): ImpactPreviewBaselineAvailability {
  const { data, isPending } = useAskProjectRunsQuery("default", {
    forCompare: true,
    committedOnly: true,
  });

  const finalizedCount = data?.items.length ?? 0;

  return {
    loading: isPending,
    finalizedCount,
  };
}
