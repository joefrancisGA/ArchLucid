import type { ArchLucidAzurePackageManifest } from "@/lib/arch-lucid-azure-package-manifest";
import {
  createAzureExtractorDemoZipFile,
  DEFAULT_AZURE_EXTRACTOR_DEMO_SCENARIO_ID,
  getAzureExtractorDemoScenario,
  getAzureExtractorDemoZipBytes,
  type AzureExtractorDemoScenarioId,
} from "@/lib/arch-lucid-azure-extractor-demo-scenarios";

/** Default bundled demo manifest (claims intake modernization). */
export const BUNDLED_ARCH_LUCID_AZURE_PACKAGE_SAMPLE_MANIFEST: ArchLucidAzurePackageManifest =
  getAzureExtractorDemoScenario(DEFAULT_AZURE_EXTRACTOR_DEMO_SCENARIO_ID).manifest;

export const BUNDLED_ARCH_LUCID_AZURE_PACKAGE_SAMPLE_ZIP_FILENAME: string =
  getAzureExtractorDemoScenario(DEFAULT_AZURE_EXTRACTOR_DEMO_SCENARIO_ID).zipFilename;

/** In-memory ZIP matching Get-ArchLucidAzurePackage.ps1 layout for zero-config demo intake. */
export function getBundledArchLucidAzurePackageSampleZipBytes(
  scenarioId: AzureExtractorDemoScenarioId = DEFAULT_AZURE_EXTRACTOR_DEMO_SCENARIO_ID,
): Uint8Array {
  return getAzureExtractorDemoZipBytes(scenarioId);
}

/** Browser File handle for upload after review creation in zero-config demo flows. */
export function createBundledArchLucidAzurePackageSampleZipFile(
  scenarioId: AzureExtractorDemoScenarioId = DEFAULT_AZURE_EXTRACTOR_DEMO_SCENARIO_ID,
): File {
  return createAzureExtractorDemoZipFile(scenarioId);
}
