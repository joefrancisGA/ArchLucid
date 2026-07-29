import {
  SHOWCASE_STATIC_DEMO_LATER_COMPARE_RUN_ID,
  SHOWCASE_STATIC_DEMO_PRIOR_COMPARE_RUN_ID,
  SHOWCASE_STATIC_DEMO_RUN_ID,
} from "@/lib/showcase-static-demo";
import type { DemoCommitPagePreviewResponse } from "@/types/demo-preview";

/**
 * Demo sample universes that can appear on `/see-it`.
 * Fail closed to `unknown` when Claims and Contoso signals collide or neither is asserted.
 */
export type SeeItDemoUniverse = "claims" | "contoso" | "unknown";

/** Contoso Retail demo seed run ids (`ToString("N")` from ContosoRetailDemoIdentifiers). */
const CONTOSO_RETAIL_DEMO_RUN_IDS = new Set<string>([
  "6e8c4a102b1f4c9a9d3e10b2a4f0c501",
  "6e8c4a102b1f4c9a9d3e10b2a4f0c502",
  "6e8c4a10-2b1f-4c9a-9d3e-10b2a4f0c501",
  "6e8c4a10-2b1f-4c9a-9d3e-10b2a4f0c502",
]);

const CLAIMS_SHOWCASE_RUN_IDS = new Set<string>([
  SHOWCASE_STATIC_DEMO_RUN_ID,
  SHOWCASE_STATIC_DEMO_PRIOR_COMPARE_RUN_ID,
  SHOWCASE_STATIC_DEMO_LATER_COMPARE_RUN_ID,
]);

function normalizeToken(value: string | undefined | null): string {
  return (value ?? "").trim().toLowerCase();
}

function hasClaimsTextSignals(haystack: string): boolean {
  return /claims\s*intake|healthcare\s*claims/.test(haystack);
}

function hasContosoTextSignals(haystack: string): boolean {
  return /\bcontoso\b/.test(haystack);
}

/**
 * Classifies the marketing preview payload so banner chrome cannot claim Claims over Contoso (TB-1279).
 */
export function resolveSeeItDemoUniverse(payload: DemoCommitPagePreviewResponse): SeeItDemoUniverse {
  const runId = normalizeToken(payload.run?.runId);
  const description = normalizeToken(payload.run?.description);
  const projectId = normalizeToken(payload.run?.projectId);
  const haystack = `${runId}\n${description}\n${projectId}`;

  const claimsByRunId = CLAIMS_SHOWCASE_RUN_IDS.has(runId);
  const contosoByRunId = CONTOSO_RETAIL_DEMO_RUN_IDS.has(runId);
  const claimsByText = hasClaimsTextSignals(haystack);
  const contosoByText = hasContosoTextSignals(haystack);

  if ((claimsByRunId || claimsByText) && (contosoByRunId || contosoByText)) {
    return "unknown";
  }

  if (claimsByRunId || claimsByText) {
    return "claims";
  }

  if (contosoByRunId || contosoByText) {
    return "contoso";
  }

  return "unknown";
}

/** Banner title must match the classified universe — never hardcode Claims over an unmatched body. */
export function seeItUniverseBannerTitle(universe: SeeItDemoUniverse): string {
  switch (universe) {
    case "claims":
      return "Healthcare claims sample — public evaluation preview";
    case "contoso":
      return "Contoso Retail sample — public evaluation preview";
    case "unknown":
      return "Public sample preview";
    default: {
      const _exhaustive: never = universe;

      return _exhaustive;
    }
  }
}
