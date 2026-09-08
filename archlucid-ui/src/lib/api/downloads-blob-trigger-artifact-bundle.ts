import { getBundleDownloadUrl, getTraceabilityBundleDownloadUrl } from "./downloads-blob-urls";
import { downloadScopedProxyFileGet } from "./downloads-blob-trigger-scoped-proxy";

/** Downloads artifact bundle ZIP for a manifest (browser only). */
export async function downloadArtifactBundleZip(manifestId: string): Promise<void> {
  await downloadScopedProxyFileGet(getBundleDownloadUrl(manifestId), {
    accept: "application/zip, application/json",
    defaultFileName: `artifact-bundle-${manifestId}.zip`,
    expectedContentTypePrefixes: ["application/zip"],
  });
}

/** Downloads traceability bundle ZIP for a run (browser only). */
export async function downloadTraceabilityBundleZip(runId: string): Promise<void> {
  await downloadScopedProxyFileGet(getTraceabilityBundleDownloadUrl(runId), {
    accept: "application/zip, application/json",
    defaultFileName: `traceability-bundle-${runId}.zip`,
    expectedContentTypePrefixes: ["application/zip"],
  });
}
