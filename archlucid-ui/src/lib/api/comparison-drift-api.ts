import { downloadScopedProxyFileGet } from "./downloads-blob-trigger-scoped-proxy";

/** Proxy URL for comparison drift report file download (markdown/html/docx). */
export function getComparisonDriftReportDownloadUrl(
  comparisonRecordId: string,
  format: "markdown" | "html" | "docx" = "markdown",
): string {
  const params = new URLSearchParams();
  params.set("format", format);

  return `/api/proxy/v1/architecture/comparisons/${encodeURIComponent(comparisonRecordId.trim())}/drift-report?${params.toString()}`;
}

/** Downloads a comparison drift report through the scoped proxy (browser only). */
export async function downloadComparisonDriftReport(options: {
  readonly comparisonRecordId: string;
  readonly format?: "markdown" | "html" | "docx";
  readonly defaultFileName?: string;
}): Promise<void> {
  const format = options.format ?? "markdown";
  const extension = format === "docx" ? "docx" : format === "html" ? "html" : "md";
  const defaultFileName =
    options.defaultFileName ?? `comparison_drift_${options.comparisonRecordId.trim()}.${extension}`;

  await downloadScopedProxyFileGet(getComparisonDriftReportDownloadUrl(options.comparisonRecordId, format), {
    accept:
      format === "docx"
        ? "application/vnd.openxmlformats-officedocument.wordprocessingml.document, application/json"
        : format === "html"
          ? "text/html, application/json"
          : "text/markdown, application/json",
    defaultFileName,
    expectedContentTypePrefixes:
      format === "docx"
        ? ["application/vnd.openxmlformats-officedocument.wordprocessingml.document"]
        : format === "html"
          ? ["text/html"]
          : ["text/markdown"],
  });
}
