import { describe, expect, it } from "vitest";

import {
  createAwsInventoryDemoZipFile,
  getAwsInventoryDemoZipBytes,
} from "@/lib/arch-lucid-aws-inventory-demo-scenarios";
import {
  createGcpInventoryDemoZipFile,
  getGcpInventoryDemoZipBytes,
} from "@/lib/arch-lucid-gcp-inventory-demo-scenarios";
import { validateInventoryDemoZipBytes } from "@/lib/arch-lucid-inventory-demo-scenarios";
import { readTier1InventoryPackageZipFromBytes } from "@/lib/read-tier1-inventory-package-zip";

describe("arch-lucid-aws-inventory-demo-scenarios", () => {
  it("builds a valid AWS inventory demo ZIP", () => {
    const bytes = getAwsInventoryDemoZipBytes("claims-intake-modernization");
    const result = readTier1InventoryPackageZipFromBytes(bytes, "aws");

    expect(result.ok).toBe(true);
  });

  it("creates a File with the scenario zip filename", () => {
    const file = createAwsInventoryDemoZipFile("finops-optimization-snapshot");

    expect(file.name).toBe("archlucid-demo-aws-finops-snapshot.zip");
    expect(file.type).toBe("application/zip");
  });
});

describe("arch-lucid-gcp-inventory-demo-scenarios", () => {
  it("builds a valid GCP inventory demo ZIP", () => {
    const bytes = getGcpInventoryDemoZipBytes("multi-region-saas-platform");
    const result = readTier1InventoryPackageZipFromBytes(bytes, "gcp");

    expect(result.ok).toBe(true);
  });

  it("creates a File with the scenario zip filename", () => {
    const file = createGcpInventoryDemoZipFile("claims-intake-modernization");

    expect(file.name).toBe("archlucid-demo-gcp-claims-intake.zip");
    expect(file.type).toBe("application/zip");
  });
});

describe("arch-lucid-inventory-demo-scenarios", () => {
  it("validates bundled AWS and GCP demo ZIP bytes", () => {
    expect(validateInventoryDemoZipBytes("aws", "claims-intake-modernization").ok).toBe(true);
    expect(validateInventoryDemoZipBytes("gcp", "finops-optimization-snapshot").ok).toBe(true);
  });
});
