import { canonicalizeDemoRunId } from "@/lib/demo-run-canonical";
import { isPinnedDemoWorkspaceRunId } from "@/lib/demo-workspace-scope";
import { SHOWCASE_STATIC_DEMO_RUN_ID } from "@/lib/showcase-static-demo";

/**
 * Curated buyer golden path run ids: static showcase slug or pinned SQL demo workspace seed runs.
 * Keep aligned with {@link resolveBuyerGoldenJourneyNav} and live E2E `demo-workspace-live-scope.ts`.
 */
export function isBuyerGoldenSpineRunId(runId: string): boolean {
  const trimmed = runId.trim();

  if (trimmed.length === 0) {
    return false;
  }

  return (
    canonicalizeDemoRunId(trimmed) === canonicalizeDemoRunId(SHOWCASE_STATIC_DEMO_RUN_ID) ||
    isPinnedDemoWorkspaceRunId(trimmed)
  );
}

export type BuyerGoldenReviewPackagePageReadyInput = {
  readonly buyerPolishedArtifactTable: boolean;
  readonly runId: string;
  readonly headline: string;
  readonly manifestId: string | null | undefined;
};

/** True when review detail exposes `data-buyer-golden-ready` for Playwright buyer golden path E2E. */
export function isBuyerGoldenReviewPackagePageReady(input: BuyerGoldenReviewPackagePageReadyInput): boolean {
  return (
    input.buyerPolishedArtifactTable === true &&
    isBuyerGoldenSpineRunId(input.runId) &&
    input.headline.trim().length > 0 &&
    Boolean(input.manifestId)
  );
}
