import { downloadScopedProxyFileGet } from "./downloads-blob-trigger-scoped-proxy";

/** Downloads server-generated manifest Markdown export for a sealed manifest version (browser only). */
export async function downloadManifestMarkdownExport(manifestVersion: string): Promise<void> {
  const trimmed = manifestVersion.trim();

  await downloadScopedProxyFileGet(
    `/api/proxy/v1/architecture/manifest/${encodeURIComponent(trimmed)}/export/download`,
    {
      accept: "text/markdown, application/json",
      defaultFileName: `architecture-export-${trimmed}.md`,
    },
  );
}
