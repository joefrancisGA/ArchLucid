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

  it("accepts Azure inventory ZIP with current packager schemaVersion 2", () => {
    const bytes = zipEntries({
      "manifest.json": {
        schemaVersion: 2,
        scriptVersion: "0.4.0",
        collectionTimestamp: "2026-06-25T12:00:00.000Z",
        subscriptionId: "11111111-1111-1111-1111-111111111111",
        scope: "/subscriptions/11111111-1111-1111-1111-111111111111",
        completenessScore: 1,
        warnings: [],
        errors: [],
        resourceCount: 0,
        captureMethod: "CustomerScript",
        collectorVersion: "0.4.0",
      },
      "resources.json": [],
    });

    const result = readTier1InventoryPackageZipFromBytes(bytes, "azure");

    expect(result.ok).toBe(true);
  });

  it("rejects Azure inventory ZIP with schemaVersion outside 1–2", () => {
    const bytes = zipEntries({
      "manifest.json": {
        schemaVersion: 99,
        scriptVersion: "0.4.0",
        collectionTimestamp: "2026-06-25T12:00:00.000Z",
        subscriptionId: "11111111-1111-1111-1111-111111111111",
        scope: "/subscriptions/11111111-1111-1111-1111-111111111111",
      },
      "resources.json": [],
    });

    const result = readTier1InventoryPackageZipFromBytes(bytes, "azure");

    expect(result.ok).toBe(false);

    if (result.ok) {
      return;
    }

    expect(result.message).toContain("Supported schema versions: 1–2");
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
