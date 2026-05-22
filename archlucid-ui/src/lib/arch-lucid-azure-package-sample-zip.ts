import { strToU8, zipSync } from "fflate";

import type { ArchLucidAzurePackageManifest } from "@/lib/arch-lucid-azure-package-manifest";

/** Stable manifest embedded in the baseline-first wizard “Try with Sample Data” control. */
export const BUNDLED_ARCH_LUCID_AZURE_PACKAGE_SAMPLE_MANIFEST: ArchLucidAzurePackageManifest = {
  schemaVersion: 1,
  scriptVersion: "0.2.0-sample",
  collectionTimestamp: "2026-05-21T12:00:00.000Z",
  subscriptionId: "11111111-1111-1111-1111-111111111111",
  scope: "/subscriptions/11111111-1111-1111-1111-111111111111/resourceGroups/SampleRg",
};

let cachedSampleZipBytes: Uint8Array | null = null;

/** In-memory ZIP matching Get-ArchLucidAzurePackage.ps1 layout (manifest.json only). */
export function getBundledArchLucidAzurePackageSampleZipBytes(): Uint8Array {
  if (cachedSampleZipBytes !== null) {
    return cachedSampleZipBytes;
  }

  cachedSampleZipBytes = zipSync({
    "manifest.json": strToU8(JSON.stringify(BUNDLED_ARCH_LUCID_AZURE_PACKAGE_SAMPLE_MANIFEST)),
  });

  return cachedSampleZipBytes;
}
