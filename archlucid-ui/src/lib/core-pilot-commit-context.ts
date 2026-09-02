import { coerceRunSummaryPaged } from "@/lib/operator/operator-response-guards";
import { isPublicDemoModeEnv } from "@/lib/public-demo-mode";
import { operatorQueryKeys } from "@/lib/query/operator-query-keys";
import { getOperatorQueryClient } from "@/lib/query/operator-query-client";
import { OPERATOR_QUERY_STALE_MS } from "@/lib/query/operator-query-stale-time";
import { fetchPagedReviewsInventory } from "@/lib/api/reviews-paged-inventory";
import { getEffectiveBrowserProxyScopeHeaders } from "@/lib/operator/operator-scope-storage";
import { fetchTenantTrialStatusCached } from "@/lib/tenant-trial-status-client";
import { SHOWCASE_STATIC_DEMO_RUN_ID } from "@/lib/showcase-static-demo";
import type { RunSummary } from "@/types/authority";

const DEFAULT_PROJECT_ID = "default";

/** First page size when scanning for a committed run (newest runs appear first). */
const COMMIT_SCAN_PAGE_SIZE = 40;

const FETCH_BUDGET_MS = 10_000;

export type SealedReviewRecordSummary = {
  readonly runId: string;
  readonly displayName: string | null;
  readonly finalizedOnUtc: string | null;
  readonly finalizedByUserId: string | null;
};

export type CorePilotCommitContext = {
  /** True when tenant has at least one authority-committed manifest (trial anchor or run row). */
  hasCommittedManifest: boolean;
  /** Committed reviews visible in the first-page scan (trial anchor counts as one when present). */
  committedReviewCount: number;
  /** Newest run id on the first page, if any — useful for “open run detail” deep links. */
  latestRunId: string | null;
  /** First run on the page that already has a golden manifest, if any. */
  firstCommittedRunId: string | null;
  /** Second committed run on the page when repeat-compare prompts need a prior anchor. */
  secondCommittedRunId: string | null;
  /** Newest run has findings but no golden manifest — finalize CTA applies. */
  latestRunReadyToFinalize: boolean;
  /** Provenance for the first sealed review record when `firstCommittedRunId` is known. */
  sealedReviewRecord: SealedReviewRecordSummary | null;
};

function isCommittedRunSummary(run: RunSummary): boolean {
  return run.hasGoldenManifest === true;
}

export const PUBLIC_DEMO_CORE_PILOT_COMMIT_CONTEXT: CorePilotCommitContext = {
  hasCommittedManifest: true,
  committedReviewCount: 2,
  latestRunId: SHOWCASE_STATIC_DEMO_RUN_ID,
  firstCommittedRunId: SHOWCASE_STATIC_DEMO_RUN_ID,
  secondCommittedRunId: SHOWCASE_STATIC_DEMO_RUN_ID,
  latestRunReadyToFinalize: false,
  sealedReviewRecord: {
    runId: SHOWCASE_STATIC_DEMO_RUN_ID,
    displayName: "Sample architecture review",
    finalizedOnUtc: "2026-04-15T12:00:00.000Z",
    finalizedByUserId: null,
  },
};

type TrialCommitAnchor = {
  readonly anchored: boolean;
  readonly firstCommitUtc: string | null;
};

async function fetchTrialCommitAnchor(): Promise<TrialCommitAnchor> {
  try {
    const payload = await fetchTenantTrialStatusCached();
    const firstCommitUtc =
      payload !== null &&
      typeof payload.firstCommitUtc === "string" &&
      payload.firstCommitUtc.length > 0
        ? payload.firstCommitUtc
        : null;

    return {
      anchored: firstCommitUtc !== null,
      firstCommitUtc,
    };
  } catch {
    return { anchored: false, firstCommitUtc: null };
  }
}

/** True when tenant trial status records a first commit timestamp. */
export async function fetchTrialAnchoredCommit(): Promise<boolean> {
  const anchor = await fetchTrialCommitAnchor();

  return anchor.anchored;
}

function resolveSealedReviewRecordSummary(
  committed: RunSummary | undefined,
  firstCommittedRunId: string | null,
  trialFirstCommitUtc: string | null,
): SealedReviewRecordSummary | null {
  if (firstCommittedRunId === null) {
    return null;
  }

  const displayName = committed?.displayName?.trim() ?? "";
  const completedUtc = committed?.completedUtc?.trim() ?? "";
  const createdUtc = committed?.createdUtc?.trim() ?? "";

  return {
    runId: firstCommittedRunId,
    displayName: displayName.length > 0 ? displayName : null,
    finalizedOnUtc:
      completedUtc.length > 0
        ? completedUtc
        : createdUtc.length > 0
          ? createdUtc
          : trialFirstCommitUtc !== null && trialFirstCommitUtc.length > 0
            ? trialFirstCommitUtc
            : null,
    finalizedByUserId: null,
  };
}

