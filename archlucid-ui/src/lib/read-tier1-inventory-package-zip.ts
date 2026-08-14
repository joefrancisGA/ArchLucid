import { strFromU8, unzipSync } from "fflate";

import {
  archLucidAwsInventoryPackageManifestSchema,
  archLucidGcpInventoryPackageManifestSchema,
} from "@/lib/arch-lucid-cloud-inventory-package-manifest";
import type { ArchLucidAzurePackageManifest } from "@/lib/arch-lucid-azure-package-manifest";
import { archLucidAzurePackageManifestSchema } from "@/lib/arch-lucid-azure-package-manifest";
import {
  ARCH_LUCID_AZURE_EXTRACTOR_SUPPORTED_SCHEMA_VERSION,
  formatUnsupportedAzureExtractorSchemaVersionMessage,
} from "@/lib/arch-lucid-azure-extractor-schema-version";
import { ARCH_LUCID_AZURE_EXTRACTOR_MAX_ZIP_BYTES } from "@/lib/azure-extractor-upload-limits";
import type { CloudInventoryPlatform } from "@/lib/cloud-inventory-platform";
import { findZipEntryName } from "@/lib/zip-entry-names";

export type ReadTier1InventoryPackageZipOk = {
  ok: true;
  platform: CloudInventoryPlatform;
  manifest:
    | ArchLucidAzurePackageManifest
    | { accountId: string; collectionTimestamp: string }
    | { projectId: string; collectionTimestamp: string };
};

export type ReadTier1InventoryPackageZipErr = {
  ok: false;
  message: string;
};

export type ReadTier1InventoryPackageZipResult =
  | ReadTier1InventoryPackageZipOk
  | ReadTier1InventoryPackageZipErr;

function readManifestJson(entries: Record<string, Uint8Array>): { ok: true; json: unknown } | ReadTier1InventoryPackageZipErr {
  const entryName = findZipEntryName(entries, "manifest.json");

  if (entryName === null) {
    return { ok: false, message: "ZIP does not contain manifest.json." };
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

function ensureResourcesJsonPresent(entries: Record<string, Uint8Array>): ReadTier1InventoryPackageZipErr | null {
  const resourcesEntry = findZipEntryName(entries, "resources.json");

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

export function readTier1InventoryPackageZipFromBytes(
  bytes: Uint8Array,
  platform: CloudInventoryPlatform,
): ReadTier1InventoryPackageZipResult {
  let entries: Record<string, Uint8Array>;

  try {
    entries = unzipSync(bytes);
  } catch {
    return { ok: false, message: "Uploaded payload is not a valid ZIP archive." };
  }

  const resourcesError = ensureResourcesJsonPresent(entries);

  if (resourcesError !== null) {
    return resourcesError;
  }

  const manifestResult = readManifestJson(entries);

  if (!manifestResult.ok) {
    return manifestResult;
  }

  if (platform === "azure") {
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

    return { ok: true, platform, manifest: parsed.data };
  }

  if (platform === "aws") {
    const parsed = archLucidAwsInventoryPackageManifestSchema.safeParse(manifestResult.json);

    if (!parsed.success || parsed.data.schemaVersion !== 1) {
      return {
        ok: false,
        message: "Missing or unsupported schemaVersion in manifest.json (required value: 1).",
      };
    }

    return {
      ok: true,
      platform,
      manifest: {
        accountId: parsed.data.accountId,
        collectionTimestamp: parsed.data.collectionTimestamp,
      },
    };
  }

  const parsed = archLucidGcpInventoryPackageManifestSchema.safeParse(manifestResult.json);

  if (!parsed.success || parsed.data.schemaVersion !== 1) {
    return {
      ok: false,
      message: "Missing or unsupported schemaVersion in manifest.json (required value: 1).",
    };
  }

  return {
    ok: true,
    platform,
    manifest: {
      projectId: parsed.data.projectId,
      collectionTimestamp: parsed.data.collectionTimestamp,
    },
  };
}

const TIER1_INVENTORY_PLATFORM_PROBE_ORDER: readonly CloudInventoryPlatform[] = ["azure", "aws", "gcp"];

/** Infer cloud platform from a Tier-1 inventory ZIP when the wizard evidence source is unknown. */
export async function detectTier1InventoryPlatformFromFile(
  file: File,
): Promise<CloudInventoryPlatform | null> {
  for (const platform of TIER1_INVENTORY_PLATFORM_PROBE_ORDER) {
    const result = await readTier1InventoryPackageZipFromFile(file, platform);

    if (result.ok) {
      return platform;
    }
  }

  return null;
}

export async function readTier1InventoryPackageZipFromFile(
  file: File,
  platform: CloudInventoryPlatform,
): Promise<ReadTier1InventoryPackageZipResult> {
  if (file.size > ARCH_LUCID_AZURE_EXTRACTOR_MAX_ZIP_BYTES) {
    const maxMb = Math.floor(ARCH_LUCID_AZURE_EXTRACTOR_MAX_ZIP_BYTES / (1024 * 1024));

    return {
      ok: false,
      message: `ZIP exceeds maximum size (${maxMb} MB). Reduce extractor scope or use chunked upload when enabled.`,
    };
  }

  const buffer: ArrayBuffer = await file.arrayBuffer();

  return readTier1InventoryPackageZipFromBytes(new Uint8Array(buffer), platform);
}
