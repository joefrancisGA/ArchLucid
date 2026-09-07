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
import {
  architectureNestedAskPath,
  parseArchitectureNestedAskArchitectureId,
} from "@/lib/architecture/architecture-routes";

export type UseWorkingInsightsArchitectureBindInput = {
  readonly tool: WorkingInsightsBindTool;
  readonly urlRunId: string;
  readonly pinnedArchitectureId?: string | null;
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
  const routeArchitectureId = parseArchitectureNestedAskArchitectureId(pathname);
  const pinnedArchitectureId = input.pinnedArchitectureId?.trim() ?? "";
  const lastOpenArchitectureId = readCachedLastOpenArchitectureId();
  const architectureIdForBind =
    pinnedArchitectureId.length > 0
      ? pinnedArchitectureId
      : routeArchitectureId !== null && routeArchitectureId.length > 0
        ? routeArchitectureId
        : lastOpenArchitectureId;
  const lastOpenReviewId = readCachedDeskContinuity().lastOpenReviewId;
  const urlRunId = input.urlRunId.trim();
  const shouldResolveBind = workingMode && urlRunId.length === 0;
  const architectureIdForQuery = architectureIdForBind?.trim() ?? "";

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
      lastOpenArchitectureId: architectureIdForBind,
      lastOpenReviewId,
      identity: identityQuery.data ?? null,
    });
  }, [
    architectureIdForBind,
    identityQuery.data,
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
        ? routeArchitectureId !== null && routeArchitectureId.length > 0
          ? `${architectureNestedAskPath(routeArchitectureId)}?runId=${encodeURIComponent(runId)}`
          : askReviewQuestionsHref({ runId })
        : evidenceGraphHref({ runId });

    router.replace(href, { scroll: false });
  }, [bindPending, bindResult, input.tool, routeArchitectureId, router, shouldResolveBind]);

  return {
    workingMode,
    bindPending,
    bindResult,
    showArchitectureDeskEmpty,
  };
}
