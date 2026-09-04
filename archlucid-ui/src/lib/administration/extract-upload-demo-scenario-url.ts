import {
  isAzureExtractorDemoScenarioId,
  type AzureExtractorDemoScenarioId,
} from "@/lib/arch-lucid-azure-extractor-demo-scenarios";

export const EXTRACT_UPLOAD_PATH = "/administration/extract-upload" as const;

export const EXTRACT_UPLOAD_DEMO_SCENARIO_PARAM = "demoScenario";

export function parseExtractUploadDemoScenarioFromSearch(
  raw: string | null | undefined,
): AzureExtractorDemoScenarioId | null {
  if (raw === null || raw === undefined) {
    return null;
  }

  const trimmed = raw.trim();

  if (!isAzureExtractorDemoScenarioId(trimmed)) {
    return null;
  }

  return trimmed;
}

export function extractUploadDemoScenarioHrefFromSearch(
  currentSearch: string,
  scenarioId: AzureExtractorDemoScenarioId | null,
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
