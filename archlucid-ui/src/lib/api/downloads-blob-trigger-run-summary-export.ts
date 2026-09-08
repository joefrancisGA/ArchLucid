import { getRunSummaryExportUrl } from "./downloads-blob-urls";
import { downloadScopedProxyFileGet } from "./downloads-blob-trigger-scoped-proxy";

/** Downloads sponsor summary markdown through the scoped proxy (browser only). */
export async function downloadRunSummaryExport(runId: string): Promise<void> {
  await downloadScopedProxyFileGet(getRunSummaryExportUrl(runId), {
    accept: "text/markdown, application/json",
    defaultFileName: `sponsor-summary-${runId}.md`,
    expectedContentTypePrefixes: ["text/markdown"],
  });
}
