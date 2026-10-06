import {
  isAzureExtractorDemoScenarioId,
  type AzureExtractorDemoScenarioId,
} from "@/lib/arch-lucid-azure-extractor-demo-scenarios";
import {
  isAzureLabDemoScenarioId,
  type AzureLabDemoScenarioId,
} from "@/lib/azure-lab-inventory-demo-scenarios";

export const EXTRACT_UPLOAD_PATH = "/administration/extract-upload" as const;

export const EXTRACT_UPLOAD_DEMO_SCENARIO_PARAM = "demoScenario";

export type ExtractUploadDemoScenarioId = AzureExtractorDemoScenarioId | AzureLabDemoScenarioId;

export function parseExtractUploadDemoScenarioFromSearch(
  raw: string | null | undefined,
): ExtractUploadDemoScenarioId | null {
  if (raw === null || raw === undefined) {
    return null;
  }

  const trimmed = raw.trim();

  if (!isAzureExtractorDemoScenarioId(trimmed) && !isAzureLabDemoScenarioId(trimmed)) {
    return null;
  }

  return trimmed as ExtractUploadDemoScenarioId;
}

export function extractUploadDemoScenarioHrefFromSearch(
  currentSearch: string,
  scenarioId: ExtractUploadDemoScenarioId | null,
  pathname: string = EXTRACT_UPLOAD_PATH,
): string {
  const params = new URLSearchParams(currentSearch);

  if (scenarioId === null) {
    params.delete(EXTRACT_UPLOAD_DEMO_SCENARIO_PARAM);
  } else {
    params.set(EXTRACT_UPLOAD_DEMO_SCENARIO_PARAM, scenarioId);
  }

  const nextQuery = params.toString();

  return nextQuery.length === 0 ? pathname : `${pathname}?${nextQuery}`;
}
