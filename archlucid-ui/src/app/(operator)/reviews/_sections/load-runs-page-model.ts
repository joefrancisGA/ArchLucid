import { redirect } from "next/navigation";

import { listRunsByProjectPaged } from "@/lib/api";
import type { ApiLoadFailureState } from "@/lib/api-load-failure";
import { toApiLoadFailure } from "@/lib/api-load-failure";
import { dedupeRunSummariesByRunId, normalizeRunSummaryForDemoPicker } from "@/lib/demo-run-canonical";
import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";
import { isPublicDemoModeEnv } from "@/lib/public-demo-mode";
import { coerceRunSummaryPaged } from "@/lib/operator-response-guards";
import { tryStaticDemoRunSummariesPaged, isStaticDemoPayloadFallbackEnabled } from "@/lib/operator-static-demo";
import type { RunSummary } from "@/types/authority";

import type { RunsPageModel, RunsPageSearchParams } from "./runs-page-model";

/**
 * Fetches paged runs, applies static demo fallbacks when enabled, normalizes rows, and enforces last-page redirect.
 * Call from the server `page`; uses `redirect()` which throws to short-circuit rendering.
 */
export async function loadRunsPageModel(resolved: RunsPageSearchParams): Promise<RunsPageModel> {
  const projectId = resolved.projectId ?? "default";
  const page = Math.max(1, Number.parseInt(resolved.page ?? "1", 10) || 1);
  const sizeRaw = resolved.pageSize ?? resolved.take ?? "20";
  const pageSize = Math.min(200, Math.max(1, Number.parseInt(sizeRaw, 10) || 20));

  const cursorParam = resolved.cursor?.trim();

  let cursor: string | undefined;

  if (cursorParam) {
    cursor = cursorParam;
  }

  let nextCursorForClient: string | null = null;

  let runs: RunSummary[] = [];
  let totalCount = 0;
  let loadFailure: ApiLoadFailureState | null = null;
  let malformedMessage: string | null = null;

  let usedStaticRunsFallback = false;

  try {
    const raw: unknown = await listRunsByProjectPaged(projectId, page, pageSize, { cursor });
    const coerced = coerceRunSummaryPaged(raw, { page });

    if (!coerced.ok) {
      malformedMessage = coerced.message;
      runs = [];
      totalCount = 0;
    } else {
      runs = coerced.value.items;
      totalCount = coerced.value.totalCount;

      const maybeNext = coerced.value.nextCursor;

      if (typeof maybeNext === "string" && maybeNext.length > 0) {
        nextCursorForClient = maybeNext;
      }
    }
  } catch (e) {
    loadFailure = toApiLoadFailure(e);
  }

  const demoPaged =
    loadFailure !== null || malformedMessage !== null
      ? tryStaticDemoRunSummariesPaged(projectId, { afterAuthorityListFailure: true })
      : null;

  if (demoPaged !== null) {
    runs = demoPaged.items;
    totalCount = demoPaged.totalCount;
    loadFailure = null;
    malformedMessage = null;
    usedStaticRunsFallback = true;
  }

  if (
    loadFailure === null &&
    malformedMessage === null &&
    runs.length === 0 &&
    totalCount === 0 &&
    isStaticDemoPayloadFallbackEnabled()
  ) {
    const emptyWorkspaceDemo = tryStaticDemoRunSummariesPaged(projectId);

    if (emptyWorkspaceDemo !== null && emptyWorkspaceDemo.items.length > 0) {
      runs = emptyWorkspaceDemo.items;
      totalCount = emptyWorkspaceDemo.totalCount;
      usedStaticRunsFallback = true;
    }
  }

  runs = dedupeRunSummariesByRunId(runs.map(normalizeRunSummaryForDemoPicker));

  const projectTitle =
    projectId === "default" && (isPublicDemoModeEnv() || isBuyerPolishedOperatorShellEnv())
      ? "Claims Intake Workspace"
      : `Project ${projectId}`;

  if (loadFailure === null && malformedMessage === null && totalCount > 0 && !usedStaticRunsFallback) {
    const pages = Math.max(1, Math.ceil(totalCount / pageSize));

    if (page > pages) {
      redirect(`/reviews?projectId=${encodeURIComponent(projectId)}&page=${pages}&pageSize=${pageSize}`);
    }
  }

  const firstCommittedRunId: string | null =
    runs.find(
      (r) =>
        (typeof r.goldenManifestId === "string" && r.goldenManifestId.length > 0) || r.hasGoldenManifest === true,
    )?.runId ?? null;

  const welcomeOnboardingEligible =
    loadFailure === null && malformedMessage === null && totalCount === 0 && !usedStaticRunsFallback;

  return {
    projectId,
    page,
    pageSize,
    runs,
    totalCount,
    loadFailure,
    malformedMessage,
    usedStaticRunsFallback,
    nextCursorForClient,
    projectTitle,
    firstCommittedRunId,
    welcomeOnboardingEligible,
  };
}
