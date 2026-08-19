"use client";

import { useMemo } from "react";

import { useHealthReadySummaryQuery } from "@/hooks/use-health-ready-summary-query";
import { resolveSetupHealthPresentation } from "@/lib/setup-health-present";

export type UseSetupHealthPresentationResult =
  | {
      readonly phase: "loading";
      readonly presentation: null;
    }
  | {
      readonly phase: "ready";
      readonly presentation: ReturnType<typeof resolveSetupHealthPresentation>;
    };

/** Loads `/health/ready` once and resolves operator setup-health presentation. */
export function useSetupHealthPresentation(): UseSetupHealthPresentationResult {
  const { data, isPending } = useHealthReadySummaryQuery();

  return useMemo(() => {
    if (isPending) {
      return { phase: "loading" as const, presentation: null };
    }

    return {
      phase: "ready" as const,
      presentation: resolveSetupHealthPresentation(data ?? null),
    };
  }, [data, isPending]);
}
