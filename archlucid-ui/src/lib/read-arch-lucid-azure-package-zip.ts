import { strFromU8, unzipSync } from "fflate";

import type { ArchLucidAzurePackageManifest } from "@/lib/arch-lucid-azure-package-manifest";
import { archLucidAzurePackageManifestSchema } from "@/lib/arch-lucid-azure-package-manifest";
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
    return { ok: false, message: "Could not read ZIP archive (file may be corrupt or not a ZIP)." };
  }

  const entryName = findManifestEntryName(entries);

  if (entryName === null) {
    return {
      ok: false,
      message: "No manifest.json found — use the ZIP produced by Get-ArchLucidAzurePackage.ps1.",
    };
  }

  const raw = entries[entryName];

  if (raw === undefined || raw.length === 0) {
    return { ok: false, message: "manifest.json in the ZIP is empty." };
  }

  let text: string;

  try {
    text = strFromU8(raw, false);
  } catch {
    return { ok: false, message: "Could not decode manifest.json as UTF-8." };
  }

  let json: unknown;

  try {
    json = JSON.parse(text) as unknown;
  } catch {
    return { ok: false, message: "manifest.json is not valid JSON." };
  }

  const parsed = archLucidAzurePackageManifestSchema.safeParse(json);

  if (!parsed.success) {
    return { ok: false, message: "manifest.json does not match the ArchLucid Azure packager shape." };
  }

  return { ok: true, manifest: parsed.data };
}

export async function readArchLucidAzurePackageZipFromFile(file: File): Promise<ReadArchLucidAzurePackageZipResult> {
  if (file.size > ARCH_LUCID_AZURE_EXTRACTOR_MAX_ZIP_BYTES) {
    const maxMb = Math.floor(ARCH_LUCID_AZURE_EXTRACTOR_MAX_ZIP_BYTES / (1024 * 1024));

    return {
      ok: false,
      message: `ZIP is too large (max ${maxMb} MB, same limit as server-side extractor upload).`,
    };
  }

  const buffer: ArrayBuffer = await file.arrayBuffer();

  return readArchLucidAzurePackageZipFromBytes(new Uint8Array(buffer));
}
