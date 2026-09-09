import { getManifestCompareExportDownloadUrl } from "./downloads-blob-urls";
import { downloadScopedProxyFileGet } from "./downloads-blob-trigger-scoped-proxy";

function resolveManifestVersionForCompare(runId: string, manifestVersion?: string | null): string {
  const trimmedVersion = manifestVersion?.trim();

  if (trimmedVersion !== undefined && trimmedVersion.length > 0) {
    return trimmedVersion;
  }

  return runId.trim();
}

/** Downloads manifest compare markdown export for two finalized review records (browser only). */
export async function downloadManifestCompareExport(options: {
  readonly leftRunId: string;
  readonly rightRunId: string;
  readonly leftManifestVersion?: string | null;
  readonly rightManifestVersion?: string | null;
}): Promise<void> {
  const leftVersion = resolveManifestVersionForCompare(options.leftRunId, options.leftManifestVersion);
  const rightVersion = resolveManifestVersionForCompare(options.rightRunId, options.rightManifestVersion);

  await downloadScopedProxyFileGet(getManifestCompareExportDownloadUrl(leftVersion, rightVersion), {
    accept: "text/markdown, application/json",
    defaultFileName: `compare_${leftVersion}_to_${rightVersion}.md`,
    expectedContentTypePrefixes: ["text/markdown"],
  });
}
