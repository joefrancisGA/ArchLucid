import { downloadScopedProxyFileGet, openScopedProxyFileGetInNewTab } from "@/lib/api/downloads-blob-trigger";

import {
  buildLearningPlanningReportFileUrl,
  buildLearningPlanningReportJsonUrl,
} from "./learning-planning-report-urls";

export async function downloadLearningPlanningReportMarkdown(): Promise<void> {
  await downloadScopedProxyFileGet(buildLearningPlanningReportFileUrl("markdown"), {
    accept: "text/markdown, application/json",
    defaultFileName: "archlucid-improvement-planning-report.md",
  });
}

export async function downloadLearningPlanningReportJson(): Promise<void> {
  await downloadScopedProxyFileGet(buildLearningPlanningReportFileUrl("json"), {
    accept: "application/json",
    defaultFileName: "archlucid-improvement-planning-report.json",
  });
}

export async function openLearningPlanningReportJsonInNewTab(): Promise<void> {
  await openScopedProxyFileGetInNewTab(buildLearningPlanningReportJsonUrl(), {
    accept: "application/json",
  });
}
