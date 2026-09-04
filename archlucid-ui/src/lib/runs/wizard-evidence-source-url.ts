import {
  isSelectableWizardEvidenceSourceId,
  type WizardEvidenceSourceId,
} from "@/lib/wizard-evidence-source-options";
import { isAzureExtractorDemoScenarioId } from "@/lib/arch-lucid-azure-extractor-demo-scenarios";
import type { DemoReviewScenarioId } from "@/lib/arch-lucid-azure-extractor-demo-scenarios";
import { NEW_RUN_WIZARD_PATH } from "@/lib/runs/quick-family-wizard-step-url";

export const WIZARD_EVIDENCE_SOURCE_PARAM = "evidenceSource";
export const WIZARD_EVIDENCE_DEMO_SCENARIO_PARAM = "demoScenario";

export type WizardEvidenceSourceUrlState = {
  readonly evidenceSourceId: WizardEvidenceSourceId | null;
  readonly demoScenarioId: DemoReviewScenarioId | null;
};

export function parseWizardEvidenceSourceFromSearch(raw: string | null | undefined): WizardEvidenceSourceId | null {
  if (raw === null || raw === undefined) {
    return null;
  }

  const trimmed = raw.trim();

  if (!isSelectableWizardEvidenceSourceId(trimmed)) {
    return null;
  }

  return trimmed;
}

export function parseWizardEvidenceDemoScenarioFromSearch(
  raw: string | null | undefined,
): DemoReviewScenarioId | null {
  if (raw === null || raw === undefined) {
    return null;
  }

  const trimmed = raw.trim();

  if (!isAzureExtractorDemoScenarioId(trimmed)) {
    return null;
  }

  return trimmed;
}

export function wizardEvidenceSourceHrefFromSearch(
  currentSearch: string,
  state: WizardEvidenceSourceUrlState,
  pathname: string = NEW_RUN_WIZARD_PATH,
): string {
  const params = new URLSearchParams(currentSearch);

  if (state.evidenceSourceId === null) {
    params.delete(WIZARD_EVIDENCE_SOURCE_PARAM);
  } else {
    params.set(WIZARD_EVIDENCE_SOURCE_PARAM, state.evidenceSourceId);
  }

  if (state.demoScenarioId === null) {
    params.delete(WIZARD_EVIDENCE_DEMO_SCENARIO_PARAM);
  } else {
    params.set(WIZARD_EVIDENCE_DEMO_SCENARIO_PARAM, state.demoScenarioId);
  }

  const nextQuery = params.toString();

  return nextQuery.length === 0 ? pathname : `${pathname}?${nextQuery}`;
}
