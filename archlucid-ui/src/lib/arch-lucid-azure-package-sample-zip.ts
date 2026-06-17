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

export const BUNDLED_ARCH_LUCID_AZURE_PACKAGE_SAMPLE_ZIP_FILENAME = "archlucid-azure-sample-package.zip";

const BUNDLED_SAMPLE_README =
  "ArchLucid Azure sample package — sanitized demonstration inventory. Do not treat as customer evidence.";

const BUNDLED_SAMPLE_RESOURCES = {
  resources: [
    {
      name: "sample-web",
      type: "Microsoft.Web/sites",
      location: "eastus",
      resourceGroup: "SampleRg",
    },
    {
      name: "sample-sql",
      type: "Microsoft.Sql/servers/databases",
      location: "eastus",
      resourceGroup: "SampleRg",
    },
    {
      name: "sample-kv",
      type: "Microsoft.KeyVault/vaults",
      location: "eastus",
      resourceGroup: "SampleRg",
    },
  ],
};

const BUNDLED_SAMPLE_DIAGRAM =
  "graph TD\n  WebApp[App Service sample-web] --> SqlDb[Azure SQL sample-sql]\n  WebApp --> KeyVault[Key Vault sample-kv]";

let cachedSampleZipBytes: Uint8Array | null = null;

/** In-memory ZIP matching Get-ArchLucidAzurePackage.ps1 layout for zero-config demo intake. */
export function getBundledArchLucidAzurePackageSampleZipBytes(): Uint8Array {
  if (cachedSampleZipBytes !== null) {
    return cachedSampleZipBytes;
  }

  cachedSampleZipBytes = zipSync({
    "manifest.json": strToU8(JSON.stringify(BUNDLED_ARCH_LUCID_AZURE_PACKAGE_SAMPLE_MANIFEST)),
    "resources.json": strToU8(JSON.stringify(BUNDLED_SAMPLE_RESOURCES)),
    "README.txt": strToU8(BUNDLED_SAMPLE_README),
    "architecture-diagram.mmd": strToU8(BUNDLED_SAMPLE_DIAGRAM),
  });

  return cachedSampleZipBytes;
}

/** Browser File handle for upload after review creation in zero-config demo flows. */
export function createBundledArchLucidAzurePackageSampleZipFile(): File {
  const bytes = getBundledArchLucidAzurePackageSampleZipBytes();

  return new File([bytes], BUNDLED_ARCH_LUCID_AZURE_PACKAGE_SAMPLE_ZIP_FILENAME, {
    type: "application/zip",
  });
}
