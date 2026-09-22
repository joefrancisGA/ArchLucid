import { strFromU8, unzipSync } from "fflate";

import { AZURE_EXTRACTOR_PACKAGE_RESOURCES_ENTRY } from "@/lib/read-arch-lucid-azure-package-zip";
import { findZipEntryName } from "@/lib/zip-entry-names";

export function countArchLucidAzurePackageResourcesFromBytes(bytes: Uint8Array): number | null {
  try {
    const entries = unzipSync(bytes);
    const resourcesEntry = findZipEntryName(entries, AZURE_EXTRACTOR_PACKAGE_RESOURCES_ENTRY);

    if (resourcesEntry === null) {
      return null;
    }

    const raw = entries[resourcesEntry];

    if (raw === undefined || raw.length === 0) {
      return null;
    }

    const parsed = JSON.parse(strFromU8(raw, false)) as unknown;

    if (!Array.isArray(parsed)) {
      return null;
    }

    return parsed.length;
  } catch {
    return null;
  }
}

export async function countArchLucidAzurePackageResourcesFromFile(file: File): Promise<number | null> {
  const buffer = await file.arrayBuffer();

  return countArchLucidAzurePackageResourcesFromBytes(new Uint8Array(buffer));
}
