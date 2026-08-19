import { getRunDetail, getRunSummary } from "@/lib/api";
import { isShowcaseStaticDemoRunId } from "@/lib/demo-run-canonical";
import { coerceRunDetail } from "@/lib/operator/operator-response-guards";
import { SHOWCASE_STATIC_DEMO_MANIFEST_ID } from "@/lib/showcase-static-demo";

function trimManifestId(value: string | null | undefined): string | null {
  const trimmed = value?.trim() ?? "";

  return trimmed.length > 0 ? trimmed : null;
}

/** Resolves the signed-record manifest id for a finalized review run. */
export async function resolveGoldenManifestIdForRun(runId: string): Promise<string | null> {
  const trimmedRunId = runId.trim();

  if (trimmedRunId.length === 0) {
    return null;
  }

  if (isShowcaseStaticDemoRunId(trimmedRunId)) {
    return SHOWCASE_STATIC_DEMO_MANIFEST_ID;
  }

  try {
    const summary = await getRunSummary(trimmedRunId);
    const fromSummary = trimManifestId(summary.goldenManifestId);

    if (fromSummary !== null) {
      return fromSummary;
    }
  } catch {
    // Fall through to run detail when summary is unavailable or omits the id.
  }

  try {
    const detailEnvelope = await getRunDetail(trimmedRunId);
    const coercedDetail = coerceRunDetail(detailEnvelope.data);

    if (!coercedDetail.ok) {
      return null;
    }

    return trimManifestId(coercedDetail.value.run.goldenManifestId);
  } catch {
    return null;
  }
}
