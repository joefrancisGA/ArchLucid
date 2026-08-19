import { describe, expect, it } from "vitest";
import { strToU8, zipSync } from "fflate";

import { readTier1InventoryPackageZipFromBytes } from "@/lib/read-tier1-inventory-package-zip";

function zipEntries(entries: Record<string, unknown>): Uint8Array {
  const packed: Record<string, Uint8Array> = {};

  for (const [key, value] of Object.entries(entries)) {
    packed[key] = typeof value === "string" ? strToU8(value) : strToU8(JSON.stringify(value));
  }

  return zipSync(packed);
}

describe("readTier1InventoryPackageZipFromBytes", () => {
  it("accepts valid AWS inventory ZIP with manifest and resources", () => {
    const bytes = zipEntries({
      "manifest.json": {
        schemaVersion: 1,
        scriptVersion: "1.0.0",
        collectionTimestamp: "2026-06-25T12:00:00.000Z",
        cloudProvider: "Aws",
        accountId: "123456789012",
        scope: "account",
      },
      "resources.json": [],
    });

    const result = readTier1InventoryPackageZipFromBytes(bytes, "aws");

    expect(result.ok).toBe(true);
  });

  it("rejects ZIP missing resources.json", () => {
    const bytes = zipEntries({
      "manifest.json": {
        schemaVersion: 1,
        scriptVersion: "1.0.0",
        collectionTimestamp: "2026-06-25T12:00:00.000Z",
        accountId: "123456789012",
      },
    });

    const result = readTier1InventoryPackageZipFromBytes(bytes, "aws");

    expect(result.ok).toBe(false);

    if (result.ok) {
      return;
    }

    expect(result.message).toContain("resources.json");
  });

  it("accepts valid GCP inventory ZIP", () => {
    const bytes = zipEntries({
      "manifest.json": {
        schemaVersion: 1,
        scriptVersion: "1.0.0",
        collectionTimestamp: "2026-06-25T12:00:00.000Z",
        cloudProvider: "Gcp",
        projectId: "my-project",
        scope: "project",
      },
      "resources.json": { items: [] },
    });

    const result = readTier1InventoryPackageZipFromBytes(bytes, "gcp");

    expect(result.ok).toBe(true);
  });
});
