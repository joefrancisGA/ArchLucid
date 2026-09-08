import { getArchitecturePackageDocxUrl } from "./downloads-blob-urls";
import { downloadScopedProxyFileGet } from "./downloads-blob-trigger-scoped-proxy";

/** Downloads architecture decision package DOCX through the scoped proxy (browser only). */
export async function downloadArchitecturePackageDocx(
  runId: string,
  compareWithRunId?: string,
  opts?: { explainRun?: boolean; includeComparisonExplanation?: boolean },
): Promise<void> {
  await downloadScopedProxyFileGet(getArchitecturePackageDocxUrl(runId, compareWithRunId, opts), {
    accept: "application/vnd.openxmlformats-officedocument.wordprocessingml.document, application/json",
    defaultFileName: `architecture-package-${runId}.docx`,
    expectedContentTypePrefixes: ["application/vnd.openxmlformats-officedocument.wordprocessingml.document"],
  });
}
