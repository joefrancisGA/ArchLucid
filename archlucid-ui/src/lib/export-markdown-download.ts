export function buildGoldenManifestMarkdownFilename(runId: string, manifestId?: string | null): string {
  const safe = (s: string): string =>
    s
      .trim()
      .replace(/[^a-zA-Z0-9._-]+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 120);

  const primary = safe(runId.length > 0 ? runId : manifestId ?? "manifest");

  return `golden-manifest-${primary || "export"}.md`;
}

/**
 * Triggers a one-shot download of Markdown content in the browser.
 */
export function triggerGoldenManifestMarkdownDownload(markdown: string, filename: string): void {
  const blob = new Blob([markdown], { type: "text/markdown;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");

  anchor.href = url;
  anchor.download = filename;
  anchor.rel = "noopener";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}
