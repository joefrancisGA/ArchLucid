import { getRunDecisionReceiptDownloadUrl } from "./downloads-blob-urls";
import { downloadScopedProxyFileGet } from "./downloads-blob-trigger-scoped-proxy";

/** Downloads ADR 0052 decision receipt JSON for a committed run (browser only). */
export async function downloadRunDecisionReceiptJson(runId: string): Promise<void> {
  await downloadScopedProxyFileGet(getRunDecisionReceiptDownloadUrl(runId), {
    accept: "application/json",
    defaultFileName: `decision-receipt-${runId}.json`,
  });
}
