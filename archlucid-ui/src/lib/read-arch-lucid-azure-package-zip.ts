import { strFromU8, unzipSync } from "fflate";

import type { ArchLucidAzurePackageManifest } from "@/lib/arch-lucid-azure-package-manifest";
import { archLucidAzurePackageManifestSchema } from "@/lib/arch-lucid-azure-package-manifest";
import {
  ARCH_LUCID_AZURE_EXTRACTOR_SUPPORTED_SCHEMA_VERSION,
  formatUnsupportedAzureExtractorSchemaVersionMessage,
} from "@/lib/arch-lucid-azure-extractor-schema-version";
import { ARCH_LUCID_AZURE_EXTRACTOR_MAX_ZIP_BYTES } from "@/lib/azure-extractor-upload-limits";

export type ReadArchLucidAzurePackageZipOk = {
  ok: true;
  manifest: ArchLucidAzurePackageManifest;
};

export type ReadArchLucidAzurePackageZipErr = {
  ok: false;
  message: string;
};

export type ReadArchLucidAzurePackageZipResult = ReadArchLucidAzurePackageZipOk | ReadArchLucidAzurePackageZipErr;

function findManifestEntryName(entries: Record<string, Uint8Array>): string | null {
  for (const key of Object.keys(entries)) {
    const normalized = key.replace(/\\/g, "/");
    const base = normalized.split("/").pop() ?? "";

    if (base.toLowerCase() === "manifest.json") {
      return key;
    }
  }

  return null;
}

export function readArchLucidAzurePackageZipFromBytes(bytes: Uint8Array): ReadArchLucidAzurePackageZipResult {
  let entries: Record<string, Uint8Array>;

  try {
    entries = unzipSync(bytes);
  } catch {
    return { ok: false, message: "Uploaded payload is not a valid ZIP archive." };
  }

  const entryName = findManifestEntryName(entries);

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

  let json: unknown;

  try {
    json = JSON.parse(text) as unknown;
  } catch {
    return { ok: false, message: "manifest.json is not valid JSON." };
  }

  const parsed = archLucidAzurePackageManifestSchema.safeParse(json);

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
