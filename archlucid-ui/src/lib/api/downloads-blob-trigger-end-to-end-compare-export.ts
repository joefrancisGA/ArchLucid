import { downloadScopedProxyFileGet } from "./downloads-blob-trigger-scoped-proxy";

export type EndToEndCompareExportFormat = "markdown" | "docx" | "file";

function buildEndToEndCompareExportUrl(
  leftRunId: string,
  rightRunId: string,
  format: EndToEndCompareExportFormat,
): string {
  const params = new URLSearchParams({
    leftRunId: leftRunId.trim(),
    rightRunId: rightRunId.trim(),
  });

  const suffix = params.toString();
  const base = `/api/proxy/v1/architecture/review/compare/end-to-end/export`;

  if (format === "docx") {
    return `${base}/docx?${suffix}`;
  }

  if (format === "file") {
    return `${base}/file?${suffix}`;
  }

  return `${base}?${suffix}`;
}

/** Downloads end-to-end compare export markdown/docx/file through the scoped proxy (browser only). */
export async function downloadEndToEndCompareExport(options: {
  readonly leftRunId: string;
  readonly rightRunId: string;
  readonly format?: EndToEndCompareExportFormat;
}): Promise<void> {
  const format = options.format ?? "file";
  const left = options.leftRunId.trim();
  const right = options.rightRunId.trim();

  if (format === "docx") {
    await downloadScopedProxyFileGet(buildEndToEndCompareExportUrl(left, right, "docx"), {
      accept: "application/vnd.openxmlformats-officedocument.wordprocessingml.document, application/json",
      defaultFileName: `end_to_end_compare_${left}_to_${right}.docx`,
      expectedContentTypePrefixes: ["application/vnd.openxmlformats-officedocument.wordprocessingml.document"],
    });

    return;
  }

  if (format === "markdown") {
    await downloadScopedProxyFileGet(buildEndToEndCompareExportUrl(left, right, "markdown"), {
      accept: "text/markdown, application/json",
      defaultFileName: `end_to_end_compare_${left}_to_${right}.md`,
      expectedContentTypePrefixes: ["text/markdown"],
    });

    return;
  }

  await downloadScopedProxyFileGet(buildEndToEndCompareExportUrl(left, right, "file"), {
    accept: "text/markdown, application/json",
    defaultFileName: `end_to_end_compare_${left}_to_${right}.md`,
    expectedContentTypePrefixes: ["text/markdown"],
  });
}