/** Derives commit signals from an already-loaded run page (avoids a second runs list fetch). */
export function buildCorePilotCommitContextFromRunItems(
  items: readonly RunSummary[],
  trialAnchoredCommit: boolean,
  trialFirstCommitUtc: string | null = null,
): CorePilotCommitContext {
  const latestRun = items.length > 0 ? items[0]! : null;
  const latestRunId = latestRun?.runId ?? null;
  const latestRunReadyToFinalize =
    latestRun !== null &&
    latestRun.hasFindingsSnapshot === true &&
    latestRun.hasGoldenManifest !== true;
  const committedRuns = items.filter((r) => isCommittedRunSummary(r));
  const committed = committedRuns[0];
  const secondCommitted = committedRuns.length > 1 ? committedRuns[1] : undefined;
  const committedReviewCount = Math.max(committedRuns.length, trialAnchoredCommit ? 1 : 0);
  const hasCommittedManifest = trialAnchoredCommit || committed !== undefined;
  const firstCommittedRunId = committed?.runId ?? null;

  return {
    hasCommittedManifest,
    committedReviewCount,
    latestRunId,
    firstCommittedRunId,
    secondCommittedRunId: secondCommitted?.runId ?? null,
    latestRunReadyToFinalize,
    sealedReviewRecord: resolveSealedReviewRecordSummary(committed, firstCommittedRunId, trialFirstCommitUtc),
  };
}

/** Derives commit signals from an already-loaded run page (avoids a second runs list fetch). */
export async function resolveCorePilotCommitContextFromRunItems(
  items: readonly RunSummary[],
): Promise<CorePilotCommitContext> {
  if (isPublicDemoModeEnv()) {
    return PUBLIC_DEMO_CORE_PILOT_COMMIT_CONTEXT;
  }

  const trialAnchor = await fetchTrialCommitAnchor();

  return buildCorePilotCommitContextFromRunItems(items, trialAnchor.anchored, trialAnchor.firstCommitUtc);
}

/**
 * Client-only: resolves Core Pilot “commit happened” signals without new API routes.
 * Prefer `GET /v1/tenant/trial-status.firstCommitUtc`; fall back to scanning run summaries.
 */
export async function fetchCorePilotCommitContext(): Promise<CorePilotCommitContext> {
  if (isPublicDemoModeEnv()) {
    return PUBLIC_DEMO_CORE_PILOT_COMMIT_CONTEXT;
  }

  const trialAnchor = await fetchTrialCommitAnchor();

  try {
    const scopeHeaders =
      typeof window !== "undefined" ? getEffectiveBrowserProxyScopeHeaders() : undefined;
    const raw: unknown = await Promise.race([
      fetchPagedReviewsInventory({
        projectId: DEFAULT_PROJECT_ID,
        page: 1,
        pageSize: COMMIT_SCAN_PAGE_SIZE,
        scopeHeaders,
      }),
      new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error("timeout")), FETCH_BUDGET_MS);
      }),
    ]);
    const coerced = coerceRunSummaryPaged(raw);

    if (!coerced.ok) {
      return buildCorePilotCommitContextFromRunItems([], trialAnchor.anchored, trialAnchor.firstCommitUtc);
    }

    return buildCorePilotCommitContextFromRunItems(
      coerced.value.items,
      trialAnchor.anchored,
      trialAnchor.firstCommitUtc,
    );
  } catch {
    return buildCorePilotCommitContextFromRunItems([], trialAnchor.anchored, trialAnchor.firstCommitUtc);
  }
}

/** Clears cached commit-context composite reads (TB-562). */
export async function invalidateCorePilotCommitContextCache(): Promise<void> {
  await getOperatorQueryClient().invalidateQueries({ queryKey: operatorQueryKeys.corePilotCommitContext });
}

/** Imperative read through the shared TanStack Query cache (TB-562). */
export async function fetchCorePilotCommitContextCached(
  options?: { force?: boolean },
): Promise<CorePilotCommitContext> {
  const queryClient = getOperatorQueryClient();

  if (options?.force === true) {
    await invalidateCorePilotCommitContextCache();
  }

  return queryClient.fetchQuery({
    queryKey: operatorQueryKeys.corePilotCommitContext,
    queryFn: fetchCorePilotCommitContext,
    staleTime: OPERATOR_QUERY_STALE_MS,
  });
}
