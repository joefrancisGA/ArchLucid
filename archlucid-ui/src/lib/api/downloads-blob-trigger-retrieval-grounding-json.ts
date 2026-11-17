import { encodeRequiredPathSegment, trimRequiredPathSegment } from "@/lib/api/api-boundary-normalization";
import { runRetrievalGroundingBlockedReason } from "@/lib/runs/run-retrieval-grounding-blocked-reason";
import { downloadScopedProxyFileGet } from "./downloads-blob-trigger-scoped-proxy";

/** Downloads retrieval grounding diagnostics JSON for one run (browser only). */
export async function downloadRunRetrievalGroundingJson(runId: string): Promise<void> {
  const trimmedRunId = trimRequiredPathSegment(runId, "runId");
  const encodedRunId = encodeRequiredPathSegment(runId, "runId");

  await downloadScopedProxyFileGet(
    `/api/proxy/v1/authority/reviews/${encodedRunId}/retrieval-grounding`,
    {
      accept: "application/json",
      defaultFileName: `retrieval-grounding-${trimmedRunId}.json`,
      resolveBlockedReason: runRetrievalGroundingBlockedReason,
    },
  );
}
