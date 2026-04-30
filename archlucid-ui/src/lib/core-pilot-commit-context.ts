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
  /** Newest run id on the first page, if any — useful for “open run detail” deep links. */
  latestRunId: string | null;
  /** First run on the page that already has a golden manifest, if any. */
  firstCommittedRunId: string | null;
};

function isCommittedRunSummary(run: RunSummary): boolean {
  return (
    (typeof run.goldenManifestId === "string" && run.goldenManifestId.length > 0) ||
    run.hasGoldenManifest === true
  );
}

/**
 * Client-only: resolves Core Pilot “commit happened” signals without new API routes.
 * Prefer `GET /v1/tenant/trial-status.firstCommitUtc`; fall back to scanning run summaries.
 */
export async function fetchCorePilotCommitContext(): Promise<CorePilotCommitContext> {
  if (isPublicDemoModeEnv()) {
    return {
      hasCommittedManifest: true,
      latestRunId: SHOWCASE_STATIC_DEMO_RUN_ID,
      firstCommittedRunId: SHOWCASE_STATIC_DEMO_RUN_ID,
    };
  }

  let trialAnchoredCommit = false;

  try {
    const res = await fetch("/api/proxy/v1/tenant/trial-status", {
      credentials: "include",
      signal: AbortSignal.timeout(FETCH_BUDGET_MS),
    });

    if (res.ok) {
      const json: unknown = await res.json();

      if (
        json !== null &&
        typeof json === "object" &&
        "firstCommitUtc" in json &&
        typeof (json as { firstCommitUtc?: unknown }).firstCommitUtc === "string" &&
        (json as { firstCommitUtc: string }).firstCommitUtc.length > 0
      ) {
        trialAnchoredCommit = true;
      }
    }
  } catch {
    /* defer to run scan */
  }

  try {
    const raw: unknown = await Promise.race([
      listRunsByProjectPaged(DEFAULT_PROJECT_ID, 1, COMMIT_SCAN_PAGE_SIZE),
      new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error("timeout")), FETCH_BUDGET_MS);
      }),
    ]);
    const coerced = coerceRunSummaryPaged(raw);

    if (!coerced.ok) {
      return {
        hasCommittedManifest: trialAnchoredCommit,
        latestRunId: null,
        firstCommittedRunId: null,
      };
    }

    const items = coerced.value.items;
    const latestRunId = items.length > 0 ? items[0].runId : null;
    const committed = items.find((r) => isCommittedRunSummary(r));

    const hasCommittedManifest = trialAnchoredCommit || committed !== undefined;

    return {
      hasCommittedManifest,
      latestRunId,
      firstCommittedRunId: committed?.runId ?? null,
    };
  } catch {
    return {
      hasCommittedManifest: trialAnchoredCommit,
      latestRunId: null,
      firstCommittedRunId: null,
    };
  }
}
