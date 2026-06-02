import { listRunsByProjectPaged } from "@/lib/api";
import { coerceRunSummaryPaged } from "@/lib/operator-response-guards";
import { isPublicDemoModeEnv } from "@/lib/public-demo-mode";
import { SHOWCASE_STATIC_DEMO_RUN_ID } from "@/lib/showcase-static-demo";
import type { RunSummary } from "@/types/authority";

const DEFAULT_PROJECT_ID = "default";

/** First page size when scanning for a committed run (newest runs appear first). */
const COMMIT_SCAN_PAGE_SIZE = 40;

const FETCH_BUDGET_MS = 10_000;

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
};

/** True when tenant trial status records a first commit timestamp. */
export async function fetchTrialAnchoredCommit(): Promise<boolean> {
  try {
    const res = await fetch("/api/proxy/v1/tenant/trial-status", {
      credentials: "include",
      signal: AbortSignal.timeout(FETCH_BUDGET_MS),
    });

    if (!res.ok) {
      return false;
    }

    const json: unknown = await res.json();

    return (
      json !== null &&
      typeof json === "object" &&
      "firstCommitUtc" in json &&
      typeof (json as { firstCommitUtc?: unknown }).firstCommitUtc === "string" &&
      (json as { firstCommitUtc: string }).firstCommitUtc.length > 0
    );
  } catch {
    return false;
  }
}

/** Derives commit signals from an already-loaded run page (avoids a second runs list fetch). */
export function buildCorePilotCommitContextFromRunItems(
  items: readonly RunSummary[],
  trialAnchoredCommit: boolean,
): CorePilotCommitContext {
  const latestRunId = items.length > 0 ? items[0]!.runId : null;
  const committedRuns = items.filter((r) => isCommittedRunSummary(r));
  const committed = committedRuns[0];
  const secondCommitted = committedRuns.length > 1 ? committedRuns[1] : undefined;
  const committedReviewCount = Math.max(committedRuns.length, trialAnchoredCommit ? 1 : 0);
  const hasCommittedManifest = trialAnchoredCommit || committed !== undefined;

  return {
    hasCommittedManifest,
    committedReviewCount,
    latestRunId,
    firstCommittedRunId: committed?.runId ?? null,
    secondCommittedRunId: secondCommitted?.runId ?? null,
  };
}

/**
 * Client-only: resolves Core Pilot “commit happened” signals without new API routes.
 * Prefer `GET /v1/tenant/trial-status.firstCommitUtc`; fall back to scanning run summaries.
 */
export async function fetchCorePilotCommitContext(): Promise<CorePilotCommitContext> {
  if (isPublicDemoModeEnv()) {
    return PUBLIC_DEMO_CORE_PILOT_COMMIT_CONTEXT;
  }

  const trialAnchoredCommit = await fetchTrialAnchoredCommit();

  try {
    const raw: unknown = await Promise.race([
      listRunsByProjectPaged(DEFAULT_PROJECT_ID, 1, COMMIT_SCAN_PAGE_SIZE),
      new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error("timeout")), FETCH_BUDGET_MS);
      }),
    ]);
    const coerced = coerceRunSummaryPaged(raw);

    if (!coerced.ok) {
      return buildCorePilotCommitContextFromRunItems([], trialAnchoredCommit);
    }

    return buildCorePilotCommitContextFromRunItems(coerced.value.items, trialAnchoredCommit);
  } catch {
    return buildCorePilotCommitContextFromRunItems([], trialAnchoredCommit);
  }
}
