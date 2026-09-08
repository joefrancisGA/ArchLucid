import { getArchitectureRequestDownloadUrl } from "./downloads-blob-urls";
import { downloadScopedProxyFileGet } from "./downloads-blob-trigger-scoped-proxy";

/** Downloads architecture request JSON through the scoped proxy (browser only). */
export async function downloadArchitectureRequestJson(requestId: string): Promise<void> {
  await downloadScopedProxyFileGet(getArchitectureRequestDownloadUrl(requestId), {
    accept: "application/json",
    defaultFileName: `ArchitectureRequest-${requestId}.json`,
  });
}
