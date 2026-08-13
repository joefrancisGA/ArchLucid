import {
  type DemoSampleUniverse,
  resolveDemoSampleUniverse,
} from "@/lib/demo-sample-universe";
import { resolveSampleScenarioByRunId } from "@/lib/samples/registry";
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

/** Banner title must match the classified universe and resolved sample scenario (TB-1279 / TB-1029). */
export function seeItUniverseBannerTitleForPayload(payload: DemoCommitPagePreviewResponse): string {
  const universe = resolveSeeItDemoUniverse(payload);

  if (universe === "contoso") {
    return "Retail baseline sample — public evaluation preview";
  }

  if (universe === "unknown") {
    return "Public sample preview";
  }

  const scenario = resolveSampleScenarioByRunId(payload.run?.runId);

  if (scenario?.slug === "claims-intake") {
    return "Healthcare claims sample — public evaluation preview";
  }

  return "Enterprise customer intake sample — public evaluation preview";
}
