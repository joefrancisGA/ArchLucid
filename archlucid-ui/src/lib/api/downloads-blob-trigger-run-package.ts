import {
  getRunPackageExportUrl,
  type RunPackageExportFormat,
} from "./downloads-blob-urls";
import { downloadScopedProxyFileGet } from "./downloads-blob-trigger-scoped-proxy";

/** Downloads run package export (DOCX/PDF/HTML) through the scoped proxy (browser only). */
export async function downloadRunPackageExport(
  runId: string,
  format: RunPackageExportFormat,
): Promise<void> {
  const defaultFileName =
    format === "docx"
      ? `run-package-${runId}.docx`
      : format === "pdf"
        ? `run-package-${runId}.pdf`
        : `run-package-${runId}.html`;

  await downloadScopedProxyFileGet(getRunPackageExportUrl(runId, format), {
    accept:
      format === "docx"
        ? "application/vnd.openxmlformats-officedocument.wordprocessingml.document, application/json"
        : format === "pdf"
          ? "application/pdf, application/json"
          : "text/html, application/json",
    defaultFileName,
    expectedContentTypePrefixes:
      format === "docx"
        ? ["application/vnd.openxmlformats-officedocument.wordprocessingml.document"]
        : format === "pdf"
          ? ["application/pdf"]
          : ["text/html"],
  });
}
