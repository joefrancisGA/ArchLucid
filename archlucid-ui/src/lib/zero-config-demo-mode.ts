import type { UseFormSetValue } from "react-hook-form";

import {
  buildWizardPrefillFromDemoScenario,
  createAzureExtractorDemoZipFile,
  DEFAULT_AZURE_EXTRACTOR_DEMO_SCENARIO_ID,
  getAzureExtractorDemoScenario,
  getAzureExtractorDemoZipBytes,
  isAzureExtractorDemoScenarioId,
  resolveAzureExtractorDemoScenarioId,
  type AzureExtractorDemoScenarioId,
} from "@/lib/arch-lucid-azure-extractor-demo-scenarios";
import { readArchLucidAzurePackageZipFromBytes } from "@/lib/read-arch-lucid-azure-package-zip";
import type { WizardFormValues } from "@/lib/wizard-schema";

/** Query flag for one-click demo review intake (`/reviews/new?zeroConfig=1`). */
export const ZERO_CONFIG_DEMO_QUERY_KEY = "zeroConfig";

export const ZERO_CONFIG_DEMO_WIZARD_HREF = `/reviews/new?${ZERO_CONFIG_DEMO_QUERY_KEY}=1`;

export const ZERO_CONFIG_DEMO_TRY_DEMO_LABEL = "Try with Demo Data";

/** @deprecated Use {@link ZERO_CONFIG_DEMO_TRY_DEMO_LABEL}. */
export const ZERO_CONFIG_DEMO_TRY_SAMPLE_LABEL = ZERO_CONFIG_DEMO_TRY_DEMO_LABEL;

export type ZeroConfigDemoApplyResult =
  | { readonly ok: true }
  | { readonly ok: false; readonly message: string };

export function isZeroConfigDemoQuery(
  searchParams: Pick<URLSearchParams, "get"> | null | undefined,
): boolean {
  const raw = searchParams?.get(ZERO_CONFIG_DEMO_QUERY_KEY)?.trim().toLowerCase() ?? "";

  if (raw.length === 0) {
    return false;
  }

  if (raw === "1" || raw === "true" || raw === "yes") {
    return true;
  }

  return isAzureExtractorDemoScenarioId(raw);
}

export function resolveZeroConfigDemoScenarioId(
  searchParams: Pick<URLSearchParams, "get"> | null | undefined,
): AzureExtractorDemoScenarioId {
  const raw = searchParams?.get(ZERO_CONFIG_DEMO_QUERY_KEY)?.trim() ?? "";

  if (raw.length === 0) {
    return DEFAULT_AZURE_EXTRACTOR_DEMO_SCENARIO_ID;
  }

  if (raw === "1" || raw === "true" || raw === "yes") {
    return DEFAULT_AZURE_EXTRACTOR_DEMO_SCENARIO_ID;
  }

  return resolveAzureExtractorDemoScenarioId(raw);
}

export function applyBundledDemoPackageToWizard(
  scenarioId: AzureExtractorDemoScenarioId,
  setValue: UseFormSetValue<WizardFormValues>,
  onPendingFileChange: (file: File | null) => void,
): ZeroConfigDemoApplyResult {
  const scenario = getAzureExtractorDemoScenario(scenarioId);
  const zipResult = readArchLucidAzurePackageZipFromBytes(getAzureExtractorDemoZipBytes(scenarioId));

  if (!zipResult.ok) {
    return { ok: false, message: zipResult.message };
  }

  const prefill = buildWizardPrefillFromDemoScenario(scenario);

  if (prefill.description !== undefined) {
    setValue("description", prefill.description, { shouldValidate: true, shouldDirty: true });
  }

  if (prefill.systemName !== undefined) {
    setValue("systemName", prefill.systemName, { shouldValidate: true, shouldDirty: true });
  }

  if (prefill.topologyHints !== undefined) {
    setValue("topologyHints", prefill.topologyHints, { shouldValidate: true, shouldDirty: true });
  }

  setValue("cloudProvider", "Azure", { shouldValidate: true, shouldDirty: true });
  onPendingFileChange(createAzureExtractorDemoZipFile(scenarioId));

  return { ok: true };
}

/** Applies the default bundled demo scenario (claims intake modernization). */
export function applyBundledSamplePackageToWizard(
  setValue: UseFormSetValue<WizardFormValues>,
  onPendingFileChange: (file: File | null) => void,
  scenarioId: AzureExtractorDemoScenarioId = DEFAULT_AZURE_EXTRACTOR_DEMO_SCENARIO_ID,
): ZeroConfigDemoApplyResult {
  return applyBundledDemoPackageToWizard(scenarioId, setValue, onPendingFileChange);
}
