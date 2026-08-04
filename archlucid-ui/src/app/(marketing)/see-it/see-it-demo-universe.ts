import {
  type DemoSampleUniverse,
  resolveDemoSampleUniverse,
} from "@/lib/demo-sample-universe";
import type { DemoCommitPagePreviewResponse } from "@/types/demo-preview";

export type SeeItDemoUniverse = DemoSampleUniverse;

/**
 * Classifies the marketing preview payload so banner chrome cannot claim Claims over Contoso (TB-1279).
 */
export function resolveSeeItDemoUniverse(payload: DemoCommitPagePreviewResponse): SeeItDemoUniverse {
  const runId = payload.run?.runId;
  const description = payload.run?.description ?? "";
  const projectId = payload.run?.projectId ?? "";

  return resolveDemoSampleUniverse({
    runId,
    textHints: `${description}\n${projectId}`,
  });
}

/** Banner title must match the classified universe — never hardcode Claims over an unmatched body. */
export function seeItUniverseBannerTitle(universe: SeeItDemoUniverse): string {
  switch (universe) {
    case "claims":
      return "Healthcare claims sample — public evaluation preview";
    case "contoso":
      return "Retail baseline sample — public evaluation preview";
    case "unknown":
      return "Public sample preview";
    default: {
      const _exhaustive: never = universe;

      return _exhaustive;
    }
  }
}
