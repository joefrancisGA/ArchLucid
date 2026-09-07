"use client";

import { useEffect, useMemo } from "react";
import { usePathname, useRouter } from "next/navigation";

import { useWorkspaceMode } from "@/components/WorkspaceModeProvider";
import { askReviewQuestionsHref } from "@/lib/ask-review-questions-route";
import {
  resolveOpenArchitectureJobRunId,
  type ResolveOpenArchitectureJobRunIdResult,
} from "@/lib/architecture/resolve-open-architecture-job-run-id";
import type { WorkingInsightsBindTool } from "@/lib/architecture/working-insights-architecture-bind-empty";
import {
  readCachedDeskContinuity,
  readCachedLastOpenArchitectureId,
} from "@/lib/desk-continuity-preference";
import { evidenceGraphHref } from "@/lib/evidence-graph-route";
import { useArchitectureIdentityQuery } from "@/hooks/use-architecture-identity-query";

export type UseWorkingInsightsArchitectureBindInput = {
  readonly tool: WorkingInsightsBindTool;
  readonly urlRunId: string;
};

export type UseWorkingInsightsArchitectureBindResult = {
  readonly workingMode: boolean;
  readonly bindPending: boolean;
  readonly bindResult: ResolveOpenArchitectureJobRunIdResult | null;
  readonly showArchitectureDeskEmpty: boolean;
};

/** Working Ask/graph: auto-bind to the open architecture job or surface desk empty state (AO-30 / AO-31). */
export function useWorkingInsightsArchitectureBind(
  input: UseWorkingInsightsArchitectureBindInput,
): UseWorkingInsightsArchitectureBindResult {
  const router = useRouter();
  const pathname = usePathname() ?? "/";
  const { isWorkingMode, mounted: workspaceMounted } = useWorkspaceMode();
  const workingMode = workspaceMounted && isWorkingMode;
  const lastOpenArchitectureId = readCachedLastOpenArchitectureId();
  const lastOpenReviewId = readCachedDeskContinuity().lastOpenReviewId;
  const urlRunId = input.urlRunId.trim();
  const shouldResolveBind = workingMode && urlRunId.length === 0;
  const architectureIdForQuery = lastOpenArchitectureId?.trim() ?? "";

  const identityQuery = useArchitectureIdentityQuery(
    architectureIdForQuery,
    shouldResolveBind && architectureIdForQuery.length > 0,
  );

  const bindResult = useMemo((): ResolveOpenArchitectureJobRunIdResult | null => {
    if (!shouldResolveBind) {
      return null;
    }

    return resolveOpenArchitectureJobRunId({
      pathname,
      lastOpenArchitectureId,
      lastOpenReviewId,
      identity: identityQuery.data ?? null,
    });
  }, [
    identityQuery.data,
    lastOpenArchitectureId,
    lastOpenReviewId,
    pathname,
    shouldResolveBind,
  ]);

  const bindPending =
    shouldResolveBind && architectureIdForQuery.length > 0 && identityQuery.isLoading;

  const showArchitectureDeskEmpty =
    shouldResolveBind &&
    !bindPending &&
    bindResult !== null &&
    (bindResult.runId === null || bindResult.runId.trim().length === 0);

  useEffect(() => {
    if (!shouldResolveBind || bindPending || bindResult === null) {
      return;
    }

    const runId = bindResult.runId?.trim() ?? "";

    if (runId.length === 0) {
      return;
    }

    const href =
      input.tool === "ask"
        ? askReviewQuestionsHref({ runId })
        : evidenceGraphHref({ runId });

    router.replace(href, { scroll: false });
  }, [bindPending, bindResult, input.tool, router, shouldResolveBind]);

  return {
    workingMode,
    bindPending,
    bindResult,
    showArchitectureDeskEmpty,
  };
}
