import { getRunDetail } from "@/lib/api";
import { isShowcaseStaticDemoRunId } from "@/lib/demo-run-canonical";
import { coerceRunDetail } from "@/lib/operator-response-guards";
import { SHOWCASE_STATIC_DEMO_MANIFEST_ID } from "@/lib/showcase-static-demo";

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
    const detailEnvelope = await getRunDetail(trimmedRunId);
    const coercedDetail = coerceRunDetail(detailEnvelope.data);

    if (!coercedDetail.ok) {
      return null;
    }

    const manifestId = coercedDetail.value.run.goldenManifestId?.trim() ?? "";

    if (manifestId.length === 0) {
      return null;
    }

    return manifestId;
  } catch {
    return null;
  }
}
