import { getDraftDecisionReceiptDownloadUrl } from "./downloads-blob-urls";
import { downloadScopedProxyFileGet } from "./downloads-blob-trigger-scoped-proxy";

/** Downloads draft decision receipt JSON through the scoped proxy (browser only). */
export async function downloadDraftDecisionReceiptJson(draftId: string): Promise<void> {
  await downloadScopedProxyFileGet(getDraftDecisionReceiptDownloadUrl(draftId), {
    accept: "application/json",
    defaultFileName: `decision-receipt-draft-${draftId}.json`,
  });
}
