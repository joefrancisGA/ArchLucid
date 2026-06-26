import { strFromU8, unzipSync } from "fflate";

import type { ArchLucidAzurePackageManifest } from "@/lib/arch-lucid-azure-package-manifest";
import { archLucidAzurePackageManifestSchema } from "@/lib/arch-lucid-azure-package-manifest";
import {
  ARCH_LUCID_AZURE_EXTRACTOR_SUPPORTED_SCHEMA_VERSION,
  formatUnsupportedAzureExtractorSchemaVersionMessage,
} from "@/lib/arch-lucid-azure-extractor-schema-version";
import { ARCH_LUCID_AZURE_EXTRACTOR_MAX_ZIP_BYTES } from "@/lib/azure-extractor-upload-limits";
import { findZipEntryName } from "@/lib/zip-entry-names";

/** Mirrors `AzureExtractorPackageZipValidator` entry names in ArchLucid.Core. */
export const AZURE_EXTRACTOR_PACKAGE_MANIFEST_ENTRY = "manifest.json";

export const AZURE_EXTRACTOR_PACKAGE_RESOURCES_ENTRY = "resources.json";

export type ReadArchLucidAzurePackageZipOk = {
  ok: true;
  manifest: ArchLucidAzurePackageManifest;
};

export type ReadArchLucidAzurePackageZipErr = {
  ok: false;
  message: string;
};

export type ReadArchLucidAzurePackageZipResult = ReadArchLucidAzurePackageZipOk | ReadArchLucidAzurePackageZipErr;

function ensureResourcesJsonPresent(entries: Record<string, Uint8Array>): ReadArchLucidAzurePackageZipErr | null {
  const resourcesEntry = findZipEntryName(entries, AZURE_EXTRACTOR_PACKAGE_RESOURCES_ENTRY);

  if (resourcesEntry === null) {
    return {
      ok: false,
      message: "ZIP does not contain resources.json (required extractor output).",
    };
  }

  const raw = entries[resourcesEntry];

  if (raw === undefined || raw.length === 0) {
    return {
      ok: false,
      message: "ZIP does not contain resources.json (required extractor output).",
    };
  }

  return null;
}

function readManifestJson(entries: Record<string, Uint8Array>): { ok: true; json: unknown } | ReadArchLucidAzurePackageZipErr {
  const entryName = findZipEntryName(entries, AZURE_EXTRACTOR_PACKAGE_MANIFEST_ENTRY);

  if (entryName === null) {
    return {
      ok: false,
      message: "ZIP does not contain manifest.json.",
    };
  }

  const raw = entries[entryName];

  if (raw === undefined || raw.length === 0) {
    return {
      ok: false,
      message: "Missing or unsupported schemaVersion in manifest.json (required value: 1).",
    };
  }

  let text: string;

  try {
    text = strFromU8(raw, false);
  } catch {
    return { ok: false, message: "manifest.json is not valid JSON." };
  }

  try {
    return { ok: true, json: JSON.parse(text) as unknown };
  } catch {
    return { ok: false, message: "manifest.json is not valid JSON." };
  }
}

export function readArchLucidAzurePackageZipFromBytes(bytes: Uint8Array): ReadArchLucidAzurePackageZipResult {
  let entries: Record<string, Uint8Array>;

  try {
    entries = unzipSync(bytes);
  } catch {
    return { ok: false, message: "Uploaded payload is not a valid ZIP archive." };
  }

  const manifestResult = readManifestJson(entries);

  if (!manifestResult.ok) {
    return manifestResult;
  }

  const resourcesError = ensureResourcesJsonPresent(entries);

  if (resourcesError !== null) {
    return resourcesError;
  }

  const parsed = archLucidAzurePackageManifestSchema.safeParse(manifestResult.json);

  if (!parsed.success) {
    return {
      ok: false,
      message: "Missing or unsupported schemaVersion in manifest.json (required value: 1).",
    };
  }

  if (parsed.data.schemaVersion !== ARCH_LUCID_AZURE_EXTRACTOR_SUPPORTED_SCHEMA_VERSION) {
    return {
      ok: false,
      message: formatUnsupportedAzureExtractorSchemaVersionMessage(parsed.data.schemaVersion),
    };
  }

  return { ok: true, manifest: parsed.data };
}

export async function readArchLucidAzurePackageZipFromFile(file: File): Promise<ReadArchLucidAzurePackageZipResult> {
  if (file.size > ARCH_LUCID_AZURE_EXTRACTOR_MAX_ZIP_BYTES) {
    const maxMb = Math.floor(ARCH_LUCID_AZURE_EXTRACTOR_MAX_ZIP_BYTES / (1024 * 1024));

    return {
      ok: false,
      message: `ZIP exceeds maximum size (${maxMb} MB). Reduce extractor scope or use chunked upload when enabled.`,
    };
  }

  const buffer: ArrayBuffer = await file.arrayBuffer();

  return readArchLucidAzurePackageZipFromBytes(new Uint8Array(buffer));
}
