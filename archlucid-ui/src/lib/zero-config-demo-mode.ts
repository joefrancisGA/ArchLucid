import type { UseFormSetValue } from "react-hook-form";

import { buildWizardPrefillFromArchLucidAzureManifest } from "@/lib/apply-arch-lucid-azure-package-manifest-to-wizard";
import {
  createBundledArchLucidAzurePackageSampleZipFile,
  getBundledArchLucidAzurePackageSampleZipBytes,
} from "@/lib/arch-lucid-azure-package-sample-zip";
import { readArchLucidAzurePackageZipFromBytes } from "@/lib/read-arch-lucid-azure-package-zip";
import type { WizardFormValues } from "@/lib/wizard-schema";

/** Query flag for one-click sample review intake (`/reviews/new?zeroConfig=1`). */
export const ZERO_CONFIG_DEMO_QUERY_KEY = "zeroConfig";

export const ZERO_CONFIG_DEMO_WIZARD_HREF = `/reviews/new?${ZERO_CONFIG_DEMO_QUERY_KEY}=1`;

export const ZERO_CONFIG_DEMO_TRY_SAMPLE_LABEL = "Try with Sample Data";

export type ZeroConfigDemoApplyResult =
  | { readonly ok: true }
  | { readonly ok: false; readonly message: string };

export function isZeroConfigDemoQuery(
  searchParams: Pick<URLSearchParams, "get"> | null | undefined,
): boolean {
  const raw = searchParams?.get(ZERO_CONFIG_DEMO_QUERY_KEY)?.trim().toLowerCase() ?? "";

  return raw === "1" || raw === "true" || raw === "yes";
}

export function applyBundledSamplePackageToWizard(
  setValue: UseFormSetValue<WizardFormValues>,
  onPendingFileChange: (file: File | null) => void,
): ZeroConfigDemoApplyResult {
  const zipResult = readArchLucidAzurePackageZipFromBytes(getBundledArchLucidAzurePackageSampleZipBytes());

  if (!zipResult.ok) {
    return { ok: false, message: zipResult.message };
  }

  const prefill = buildWizardPrefillFromArchLucidAzureManifest(zipResult.manifest);

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
  onPendingFileChange(createBundledArchLucidAzurePackageSampleZipFile());

  return { ok: true };
}
