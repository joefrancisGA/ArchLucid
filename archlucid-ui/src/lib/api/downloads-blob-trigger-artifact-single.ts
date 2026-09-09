import { getArtifactDownloadUrl } from "./downloads-blob-urls";
import { downloadScopedProxyFileGet } from "./downloads-blob-trigger-scoped-proxy";

/** Downloads one artifact file for a manifest (browser only). */
export async function downloadArtifactFile(manifestId: string, artifactId: string): Promise<void> {
  await downloadScopedProxyFileGet(getArtifactDownloadUrl(manifestId, artifactId), {
    accept: "application/octet-stream, application/json",
    defaultFileName: `artifact-${artifactId}`,
  });
}
