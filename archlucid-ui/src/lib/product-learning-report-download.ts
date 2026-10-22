import {
  downloadScopedProxyFileGet,
  openScopedProxyFileGetInNewTab,
} from "@/lib/api/downloads-blob-trigger";

import {
  buildProductLearningReportFileUrl,
  buildProductLearningReportJsonUrl,
} from "./product-learning-report-urls";

export async function downloadProductLearningReportMarkdown(since: string | null): Promise<void> {
  await downloadScopedProxyFileGet(buildProductLearningReportFileUrl("markdown", since), {
    accept: "text/markdown, application/json",
    defaultFileName: "archlucid-pilot-feedback-report.md",
  });
}

export async function downloadProductLearningReportJson(since: string | null): Promise<void> {
  await downloadScopedProxyFileGet(buildProductLearningReportFileUrl("json", since), {
    accept: "application/json",
    defaultFileName: "archlucid-pilot-feedback-report.json",
  });
}

export async function openProductLearningReportJsonInNewTab(since: string | null): Promise<void> {
  await openScopedProxyFileGetInNewTab(buildProductLearningReportJsonUrl(since), {
    accept: "application/json",
  });
}
