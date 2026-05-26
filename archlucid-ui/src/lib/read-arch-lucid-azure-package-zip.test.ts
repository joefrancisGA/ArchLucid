import { describe, expect, it } from "vitest";
import { strToU8, zipSync } from "fflate";

import { buildWizardPrefillFromArchLucidAzureManifest } from "@/lib/apply-arch-lucid-azure-package-manifest-to-wizard";
import {
  readArchLucidAzurePackageZipFromBytes,
  readArchLucidAzurePackageZipFromFile,
} from "@/lib/read-arch-lucid-azure-package-zip";
import { ARCH_LUCID_AZURE_EXTRACTOR_MAX_ZIP_BYTES } from "@/lib/azure-extractor-upload-limits";

function zipWithManifest(manifest: Record<string, unknown>): Uint8Array {
  return zipSync({ "manifest.json": strToU8(JSON.stringify(manifest)) });
}

describe("readArchLucidAzurePackageZipFromBytes", () => {
  it("returns manifest for a valid packager-shaped ZIP", () => {
    const bytes = zipWithManifest({
      schemaVersion: 1,
      scriptVersion: "0.2.0",
      collectionTimestamp: "2026-05-17T12:00:00.000Z",
      subscriptionId: "11111111-1111-1111-1111-111111111111",
      scope: "/subscriptions/11111111-1111-1111-1111-111111111111/resourceGroups/RgName",
    });

    const result = readArchLucidAzurePackageZipFromBytes(bytes);
    expect(result.ok).toBe(true);

    if (!result.ok) {
      return;
    }

    expect(result.manifest.subscriptionId).toContain("1111");
    expect(result.manifest.scope).toContain("resourceGroups");
  });

  it("rejects unsupported schemaVersion before upload", () => {
    const bytes = zipWithManifest({
      schemaVersion: 2,
      scriptVersion: "0.2.0",
      collectionTimestamp: "2026-05-17T12:00:00.000Z",
      subscriptionId: "11111111-1111-1111-1111-111111111111",
      scope: "/subscriptions/11111111-1111-1111-1111-111111111111/resourceGroups/RgName",
    });

    const result = readArchLucidAzurePackageZipFromBytes(bytes);
    expect(result.ok).toBe(false);

    if (result.ok) {
      return;
    }

    expect(result.message).toContain("Required schemaVersion is 1");
  });

  it("rejects ZIPs without manifest.json", () => {
    const bytes = zipSync({ "readme.txt": strToU8("x") });
    const result = readArchLucidAzurePackageZipFromBytes(bytes);

    expect(result.ok).toBe(false);

    if (result.ok) {
      return;
    }

    expect(result.message).toContain("manifest.json");
  });
});

describe("readArchLucidAzurePackageZipFromFile", () => {
  it("rejects files over the extractor byte limit", async () => {
    const file = new File([], "big.zip");

    Object.defineProperty(file, "size", { value: ARCH_LUCID_AZURE_EXTRACTOR_MAX_ZIP_BYTES + 1 });

    const result = await readArchLucidAzurePackageZipFromFile(file);

    expect(result.ok).toBe(false);

    if (result.ok) {
      return;
    }

    expect(result.message).toContain("too large");
  });
});

describe("buildWizardPrefillFromArchLucidAzureManifest", () => {
  it("derives systemName from resource group and builds a valid description", () => {
    const prefill = buildWizardPrefillFromArchLucidAzureManifest({
      schemaVersion: 1,
      scriptVersion: "0.2.0",
      collectionTimestamp: "2026-05-17T12:00:00Z",
      subscriptionId: "11111111-1111-1111-1111-111111111111",
      scope: "/subscriptions/11111111-1111-1111-1111-111111111111/resourceGroups/MyRg",
    });

    expect(prefill.systemName).toBe("MyRg");
    expect(prefill.description !== undefined && prefill.description.length).toBeGreaterThanOrEqual(10);
    expect(prefill.topologyHints?.length).toBeGreaterThanOrEqual(1);
  });
});
