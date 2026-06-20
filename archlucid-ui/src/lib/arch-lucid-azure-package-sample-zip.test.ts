import { describe, expect, it } from "vitest";

import { buildWizardPrefillFromArchLucidAzureManifest } from "@/lib/apply-arch-lucid-azure-package-manifest-to-wizard";
import {
  BUNDLED_ARCH_LUCID_AZURE_PACKAGE_SAMPLE_MANIFEST,
  createBundledArchLucidAzurePackageSampleZipFile,
  getBundledArchLucidAzurePackageSampleZipBytes,
} from "@/lib/arch-lucid-azure-package-sample-zip";
import { readArchLucidAzurePackageZipFromBytes } from "@/lib/read-arch-lucid-azure-package-zip";
import { unzipSync } from "fflate";

describe("arch-lucid-azure-package-sample-zip", () => {
  it("ships a valid default demo ZIP that prefills ClaimsIntakeRg", () => {
    const result = readArchLucidAzurePackageZipFromBytes(getBundledArchLucidAzurePackageSampleZipBytes());

    expect(result.ok).toBe(true);

    if (!result.ok) {
      return;
    }

    expect(result.manifest).toEqual(BUNDLED_ARCH_LUCID_AZURE_PACKAGE_SAMPLE_MANIFEST);

    const prefill = buildWizardPrefillFromArchLucidAzureManifest(result.manifest);
    expect(prefill.systemName).toBe("ClaimsIntakeRg");
  });

  it("includes resources, diagram, policy, and readme entries for zero-config demo", () => {
    const entries = unzipSync(getBundledArchLucidAzurePackageSampleZipBytes());

    expect(entries["manifest.json"]).toBeDefined();
    expect(entries["resources.json"]).toBeDefined();
    expect(entries["policy-compliance.json"]).toBeDefined();
    expect(entries["README.txt"]).toBeDefined();
    expect(entries["architecture-diagram.mmd"]).toBeDefined();
  });

  it("creates a File suitable for post-create upload", () => {
    const file = createBundledArchLucidAzurePackageSampleZipFile();

    expect(file.name).toContain("demo");
    expect(file.size).toBeGreaterThan(0);
  });
});
