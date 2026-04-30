import type { DemoCommitPagePreviewResponse } from "@/types/demo-preview";
import { getShowcaseStaticDemoPayload, SHOWCASE_STATIC_DEMO_RUN_ID } from "@/lib/showcase-static-demo";

function isWeakPlaceholderRunId(runId: string | undefined | null): boolean {
  const t = runId?.trim() ?? "";

  if (t.length === 0)
    return true;

  // Snapshot / fixture runs sometimes use long repeated placeholder digits or a single repeated character.
  if (t.length >= 16 && /^(.)\1+$/.test(t))
    return true;

  return false;
}

function isUsableSeeItPayload(p: DemoCommitPagePreviewResponse): boolean {
  if (isWeakPlaceholderRunId(p.run?.runId))
    return false;

  const re = p.runExplanation;

  if (re === null || re === undefined)
    return false;

  if (typeof re.findingCount !== "number" || !Number.isFinite(re.findingCount))
    return false;

  if (typeof re.complianceGapCount !== "number" || !Number.isFinite(re.complianceGapCount))
    return false;

  if (!Array.isArray(p.artifacts) || p.artifacts.length === 0)
    return false;

  return true;
}

/**
 * Ensures /see-it and similar marketing surfaces always show a credible snapshot when the live preview or JSON file is thin.
 */
export function normalizeSeeItMarketingPayload(p: DemoCommitPagePreviewResponse): DemoCommitPagePreviewResponse {
  if (isUsableSeeItPayload(p))
    return p;

  return getShowcaseStaticDemoPayload(SHOWCASE_STATIC_DEMO_RUN_ID);
}
