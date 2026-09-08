import { downloadScopedProxyFileGet } from "./downloads-blob-trigger-scoped-proxy";

/** Downloads retrieval grounding diagnostics JSON for one run (browser only). */
export async function downloadRunRetrievalGroundingJson(runId: string): Promise<void> {
  await downloadScopedProxyFileGet(
    `/api/proxy/v1/authority/reviews/${encodeURIComponent(runId)}/retrieval-grounding`,
    {
      accept: "application/json",
      defaultFileName: `retrieval-grounding-${runId}.json`,
    },
  );
}
